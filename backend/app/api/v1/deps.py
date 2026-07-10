import time
from fastapi import Header, HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db, get_read_db
from app.crud import user as user_crud
from app.models.user import User
from app.core.security import validate_init_data, extract_client_ip_from_request, hash_ip
from typing import Optional

_photo_checked_cache = set()

# ---------------------------------------------------------------------------
# IP-keyed failed-auth throttle (roadmap 2b)
#
# The per-user rate_limit() below cannot guard the auth VALIDATION step itself:
# it depends on get_current_user, so there is no trusted identity to key on
# before login. This throttle keys on a salted hash of the client IP and counts
# ONLY FAILED validations, so legitimate users — even many sharing one NAT /
# carrier IP — are never throttled, while an attacker spraying forged/guessed
# initData (brute-force, token-generation, or HMAC-DoS) trips the limit quickly
# and gets 429s (HTTP) / rejected sockets. Redis-backed with an in-memory
# fallback, and fail-open on infra errors so a Redis hiccup never blocks auth.
# ---------------------------------------------------------------------------
AUTH_FAIL_LIMIT = 20
AUTH_FAIL_WINDOW = 60  # seconds
_auth_fail_memory: dict = {}


async def auth_ip_is_blocked(ip_hash: Optional[str]) -> bool:
    if not ip_hash:
        return False
    key = f"authfail:{ip_hash}"
    try:
        from app.services.session_manager import SessionManager
        sm = SessionManager()
        if sm.redis and not sm._use_memory:
            val = await sm.redis.get(key)
            return bool(val) and int(val) >= AUTH_FAIL_LIMIT
    except Exception:
        SessionManager._use_memory = True
        pass
    now = time.time()
    hist = [t for t in _auth_fail_memory.get(key, []) if now - t < AUTH_FAIL_WINDOW]
    _auth_fail_memory[key] = hist
    return len(hist) >= AUTH_FAIL_LIMIT


async def register_auth_failure(ip_hash: Optional[str]) -> None:
    if not ip_hash:
        return
    key = f"authfail:{ip_hash}"
    try:
        from app.services.session_manager import SessionManager
        sm = SessionManager()
        if sm.redis and not sm._use_memory:
            count = await sm.redis.incr(key)
            if count == 1:
                await sm.redis.expire(key, AUTH_FAIL_WINDOW)
            return
    except Exception:
        SessionManager._use_memory = True
        pass
    _auth_fail_memory.setdefault(key, []).append(time.time())

