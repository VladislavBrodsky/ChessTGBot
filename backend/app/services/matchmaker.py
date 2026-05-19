import asyncio
from typing import Dict, List, Optional

class MatchmakerService:
    _instance = None
    _lock = asyncio.Lock()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MatchmakerService, cls).__new__(cls)
            cls._instance.queues = {}  # Dict[int, List[dict]] (bid_amount -> list of waiting players)
        return cls._instance

    async def add_to_queue(self, user_id: int, bid_amount: int, sid: str) -> None:
        """
        Add a user's connection to the matchmaking queue for a specific bid tier.
        """
        async with self._lock:
            if bid_amount not in self.queues:
                self.queues[bid_amount] = []
            
            # Remove player from all other queues first to avoid double matching
            await self._remove_from_queue_unsafe(user_id)
            
            # Append to target queue
            self.queues[bid_amount].append({
                'user_id': user_id,
                'sid': sid
            })
            print(f"Matchmaker: Added User {user_id} to ${bid_amount / 100:.2f} queue (sid: {sid})")

    async def find_opponent(self, bid_amount: int, exclude_user_id: int) -> Optional[dict]:
        """
        Find and return an opponent waiting in the same bid tier queue.
        Does NOT remove them from the queue yet (matching logic will pull them out).
        """
        async with self._lock:
            queue = self.queues.get(bid_amount, [])
            for item in queue:
                if item['user_id'] != exclude_user_id:
                    return item
            return None

    async def remove_from_queue(self, user_id: int) -> None:
        """
        Public method to safely remove a user from all matchmaking queues.
        """
        async with self._lock:
            await self._remove_from_queue_unsafe(user_id)

    async def remove_match_pair(self, bid_amount: int, player1_id: int, player2_id: int) -> None:
        """
        Safely remove matched players from the queue.
        """
        async with self._lock:
            if bid_amount in self.queues:
                self.queues[bid_amount] = [
                    item for item in self.queues[bid_amount]
                    if item['user_id'] not in (player1_id, player2_id)
                ]
                print(f"Matchmaker: Removed User {player1_id} and User {player2_id} from ${bid_amount / 100:.2f} queue")

    async def _remove_from_queue_unsafe(self, user_id: int) -> None:
        """
        Unsafe internal helper; assumes self._lock is already acquired.
        """
        for bid in list(self.queues.keys()):
            original_len = len(self.queues[bid])
            self.queues[bid] = [item for item in self.queues[bid] if item['user_id'] != user_id]
            if len(self.queues[bid]) < original_len:
                print(f"Matchmaker: Removed User {user_id} from ${bid / 100:.2f} queue")
