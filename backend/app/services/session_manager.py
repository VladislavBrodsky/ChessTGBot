import redis.asyncio as redis
from app.core.config import get_settings
from app.schemas.game_state import GameState
import json
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

class SessionManager:
    _memory_store = {}
    _use_memory = False

    def __init__(self):
        try:
            self.redis = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
        except Exception as e:
            logger.warning(f"Failed to initialize Redis client: {e}. Falling back to in-memory store.")
            self.redis = None
            SessionManager._use_memory = True
        self.ttl = 3600 * 24 # 24 hours

    async def save_game(self, game_id: str, state: GameState):
        """Save game state to Redis with fast write, or in-memory fallback."""
        if SessionManager._use_memory or not self.redis:
            SessionManager._memory_store[f"game:{game_id}"] = state.model_dump_json()
            return
        try:
            await self.redis.setex(
                f"game:{game_id}",
                self.ttl,
                state.model_dump_json()
            )
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
        """Delete game state."""
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