async def get_current_user(
    request: Request,
    x_telegram_init_data: Optional[str] = Header(None, alias="X-Telegram-Init-Data"),
    # Keep legacy header for backward compat during migration? Or strict fail?
    # Strict fail is safer for Phase 1.
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get the current user by validating the Telegram InitData.
    """
    ip_hash = hash_ip(extract_client_ip_from_request(request))

    if not x_telegram_init_data:
        from app.core.config import get_settings
        settings = get_settings()
        if settings.TESTING or settings.ENV == "development":
            user_id = 123456789
            user = await user_crud.get_user_by_telegram_id(db, user_id)
            if not user:
                user = await user_crud.create_user(
                    db,
                    user_id,
                    "Protagonist",
                    username="Protagonist"
                )
            return user
        # 2b: a bare unauthenticated request is a failed auth attempt.
        await register_auth_failure(ip_hash)
        raise HTTPException(
            status_code=401,
            detail="X-Telegram-Init-Data header missing"
        )

    # 2b: block IPs with too many recent failed auth attempts before doing the
    # (relatively expensive) HMAC validation + DB lookup below.
    if await auth_ip_is_blocked(ip_hash):
        raise HTTPException(status_code=429, detail="Too many authentication attempts. Please slow down.")

    # 1. Validate Signature & Extract Data
    try:
        telegram_user = validate_init_data(x_telegram_init_data)
        user_id = telegram_user.get("id")
    except Exception as e:
        from app.core.config import get_settings
        settings = get_settings()
        if settings.TESTING or settings.ENV == "development":
            from app.core.security import parse_init_data_unverified
            telegram_user = parse_init_data_unverified(x_telegram_init_data)
            user_id = telegram_user.get("id")
            if not user_id:
                telegram_user = {"id": 123456789, "first_name": "Protagonist", "username": "Protagonist"}
                user_id = 123456789
        else:
            await register_auth_failure(ip_hash)
            raise HTTPException(status_code=401, detail=f"Invalid signature: {str(e)}")

    
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid user data")

    # 2. Get or Create DB User
    user = await user_crud.get_user_by_telegram_id(db, user_id)
    
    local_photo_url = f"/api/v1/users/avatar/{user_id}"

    if not user:
        # Auto-register
        user = await user_crud.create_user(
            db, 
            user_id, 
            telegram_user.get("first_name", f"User_{user_id}"),
            last_name=telegram_user.get("last_name"),
            username=telegram_user.get("username"),
            photo_url=local_photo_url
        )
        
        start_param = telegram_user.get("start_param")
        if start_param:
            code = start_param
            if code.startswith("ref_"):
                code = code[4:]
            try:
                from app.services.gamification_service import GamificationService
                await GamificationService.process_referral(db, user, code)
            except Exception as e:
                print(f"Error processing referral for user {user_id}: {e}")
    else:
        # Sync profile information if different
        updated = False
        first_name = telegram_user.get("first_name")
        last_name = telegram_user.get("last_name")
        username = telegram_user.get("username")
        
        if not user.photo_url:
            user.photo_url = local_photo_url
            updated = True
        if first_name and user.first_name != first_name:
            user.first_name = first_name
            updated = True
        if last_name and user.last_name != last_name:
            user.last_name = last_name
            updated = True
        if username and user.username != username:
            user.username = username
            updated = True
            
        if updated:
            db.add(user)
            await db.commit()
            await db.refresh(user)
        
    # 3. Self-healing premium status sync
    if user.is_premium and user.premium_expires_at:
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        if user.premium_expires_at < now:
            user.is_premium = False
            user.premium_tier = None
            db.add(user)
            await db.commit()
            await db.refresh(user)

    return user


async def get_current_telegram_id(
    request: Request,
    x_telegram_init_data: Optional[str] = Header(None, alias="X-Telegram-Init-Data")
) -> int:
    """
    Dependency to get the current user's Telegram ID without holding a database session.
    """
    ip_hash = hash_ip(extract_client_ip_from_request(request))

    if not x_telegram_init_data:
        from app.core.config import get_settings
        settings = get_settings()
        if settings.TESTING or settings.ENV == "development":
            return 123456789
        await register_auth_failure(ip_hash)
        raise HTTPException(
            status_code=401,
            detail="X-Telegram-Init-Data header missing"
        )

    if await auth_ip_is_blocked(ip_hash):
        raise HTTPException(status_code=429, detail="Too many authentication attempts. Please slow down.")

    try:
        telegram_user = validate_init_data(x_telegram_init_data)
        user_id = telegram_user.get("id")
    except Exception as e:
        from app.core.config import get_settings
        settings = get_settings()
        if settings.TESTING or settings.ENV == "development":
            from app.core.security import parse_init_data_unverified
            telegram_user = parse_init_data_unverified(x_telegram_init_data)
            user_id = telegram_user.get("id")
            if not user_id:
                user_id = 123456789
        else:
            await register_auth_failure(ip_hash)
            raise HTTPException(status_code=401, detail=f"Invalid signature: {str(e)}")

    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid user data")
        
    return user_id


# ---------------------------------------------------------------------------
# Admin authentication
# ---------------------------------------------------------------------------

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency that extends get_current_user by asserting that the authenticated
    user is one of the designated admin accounts.  Returns 403 for everyone else.
    """
    from app.core.config import get_settings
    if current_user.telegram_id not in get_settings().admin_telegram_ids:
        raise HTTPException(
            status_code=403,
            detail="Access denied: admin privileges required"
        )
    return current_user


# ---------------------------------------------------------------------------
# Rate limiting
# ---------------------------------------------------------------------------

_rate_limits = {}

def rate_limit(limit: int, window: int):
    """
    FastAPI dependency for rate limiting by user and endpoint path.
    """
    from fastapi import Request
    
    async def check_rate_limit(
        request: Request,
        current_user: User = Depends(get_current_user)
    ):
        import time
        user_key = f"rl:{current_user.telegram_id}:{request.url.path}"
        now = time.time()
        
        # Try to use Redis from SessionManager
        from app.services.session_manager import SessionManager
        session_mgr = SessionManager()
        use_redis = session_mgr.redis and not session_mgr._use_memory
        
        if use_redis:
            try:
                current_count_str = await session_mgr.redis.get(user_key)
                if current_count_str:
                    current_count = int(current_count_str)
                    if current_count >= limit:
                        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
                    await session_mgr.redis.incr(user_key)
                else:
                    await session_mgr.redis.set(user_key, "1", ex=window)
                return
            except HTTPException:
                raise
            except Exception:
                SessionManager._use_memory = True
                pass
                
        # In-memory fallback
        history = _rate_limits.get(user_key, [])
        history = [t for t in history if now - t < window]
        
        if len(history) >= limit:
            raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
            
        history.append(now)
        _rate_limits[user_key] = history
        
    return check_rate_limit
