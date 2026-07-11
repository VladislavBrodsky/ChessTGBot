import asyncio
import json
import logging
import time
import uuid
import redis.asyncio as redis
from typing import Dict, List, Optional
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class MatchmakerService:
    _instance = None
    _lock = asyncio.Lock()
    _redis_client = None
    _use_memory = False
    _memory_queues = {}  # Dict[int, List[dict]]

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MatchmakerService, cls).__new__(cls)
            cls._instance._init_redis()
        return cls._instance

    def _init_redis(self):
        if not MatchmakerService._use_memory and MatchmakerService._redis_client is None:
            try:
                MatchmakerService._redis_client = redis.from_url(
                    settings.REDIS_URL, encoding="utf-8", decode_responses=True
                )
            except Exception as e:
                logger.warning(f"Failed to initialize Redis client for Matchmaker: {e}. Falling back to in-memory store.")
                MatchmakerService._redis_client = None
                MatchmakerService._use_memory = True

    @property
    def redis(self):
        return MatchmakerService._redis_client

    async def _acquire_distributed_lock(self, key: str, ttl_seconds: int = 5) -> Optional[str]:
        """Acquire a simple distributed lock in Redis with retries."""
        if MatchmakerService._use_memory or not self.redis:
            return None
        
        lock_key = f"lock:matchmaker:{key}"
        token = str(uuid.uuid4())
        
        # Retry for up to 3 seconds to acquire the lock
        retries = 30
        for _ in range(retries):
            try:
                # set nx=True, ex=ttl_seconds
                acquired = await self.redis.set(lock_key, token, nx=True, ex=ttl_seconds)
                if acquired:
                    return token
            except Exception as e:
                logger.warning(f"Redis system/connection error during lock acquisition: {e}. Switching to in-memory store immediately.")
                MatchmakerService._redis_client = None
                MatchmakerService._use_memory = True
                return None
            await asyncio.sleep(0.1)
            
        logger.error(f"Failed to acquire distributed lock for key {key} after {retries} retries.")
        return None

    async def _release_distributed_lock(self, key: str, token: str) -> None:
        """Atomically release distributed lock using a Lua script."""
        if MatchmakerService._use_memory or not self.redis or not token:
            return
            
        lock_key = f"lock:matchmaker:{key}"
        lua_release_script = """
        if redis.call('get', KEYS[1]) == ARGV[1] then
            return redis.call('del', KEYS[1])
        else
            return 0
        end
        """
        try:
            await self.redis.eval(lua_release_script, 1, lock_key, token)
        except Exception as e:
            logger.warning(f"Failed to release lock {key}: {e}")

    @staticmethod
    def _would_collude(user_id: int, ip_hash: Optional[str], referrer_id: Optional[int], candidate: dict, recent_opponents: Optional[set] = None) -> bool:
        """
        True if `candidate` must NOT be auto-matched with the requesting user because
        they look like the same person / a colluding pair. This guard applies to
        WAGERED games only — with no money at stake there is no rake/commission to
        farm, and blocking free games strands legitimate pairs (a referrer and the
        friend they invited, or two players on the same household WiFi/CGNAT) in a
        queue that silently never matches. Friend-invite games are also exempt —
        you choose a known opponent there. Skips a candidate when:
          - it is the same account,
          - it connected from the same IP (same device/network — the classic
            "two accounts, one person" self-match), or
          - there is a direct referral edge between them in either direction (a
            referrer ranked-matching their own referee is the collusion/commission-
            farming pattern; legit friends can still use the friend invite), or
          - candidate is in the requester's recent opponents list (last 5 games).
        Deliberately does NOT block "shared referrer" siblings: a popular referrer
        would otherwise wall thousands of unrelated users off from each other, and
        the platform rake already makes wager transfer between colluders net-negative.
        """
        cand_id = candidate.get('user_id')
        if cand_id == user_id:
            return True
        if recent_opponents and cand_id in recent_opponents:
            return True
        cand_ip = candidate.get('ip_hash')
        if ip_hash and cand_ip and cand_ip == ip_hash:
            return True
        cand_ref = candidate.get('referrer_id')
        if referrer_id and cand_id == referrer_id:
            return True  # candidate is the requester's direct referrer
        if cand_ref and cand_ref == user_id:
            return True  # requester is the candidate's direct referrer
        return False

    async def add_to_queue(self, user_id: int, bid_amount: int, sid: str, elo: int = 1000, time_control: int = 600, ip_hash: Optional[str] = None, referrer_id: Optional[int] = None) -> None:
        """
        Add a user's connection to the matchmaking queue for a specific bid tier and time control.
        Uses distributed lock for multi-instance safety.
        """
        lock_token = await self._acquire_distributed_lock("global")
        async with self._lock:
            try:
                # Remove player from all other queues first to avoid double matching
                await self._remove_from_queue_unsafe(user_id)

                player_data = {
                    'user_id': user_id,
                    'sid': sid,
                    'elo': elo,
                    'joined_at': time.time(),
                    'time_control': time_control,
                    'ip_hash': ip_hash,
                    'referrer_id': referrer_id
                }

                queue_key_mem = (bid_amount, time_control)

                if MatchmakerService._use_memory or not self.redis:
                    if queue_key_mem not in MatchmakerService._memory_queues:
                        MatchmakerService._memory_queues[queue_key_mem] = []
                    MatchmakerService._memory_queues[queue_key_mem].append(player_data)
                    logger.info(f"Matchmaker (Memory): Added User {user_id} (ELO {elo}) to ${bid_amount / 100:.2f} ({time_control}s) queue")
                    return

                try:
                    queue_key = f"matchmaker:queue:{bid_amount}:{time_control}"
                    data = await self.redis.get(queue_key)
                    queue = json.loads(data) if data else []
                    queue.append(player_data)
                    await self.redis.set(queue_key, json.dumps(queue))
                    logger.info(f"Matchmaker (Redis): Added User {user_id} (ELO {elo}) to ${bid_amount / 100:.2f} ({time_control}s) queue")
                except Exception as e:
                    logger.warning(f"Redis add_to_queue failed ({e}). Falling back to memory.")
                    MatchmakerService._use_memory = True
                    if queue_key_mem not in MatchmakerService._memory_queues:
                        MatchmakerService._memory_queues[queue_key_mem] = []
                    MatchmakerService._memory_queues[queue_key_mem].append(player_data)
            finally:
                if lock_token:
                    await self._release_distributed_lock("global", lock_token)

    async def try_match_and_pop(self, bid_amount: int, user_id: int, user_elo: int = 1000, time_control: int = 600, ip_hash: Optional[str] = None, referrer_id: Optional[int] = None) -> Optional[dict]:
        """
        Atomically find and pop a matching opponent and the user from the queue.
        This ensures that no other worker thread or container can match the same opponent.
        """
        recent_opponents = set()
        if bid_amount > 0:
            try:
                from app.core.database import AsyncSessionLocal
                from app.crud.game_history import get_user_recent_games
                async with AsyncSessionLocal() as db:
                    games = await get_user_recent_games(db, telegram_id=user_id, limit=5)
                    for g in games:
                        opp_id = g.black_player_id if g.white_player_id == user_id else g.white_player_id
                        if opp_id:
                            recent_opponents.add(opp_id)
            except Exception as e:
                logger.warning(f"Matchmaker: failed to fetch recent games for user {user_id}: {e}")

        lock_token = await self._acquire_distributed_lock("global")
        async with self._lock:
            try:
                current_time = time.time()
                queue_key_mem = (bid_amount, time_control)
                queue_key = f"matchmaker:queue:{bid_amount}:{time_control}"
                
                if MatchmakerService._use_memory or not self.redis:
                    queue = MatchmakerService._memory_queues.get(queue_key_mem, [])
                else:
                    try:
                        data = await self.redis.get(queue_key)
                        queue = json.loads(data) if data else []
                    except Exception as e:
                        logger.warning(f"Redis try_match_and_pop failed ({e}). Falling back to memory.")
                        MatchmakerService._use_memory = True
                        queue = MatchmakerService._memory_queues.get(queue_key_mem, [])

                # Clean up expired zombie entries (older than 130 seconds)
                active_queue = []
                zombies_found = False
                for item in queue:
                    wait_time = current_time - item.get('joined_at', current_time)
                    if wait_time > 130.0:
                        logger.info(f"Matchmaker: Purging expired zombie user {item['user_id']} from queue")
                        zombies_found = True
                    else:
                        active_queue.append(item)

                if zombies_found:
                    queue = active_queue
                    # Update queue in Redis/memory immediately
                    if MatchmakerService._use_memory or not self.redis:
                        MatchmakerService._memory_queues[queue_key_mem] = queue
                    else:
                        try:
                            await self.redis.set(queue_key, json.dumps(queue))
                        except Exception as e:
                            logger.warning(f"Redis update failed during zombie purge ({e}).")

                best_opponent = None
                best_diff = float('inf')
                collusion_skipped = 0

                for item in queue:
                    # Never match a user against their own other connection.
                    if item.get('user_id') == user_id:
                        continue
                    # Anti-collusion (wagered games only): never auto-match a
                    # colluding-looking pair (same IP, referrer<->referee, or
                    # recent opponent). Free games are exempt — see _would_collude.
                    if bid_amount > 0 and self._would_collude(user_id, ip_hash, referrer_id, item, recent_opponents):
                        collusion_skipped += 1
                        continue

                    # ELO threshold expands by 10 points per second of wait time, starting at 100
                    wait_time = current_time - item.get('joined_at', current_time)
                    elo_threshold = 100 + 10 * wait_time

                    opponent_elo = item.get('elo', 1000)
                    elo_diff = abs(user_elo - opponent_elo)

                    if elo_diff <= elo_threshold:
                        if elo_diff < best_diff:
                            best_diff = elo_diff
                            best_opponent = item

                if best_opponent:
                    # Pop both players from the queue atomically
                    new_queue = [item for item in queue if item['user_id'] not in (user_id, best_opponent['user_id'])]
                    
                    if MatchmakerService._use_memory or not self.redis:
                        MatchmakerService._memory_queues[queue_key_mem] = new_queue
                    else:
                        try:
                            await self.redis.set(queue_key, json.dumps(new_queue))
                        except Exception as e:
                            logger.warning(f"Redis update failed in try_match_and_pop ({e}). Falling back to memory.")
                            MatchmakerService._use_memory = True
                            MatchmakerService._memory_queues[queue_key_mem] = new_queue
                            
                    logger.info(f"Matchmaker: Matched User {user_id} with User {best_opponent['user_id']} and popped both.")
                elif collusion_skipped:
                    # Make the silent skip diagnosable: a pair stuck "searching"
                    # while both are queued is otherwise invisible in logs.
                    logger.info(
                        f"Matchmaker: no opponent for User {user_id} (bid {bid_amount}, tc {time_control}); "
                        f"{collusion_skipped} queued candidate(s) skipped by anti-collusion guard"
                    )

                return best_opponent
            finally:
                if lock_token:
                    await self._release_distributed_lock("global", lock_token)

    async def find_opponent(self, bid_amount: int, exclude_user_id: int, user_elo: int = 1000, time_control: int = 600, ip_hash: Optional[str] = None, referrer_id: Optional[int] = None) -> Optional[dict]:
        """
        Deprecated: Use try_match_and_pop instead for atomic matching.
        """
        recent_opponents = set()
        if bid_amount > 0:
            try:
                from app.core.database import AsyncSessionLocal
                from app.crud.game_history import get_user_recent_games
                async with AsyncSessionLocal() as db:
                    games = await get_user_recent_games(db, telegram_id=exclude_user_id, limit=5)
                    for g in games:
                        opp_id = g.black_player_id if g.white_player_id == exclude_user_id else g.white_player_id
                        if opp_id:
                            recent_opponents.add(opp_id)
            except Exception as e:
                logger.warning(f"Matchmaker: failed to fetch recent games for user {exclude_user_id}: {e}")

        async with self._lock:
            current_time = time.time()
            queue_key_mem = (bid_amount, time_control)
            
            if MatchmakerService._use_memory or not self.redis:
                queue = MatchmakerService._memory_queues.get(queue_key_mem, [])
            else:
                try:
                    queue_key = f"matchmaker:queue:{bid_amount}:{time_control}"
                    data = await self.redis.get(queue_key)
                    queue = json.loads(data) if data else []
                except Exception as e:
                    logger.warning(f"Redis find_opponent failed ({e}). Falling back to memory.")
                    MatchmakerService._use_memory = True
                    queue = MatchmakerService._memory_queues.get(queue_key_mem, [])

            best_opponent = None
            best_diff = float('inf')
            
            for item in queue:
                if item.get('user_id') == exclude_user_id:
                    continue
                if bid_amount > 0 and self._would_collude(exclude_user_id, ip_hash, referrer_id, item, recent_opponents):
                    continue

                # ELO threshold expands by 10 points per second of wait time, starting at 100
                wait_time = current_time - item.get('joined_at', current_time)
                elo_threshold = 100 + 10 * wait_time

                opponent_elo = item.get('elo', 1000)
                elo_diff = abs(user_elo - opponent_elo)

                if elo_diff <= elo_threshold:
                    if elo_diff < best_diff:
                        best_diff = elo_diff
                        best_opponent = item

            return best_opponent

    async def remove_from_queue(self, user_id: int) -> None:
        """
        Public method to safely remove a user from all matchmaking queues.
        """
        lock_token = await self._acquire_distributed_lock("global")
        async with self._lock:
            try:
                await self._remove_from_queue_unsafe(user_id)
            finally:
                if lock_token:
                    await self._release_distributed_lock("global", lock_token)

    async def remove_match_pair(self, bid_amount: int, player1_id: int, player2_id: int, time_control: int = 600) -> None:
        """
        Safely remove matched players from the queue.
        """
        lock_token = await self._acquire_distributed_lock("global")
        async with self._lock:
            try:
                queue_key_mem = (bid_amount, time_control)
                if MatchmakerService._use_memory or not self.redis:
                    if queue_key_mem in MatchmakerService._memory_queues:
                        MatchmakerService._memory_queues[queue_key_mem] = [
                            item for item in MatchmakerService._memory_queues[queue_key_mem]
                            if item['user_id'] not in (player1_id, player2_id)
                        ]
                    logger.info(f"Matchmaker (Memory): Removed User {player1_id} and User {player2_id} from ${bid_amount / 100:.2f} ({time_control}s) queue")
                    return

                try:
                    queue_key = f"matchmaker:queue:{bid_amount}:{time_control}"
                    data = await self.redis.get(queue_key)
                    if data:
                        queue = json.loads(data)
                        new_queue = [item for item in queue if item['user_id'] not in (player1_id, player2_id)]
                        await self.redis.set(queue_key, json.dumps(new_queue))
                    logger.info(f"Matchmaker (Redis): Removed User {player1_id} and User {player2_id} from ${bid_amount / 100:.2f} ({time_control}s) queue")
                except Exception as e:
                    logger.warning(f"Redis remove_match_pair failed ({e}). Falling back to memory.")
                    MatchmakerService._use_memory = True
                    if queue_key_mem in MatchmakerService._memory_queues:
                        MatchmakerService._memory_queues[queue_key_mem] = [
                            item for item in MatchmakerService._memory_queues[queue_key_mem]
                            if item['user_id'] not in (player1_id, player2_id)
                        ]
            finally:
                if lock_token:
                    await self._release_distributed_lock("global", lock_token)

    async def _remove_from_queue_unsafe(self, user_id: int) -> None:
        """
        Unsafe internal helper; assumes self._lock is already acquired.
        """
        if MatchmakerService._use_memory or not self.redis:
            for key in list(MatchmakerService._memory_queues.keys()):
                original_len = len(MatchmakerService._memory_queues[key])
                MatchmakerService._memory_queues[key] = [item for item in MatchmakerService._memory_queues[key] if item['user_id'] != user_id]
                if len(MatchmakerService._memory_queues[key]) < original_len:
                    logger.info(f"Matchmaker (Memory): Removed User {user_id} from {key} queue")
            return

        try:
            # Non-blocking scan for keys matching matchmaker:queue:* to prevent blocking Redis
            keys = []
            cursor = 0
            while True:
                cursor, scan_keys = await self.redis.scan(cursor, match="matchmaker:queue:*", count=100)
                keys.extend(scan_keys)
                if cursor == 0:
                    break

            for queue_key in keys:
                data = await self.redis.get(queue_key)
                if data:
                    queue = json.loads(data)
                    original_len = len(queue)
                    new_queue = [item for item in queue if item['user_id'] != user_id]
                    if len(new_queue) < original_len:
                        await self.redis.set(queue_key, json.dumps(new_queue))
                        logger.info(f"Matchmaker (Redis): Removed User {user_id} from {queue_key} queue")
        except Exception as e:
            logger.warning(f"Redis _remove_from_queue_unsafe failed ({e}). Falling back to memory.")
            MatchmakerService._use_memory = True

    async def is_in_queue(self, bid_amount: int, time_control: int, user_id: int) -> bool:
        """Check if user is currently in the specified queue."""
        queue_key_mem = (bid_amount, time_control)
        queue_key = f"matchmaker:queue:{bid_amount}:{time_control}"
        
        if MatchmakerService._use_memory or not self.redis:
            queue = MatchmakerService._memory_queues.get(queue_key_mem, [])
        else:
            try:
                data = await self.redis.get(queue_key)
                queue = json.loads(data) if data else []
            except Exception:
                MatchmakerService._use_memory = True
                queue = MatchmakerService._memory_queues.get(queue_key_mem, [])
                
        return any(item['user_id'] == user_id for item in queue)

