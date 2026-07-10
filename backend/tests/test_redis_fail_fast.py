import pytest
import pytest_asyncio
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.session_manager import SessionManager
from app.api.v1 import deps
from app.services.matchmaker import MatchmakerService

@pytest_asyncio.fixture
async def cleanup_session_manager():
    # Save original states
    orig_use_memory = SessionManager._use_memory
    orig_client = SessionManager._redis_client
    orig_mm_use_memory = MatchmakerService._use_memory
    orig_mm_client = MatchmakerService._redis_client
    yield
    # Restore
    SessionManager._use_memory = orig_use_memory
    SessionManager._redis_client = orig_client
    MatchmakerService._use_memory = orig_mm_use_memory
    MatchmakerService._redis_client = orig_mm_client

@pytest.mark.asyncio
async def test_deps_auth_redis_failure_sets_fail_fast(cleanup_session_manager):
    # Setup mock Redis client that raises an exception on get
    mock_redis = AsyncMock()
    mock_redis.get.side_effect = Exception("Redis Connection Down")
    
    SessionManager._redis_client = mock_redis
    SessionManager._use_memory = False
    
    # Trigger auth_ip_is_blocked
    is_blocked = await deps.auth_ip_is_blocked("test_ip_hash")
    
    # Verify we fell back to memory, returned False, and flipped _use_memory to True
    assert is_blocked is False
    assert SessionManager._use_memory is True

@pytest.mark.asyncio
async def test_deps_register_failure_sets_fail_fast(cleanup_session_manager):
    # Setup mock Redis client that raises an exception on incr
    mock_redis = AsyncMock()
    mock_redis.incr.side_effect = Exception("Redis Connection Down")
    
    SessionManager._redis_client = mock_redis
    SessionManager._use_memory = False
    
    # Trigger register_auth_failure
    await deps.register_auth_failure("test_ip_hash")
    
    # Verify flipped _use_memory to True
    assert SessionManager._use_memory is True

@pytest.mark.asyncio
async def test_try_recover_redis_success(cleanup_session_manager):
    SessionManager._use_memory = True
    MatchmakerService._use_memory = True
    
    # Mock redis.from_url to return a mock client whose ping succeeds
    mock_ping_client = AsyncMock()
    mock_ping_client.ping.return_value = True
    
    with patch("redis.asyncio.from_url") as mock_from_url:
        mock_from_url.return_value = mock_ping_client
        
        await SessionManager.try_recover_redis()
        
        # Verify SessionManager and MatchmakerService recovered back to False (use redis)
        assert SessionManager._use_memory is False
        assert MatchmakerService._use_memory is False
        assert SessionManager._redis_client is not None
        assert MatchmakerService._redis_client is not None

@pytest.mark.asyncio
async def test_try_recover_redis_failure(cleanup_session_manager):
    SessionManager._use_memory = True
    MatchmakerService._use_memory = True
    
    # Mock redis.from_url to raise exception on ping
    mock_ping_client = AsyncMock()
    mock_ping_client.ping.side_effect = Exception("Redis Still Down")
    
    with patch("redis.asyncio.from_url") as mock_from_url:
        mock_from_url.return_value = mock_ping_client
        
        await SessionManager.try_recover_redis()
        
        # Verify both remain in memory fallback mode
        assert SessionManager._use_memory is True
        assert MatchmakerService._use_memory is True
