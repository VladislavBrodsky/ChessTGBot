import redis.asyncio as redis
from app.core.config import get_settings
from app.core.redis_client import create_redis_client
from app.schemas.game_state import GameState
from app.core.coordination import SharedStateUnavailable, StateConflict, current_lease, require_shared_store
import logging
from datetime import datetime, timezone

settings = get_settings()
logger = logging.getLogger(__name__)

class SessionManager:
    _memory_store = {}
    _use_memory = False
    _redis_client = None

    def __init__(self):
        if not SessionManager._use_memory and SessionManager._redis_client is None:
            try:
                SessionManager._redis_client = create_redis_client(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
            except Exception as e:
                if not settings.is_development_or_testing:
                    raise SharedStateUnavailable("Shared game storage is unavailable") from e
                logger.warning(f"Failed to initialize development Redis client: {e}")
                SessionManager._redis_client = None
                SessionManager._use_memory = True
        self.redis = SessionManager._redis_client
        self.ttl = 3600 * 24 # 24 hours

    async def save_game(self, game_id: str, state: GameState):
        """Atomically compare-and-swap state and indexes; stale writers never win."""
        require_shared_store(self._use_memory, self.redis)
        expected = state.revision
        next_state = state.model_copy(update={"revision": expected + 1})
        if self._use_memory or not self.redis:
            previous = self._memory_store.get(f"game:{game_id}")
            if previous:
                if GameState.model_validate_json(previous).revision != expected:
                    raise StateConflict("Game state changed; reload and retry")
            elif expected:
                raise StateConflict("Game expired; reload and retry")
            self._memory_store[f"game:{game_id}"] = next_state.model_dump_json()
            active = self._memory_store.setdefault("games:active", set())
            if state.is_game_over:
                active.discard(game_id)
                self._memory_store.setdefault("games:unsettled", set()).add(game_id)
            else:
                active.add(game_id)
            for uid in (state.white_player_id, state.black_player_id):
                if uid and uid > 0:
                    key = f"user:active_game:{uid}"
                    if not state.is_game_over:
                        self._memory_store[key] = game_id
                    elif self._memory_store.get(key) == game_id:
                        self._memory_store.pop(key, None)
            state.revision = next_state.revision
            return
        # Guard both the read revision and the lease in the same Redis operation.
        # Version checks also protect callers such as timeout/reconnect handlers.
        lease = current_lease.get()
        lock_key, lock_token = lease if lease and lease[0] == f"lock:game:{game_id}" else ("unused:game-lock", "")
        script = """
        if ARGV[5] ~= '' and redis.call('get', KEYS[3]) ~= ARGV[5] then return -2 end
        local old = redis.call('get', KEYS[1])
        if old then
            if tonumber(cjson.decode(old).revision or 0) ~= tonumber(ARGV[1]) then return -1 end
        elseif tonumber(ARGV[1]) ~= 0 then return -1 end
        local after = cjson.decode(ARGV[2])
        local has_opponent = type(after.black_player_id) == 'number' and type(after.white_player_id) == 'number'
        if ARGV[4] == '0' and tonumber(after.bid_amount or 0) == 0 and has_opponent then
            for i=4,#KEYS do
                local active_id = redis.call('get', KEYS[i])
                if active_id and active_id ~= ARGV[6] then
                    local other = redis.call('get', 'game:' .. active_id)
                    if other then
                        local active = cjson.decode(other)
                        local unstarted_ai = active.black_player_id == -1 and (not active.last_move_at or active.last_move_at == cjson.null)
                        if not active.is_game_over and type(active.black_player_id) == 'number' and not unstarted_ai then return -3 end
                    end
                end
            end
        end
        if ARGV[4] == '1' then redis.call('set', KEYS[1], ARGV[2])
        else redis.call('set', KEYS[1], ARGV[2], 'EX', ARGV[3]) end
        if ARGV[4] == '1' then
            redis.call('srem', KEYS[2], ARGV[6])
            redis.call('sadd', 'games:unsettled', ARGV[6])
        else redis.call('sadd', KEYS[2], ARGV[6]) end
        for i=4,#KEYS do
            if ARGV[4] == '0' and (has_opponent or tonumber(after.bid_amount or 0) > 0) then redis.call('set', KEYS[i], ARGV[6], 'EX', ARGV[3])
            elseif redis.call('get', KEYS[i]) == ARGV[6] then redis.call('del', KEYS[i]) end
        end
        if old then
            local before = cjson.decode(old)
            local after = cjson.decode(ARGV[2])
            if #after.move_history == #before.move_history + 1 then
                local uid = before.turn == 'w' and before.white_player_id or before.black_player_id
                if type(uid) == 'number' and uid > 0 then
                    local member = ARGV[7] .. ':' .. string.format('%.0f', uid)
                    if redis.call('set', 'gameplay:seen:' .. member, '1', 'NX', 'EX', 172800) then
                        redis.call('sadd', 'gameplay:pending_days', member)
                    end
                end
            end
        end
        return 1
        """
        keys = [f"game:{game_id}", "games:active", lock_key]
        keys += [f"user:active_game:{uid}" for uid in (state.white_player_id, state.black_player_id) if uid and uid > 0]
        try:
            result = await self.redis.eval(script, len(keys), *keys, expected,
                                           next_state.model_dump_json(), self.ttl,
                                           "1" if state.is_game_over else "0", lock_token, game_id, datetime.now(timezone.utc).date().isoformat())
            if result != 1:
                raise StateConflict("Game state or lock changed; reload and retry")
            state.revision = next_state.revision
        except SharedStateUnavailable:
            raise
        except Exception as exc:
            if settings.is_development_or_testing:
                SessionManager._use_memory = True
                return await self.save_game(game_id, state)
            # Production never changes authority to a process-local dictionary.
            raise SharedStateUnavailable("Shared game storage is unavailable") from exc

    async def get_game(self, game_id: str) -> GameState | None:
        """Retrieve game state from Redis, or in-memory fallback."""
        require_shared_store(self._use_memory, self.redis)
        if SessionManager._use_memory or not self.redis:
            data = self._memory_store.get(f"game:{game_id}")
        else:
            try:
                data = await self.redis.get(f"game:{game_id}")
            except Exception as e:
                if not settings.is_development_or_testing:
                    raise SharedStateUnavailable("Shared game storage is unavailable") from e
                logger.warning(f"Development Redis read failed: {e}")
                SessionManager._use_memory = True
                data = self._memory_store.get(f"game:{game_id}")
        
        if data:
            return GameState.model_validate_json(data)
        return None

    async def delete_game(self, game_id: str):
        """Delete game state and associated player active game mappings."""
        require_shared_store(self._use_memory, self.redis)
        state = await self.get_game(game_id)
        if state:
            if SessionManager._use_memory or not self.redis:
                if "games:active" in self._memory_store:
                    self._memory_store["games:active"].discard(game_id)
                if state.white_player_id and state.white_player_id > 0:
                    self._memory_store.pop(f"user:active_game:{state.white_player_id}", None)
                if state.black_player_id and state.black_player_id > 0:
                    self._memory_store.pop(f"user:active_game:{state.black_player_id}", None)
            else:
                try:
                    await self.redis.srem("games:active", game_id)
                    if state.white_player_id and state.white_player_id > 0:
                        await self.redis.eval("if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('del',KEYS[1]) end; return 0", 1, f"user:active_game:{state.white_player_id}", game_id)
                    if state.black_player_id and state.black_player_id > 0:
                        await self.redis.eval("if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('del',KEYS[1]) end; return 0", 1, f"user:active_game:{state.black_player_id}", game_id)
                except Exception as exc:
                    raise SharedStateUnavailable("Shared game storage is unavailable") from exc

        if SessionManager._use_memory or not self.redis:
            self._memory_store.pop(f"game:{game_id}", None)
            return
        try:
            await self.redis.delete(f"game:{game_id}")
        except Exception as e:
            if not settings.is_development_or_testing:
                raise SharedStateUnavailable("Shared game storage is unavailable") from e
            logger.warning(f"Development Redis delete failed: {e}")
            SessionManager._use_memory = True
            self._memory_store.pop(f"game:{game_id}", None)

    async def mark_settled(self, game_id: str):
        require_shared_store(self._use_memory, self.redis)
        if self._use_memory or not self.redis:
            self._memory_store.setdefault("games:unsettled", set()).discard(game_id)
        else:
            await self.redis.eval("redis.call('srem',KEYS[1],ARGV[1]); return redis.call('expire',KEYS[2],ARGV[2])", 2,
                                  "games:unsettled", f"game:{game_id}", game_id, self.ttl)

    async def close(self):
        """Close connection."""
        if self.redis:
            try:
                await self.redis.close()
            except Exception:
                pass

    @classmethod
    async def try_recover_redis(cls):
        """Periodically probe Redis if we are currently in memory fallback mode, and recover if online."""
        if not cls._use_memory or not settings.is_development_or_testing:
            return
        
        try:
            test_client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                socket_timeout=1.0,
                socket_connect_timeout=1.0
            )
            await test_client.ping()
            await test_client.close()
            
            # Recreate primary client using application defaults (keepalive, health check, timeout)
            if cls._redis_client is not None:
                try:
                    await cls._redis_client.close()
                except Exception:
                    pass
            cls._redis_client = create_redis_client(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
            cls._use_memory = False
            logger.info("SessionManager successfully reconnected and recovered Redis client from fallback mode.")
            
            # Also notify MatchmakerService to recover
            try:
                from app.services.matchmaker import MatchmakerService
                MatchmakerService._redis_client = cls._redis_client
                MatchmakerService._use_memory = False
            except Exception:
                pass
        except Exception:
            pass
