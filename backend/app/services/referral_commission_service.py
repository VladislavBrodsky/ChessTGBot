import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.gamification import Referral
from app.models.transaction import Transaction

logger = logging.getLogger(__name__)

class ReferralCommissionService:
    TIER_RATES = {
        "Recruit": {
            1: 0.020, 2: 0.0, 3: 0.0, 4: 0.0, 5: 0.0, 6: 0.0
        },
        "Pawn": {
            1: 0.012, 2: 0.008, 3: 0.0, 4: 0.0, 5: 0.0, 6: 0.0
        },
        "Knight": {
            1: 0.010, 2: 0.006, 3: 0.004, 4: 0.0, 5: 0.0, 6: 0.0
        },
        "Master": {
            1: 0.008, 2: 0.005, 3: 0.004, 4: 0.003, 5: 0.0, 6: 0.0
        },
        "Elite": {
            1: 0.007, 2: 0.004, 3: 0.003, 4: 0.0025, 5: 0.002, 6: 0.0015
        }
    }

    DEPTH_REQUIREMENTS = {
        2: {"tier": "Pawn", "level": 11, "rate": 0.008},
        3: {"tier": "Knight", "level": 21, "rate": 0.004},
        4: {"tier": "Master", "level": 31, "rate": 0.003},
        5: {"tier": "Elite", "level": 51, "rate": 0.002},
        6: {"tier": "Elite", "level": 51, "rate": 0.0015},
    }

    SUBSCRIPTION_TIER_RATES = {
        "Recruit": {
            1: 0.15, 2: 0.0, 3: 0.0, 4: 0.0, 5: 0.0, 6: 0.0
        },
        "Pawn": {
            1: 0.12, 2: 0.08, 3: 0.0, 4: 0.0, 5: 0.0, 6: 0.0
        },
        "Knight": {
            1: 0.12, 2: 0.08, 3: 0.05, 4: 0.0, 5: 0.0, 6: 0.0
        },
        "Master": {
            1: 0.10, 2: 0.08, 3: 0.05, 4: 0.07, 5: 0.0, 6: 0.0
        },
        "Elite": {
            1: 0.10, 2: 0.06, 3: 0.05, 4: 0.04, 5: 0.03, 6: 0.02
        }
    }

    SUBSCRIPTION_DEPTH_REQUIREMENTS = {
        2: {"tier": "Pawn", "level": 11, "rate": 0.08},
        3: {"tier": "Knight", "level": 21, "rate": 0.05},
        4: {"tier": "Master", "level": 31, "rate": 0.07},
        5: {"tier": "Elite", "level": 51, "rate": 0.03},
        6: {"tier": "Elite", "level": 51, "rate": 0.02},
    }

    @staticmethod
    def get_commission_tier(level: int) -> dict:
        """Determines commission tier and emoji based on level (Elite is Level 51+)."""
        if level <= 10:
            return {"name": "Recruit", "emoji": "🪖", "rates": ReferralCommissionService.TIER_RATES["Recruit"]}
        elif level <= 20:
            return {"name": "Pawn", "emoji": "♟️", "rates": ReferralCommissionService.TIER_RATES["Pawn"]}
        elif level <= 30:
            return {"name": "Knight", "emoji": "🏅", "rates": ReferralCommissionService.TIER_RATES["Knight"]}
        elif level <= 50:
            return {"name": "Master", "emoji": "👑", "rates": ReferralCommissionService.TIER_RATES["Master"]}
        else:
            return {"name": "Elite", "emoji": "⚡", "rates": ReferralCommissionService.TIER_RATES["Elite"]}

    @staticmethod
    async def get_referrer_chain(db: AsyncSession, user_id: int, levels: int = 6) -> list[User]:
        """
        Traverses the referral graph up to `levels` levels to find the parent referrers.
        Returns a list of User objects starting from Tier 1 (direct referrer) to Tier N.
        Optimized to avoid N+1 queries and lock rows in deterministic order to prevent deadlocks.
        """
        from sqlalchemy import alias
        
        # Support up to 6 levels in this optimization.
        ref1 = alias(Referral, name="ref1")
        ref2 = alias(Referral, name="ref2")
        ref3 = alias(Referral, name="ref3")
        ref4 = alias(Referral, name="ref4")
        ref5 = alias(Referral, name="ref5")
        ref6 = alias(Referral, name="ref6")
        
        stmt = (
            select(
                ref1.c.referrer_id.label("l1"),
                ref2.c.referrer_id.label("l2"),
                ref3.c.referrer_id.label("l3"),
                ref4.c.referrer_id.label("l4"),
                ref5.c.referrer_id.label("l5"),
                ref6.c.referrer_id.label("l6")
            )
            .select_from(ref1)
            .outerjoin(ref2, ref2.c.referred_user_id == ref1.c.referrer_id)
            .outerjoin(ref3, ref3.c.referred_user_id == ref2.c.referrer_id)
            .outerjoin(ref4, ref4.c.referred_user_id == ref3.c.referrer_id)
            .outerjoin(ref5, ref5.c.referred_user_id == ref4.c.referrer_id)
            .outerjoin(ref6, ref6.c.referred_user_id == ref5.c.referrer_id)
            .where(ref1.c.referred_user_id == user_id)
        )
        
        result = await db.execute(stmt)
        row = result.first()
        if not row:
            return []
            
        referrer_ids = []
        if row.l1:
            referrer_ids.append(row.l1)
        if row.l2 and levels >= 2:
            referrer_ids.append(row.l2)
        if row.l3 and levels >= 3:
            referrer_ids.append(row.l3)
        if row.l4 and levels >= 4:
            referrer_ids.append(row.l4)
        if row.l5 and levels >= 5:
            referrer_ids.append(row.l5)
        if row.l6 and levels >= 6:
            referrer_ids.append(row.l6)
            
        if not referrer_ids:
            return []
            
        # Lock rows in deterministic ascending order to prevent deadlocks
        referrer_ids_sorted = sorted(list(set(referrer_ids)))
        users_stmt = select(User).where(User.id.in_(referrer_ids_sorted)).with_for_update()
        users_res = await db.execute(users_stmt)
        users_map = {u.id: u for u in users_res.scalars().all()}
        
        # Build chain preserving direct-referrer first (l1 -> l2 -> l3 -> l4 -> l5 -> l6) order
        chain = []
        for rid in referrer_ids:
            if rid in users_map:
                chain.append(users_map[rid])
                
        return chain

    @staticmethod
    async def get_cumulative_earnings(db: AsyncSession, telegram_id: int) -> int:
        """Gets cumulative referral commission earned by a user in cents."""
        from sqlalchemy import func
        result = await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                Transaction.user_id == telegram_id,
                Transaction.type == "referral_commission",
                Transaction.status == "completed"
            )
        )
        return result.scalar() or 0

    @staticmethod
    async def get_referral_count(db: AsyncSession, referrer_id: int) -> int:
        """Gets total referral count for a referrer."""
        from sqlalchemy import func
        result = await db.execute(
            select(func.count(Referral.id)).where(Referral.referrer_id == referrer_id)
        )
        return result.scalar() or 0

    @staticmethod
    async def distribute_wager_commissions(db: AsyncSession, game_id: str, player_id: int, bid_amount: int, is_winner: bool) -> int:
        """
        Distributes referral commissions based on a player's wager (2% referral pool).
        Splits the commission up to 6 levels deep according to referrer tiers and premium status.
        Sends engaging success or FOMO (Premium / Level Up) notifications.
        Returns the total commission distributed in cents.
        """
        if bid_amount <= 0:
            return 0

        # Fetch the player's info to personalize notifications
        player_result = await db.execute(select(User).where(User.id == player_id))
        player = player_result.scalars().first()
        if not player:
            return 0

        player_display = f"@{player.username}" if player.username else f"{player.first_name}"

        # Fetch referrer chain up to 6 levels
        chain = await ReferralCommissionService.get_referrer_chain(db, player_id, levels=6)
        if not chain:
            return 0

        total_distributed = 0

        for idx, referrer in enumerate(chain):
            depth = idx + 1
            tier_info = ReferralCommissionService.get_commission_tier(referrer.level)
            rate = tier_info["rates"].get(depth, 0.0)

            # Determine eligibility
            is_premium_eligible = (depth <= 3) or referrer.is_premium
            has_tier_rate = rate > 0.0

            if is_premium_eligible and has_tier_rate:
                # Calculate and award commission
                commission = int(bid_amount * rate)
                if commission > 0:
                    referrer.balance += commission
                    db.add(referrer)

                    # Create commission transaction ledger entry
                    tx = Transaction(
                        user_id=referrer.telegram_id,
                        type="referral_commission",
                        amount=commission,
                        fee=0,
                        reference_id=f"ref_{game_id}",
                        status="completed"
                    )
                    db.add(tx)
                    await db.flush()  # Flush so transaction is in DB before querying sum

                    total_distributed += commission
                    logger.info(f"Awarded L{depth} commission of {commission} cents to User {referrer.id}")

                    # Fetch cumulative stats for notification
                    cum_earnings = await ReferralCommissionService.get_cumulative_earnings(db, referrer.telegram_id)
                    ref_count = await ReferralCommissionService.get_referral_count(db, referrer.id)

                    # Send victory or played notification
                    try:
                        from app.services.telegram_bot import TelegramService
                        tier_emoji = tier_info["emoji"]
                        tier_name = tier_info["name"]

                        if is_winner:
                            msg = (
                                f"🏆 <b>Your Recruit Secured a Victory!</b>\n\n"
                                f"• <b>Player:</b> {player_display} (L{depth})\n"
                                f"• <b>Match ID:</b> <code>{game_id}</code>\n"
                                f"• <b>Your Cut ({rate * 100:.2f}%):</b> +${commission / 100:.3f} USDT\n"
                                f"• <b>Your Tier:</b> {tier_emoji} {tier_name}\n\n"
                                f"📊 <b>Your Network:</b> {ref_count} recruits | ${cum_earnings / 100:.2f} USDT earned\n\n"
                                f"<i>Passive income is flowing in! Keep sharing your link. ♟️💸</i>"
                            )
                        else:
                            msg = (
                                f"♟️ <b>Referral Match Played!</b>\n\n"
                                f"• <b>Player:</b> {player_display} (L{depth})\n"
                                f"• <b>Match ID:</b> <code>{game_id}</code>\n"
                                f"• <b>Your Cut ({rate * 100:.2f}%):</b> +${commission / 100:.3f} USDT\n"
                                f"• <b>Your Tier:</b> {tier_emoji} {tier_name}\n\n"
                                f"📊 <b>Your Network:</b> {ref_count} recruits | ${cum_earnings / 100:.2f} USDT earned\n\n"
                                f"<i>Passive income earned from your recruit's battle! ♟️⚡</i>"
                            )
                        await TelegramService.send_notification(referrer.telegram_id, msg)
                    except Exception as e:
                        logger.error(f"Failed to send commission notification to {referrer.telegram_id}: {e}")

            elif not is_premium_eligible and has_tier_rate:
                # Premium FOMO: tier supports this level, but referrer is not Premium
                potential_commission = int(bid_amount * rate)
                if potential_commission > 0:
                    try:
                        from app.services.telegram_bot import TelegramService
                        msg = (
                            f"👑 <b>Missed Premium Commission!</b>\n\n"
                            f"Your L{depth} recruit {player_display} just completed a match.\n"
                            f"• <b>Match ID:</b> <code>{game_id}</code>\n"
                            f"• <b>Wager Bid:</b> ${bid_amount / 100:.2f} USDT\n"
                            f"• <b>You Missed:</b> +${potential_commission / 100:.3f} USDT\n\n"
                            f"<i>Upgrade to 👑 <b>Chess Premium</b> to unlock commissions for Level 4-6 referrals!</i>"
                        )
                        await TelegramService.send_notification(referrer.telegram_id, msg)
                    except Exception as e:
                        logger.error(f"Failed to send Premium FOMO to {referrer.telegram_id}: {e}")

            elif is_premium_eligible and not has_tier_rate:
                # Level Up FOMO: current tier doesn't support depth d, but a higher tier does
                if depth in ReferralCommissionService.DEPTH_REQUIREMENTS:
                    req = ReferralCommissionService.DEPTH_REQUIREMENTS[depth]
                    potential_commission = int(bid_amount * req["rate"])
                    if potential_commission > 0:
                        try:
                            from app.services.telegram_bot import TelegramService
                            msg = (
                                f"📈 <b>Level Up to Unlock Level {depth} Commissions!</b>\n\n"
                                f"Your L{depth} recruit {player_display} just completed a match.\n"
                                f"• <b>Match ID:</b> <code>{game_id}</code>\n"
                                f"• <b>Wager Bid:</b> ${bid_amount / 100:.2f} USDT\n"
                                f"• <b>Potential Cut:</b> +${potential_commission / 100:.3f} USDT\n"
                                f"• <b>Your Current Tier:</b> {tier_info['emoji']} {tier_info['name']}\n\n"
                                f"<i>Reach <b>{req['tier']} Tier (Level {req['level']})</b> to unlock this passive income! ♟️🚀</i>"
                            )
                            await TelegramService.send_notification(referrer.telegram_id, msg)
                        except Exception as e:
                            logger.error(f"Failed to send Level Up FOMO to {referrer.telegram_id}: {e}")

        return total_distributed

    @staticmethod
    async def distribute_subscription_commissions(db: AsyncSession, subscriber_id: int, price: int) -> int:
        """
        Distributes referral commissions based on a user's Premium subscription purchase (up to 30% pool).
        Splits the commission up to 6 levels deep.
        Referrers with Premium get up to 6 levels; referrers without Premium get up to 3 levels.
        Sends Telegram notifications and FOMO alerts.
        Returns the total commission distributed in cents.
        """
        if price <= 0:
            return 0

        # Fetch the subscriber info to personalize notifications
        subscriber_res = await db.execute(select(User).where(User.id == subscriber_id))
        subscriber = subscriber_res.scalars().first()
        if not subscriber:
            return 0

        subscriber_display = f"@{subscriber.username}" if subscriber.username else f"{subscriber.first_name}"

        # Fetch referrer chain up to 6 levels
        chain = await ReferralCommissionService.get_referrer_chain(db, subscriber_id, levels=6)
        if not chain:
            return 0

        total_distributed = 0

        for idx, referrer in enumerate(chain):
            depth = idx + 1
            tier_info = ReferralCommissionService.get_commission_tier(referrer.level)
            
            # Use subscription rate matrix
            rate = ReferralCommissionService.SUBSCRIPTION_TIER_RATES[tier_info["name"]].get(depth, 0.0)

            # Determine eligibility: Premium referrers get up to 6 levels, Free referrers get up to 3 levels
            is_premium_eligible = (depth <= 3) or referrer.is_premium
            has_tier_rate = rate > 0.0

            if is_premium_eligible and has_tier_rate:
                # Calculate and award commission
                commission = int(price * rate)
                if commission > 0:
                    referrer.balance += commission
                    db.add(referrer)

                    # Create commission transaction ledger entry
                    tx = Transaction(
                        user_id=referrer.telegram_id,
                        type="subscription_commission",
                        amount=commission,
                        fee=0,
                        reference_id=f"sub_commission_{subscriber_id}",
                        status="completed"
                    )
                    db.add(tx)
                    await db.flush()

                    total_distributed += commission
                    logger.info(f"Awarded L{depth} Premium subscription commission of {commission} cents to User {referrer.id}")

                    # Fetch stats for notification
                    cum_earnings = await ReferralCommissionService.get_cumulative_earnings(db, referrer.telegram_id)
                    ref_count = await ReferralCommissionService.get_referral_count(db, referrer.id)

                    try:
                        from app.services.telegram_bot import TelegramService
                        tier_emoji = tier_info["emoji"]
                        tier_name = tier_info["name"]

                        msg = (
                            f"👑 <b>New Premium Upgrade in Your Network!</b>\n\n"
                            f"• <b>Subscriber:</b> {subscriber_display} (L{depth})\n"
                            f"• <b>Upgrade Price:</b> ${price / 100:.2f} USDT\n"
                            f"• <b>Your Cut ({rate * 100:.1f}%):</b> +${commission / 100:.2f} USDT\n"
                            f"• <b>Your Tier:</b> {tier_emoji} {tier_name}\n\n"
                            f"📊 <b>Your Network:</b> {ref_count} recruits | ${cum_earnings / 100:.2f} USDT earned\n\n"
                            f"<i>Thank them for leveling up! Your network is growing! ♟️🚀🔥</i>"
                        )
                        await TelegramService.send_notification(referrer.telegram_id, msg)
                    except Exception as e:
                        logger.error(f"Failed to send subscription commission notification to {referrer.telegram_id}: {e}")

            elif not is_premium_eligible and has_tier_rate:
                # Premium FOMO: referrer is not Premium but depth is 4-6
                potential_commission = int(price * rate)
                if potential_commission > 0:
                    try:
                        from app.services.telegram_bot import TelegramService
                        msg = (
                            f"👑 <b>Missed Premium Upgrade Commission!</b>\n\n"
                            f"Your L{depth} recruit {subscriber_display} just upgraded to Chess Premium.\n"
                            f"• <b>Upgrade Price:</b> ${price / 100:.2f} USDT\n"
                            f"• <b>You Missed:</b> +${potential_commission / 100:.2f} USDT\n\n"
                            f"<i>Upgrade to 👑 <b>Chess Premium</b> to unlock commissions for Level 4-6 referrals!</i>"
                        )
                        await TelegramService.send_notification(referrer.telegram_id, msg)
                    except Exception as e:
                        logger.error(f"Failed to send Premium subscription FOMO to {referrer.telegram_id}: {e}")

            elif is_premium_eligible and not has_tier_rate:
                # Level Up FOMO: current tier doesn't support depth d, but a higher tier does
                if depth in ReferralCommissionService.SUBSCRIPTION_DEPTH_REQUIREMENTS:
                    req = ReferralCommissionService.SUBSCRIPTION_DEPTH_REQUIREMENTS[depth]
                    potential_commission = int(price * req["rate"])
                    if potential_commission > 0:
                        try:
                            from app.services.telegram_bot import TelegramService
                            msg = (
                                f"📈 <b>Level Up to Unlock Level {depth} Subscription Commissions!</b>\n\n"
                                f"Your L{depth} recruit {subscriber_display} just upgraded to Chess Premium.\n"
                                f"• <b>Upgrade Price:</b> ${price / 100:.2f} USDT\n"
                                f"• <b>Potential Cut:</b> +${potential_commission / 100:.2f} USDT\n"
                                f"• <b>Your Current Tier:</b> {tier_info['emoji']} {tier_info['name']}\n\n"
                                f"<i>Reach <b>{req['tier']} Tier (Level {req['level']})</b> to unlock this passive income! ♟️🚀</i>"
                            )
                            await TelegramService.send_notification(referrer.telegram_id, msg)
                        except Exception as e:
                            logger.error(f"Failed to send subscription Level Up FOMO to {referrer.telegram_id}: {e}")

        return total_distributed
