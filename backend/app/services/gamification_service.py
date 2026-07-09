from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.user import User
from app.models.gamification import Task, UserTask, Referral, TaskType, UnlockedLesson, UnlockedPuzzle
from datetime import datetime, timedelta, timezone
import random
import string


def _xp_to_level(xp: int) -> int:
    """Canonical formula: 1 level per 200 XP, minimum level 1."""
    return max(1, int(xp // 200) + 1)


class GamificationService:
    @staticmethod
    async def get_or_create_daily_tasks(db: AsyncSession, user_id: int):
        # Lock user row to serialize task list generation and updates per user
        user_stmt = select(User).where(User.id == user_id).with_for_update()
        await db.execute(user_stmt)

        # 1. Get all daily tasks definitions
        result = await db.execute(select(Task).where(Task.is_daily == True))
        daily_tasks_defs = result.scalars().all()
        
        # Pre-fetch existing user tasks in a single query to eliminate N+1 database lookups
        task_ids = [t.id for t in daily_tasks_defs]
        existing_ut = await db.execute(
            select(UserTask).where(
                and_(UserTask.user_id == user_id, UserTask.task_id.in_(task_ids))
            )
        )
        user_tasks_map = {ut.task_id: ut for ut in existing_ut.scalars().all()}
        
        user_tasks = []
        for task_def in daily_tasks_defs:
            user_task = user_tasks_map.get(task_def.id)
            
            if not user_task:
                user_task = UserTask(user_id=user_id, task_id=task_def.id, progress=0, completed=False, claimed=False)
                db.add(user_task)
            else:
                # Reset logic for daily tasks: if last updated on a previous UTC day, reset progress & completion
                last_update = user_task.updated_at
                now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
                if not last_update or last_update.date() < now_utc.date():
                    user_task.progress = 0
                    user_task.completed = False
                    user_task.claimed = False
                    user_task.updated_at = now_utc
                    db.add(user_task)
            
            user_tasks.append(user_task)
        
        await db.commit()
        return user_tasks

    @staticmethod
    async def get_or_create_achievements(db: AsyncSession, user_id: int, commit: bool = True):
        # Lock user row to prevent concurrent achievements generation
        user_stmt = select(User).where(User.id == user_id).with_for_update()
        await db.execute(user_stmt)

        # Fetch all permanent tasks definitions
        result = await db.execute(select(Task).where(Task.is_daily == False))
        achievement_defs = result.scalars().all()
        
        # Pre-fetch existing user achievements in a single query to eliminate N+1 database lookups
        task_ids = [t.id for t in achievement_defs]
        existing_ut = await db.execute(
            select(UserTask).where(
                and_(UserTask.user_id == user_id, UserTask.task_id.in_(task_ids))
            )
        )
        user_tasks_map = {ut.task_id: ut for ut in existing_ut.scalars().all()}
        
        user_tasks = []
        for task_def in achievement_defs:
            user_task = user_tasks_map.get(task_def.id)
            
            # Determine progress for REFER task if applicable
            progress = 0
            completed = False
            if task_def.task_type == TaskType.REFER:
                from sqlalchemy import func
                ref_count_res = await db.execute(
                    select(func.count(Referral.id)).where(Referral.referrer_id == user_id)
                )
                ref_count = ref_count_res.scalar() or 0
                progress = min(ref_count, task_def.target_count)
                completed = progress >= task_def.target_count

            if not user_task:
                user_task = UserTask(
                    user_id=user_id,
                    task_id=task_def.id,
                    progress=progress if task_def.task_type == TaskType.REFER else 0,
                    completed=completed if task_def.task_type == TaskType.REFER else False,
                    claimed=False
                )
                db.add(user_task)
                user_tasks.append(user_task)
            else:
                # Self-healing: Update progress for REFER tasks if not claimed
                if task_def.task_type == TaskType.REFER and not user_task.claimed:
                    if user_task.progress != progress or user_task.completed != completed:
                        user_task.progress = progress
                        user_task.completed = completed
                        user_task.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
                        db.add(user_task)
                        user_tasks.append(user_task)
                
        if user_tasks:
            if commit:
                await db.commit()
            else:
                await db.flush()

    @staticmethod
    async def add_xp(db: AsyncSession, user: User, amount: int, trigger_kickback: bool = True, apply_booster: bool = True, commit: bool = True, reason: str = "activity", reference_id: str = None):
        # 1. Gather all user IDs that need to be locked (user + up to 3 tiers of referrers)
        user_ids_to_lock = [user.id]
        if trigger_kickback and amount > 0:
            current_id = user.id
            for _ in range(3):
                stmt = select(Referral).where(Referral.referred_user_id == current_id)
                res = await db.execute(stmt)
                referral = res.scalars().first()
                if not referral:
                    break
                user_ids_to_lock.append(referral.referrer_id)
                current_id = referral.referrer_id

        # 2. Lock users in deterministic ascending ID order to prevent database deadlocks
        sorted_user_ids = sorted(list(set(user_ids_to_lock)))
        users_stmt = select(User).where(User.id.in_(sorted_user_ids)).with_for_update()
        users_res = await db.execute(users_stmt)
        users_map = {u.id: u for u in users_res.scalars().all()}

        db_user = users_map.get(user.id)
        if not db_user:
            db_user = user # Fallback

        xp_earned = amount
        if apply_booster and db_user.is_premium_active and amount > 0:
            xp_earned = amount * 2

        db_user.xp += xp_earned

        # Use canonical level formula. Level is a high-watermark: only increases.
        new_level = _xp_to_level(db_user.xp)
        if new_level > db_user.level:
            db_user.level = new_level

        # Log main user XP transaction
        from app.models.xp_transaction import XpTransaction
        xp_tx = XpTransaction(
            user_id=db_user.telegram_id,
            amount=xp_earned,
            reason=reason,
            reference_id=str(reference_id) if reference_id is not None else None
        )
        db.add(xp_tx)

        # Multi-Tier XP Kickbacks — apply to locked users in memory
        if trigger_kickback and xp_earned > 0:
            current_user_id = db_user.id
            percentages = [0.10, 0.05, 0.025]

            for pct in percentages:
                # Find referrer of current_user_id
                stmt = select(Referral).where(Referral.referred_user_id == current_user_id)
                res = await db.execute(stmt)
                referral = res.scalars().first()
                if not referral:
                    break

                # Get locked referrer User from pre-fetched map
                referrer = users_map.get(referral.referrer_id)
                if not referrer:
                    break

                # Only premium referrers receive kickbacks
                if referrer.is_premium_active:
                    kickback_amount = round(xp_earned * pct)
                    if kickback_amount > 0:
                        referrer.xp += kickback_amount
                        # Recalculate referrer level (high-watermark)
                        referrer_new_level = _xp_to_level(referrer.xp)
                        if referrer_new_level > referrer.level:
                            referrer.level = referrer_new_level
                        db.add(referrer)

                        # Log kickback XP transaction
                        referral_tx = XpTransaction(
                            user_id=referrer.telegram_id,
                            amount=kickback_amount,
                            reason="referral_kickback",
                            reference_id=str(db_user.telegram_id)
                        )
                        db.add(referral_tx)

                current_user_id = referrer.id

        # Single atomic commit/flush covering user XP + all referral kickbacks
        if commit:
            await db.commit()
        else:
            await db.flush()
        return db_user


    @staticmethod
    async def generate_referral_code(db: AsyncSession):
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            result = await db.execute(select(User).where(User.referral_code == code))
            if not result.scalars().first():
                return code

    @staticmethod
    async def process_referral(db: AsyncSession, new_user: User, referral_code: str):
        if not referral_code:
            return False

        # Strip any deep link prefix (like "ref_")
        clean_code = referral_code
        if clean_code.startswith("ref_"):
            clean_code = clean_code[4:]

        result = await db.execute(select(User).where(User.referral_code == clean_code))
        referrer = result.scalars().first()

        if referrer and referrer.id != new_user.id:
            # Lock referrer and new_user in sorted ID order to prevent deadlocks
            sorted_ids = sorted([referrer.id, new_user.id])
            lock_stmt = select(User).where(User.id.in_(sorted_ids)).with_for_update()
            lock_res = await db.execute(lock_stmt)
            users_map = {u.id: u for u in lock_res.scalars().all()}

            referrer = users_map.get(referrer.id)
            new_user = users_map.get(new_user.id)

            if not referrer or not new_user:
                return False

            # Check if this referral already exists to prevent duplicate rewards
            referral_exists_result = await db.execute(
                select(Referral).where(
                    and_(Referral.referrer_id == referrer.id, Referral.referred_user_id == new_user.id)
                )
            )
            if referral_exists_result.scalars().first():
                return False

            # Circular referral loop check: prevent cycles (e.g. A -> B -> A)
            from app.services.referral_commission_service import ReferralCommissionService
            referrer_chain = await ReferralCommissionService.get_referrer_chain(db, referrer.id, levels=6)
            if any(u.id == new_user.id for u in referrer_chain):
                return False

            # Record the referral relationship — rewards are NOT granted yet.
            # They unlock once the recruit plays 3 games (see check_referral_game_milestone).
            referral = Referral(referrer_id=referrer.id, referred_user_id=new_user.id)
            db.add(referral)
            await db.commit()

            # Notify the referrer that a new recruit joined — bonus pending 3 games
            try:
                from app.services.telegram_bot import TelegramService
                import logging

                referrer_bonus_preview = 20 if referrer.is_premium_active else 10
                referrer_xp_preview = 100 if referrer.is_premium_active else 50
                username_display = f" (@{new_user.username})" if new_user.username else ""
                full_name = f"{new_user.first_name} {new_user.last_name or ''}".strip()
                msg = (
                    f"🎉 <b>New Recruit Joined!</b>\n\n"
                    f"👤 <b>{full_name}</b>{username_display} just joined via your referral link!\n\n"
                    f"🎁 <b>Your Pending Signup Bonus:</b>\n"
                    f"💰 <b>+${referrer_bonus_preview / 100:.2f} USDT</b>\n"
                    f"🏅 <b>+{referrer_xp_preview} XP</b>\n\n"
                    f"⏳ <b>Unlocks when they complete 3 chess games!</b>\n\n"
                    f"⚡ From game 1, you're already earning <b>up to 2% commission</b> on all their wagers!\n\n"
                    f"<i>The more players you recruit, the bigger your passive network payout! ♟️💸</i>"
                )
                await TelegramService.send_notification(referrer.telegram_id, msg)
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Failed to send referral pending notification to referrer: {e}")

            # Notify the new user that their signup bonus is pending 3 games
            try:
                from app.services.telegram_bot import TelegramService
                referrer_display = f"@{referrer.username}" if referrer.username else referrer.first_name
                new_user_bonus_preview = 10 if new_user.is_premium_active else 5
                new_user_xp_preview = 50 if new_user.is_premium_active else 20
                new_user_msg = (
                    f"♟️ <b>Welcome to the Chess Arena!</b>\n\n"
                    f"You joined via {referrer_display}'s invitation. 🤝\n\n"
                    f"🎁 <b>Your Signup Bonus (Pending):</b>\n"
                    f"💰 <b>+${new_user_bonus_preview / 100:.2f} USDT</b>\n"
                    f"🏅 <b>+{new_user_xp_preview} XP</b>\n\n"
                    f"⏳ <b>Play 3 games to unlock your reward!</b>\n\n"
                    f"<i>Open the arena, play your first moves and claim your bonus! ⚡</i>"
                )
                await TelegramService.send_notification(new_user.telegram_id, new_user_msg)
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Failed to send referral pending notification to recruit: {e}")

            return True
        return False

    @staticmethod
    async def check_referral_game_milestone(db: AsyncSession, referred_user_id: int):
        """
        Called after every game completion for a user.
        If the user was referred AND has now played >= 3 games AND hasn't yet received
        the signup bonus, credit both the referrer and the recruit and notify them.
        """
        from app.models.transaction import Transaction
        from app.services.referral_commission_service import ReferralCommissionService
        from sqlalchemy import func

        # 1. Check if this user was referred by someone
        ref_result = await db.execute(
            select(Referral).where(Referral.referred_user_id == referred_user_id)
        )
        referral = ref_result.scalars().first()
        if not referral:
            return False  # Not a referred user

        # 2. Lock both users in sorted ID order to prevent deadlocks
        sorted_ids = sorted([referral.referrer_id, referred_user_id])
        lock_stmt = select(User).where(User.id.in_(sorted_ids)).with_for_update()
        lock_res = await db.execute(lock_stmt)
        users_map = {u.id: u for u in lock_res.scalars().all()}

        referrer = users_map.get(referral.referrer_id)
        new_user = users_map.get(referred_user_id)

        if not referrer or not new_user:
            return False

        # 3. Check if the referred user has played at least 3 games
        if new_user.games_played < 3:
            return False

        # 4. Idempotency: check if the signup bonus has already been awarded
        bonus_ref_id = f"ref_signup_bonus_{new_user.telegram_id}"
        already_rewarded = await db.execute(
            select(Transaction).where(
                and_(
                    Transaction.user_id == referrer.telegram_id,
                    Transaction.type == "referral_commission",
                    Transaction.reference_id == bonus_ref_id
                )
            )
        )
        if already_rewarded.scalars().first():
            return False  # Already rewarded — skip

        # 5. Award XP and balance to referrer
        referrer_xp = 100 if referrer.is_premium_active else 50
        await GamificationService.add_xp(
            db, referrer, referrer_xp,
            trigger_kickback=False, apply_booster=False, commit=False,
            reason="referral_invite", reference_id=new_user.telegram_id
        )

        referrer_bonus = 20 if referrer.is_premium_active else 10
        referrer.balance += referrer_bonus
        db.add(referrer)

        tx_referrer = Transaction(
            user_id=referrer.telegram_id,
            type="referral_commission",
            amount=referrer_bonus,
            fee=0,
            status="completed",
            reference_id=bonus_ref_id
        )
        db.add(tx_referrer)

        # 6. Award XP and balance to the referred user
        new_user_xp = 50 if new_user.is_premium_active else 20
        await GamificationService.add_xp(
            db, new_user, new_user_xp,
            trigger_kickback=False, apply_booster=False, commit=False,
            reason="referral_signup", reference_id=referrer.telegram_id
        )

        new_user_bonus = 10 if new_user.is_premium_active else 5
        new_user.balance += new_user_bonus
        db.add(new_user)

        tx_new_user = Transaction(
            user_id=new_user.telegram_id,
            type="referral_commission",
            amount=new_user_bonus,
            fee=0,
            status="completed",
            reference_id=f"ref_signup_bonus_recruit_{new_user.telegram_id}"
        )
        db.add(tx_new_user)

        # 7. Increment referral task progress for the referrer
        await GamificationService.update_task_progress(db, referrer.id, TaskType.REFER, increment=1, commit=False)

        # 8. Check and award referrer milestone achievements
        try:
            l1_count_result = await db.execute(
                select(func.count(Referral.id)).where(Referral.referrer_id == referrer.id)
            )
            l1_count = l1_count_result.scalar() or 0

            async def claim_milestone(ref_count, xp_reward, usdt_reward_cents, milestone_name):
                ref_id = f"milestone_ref_{ref_count}"
                tx_check = await db.execute(
                    select(Transaction).where(
                        and_(Transaction.user_id == referrer.telegram_id, Transaction.reference_id == ref_id)
                    )
                )
                if tx_check.scalars().first():
                    return
                await GamificationService.add_xp(
                    db, referrer, xp_reward,
                    trigger_kickback=False, apply_booster=False, commit=False,
                    reason="referral_milestone", reference_id=ref_id
                )
                if usdt_reward_cents > 0:
                    referrer.balance += usdt_reward_cents
                    db.add(referrer)
                tx_milestone = Transaction(
                    user_id=referrer.telegram_id,
                    type="referral_commission",
                    amount=usdt_reward_cents if usdt_reward_cents > 0 else 0,
                    fee=0,
                    status="completed",
                    reference_id=ref_id
                )
                db.add(tx_milestone)
                try:
                    from app.services.telegram_bot import TelegramService
                    ms_msg = (
                        f"🎯 <b>REFERRAL MILESTONE REACHED!</b>\n\n"
                        f"Congratulations! You have recruited <b>{ref_count}</b> chess combatants to the arena!\n"
                        f"🎁 <b>Milestone Rewards:</b>\n"
                        f"• XP Earned: +{xp_reward} XP\n"
                    )
                    if usdt_reward_cents > 0:
                        ms_msg += f"• Bonus Credited: +${usdt_reward_cents / 100:.2f} USDT\n"
                    ms_msg += (
                        f"• Badge Gained: 🎖️ <b>{milestone_name}</b>\n\n"
                        f"<i>Keep growing your network to unlock the next level of referral commissions! ♟️🏆</i>"
                    )
                    await TelegramService.send_notification(referrer.telegram_id, ms_msg)
                except Exception:
                    pass

            if l1_count == 1:
                await claim_milestone(1, 50, 0, "Network Recruit")
            elif l1_count == 5:
                await claim_milestone(5, 200, 0, "Network Architect")
            elif l1_count == 10:
                await claim_milestone(10, 500, 100, "Network Commander")
            elif l1_count == 25:
                await claim_milestone(25, 1500, 0, "Network Elite")
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Failed to check milestones in game milestone check: {e}")

        # 9. Notify referrer — bonus unlocked!
        try:
            from app.services.telegram_bot import TelegramService
            username_display = f" (@{new_user.username})" if new_user.username else ""
            full_name = f"{new_user.first_name} {new_user.last_name or ''}".strip()
            referrer_msg = (
                f"🏆 <b>Referral Bonus Unlocked!</b>\n\n"
                f"🎮 <b>{full_name}</b>{username_display} just completed their 3rd chess game!\n\n"
                f"💰 <b>+${referrer_bonus / 100:.2f} USDT</b> credited to your balance\n"
                f"🏅 <b>+{referrer_xp} XP</b> added to your account\n\n"
                f"⚡ Keep earning <b>up to 2% commission</b> on every wager they place!\n\n"
                f"<i>Recruit more players to multiply your passive income! ♟️💸</i>"
            )
            await TelegramService.send_notification(referrer.telegram_id, referrer_msg)
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Failed to send referral bonus unlock notification to referrer: {e}")

        # 10. Notify the recruit — bonus unlocked!
        try:
            from app.services.telegram_bot import TelegramService
            referrer_display = f"@{referrer.username}" if referrer.username else referrer.first_name
            recruit_msg = (
                f"🎉 <b>Signup Bonus Unlocked!</b>\n\n"
                f"You completed 3 games — your signup reward is now yours! 🏆\n\n"
                f"💰 <b>+${new_user_bonus / 100:.2f} USDT</b> credited to your balance\n"
                f"🏅 <b>+{new_user_xp} XP</b> added to your account\n\n"
                f"<i>Invite your friends with your referral link and earn even more rewards! ♟️⚡</i>"
            )
            await TelegramService.send_notification(new_user.telegram_id, recruit_msg)
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Failed to send referral bonus unlock notification to recruit: {e}")

        # 11. Notify L2/L3 grandparents that the network expanded
        try:
            from app.services.telegram_bot import TelegramService
            grand_chain = await ReferralCommissionService.get_referrer_chain(db, referrer.id, levels=2)
            for idx, grand_referrer in enumerate(grand_chain):
                g_depth = idx + 2
                ref_user_display = f"@{new_user.username}" if new_user.username else new_user.first_name
                referrer_display = f"@{referrer.username}" if referrer.username else referrer.first_name
                grand_msg = (
                    f"🔗 <b>Network Expansion: Level {g_depth} Recruit Active!</b>\n\n"
                    f"🟢 {ref_user_display} just completed 3 games under {referrer_display} (L1)!\n"
                    f"Your decentralized player network is growing.\n\n"
                    f"<i>Level up your XP and Premium status to secure higher passive commissions! ♟️📈</i>"
                )
                await TelegramService.send_notification(grand_referrer.telegram_id, grand_msg)
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Failed to send grandparent milestone notifications: {e}")

        return True

    @staticmethod
    async def claim_task(db: AsyncSession, user_id: int, task_id: int):

        # 1. Lock User row first to prevent deadlock and serialize claims per user
        user_stmt = select(User).where(User.id == user_id).with_for_update()
        res_user = await db.execute(user_stmt)
        user = res_user.scalars().first()
        if not user:
            return None, "User not found"

        # 2. Find and lock the specific user task
        result = await db.execute(select(UserTask).where(
            and_(UserTask.user_id == user_id, UserTask.task_id == task_id)
        ).with_for_update())
        user_task = result.scalars().first()

        if not user_task:
            return None, "Task not found"
        
        if not user_task.completed:
            return None, "Task not completed yet"
            
        if user_task.claimed:
            return None, "Task already claimed"

        # Get the task definition for XP reward
        task_def_result = await db.execute(select(Task).where(Task.id == user_task.task_id))
        task_def = task_def_result.scalars().first()
        
        if not task_def:
             return None, "Task definition not found"

        # Mark as claimed
        user_task.claimed = True
        db.add(user_task)
        
        # Award XP
        updated_user = await GamificationService.add_xp(db, user, task_def.xp_reward, trigger_kickback=False, apply_booster=True, commit=False, reason=f"task_{task_def.title_key}", reference_id=user_task.id)
        
        await db.commit()
        return updated_user, "Success"

    @staticmethod
    async def update_task_progress(db: AsyncSession, user_id: int, task_type: TaskType, increment: int = 1, commit: bool = True):
        """
        Increment progress for a specific task type (WIN, PLAY, etc.) for the user.
        If the task becomes completed, mark it.
        """
        # 1. Lock User row first to prevent deadlocks/races
        user_stmt = select(User).where(User.id == user_id).with_for_update()
        await db.execute(user_stmt)

        # Ensure achievements are generated before updating progress
        await GamificationService.get_or_create_achievements(db, user_id, commit=commit)

        # 2. Lock UserTask rows to prevent lost updates
        result = await db.execute(
            select(UserTask)
            .join(Task, UserTask.task_id == Task.id)
            .where(
                and_(
                    UserTask.user_id == user_id,
                    UserTask.completed == False,
                    Task.task_type == task_type
                )
            )
            .with_for_update()
        )
        
        user_tasks = result.scalars().all()
        for user_task in user_tasks:
            task_def_result = await db.execute(select(Task).where(Task.id == user_task.task_id))
            task_def = task_def_result.scalars().first()
            if not task_def:
                continue
                
            user_task.progress += increment
            if user_task.progress >= task_def.target_count:
                user_task.progress = task_def.target_count
                user_task.completed = True
            user_task.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
            db.add(user_task)
            
        if commit:
            await db.commit()
        else:
            await db.flush()

    @staticmethod
    async def unlock_lesson(db: AsyncSession, user: User, lesson_id: str):
        """
        Deduct 100 XP to unlock an advanced lesson.
        """
        # Lock user row to prevent concurrent race conditions/duplicate spends
        user_stmt = select(User).where(User.id == user.id).with_for_update()
        res_user = await db.execute(user_stmt)
        db_user = res_user.scalars().first()
        if not db_user:
            return None, "User not found"

        # Check if already unlocked
        result = await db.execute(
            select(UnlockedLesson).where(
                and_(UnlockedLesson.user_id == db_user.id, UnlockedLesson.lesson_id == lesson_id)
            )
        )
        existing = result.scalars().first()
        if existing:
            return db_user, "Lesson already unlocked"

        if db_user.xp < 100:
            return None, "Insufficient XP. Need 100 XP to unlock."
            
        # Deduct XP (level is a high-watermark — never decreases on XP spend)
        db_user.xp -= 100

        # Create unlock entry
        unlock = UnlockedLesson(user_id=db_user.id, lesson_id=lesson_id)
        db.add(unlock)
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user, "Success"

    @staticmethod
    async def unlock_puzzle(db: AsyncSession, user: User, puzzle_id: int):
        """
        Deduct progressive XP to unlock a tactics level.
        Formula: Cost = 200 + (puzzle_id - 11) * 50
        """
        if puzzle_id < 11 or puzzle_id > 29:
            return None, "Only levels 11 to 29 can be unlocked with XP."

        # Lock user row to prevent concurrent race conditions/duplicate spends
        user_stmt = select(User).where(User.id == user.id).with_for_update()
        res_user = await db.execute(user_stmt)
        db_user = res_user.scalars().first()
        if not db_user:
            return None, "User not found"

        if db_user.is_premium_active:
            return db_user, "Premium users already have access to all levels."

        # Check if already unlocked
        result = await db.execute(
            select(UnlockedPuzzle).where(
                and_(UnlockedPuzzle.user_id == db_user.id, UnlockedPuzzle.puzzle_id == puzzle_id)
            )
        )
        existing = result.scalars().first()
        if existing:
            return db_user, "Level already unlocked"

        # Sequential check: must have solved previous level (puzzle_id - 1)
        from app.models.gamification import SolvedPuzzle
        solved_check = await db.execute(
            select(SolvedPuzzle).where(
                and_(SolvedPuzzle.user_id == db_user.id, SolvedPuzzle.puzzle_id == puzzle_id - 1)
            )
        )
        if not solved_check.scalars().first():
            return None, f"You must solve Level {puzzle_id - 1} before unlocking Level {puzzle_id}."

        cost = 200 + (puzzle_id - 11) * 50
        if db_user.xp < cost:
            return None, f"Insufficient XP. Need {cost} XP to unlock Level {puzzle_id}."

        # Deduct XP (level is a high-watermark — never decreases on XP spend)
        db_user.xp -= cost

        # Log XP transaction
        from app.models.xp_transaction import XpTransaction
        xp_tx = XpTransaction(
            user_id=db_user.telegram_id,
            amount=-cost,
            reason=f"puzzle_unlock_{puzzle_id}",
            reference_id=str(puzzle_id)
        )
        db.add(xp_tx)

        # Create unlock entry
        unlock = UnlockedPuzzle(user_id=db_user.id, puzzle_id=puzzle_id)
        db.add(unlock)
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user, "Success"

    @staticmethod
    async def upgrade_premium_with_xp(db: AsyncSession, user: User):
        """
        Deduct 5000 XP to upgrade user to Premium status for 1 year.
        """
        # Lock user row to serialize premium upgrades
        user_stmt = select(User).where(User.id == user.id).with_for_update()
        res_user = await db.execute(user_stmt)
        db_user = res_user.scalars().first()
        if not db_user:
            return None, "User not found"

        if db_user.is_premium_active:
            return db_user, "Already Premium"
            
        if db_user.xp < 5000:
            return None, "Insufficient XP. Need 5000 XP to upgrade."
            
        # Deduct XP (level is a high-watermark — never decreases on XP spend)
        db_user.xp -= 5000
        db_user.is_premium = True
        db_user.premium_tier = "premium"
        
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        db_user.premium_expires_at = now + timedelta(days=365)

        # Log XP deduction
        from app.models.xp_transaction import XpTransaction
        xp_tx = XpTransaction(
            user_id=db_user.telegram_id,
            amount=-5000,
            reason="premium_upgrade",
            reference_id="xp_upgrade_1year"
        )
        db.add(xp_tx)


        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)

        # Send Premium welcome notification to the subscriber
        try:
            from app.services.telegram_bot import TelegramService
            await TelegramService.send_premium_welcome(
                user_id=db_user.telegram_id,
                first_name=db_user.first_name,
                expires_at=db_user.premium_expires_at,
                lang=db_user.preferred_language
            )
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Failed to send premium welcome notification: {e}")

        return db_user, "Success"

    @staticmethod
    async def complete_academy_task(db: AsyncSession, user: User, task_type: str, item_id: str = ""):
        """
        Award 50 XP to the user for completing a lesson/puzzle.
        """
        # Re-fetch/lock user row to serialize validation and prevent concurrent reward bypasses
        user_stmt = select(User).where(User.id == user.id).with_for_update()
        res_user = await db.execute(user_stmt)
        db_user = res_user.scalars().first()
        if not db_user:
            db_user = user

        from app.services.session_manager import SessionManager
        session_mgr = SessionManager()
        redis_key = f"user:completed_academy:{db_user.telegram_id}"
        task_val = f"{task_type}:{item_id}"
        
        already_completed = False
        if session_mgr.redis and not session_mgr._use_memory:
            try:
                already_completed = await session_mgr.redis.sismember(redis_key, task_val)
            except Exception:
                pass

        if (not session_mgr.redis or session_mgr._use_memory) or already_completed is None:
            if not hasattr(GamificationService, "_completed_academy"):
                GamificationService._completed_academy = set()
            mem_key = f"{db_user.telegram_id}:{task_val}"
            already_completed = mem_key in GamificationService._completed_academy
            if not already_completed:
                GamificationService._completed_academy.add(mem_key)

        if already_completed:
            return db_user, "Already Completed"

        if session_mgr.redis and not session_mgr._use_memory:
            try:
                await session_mgr.redis.sadd(redis_key, task_val)
            except Exception:
                pass

        updated_user = await GamificationService.add_xp(db, db_user, 50, trigger_kickback=True, apply_booster=True, reason=f"academy_{task_type}", reference_id=item_id)
        return updated_user, "Success"
