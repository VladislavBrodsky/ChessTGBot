import asyncio
import json
import logging
import time
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
        self.redis = MatchmakerService._redis_client

    async def add_to_queue(self, user_id: int, bid_amount: int, sid: str, elo: int = 1000, time_control: int = 600) -> None:
        """
        Add a user's connection to the matchmaking queue for a specific bid tier and time control.
        """
        async with self._lock:
            # Remove player from all other queues first to avoid double matching
            await self._remove_from_queue_unsafe(user_id)
            
            player_data = {
                'user_id': user_id,
                'sid': sid,
                'elo': elo,
                'joined_at': time.time(),
                'time_control': time_control
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

    async def find_opponent(self, bid_amount: int, exclude_user_id: int, user_elo: int = 1000, time_control: int = 600) -> Optional[dict]:
        """
        Find and return an opponent waiting in the same bid tier and time control queue who has a comparable ELO.
        """
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
                if item['user_id'] == exclude_user_id:
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
        async with self._lock:
            await self._remove_from_queue_unsafe(user_id)

    async def remove_match_pair(self, bid_amount: int, player1_id: int, player2_id: int, time_control: int = 600) -> None:
        """
        Safely remove matched players from the queue.
        """
        async with self._lock:
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
            keys = await self.redis.keys("matchmaker:queue:*")
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

