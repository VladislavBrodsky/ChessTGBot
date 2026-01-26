from fastapi import Header, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.crud import user as user_crud
from app.models.user import User
from app.core.security import validate_init_data
from typing import Optional

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
        raise HTTPException(
            status_code=401,
            detail="X-Telegram-Init-Data header missing"
        )
    
    # 1. Validate Signature & Extract Data
    telegram_user = validate_init_data(x_telegram_init_data)
    user_id = telegram_user.get("id")
    
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid user data")

    # 2. Get or Create DB User
    user = await user_crud.get_user_by_telegram_id(db, user_id)
    if not user:
        # Auto-register
        user = await user_crud.create_user(
            db, 
            user_id, 
            telegram_user.get("first_name", f"User_{user_id}"),
            last_name=telegram_user.get("last_name"),
            username=telegram_user.get("username"),
            photo_url=telegram_user.get("photo_url")
        )
        
    return user
