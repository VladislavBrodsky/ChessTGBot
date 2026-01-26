from fastapi import Header, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.crud import user as user_crud
from app.models.user import User
from typing import Optional

async def get_current_user(
    x_telegram_id: Optional[int] = Header(None, alias="X-Telegram-ID"),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get the current user from the X-Telegram-ID header.
    In a real production app, this would verify a Telegram InitData token.
    For this MVP, we trust the header for simplicity.
    """
    if not x_telegram_id:
        raise HTTPException(
            status_code=401,
            detail="X-Telegram-ID header missing"
        )
    
    user = await user_crud.get_user_by_telegram_id(db, x_telegram_id)
    if not user:
        # Auto-register if user doesn't exist? (Consistent with users.py logic)
        user = await user_crud.create_user(db, x_telegram_id, f"User_{x_telegram_id}")
        
    return user
