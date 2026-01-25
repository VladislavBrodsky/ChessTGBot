import redis.asyncio as redis
from app.core.config import get_settings
from app.schemas.game_state import GameState
import json

settings = get_settings()

class SessionManager:
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
        self.ttl = 3600 * 24 # 24 hours

    async def save_game(self, game_id: str, state: GameState):
        """Save game state to Redis with fast write."""
        await self.redis.setex(
            f"game:{game_id}",
            self.ttl,
            state.model_dump_json()
        )

    async def get_game(self, game_id: str) -> GameState | None:
        """Retrieve game state from Redis (Sub-millisecond latency)."""
        data = await self.redis.get(f"game:{game_id}")
        if data:
            return GameState.model_validate_json(data)
        return None

    async def delete_game(self, game_id: str):
        await self.redis.delete(f"game:{game_id}")

    async def close(self):
        await self.redis.close()
