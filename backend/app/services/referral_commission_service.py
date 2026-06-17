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
    async def distribute_wager_commissions(db: AsyncSession, game_id: str, player_id: int, bid_amount: int, is_winner: bool) -> int:
        """
        Distributes referral commissions based on player's wager and match outcome:
        - 0.5% of player's wager goes to L1 (direct parent) as a Played Game Commission.
        - If is_winner is True, a Win Tree Commission is charged from the winner's payout:
            - L1 (direct parent): 1.0% of wager
            - L2 (grandparent): 0.5% of wager
            - L3 (great-grandparent): 0.3% of wager
        Returns the total Win Tree Commission sum to be deducted from the winner's payout.
        """
        if bid_amount <= 0:
            return 0

        # Fetch the player's info to personalize notifications
        player_result = await db.execute(select(User).where(User.id == player_id))
        player = player_result.scalars().first()
        if not player:
            return 0

        player_display = f"@{player.username}" if player.username else f"User {player.first_name}"

        # Fetch referrer chain up to 3 levels
        chain = await ReferralCommissionService.get_referrer_chain(db, player_id, levels=3)
        if not chain:
            return 0

        # 1. Distribute Played Game Commission (0.5% to L1 parent only)
        l1_referrer = chain[0] if len(chain) > 0 else None
        if l1_referrer:
            played_commission = int(bid_amount * 0.005)
            if played_commission > 0:
                if l1_referrer.is_premium:
                    l1_referrer.balance += played_commission
                    db.add(l1_referrer)

                    # Create commission transaction ledger entry
                    tx_played = Transaction(
                        user_id=l1_referrer.telegram_id,
                        type="referral_commission",
                        amount=played_commission,
                        fee=0,
                        reference_id=f"played_{game_id}",
                        status="completed"
                    )
                    db.add(tx_played)
                    logger.info(f"Awarded Played Commission of {played_commission} cents to User {l1_referrer.id} (L1)")

                    # Send notification to L1
                    try:
                        from app.services.telegram_bot import TelegramService
                        msg = (
                            f"♟️ <b>Referral Match Played Commission!</b>\n\n"
                            f"• <b>Player:</b> {player_display}\n"
                            f"• <b>Match ID:</b> <code>{game_id}</code>\n"
                            f"• <b>L1 Played Commission (0.5%):</b> +${played_commission / 100:.3f} USDT\n\n"
                            f"<i>Passive income earned from your recruit's match! ♟️⚡</i>"
                        )
                        await TelegramService.send_notification(l1_referrer.telegram_id, msg)
                    except Exception as e:
                        logger.error(f"Failed to send played commission notification to user {l1_referrer.telegram_id}: {e}")
                else:
                    logger.info(f"Skipping played commission for User {l1_referrer.id} (L1): Not Premium")

        # 2. Distribute Win Tree Commission (Only if the player won the match)
        total_win_deduction = 0
        if is_winner:
            # Win commission rates for each tier
            tier_rates = {
                1: 0.010,   # Tier 1 (L1): 1.0% of wager
                2: 0.005,   # Tier 2 (L2): 0.5% of wager
                3: 0.003    # Tier 3 (L3): 0.3% of wager
            }

            for idx, referrer in enumerate(chain):
                tier = idx + 1
                rate = tier_rates.get(tier, 0.0)
                commission = int(bid_amount * rate)
                if commission <= 0:
                    continue

                # The winner is charged this commission regardless of whether referrer is Premium.
                # (Referrer only gets it if they are Premium, which builds strong FOMO for the referrer).
                total_win_deduction += commission

                if not referrer.is_premium:
                    logger.info(f"Skipping win commission credit for User {referrer.id} (Tier {tier}): Not Premium")
                    continue

                # Credit referrer balance
                referrer.balance += commission
                db.add(referrer)

                # Create commission transaction ledger entry
                tx_win = Transaction(
                    user_id=referrer.telegram_id,
                    type="referral_commission",
                    amount=commission,
                    fee=0,
                    reference_id=f"win_{game_id}",
                    status="completed"
                )
                db.add(tx_win)
                logger.info(f"Awarded Win Commission of {commission} cents to User {referrer.id} (Tier {tier})")

                # Send notifications to referrers L1, L2, L3
                try:
                    from app.services.telegram_bot import TelegramService
                    tier_emoji = {1: "🏆 L1", 2: "🥈 L2", 3: "🥉 L3"}.get(tier, "🎖️")
                    msg = (
                        f"🏆 <b>Your Recruit Secured a Victory!</b>\n\n"
                        f"• <b>Player:</b> {player_display}\n"
                        f"• <b>Match ID:</b> <code>{game_id}</code>\n"
                        f"• <b>{tier_emoji} Win Commission ({rate*100:.1f}%):</b> +${commission / 100:.3f} USDT\n\n"
                        f"<i>Your referral passive income is growing! ♟️💸</i>"
                    )
                    await TelegramService.send_notification(referrer.telegram_id, msg)
                except Exception as e:
                    logger.error(f"Failed to send win commission notification to user {referrer.telegram_id}: {e}")

        return total_win_deduction
