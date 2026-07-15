from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.xp_transaction import XpTransaction
from app.crud import user as user_crud
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
import random
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class UnboxRequest(BaseModel):
    tier: str
    currency: str = "xr"  # "xr" or "xp"

class PurchaseRequest(BaseModel):
    item_id: str
    currency: str = "xr"  # "xr" or "xp"

# Box costs in cents (1 XR = $1.00 = 100 cents)
BOX_COSTS_XR = {
    "common": 5000,     # 50 XR
    "rare": 15000,      # 150 XR
    "epic": 50000,      # 500 XR
    "legendary": 150000,# 1500 XR
    "seasonal": 80000   # 800 XR
}

# Box costs in XP (Scholastic XP)
BOX_COSTS_XP = {
    "common": 5000,     # Bronze
    "rare": 8000,       # Silver
    "epic": 10000,      # Gold
    "legendary": 30000, # Platinum
    "seasonal": 12000   # Genesis
}

# Direct purchase costs in cents
DIRECT_COSTS_XR = {
    "premium_1m": 100000,   # 1000 XR
    "premium_1y": 800000,   # 8000 XR
}

# Direct purchase costs in XP (Rebalanced Progression)
DIRECT_COSTS_XP = {
    "premium_1m": 15000,    # 1-Month Premium
    "premium_1y": 120000,   # 1-Year Premium
}

