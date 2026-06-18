from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.user import User
from app.models.gamification import Task, UserTask, Referral, TaskType, UnlockedLesson
from datetime import datetime, timedelta, timezone
import random
import string


def _xp_to_level(xp: int) -> int:
    """Canonical formula: 1 level per 200 XP, minimum level 1."""
    return max(1, int(xp // 200) + 1)


class GamificationService:
    @staticmethod
    async def get_or_create_daily_tasks(db: AsyncSession, user_id: int):
        # Logic: Check if user has daily tasks for today. If not, assign them.
        # This is a simplified version.
        
        # 1. Get all daily tasks definitions
        result = await db.execute(select(Task).where(Task.is_daily == True))
        daily_tasks_defs = result.scalars().all()
        
        user_tasks = []
        for task_def in daily_tasks_defs:
            # Check if user has this task assigned today
            # We can check created_at or updated_at
            # For simplicity, we just check if a record exists and if it's "fresh"
            # In a real app, we'd have a 'date' field or reset logic
            
            result = await db.execute(select(UserTask).where(
                and_(UserTask.user_id == user_id, UserTask.task_id == task_def.id)
            ))
            user_task = result.scalars().first()
            
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
    async def get_or_create_achievements(db: AsyncSession, user_id: int):
        # Fetch all permanent tasks definitions
        result = await db.execute(select(Task).where(Task.is_daily == False))
        achievement_defs = result.scalars().all()
        
        user_tasks = []
        for task_def in achievement_defs:
            # Check if user already has this achievement assigned
            result_ut = await db.execute(select(UserTask).where(
                and_(UserTask.user_id == user_id, UserTask.task_id == task_def.id)
            ))
            user_task = result_ut.scalars().first()
            
            if not user_task:
                user_task = UserTask(user_id=user_id, task_id=task_def.id, progress=0, completed=False, claimed=False)
                db.add(user_task)
                user_tasks.append(user_task)
                
        if user_tasks:
            await db.commit()

    @staticmethod
    async def add_xp(db: AsyncSession, user: User, amount: int, trigger_kickback: bool = True, apply_booster: bool = True, commit: bool = True):
        xp_earned = amount
        if apply_booster and user.is_premium and amount > 0:
            xp_earned = amount * 2

        user.xp += xp_earned

        # Use canonical level formula. Level is a high-watermark: only increases.
        new_level = _xp_to_level(user.xp)
        if new_level > user.level:
            user.level = new_level

        # Multi-Tier XP Kickbacks — collect all changes before committing
        if trigger_kickback and xp_earned > 0:
            current_user_id = user.id
            percentages = [0.10, 0.05, 0.025]

            for tier, pct in enumerate(percentages, 1):
                # Find referrer of current_user_id
                stmt = select(Referral).where(Referral.referred_user_id == current_user_id)
                res = await db.execute(stmt)
                referral = res.scalars().first()
                if not referral:
                    break

                # Fetch referrer User
                stmt_user = select(User).where(User.id == referral.referrer_id)
                res_user = await db.execute(stmt_user)
                referrer = res_user.scalars().first()
                if not referrer:
                    break

                # Only premium referrers receive kickbacks
                if referrer.is_premium:
                    kickback_amount = round(xp_earned * pct)
                    if kickback_amount > 0:
                        referrer.xp += kickback_amount
                        # Recalculate referrer level (high-watermark)
                        referrer_new_level = _xp_to_level(referrer.xp)
                        if referrer_new_level > referrer.level:
                            referrer.level = referrer_new_level

                current_user_id = referrer.id

        # Single atomic commit/flush covering user XP + all referral kickbacks
        if commit:
            await db.commit()
        else:
            await db.flush()
        return user


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
            # Check if this referral already exists to prevent duplicate rewards
            referral_exists_result = await db.execute(
                select(Referral).where(
                    and_(Referral.referrer_id == referrer.id, Referral.referred_user_id == new_user.id)
                )
            )
            if referral_exists_result.scalars().first():
                return False
                
            referral = Referral(referrer_id=referrer.id, referred_user_id=new_user.id)
            db.add(referral)
            
            # Award XP to referrer
            referrer_xp = 100 if referrer.is_premium else 50
            await GamificationService.add_xp(db, referrer, referrer_xp, trigger_kickback=False, apply_booster=False)
            
            # Award XP to new user
            new_user_xp = 50 if new_user.is_premium else 20
            await GamificationService.add_xp(db, new_user, new_user_xp, trigger_kickback=False, apply_booster=False)

            # Award Balance (in cents) & log transactions
            from app.models.transaction import Transaction
            from app.services.referral_commission_service import ReferralCommissionService
            from sqlalchemy import func
            
            referrer_bonus = 20 if referrer.is_premium else 10
            referrer.balance += referrer_bonus
            db.add(referrer)
            
            tx_referrer = Transaction(
                user_id=referrer.telegram_id,
                type="referral_commission",
                amount=referrer_bonus,
                fee=0,
                status="completed",
                reference_id="sign_up_bonus"
            )
            db.add(tx_referrer)
            
            new_user_bonus = 10 if new_user.is_premium else 5
            new_user.balance += new_user_bonus
            db.add(new_user)
            
            tx_new_user = Transaction(
                user_id=new_user.telegram_id,
                type="referral_commission",
                amount=new_user_bonus,
                fee=0,
                status="completed",
                reference_id="sign_up_bonus"
            )
            db.add(tx_new_user)
            
            # Send Telegram push notification to the referrer
            try:
                from app.services.telegram_bot import TelegramService
                import logging
                logger = logging.getLogger(__name__)
                
                ref_user_display = f"@{new_user.username}" if new_user.username else f"User {new_user.first_name}"
                msg = (
                    f"🎉 <b>New Recruit Joined!</b>\n\n"
                    f"• <b>User:</b> {ref_user_display}\n"
                    f"• <b>Name:</b> {new_user.first_name} {new_user.last_name or ''}\n"
                    f"• <b>Your Sign-Up Reward:</b> +${referrer_bonus / 100:.2f} USDT & +{referrer_xp} XP!\n\n"
                    f"<i>Your referral tree is growing! Keep sharing your link. ♟️🚀</i>"
                )
                await TelegramService.send_notification(referrer.telegram_id, msg)
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Failed to send referral sign-up notification: {e}")

            # Send Telegram push notification to the new user (recruit)
            try:
                from app.services.telegram_bot import TelegramService
                referrer_display = f"@{referrer.username}" if referrer.username else f"{referrer.first_name}"
                new_user_msg = (
                    f"♟️ <b>Welcome to the Chess Arena!</b>\n\n"
                    f"You have successfully joined via {referrer_display}'s invitation.\n"
                    f"🎁 <b>Instant Signup Bonus:</b> +${new_user_bonus / 100:.2f} USDT & +{new_user_xp} XP has been credited to your balance!\n\n"
                    f"<i>Unlock the dashboard to start playing and earning! ⚡</i>"
                )
                await TelegramService.send_notification(new_user.telegram_id, new_user_msg)
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Failed to send welcome notification to new user: {e}")

            # Send grandparent (L2/L3) notifications
            try:
                from app.services.telegram_bot import TelegramService
                grand_chain = await ReferralCommissionService.get_referrer_chain(db, referrer.id, levels=2)
                for idx, grand_referrer in enumerate(grand_chain):
                    g_depth = idx + 2
                    ref_user_display = f"@{new_user.username}" if new_user.username else f"{new_user.first_name}"
                    referrer_display = f"@{referrer.username}" if referrer.username else f"{referrer.first_name}"
                    
                    grand_msg = (
                        f"🔗 <b>Network Expansion: Level {g_depth} Recruit!</b>\n\n"
                        f"🟢 {ref_user_display} just joined the chess matrix under {referrer_display} (L1)!\n"
                        f"Your decentralized player network is expanding deeper.\n\n"
                        f"<i>Level up your XP and Premium status to secure higher passive commissions from this network tree branch! ♟️📈</i>"
                    )
                    await TelegramService.send_notification(grand_referrer.telegram_id, grand_msg)
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Failed to send grandparent notifications: {e}")

            # Check and award milestone achievements
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
                    
                    await GamificationService.add_xp(db, referrer, xp_reward, trigger_kickback=False, apply_booster=False, commit=False)
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
                        msg = (
                            f"🎯 <b>REFERRAL MILESTONE REACHED!</b>\n\n"
                            f"Congratulations! You have recruited <b>{ref_count}</b> chess combatants to the arena!\n"
                            f"🎁 <b>Milestone Rewards:</b>\n"
                            f"• XP Earned: +{xp_reward} XP\n"
                        )
                        if usdt_reward_cents > 0:
                            msg += f"• Bonus Credited: +${usdt_reward_cents / 100:.2f} USDT\n"
                        msg += (
                            f"• Badge Gained: 🎖️ <b>{milestone_name}</b>\n\n"
                            f"<i>Keep growing your network to unlock the next level of referral commissions! ♟️🏆</i>"
                        )
                        await TelegramService.send_notification(referrer.telegram_id, msg)
                    except Exception as e:
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
                logging.getLogger(__name__).warning(f"Failed to check milestones: {e}")

            await db.commit()
            return True
        return False
    @staticmethod
    async def claim_task(db: AsyncSession, user_id: int, task_id: int):
        # Find the specific user task
        result = await db.execute(select(UserTask).where(
            and_(UserTask.user_id == user_id, UserTask.task_id == task_id)
        ))
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
        
        # Award XP
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalars().first()
        
        updated_user = await GamificationService.add_xp(db, user, task_def.xp_reward, trigger_kickback=False, apply_booster=True)
        
        await db.commit()
        return updated_user, "Success"

    @staticmethod
    async def update_task_progress(db: AsyncSession, user_id: int, task_type: TaskType, increment: int = 1, commit: bool = True):
        """
        Increment progress for a specific task type (WIN, PLAY, etc.) for the user.
        If the task becomes completed, mark it.
        """
        # Ensure achievements are generated before updating progress
        await GamificationService.get_or_create_achievements(db, user_id)

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
        # Check if already unlocked
        result = await db.execute(
            select(UnlockedLesson).where(
                and_(UnlockedLesson.user_id == user.id, UnlockedLesson.lesson_id == lesson_id)
            )
        )
        existing = result.scalars().first()
        if existing:
            return user, "Lesson already unlocked"

        if user.xp < 100:
            return None, "Insufficient XP. Need 100 XP to unlock."
            
        # Deduct XP (level is a high-watermark — never decreases on XP spend)
        user.xp -= 100

        # Create unlock entry
        unlock = UnlockedLesson(user_id=user.id, lesson_id=lesson_id)
        db.add(unlock)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user, "Success"

    @staticmethod
    async def upgrade_premium_with_xp(db: AsyncSession, user: User):
        """
        Deduct 5000 XP to upgrade user to Premium status for 1 year.
        """
        if user.is_premium:
            return user, "Already Premium"
            
        if user.xp < 5000:
            return None, "Insufficient XP. Need 5000 XP to upgrade."
            
        # Deduct XP (level is a high-watermark — never decreases on XP spend)
        user.xp -= 5000
        user.is_premium = True
        user.premium_tier = "premium"
        
        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        user.premium_expires_at = now + timedelta(days=365)

        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user, "Success"

    @staticmethod
    async def complete_academy_task(db: AsyncSession, user: User, task_type: str, item_id: str = ""):
        """
        Award 50 XP to the user for completing a lesson/puzzle.
        """
        from app.services.session_manager import SessionManager
        session_mgr = SessionManager()
        redis_key = f"user:completed_academy:{user.telegram_id}"
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
            mem_key = f"{user.telegram_id}:{task_val}"
            already_completed = mem_key in GamificationService._completed_academy
            if not already_completed:
                GamificationService._completed_academy.add(mem_key)

        if already_completed:
            return user, "Already Completed"

        if session_mgr.redis and not session_mgr._use_memory:
            try:
                await session_mgr.redis.sadd(redis_key, task_val)
            except Exception:
                pass

        updated_user = await GamificationService.add_xp(db, user, 50, trigger_kickback=True, apply_booster=True)
        return updated_user, "Success"
