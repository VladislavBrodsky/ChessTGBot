import pytest
import time
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import Request, HTTPException
from app.api.v1.deps import rate_limit
from app.models.user import User

@pytest.mark.asyncio
async def test_rate_limiter_in_memory():
    # Construct a dummy user
    user = User(id=1, telegram_id=12345, first_name="RateLimitUser")
    
    # Construct dummy request mocks
    req1 = MagicMock(spec=Request)
    req1.url = MagicMock()
    req1.url.path = "/api/v1/game/create"
    
    req2 = MagicMock(spec=Request)
    req2.url = MagicMock()
    req2.url.path = "/api/v1/wallet/withdraw"
    
    # Limit: 2 requests per 60 seconds
    limiter = rate_limit(limit=2, window=60)
    
    # 1. First request should pass
    await limiter(req1, user)
    
    # 2. Second request should pass
    await limiter(req1, user)
    
    # 3. Third request should fail with 429
    with pytest.raises(HTTPException) as excinfo:
        await limiter(req1, user)
    assert excinfo.value.status_code == 429
    assert "Too many requests" in excinfo.value.detail
    
    # 4. Request on a different path should pass (separate bucket)
    await limiter(req2, user)


@pytest.mark.asyncio
async def test_rate_limiter_redis():
    # Construct a dummy user
    user = User(id=1, telegram_id=54321, first_name="RedisUser")
    
    req = MagicMock(spec=Request)
    req.url = MagicMock()
    req.url.path = "/api/v1/game/create"
    
    # Mock SessionManager
    mock_redis = AsyncMock()
    # First call to get returns None, next returns "1", next returns "2" (exceeded)
    mock_redis.get.side_effect = [None, "1", "2"]
    
    mock_session_mgr = MagicMock()
    mock_session_mgr.redis = mock_redis
    mock_session_mgr._use_memory = False
    
    with patch("app.services.session_manager.SessionManager", return_value=mock_session_mgr):
        limiter = rate_limit(limit=2, window=60)
        
        # 1. First call (redis returns None) -> sets key to 1, passes
        await limiter(req, user)
        mock_redis.set.assert_called_once()
        
        # 2. Second call (redis returns "1") -> increments key, passes
        await limiter(req, user)
        mock_redis.incr.assert_called_once()
        
        # 3. Third call (redis returns "2" >= 2) -> raises 429
        with pytest.raises(HTTPException) as excinfo:
            await limiter(req, user)
        assert excinfo.value.status_code == 429
