import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.gamification import Referral
from app.models.transaction import Transaction

logger = logging.getLogger(__name__)

class ReferralCommissionService:
    @staticmethod
    async def get_referrer_chain(db: AsyncSession, user_id: int, levels: int = 3) -> list[User]:
        """
        Traverses the referral graph up to `levels` levels to find the parent referrers.
        Returns a list of User objects starting from Tier 1 (direct referrer) to Tier N.
        """
        chain = []
        current_user_id = user_id
        
        for _ in range(levels):
            # Find the referral relationship where current_user_id was invited
            result = await db.execute(
                select(Referral).where(Referral.referred_user_id == current_user_id)
            )
            ref = result.scalars().first()
            if not ref:
                break
                
            # Fetch the referrer user details
            referrer_result = await db.execute(
                select(User).where(User.id == ref.referrer_id)
            )
            referrer = referrer_result.scalars().first()
            if not referrer:
                break
                
            chain.append(referrer)
            current_user_id = referrer.id
            
        return chain

    @staticmethod
    async def distribute_wager_commissions(db: AsyncSession, game_id: str, player_id: int, bid_amount: int):
        """
        Distributes referral commissions up to 3 tiers based on the player's wager.
        Commissions are funded out of the platform's rake and credited to Premium referrers.
        """
        if bid_amount <= 0:
            return

        # Individual rake contribution of the player (3% of player's wager)
        indiv_rake = int(bid_amount * 0.03)
        if indiv_rake <= 0:
            return

        # Fetch referrer chain up to 3 levels
        chain = await ReferralCommissionService.get_referrer_chain(db, player_id, levels=3)
        if not chain:
            return

        # Commission rates for each tier
        tier_rates = {
            1: 0.10,   # Tier 1: 10% of individual rake
            2: 0.05,   # Tier 2: 5% of individual rake
            3: 0.025   # Tier 3: 2.5% of individual rake
        }

        for idx, referrer in enumerate(chain):
            tier = idx + 1
            rate = tier_rates.get(tier, 0.0)
            
            # Commission is only paid if the referrer is a Premium user
            if not referrer.is_premium:
                logger.info(f"Skipping commission for User {referrer.id} (Tier {tier}): Not Premium")
                continue

            commission = int(indiv_rake * rate)
            if commission <= 0:
                continue

            # Credit balance
            referrer.balance += commission
            db.add(referrer)

            # Create commission transaction ledger entry
            tx = Transaction(
                user_id=referrer.telegram_id,
                type="referral_commission",
                amount=commission,
                fee=0,
                reference_id=game_id,
                status="completed"
            )
            db.add(tx)
            
            logger.info(f"Awarded Referral Commission of {commission} cents to User {referrer.id} (Tier {tier})")

            # Try to notify the referrer via Telegram bot
            try:
                from app.services.telegram_bot import TelegramService
                msg = (
                    f"<b>💸 Referral Commission Received!</b>\n\n"
                    f"• <b>Tier:</b> Tier {tier}\n"
                    f"• <b>Source Match ID:</b> <code>{game_id}</code>\n"
                    f"• <b>Amount Credited:</b> +${commission / 100:.3f} USDT\n\n"
                    f"<i>Thank you for helping grow the FinChess Matrix! ♟️⚡</i>"
                )
                await TelegramService.send_notification(referrer.telegram_id, msg)
            except Exception as e:
                logger.error(f"Failed to send commission notification to user {referrer.telegram_id}: {e}")
