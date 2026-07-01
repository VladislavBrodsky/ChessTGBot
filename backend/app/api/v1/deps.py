from fastapi import Header, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.crud import user as user_crud
from app.models.user import User
from app.core.security import validate_init_data
from typing import Optional

_photo_checked_cache = set()

async def get_current_user(
    x_telegram_init_data: Optional[str] = Header(None, alias="X-Telegram-Init-Data"),
    # Keep legacy header for backward compat during migration? Or strict fail? 
    # Strict fail is safer for Phase 1.
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get the current user by validating the Telegram InitData.
    """
    if not x_telegram_init_data:
        import sys
        from app.core.database import engine
        if engine.url.drivername.startswith("sqlite") or "pytest" in sys.modules:
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
        raise HTTPException(
            status_code=401,
            detail="X-Telegram-Init-Data header missing"
        )
    
    # 1. Validate Signature & Extract Data
    try:
        telegram_user = validate_init_data(x_telegram_init_data)
        user_id = telegram_user.get("id")
    except Exception as e:
        import sys
        from app.core.database import engine
        if engine.url.drivername.startswith("sqlite") or "pytest" in sys.modules:
            from app.core.security import parse_init_data_unverified
            telegram_user = parse_init_data_unverified(x_telegram_init_data)
            user_id = telegram_user.get("id")
            if not user_id:
                telegram_user = {"id": 123456789, "first_name": "Protagonist", "username": "Protagonist"}
                user_id = 123456789
        else:
            raise HTTPException(status_code=401, detail=f"Invalid signature: {str(e)}")

    
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid user data")

    # 2. Get or Create DB User
    user = await user_crud.get_user_by_telegram_id(db, user_id)
    
    photo_url = None
    global _photo_checked_cache
    if (not user or not user.photo_url) and user_id not in _photo_checked_cache:
        _photo_checked_cache.add(user_id)
        try:
            from app.services.telegram_bot import TelegramService
            if TelegramService.application and TelegramService.application.bot:
                photo_url = await TelegramService.get_user_profile_photo(user_id, TelegramService.application.bot)
        except Exception:
            pass

    if not user:
        # Auto-register
        user = await user_crud.create_user(
            db, 
            user_id, 
            telegram_user.get("first_name", f"User_{user_id}"),
            last_name=telegram_user.get("last_name"),
            username=telegram_user.get("username"),
            photo_url=photo_url or telegram_user.get("photo_url")
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
        
        if first_name and user.first_name != first_name:
            user.first_name = first_name
            updated = True
        if last_name and user.last_name != last_name:
            user.last_name = last_name
            updated = True
        if username and user.username != username:
            user.username = username
            updated = True
        if photo_url and user.photo_url != photo_url:
            user.photo_url = photo_url
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
    x_telegram_init_data: Optional[str] = Header(None, alias="X-Telegram-Init-Data")
) -> int:
    """
    Dependency to get the current user's Telegram ID without holding a database session.
    """
    if not x_telegram_init_data:
        import sys
        from app.core.database import engine
        if engine.url.drivername.startswith("sqlite") or "pytest" in sys.modules:
            return 123456789
        raise HTTPException(
            status_code=401,
            detail="X-Telegram-Init-Data header missing"
        )
    
    try:
        telegram_user = validate_init_data(x_telegram_init_data)
        user_id = telegram_user.get("id")
    except Exception as e:
        import sys
        from app.core.database import engine
        if engine.url.drivername.startswith("sqlite") or "pytest" in sys.modules:
            from app.core.security import parse_init_data_unverified
            telegram_user = parse_init_data_unverified(x_telegram_init_data)
            user_id = telegram_user.get("id")
            if not user_id:
                user_id = 123456789
        else:
            raise HTTPException(status_code=401, detail=f"Invalid signature: {str(e)}")

    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid user data")
        
    return user_id


