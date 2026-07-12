import redis.asyncio as redis
from app.core.config import get_settings
from app.schemas.game_state import GameState
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

class SessionManager:
    _memory_store = {}
    _use_memory = False
    _redis_client = None

    def __init__(self):
        if not SessionManager._use_memory and SessionManager._redis_client is None:
            try:
                SessionManager._redis_client = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
            except Exception as e:
                logger.warning(f"Failed to initialize Redis client: {e}. Falling back to in-memory store.")
                SessionManager._redis_client = None
                SessionManager._use_memory = True
        self.redis = SessionManager._redis_client
        self.ttl = 3600 * 24 # 24 hours

    async def save_game(self, game_id: str, state: GameState):
        """Save game state to Redis with fast write, or in-memory fallback.
        Also updates player active game mappings and the active games set.
        """
        if SessionManager._use_memory or not self.redis:
            SessionManager._memory_store[f"game:{game_id}"] = state.model_dump_json()
            if not state.is_game_over:
                SessionManager._memory_store[f"games:active"] = SessionManager._memory_store.get("games:active", set()) | {game_id}
                if state.white_player_id and state.white_player_id > 0:
                    SessionManager._memory_store[f"user:active_game:{state.white_player_id}"] = game_id
                if state.black_player_id and state.black_player_id > 0:
                    SessionManager._memory_store[f"user:active_game:{state.black_player_id}"] = game_id
            else:
                if "games:active" in SessionManager._memory_store:
                    SessionManager._memory_store["games:active"].discard(game_id)
                if state.white_player_id and state.white_player_id > 0:
                    SessionManager._memory_store.pop(f"user:active_game:{state.white_player_id}", None)
                if state.black_player_id and state.black_player_id > 0:
                    SessionManager._memory_store.pop(f"user:active_game:{state.black_player_id}", None)
            return
        try:
            await self.redis.set(
                f"game:{game_id}",
                state.model_dump_json(),
                ex=self.ttl
            )
            if not state.is_game_over:
                await self.redis.sadd("games:active", game_id)
                if state.white_player_id and state.white_player_id > 0:
                    await self.redis.set(f"user:active_game:{state.white_player_id}", game_id, ex=self.ttl)
                if state.black_player_id and state.black_player_id > 0:
                    await self.redis.set(f"user:active_game:{state.black_player_id}", game_id, ex=self.ttl)
            else:
                await self.redis.srem("games:active", game_id)
                if state.white_player_id and state.white_player_id > 0:
                    await self.redis.delete(f"user:active_game:{state.white_player_id}")
                if state.black_player_id and state.black_player_id > 0:
                    await self.redis.delete(f"user:active_game:{state.black_player_id}")
        except Exception as e:
            logger.warning(f"Redis save failed ({e}). Falling back to memory.")
            SessionManager._use_memory = True
            SessionManager._memory_store[f"game:{game_id}"] = state.model_dump_json()

    async def get_game(self, game_id: str) -> GameState | None:
        """Retrieve game state from Redis, or in-memory fallback."""
        if SessionManager._use_memory or not self.redis:
            data = SessionManager._memory_store.get(f"game:{game_id}")
        else:
            try:
                data = await self.redis.get(f"game:{game_id}")
            except Exception as e:
                logger.warning(f"Redis get failed ({e}). Falling back to memory.")
                SessionManager._use_memory = True
                data = SessionManager._memory_store.get(f"game:{game_id}")
        
        if data:
            return GameState.model_validate_json(data)
        return None

    async def delete_game(self, game_id: str):
        """Delete game state and associated player active game mappings."""
        state = await self.get_game(game_id)
        if state:
            if SessionManager._use_memory or not self.redis:
                if "games:active" in SessionManager._memory_store:
                    SessionManager._memory_store["games:active"].discard(game_id)
                if state.white_player_id and state.white_player_id > 0:
                    SessionManager._memory_store.pop(f"user:active_game:{state.white_player_id}", None)
                if state.black_player_id and state.black_player_id > 0:
                    SessionManager._memory_store.pop(f"user:active_game:{state.black_player_id}", None)
            else:
                try:
                    await self.redis.srem("games:active", game_id)
                    if state.white_player_id and state.white_player_id > 0:
                        await self.redis.delete(f"user:active_game:{state.white_player_id}")
                    if state.black_player_id and state.black_player_id > 0:
                        await self.redis.delete(f"user:active_game:{state.black_player_id}")
                except Exception:
                    pass

        if SessionManager._use_memory or not self.redis:
            SessionManager._memory_store.pop(f"game:{game_id}", None)
            return
        try:
            await self.redis.delete(f"game:{game_id}")
        except Exception as e:
            logger.warning(f"Redis delete failed ({e}). Falling back to memory.")
            SessionManager._use_memory = True
            SessionManager._memory_store.pop(f"game:{game_id}", None)

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
        if not cls._use_memory:
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
            
            # Recreate primary client
            cls._redis_client = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
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