@router.post("/unbox")
async def unbox_mystery_box(
    request: UnboxRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    tier = request.tier.lower()
    currency = request.currency.lower()

    if tier not in BOX_COSTS_XR:
        raise HTTPException(status_code=400, detail="Invalid mystery box tier")

    # Serialize user row to prevent concurrency races
    from sqlalchemy import select
    user_stmt = select(User).where(User.telegram_id == current_user.telegram_id).with_for_update()
    res_user = await db.execute(user_stmt)
    db_user = res_user.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # 1. Deduct cost based on selected currency
    if currency == "xp":
        cost_xp = BOX_COSTS_XP[tier]
        if db_user.xp < cost_xp:
            raise HTTPException(status_code=400, detail=f"Insufficient XP. Need {cost_xp} XP.")
        
        db_user.xp -= cost_xp
        
        # Log negative XP transaction
        xp_tx = XpTransaction(
            user_id=db_user.telegram_id,
            amount=-cost_xp,
            reason=f"unbox_spend_{tier}"
        )
        db.add(xp_tx)
        db.add(db_user)
    elif currency == "xr":
        cost_xr = BOX_COSTS_XR[tier]
        # Atomically debit the balance
        updated_user = await user_crud.atomic_debit(db, current_user.telegram_id, cost_xr, commit=False)
        if not updated_user:
            raise HTTPException(status_code=400, detail="Insufficient XR balance")
        db_user = updated_user

        # Record debit transaction ledger entry
        debit_tx = Transaction(
            user_id=current_user.telegram_id,
            type="marketplace_purchase",
            amount=-cost_xr,
            status="completed",
            reference_id=f"unbox_{tier}"
        )
        db.add(debit_tx)
    else:
        raise HTTPException(status_code=400, detail="Unsupported currency type")

    # 2. Roll RNG and determine prize
    prize_name = ""
    prize_type = ""
    refund_amount = 0
    premium_days = 0

    roll = random.random()

    if tier == "common":
        if roll < 0.50:
            prize_name = "50 XR (Full Refund)"
            prize_type = "refund"
            refund_amount = 5000
        elif roll < 0.90:
            prize_name = "1.2x XR Boost (24h)"
            prize_type = "boost"
        else:
            prize_name = "Bronze Profile Border"
            prize_type = "cosmetic"

    elif tier == "rare":
        if roll < 0.40:
            prize_name = "1.5x XR Boost (48h)"
            prize_type = "boost"
        elif roll < 0.80:
            prize_name = "Silver Profile Border"
            prize_type = "cosmetic"
        else:
            prize_name = "1-Week Premium"
            prize_type = "premium"
            premium_days = 7

    elif tier == "epic":
        if roll < 0.50:
            prize_name = "1-Month Premium"
            prize_type = "premium"
            premium_days = 30
        elif roll < 0.80:
            prize_name = "Gold Profile Border"
            prize_type = "cosmetic"
        else:
            prize_name = "2x XR Boost (72h)"
            prize_type = "boost"

    elif tier == "legendary":
        if roll < 0.50:
            prize_name = "500 XR Jackpot"
            prize_type = "refund"
            refund_amount = 50000
        elif roll < 0.80:
            prize_name = "Platinum Profile Border"
            prize_type = "cosmetic"
        else:
            prize_name = "1-Year Premium"
            prize_type = "premium"
            premium_days = 365

    elif tier == "seasonal":
        if roll < 0.50:
            prize_name = "Limited Season Badge"
            prize_type = "cosmetic"
        else:
            prize_name = "Season Multiplier Boost"
            prize_type = "boost"

    # Apply prize updates
    if refund_amount > 0:
        # Credit refund atomically to user balance
        await user_crud.atomic_credit(db, current_user.telegram_id, refund_amount, commit=False)
        refund_tx = Transaction(
            user_id=current_user.telegram_id,
            type="marketplace_refund",
            amount=refund_amount,
            status="completed",
            reference_id=f"refund_{tier}"
        )
        db.add(refund_tx)

    if premium_days > 0:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        current_expiry = db_user.premium_expires_at
        
        if db_user.is_premium_active and current_expiry:
            new_expiry = current_expiry + timedelta(days=premium_days)
        else:
            new_expiry = now + timedelta(days=premium_days)
            
        await user_crud.update_subscription(
            db, 
            db_user, 
            tier="premium", 
            expires_at=new_expiry, 
            billing_period="monthly" if premium_days == 30 else ("annual" if premium_days == 365 else "weekly")
        )

    # Boost updates
    if prize_type == "boost":
        import json
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        boost_multiplier = 1.2
        hours = 24
        if "1.5x" in prize_name:
            boost_multiplier = 1.5
            hours = 48
        elif "2x" in prize_name:
            boost_multiplier = 2.0
            hours = 72
        elif "Season" in prize_name:
            boost_multiplier = 2.0
            hours = 168 # 7 days
        
        if db_user.multiplier_expires_at and db_user.multiplier_expires_at > now:
            db_user.multiplier_expires_at += timedelta(hours=hours)
            db_user.xp_multiplier = max(db_user.xp_multiplier, boost_multiplier)
        else:
            db_user.xp_multiplier = boost_multiplier
            db_user.multiplier_expires_at = now + timedelta(hours=hours)
        db.add(db_user)

    # Cosmetic updates
    if prize_type == "cosmetic":
        import json
        cosmetic_code = "cosmetic_unknown"
        if "Bronze" in prize_name:
            cosmetic_code = "border_bronze"
        elif "Silver" in prize_name:
            cosmetic_code = "border_silver"
        elif "Gold" in prize_name:
            cosmetic_code = "border_gold"
        elif "Platinum" in prize_name:
            cosmetic_code = "border_platinum"
        elif "Season" in prize_name:
            cosmetic_code = "badge_seasonal"
        
        try:
            unlocked = json.loads(db_user.unlocked_items or "[]")
        except Exception:
            unlocked = []
        
        if cosmetic_code not in unlocked:
            unlocked.append(cosmetic_code)
            db_user.unlocked_items = json.dumps(unlocked)
        db.add(db_user)

    await db.commit()
    logger.info(f"[MARKETPLACE] user_id={current_user.telegram_id} | unboxed={tier} via={currency} | won={prize_name}")

    return {
        "success": True,
        "prize_name": prize_name,
        "prize_type": prize_type,
        "balance": db_user.balance,
        "xp": db_user.xp
    }

@router.post("/purchase")
async def purchase_direct_item(
    request: PurchaseRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    item_id = request.item_id
    currency = request.currency.lower()

    # Lock user row
    from sqlalchemy import select
    user_stmt = select(User).where(User.telegram_id == current_user.telegram_id).with_for_update()
    res_user = await db.execute(user_stmt)
    db_user = res_user.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # 1. Deduct cost based on selected currency
    if currency == "xp":
        if item_id not in DIRECT_COSTS_XP:
            raise HTTPException(status_code=400, detail="Invalid direct purchase item for XP")
        cost_xp = DIRECT_COSTS_XP[item_id]
        if db_user.xp < cost_xp:
            raise HTTPException(status_code=400, detail=f"Insufficient XP. Need {cost_xp} XP.")
        
        db_user.xp -= cost_xp
        
        # Log negative XP transaction
        xp_tx = XpTransaction(
            user_id=db_user.telegram_id,
            amount=-cost_xp,
            reason=f"purchase_spend_{item_id}"
        )
        db.add(xp_tx)
        db.add(db_user)
    elif currency == "xr":
        if item_id not in DIRECT_COSTS_XR:
            raise HTTPException(status_code=400, detail="Invalid direct purchase item for XR")
        cost_xr = DIRECT_COSTS_XR[item_id]
        
        # Atomically debit the balance
        updated_user = await user_crud.atomic_debit(db, current_user.telegram_id, cost_xr, commit=False)
        if not updated_user:
            raise HTTPException(status_code=400, detail="Insufficient XR balance")
        db_user = updated_user

        # Record transaction ledger entry
        purchase_tx = Transaction(
            user_id=current_user.telegram_id,
            type="marketplace_purchase",
            amount=-cost_xr,
            status="completed",
            reference_id=f"purchase_{item_id}"
        )
        db.add(purchase_tx)
    else:
        raise HTTPException(status_code=400, detail="Unsupported currency type")

    # 2. Apply purchased upgrade
    if item_id == "premium_1m":
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        current_expiry = db_user.premium_expires_at
        new_expiry = (current_expiry if db_user.is_premium_active and current_expiry else now) + timedelta(days=30)
        
        await user_crud.update_subscription(db, db_user, tier="premium", expires_at=new_expiry, billing_period="monthly")
    
    elif item_id == "premium_1y":
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        current_expiry = db_user.premium_expires_at
        new_expiry = (current_expiry if db_user.is_premium_active and current_expiry else now) + timedelta(days=365)
        
        await user_crud.update_subscription(db, db_user, tier="premium", expires_at=new_expiry, billing_period="annual")

    await db.commit()
    return {
        "success": True,
        "message": f"Successfully purchased {item_id}",
        "balance": db_user.balance,
        "xp": db_user.xp
    }
