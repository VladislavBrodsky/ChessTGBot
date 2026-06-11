import os
# Ensure sqlite test settings or dev db is initialized
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./chess.db"

import asyncio
import sys
from sqlalchemy import select, and_
from app.core.database import engine, AsyncSessionLocal, init_db, Base
from app.crud import user as user_crud
from app.models.user import User
from app.models.transaction import Transaction
from app.models.gamification import Task, UserTask, Referral, TaskType
from app.services.gamification_service import GamificationService
from app.services.matchmaker import MatchmakerService
from app.services.game_service import GameService
from app.schemas.game_state import GameState

async def run_simulation():
    print("=" * 60)
    print("🤖 CHESS TG MINI APP: END-TO-END FLOW SIMULATION")
    print("=" * 60)

    # 1. Initialize DB and Verify Schema
    print("\n[STEP 1] Initializing Database Schema & Seeding Daily Tasks...")
    await init_db()
    
    # Check/seed default daily tasks definition in Database
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Task))
        tasks = result.scalars().all()
        if not tasks:
            print("Seeding default tasks...")
            default_tasks = [
                Task(id=1, title_key="daily_win", description_key="Win a chess match today", xp_reward=50, task_type=TaskType.WIN, target_count=1, is_daily=True, icon="trophy"),
                Task(id=2, title_key="daily_play", description_key="Play 3 chess matches", xp_reward=30, task_type=TaskType.PLAY, target_count=3, is_daily=True, icon="gamepad"),
                Task(id=3, title_key="daily_login", description_key="Login to the app", xp_reward=10, task_type=TaskType.LOGIN, target_count=1, is_daily=True, icon="sync")
            ]
            session.add_all(default_tasks)
            await session.commit()
            print("Daily tasks seeded in DB.")
        else:
            print(f"Daily tasks definitions already exist ({len(tasks)} tasks).")

    # Clean existing simulator players to ensure fresh state
    async with AsyncSessionLocal() as session:
        print("Cleaning old simulation data...")
        for tid in [11111, 22222, 55555, 66666, 77777]:
            u = await user_crud.get_user_by_telegram_id(session, tid)
            if u:
                # Delete any referral referencing this user's id
                referrals_result = await session.execute(
                    select(Referral).where(
                        (Referral.referrer_id == u.id) | (Referral.referred_user_id == u.id)
                    )
                )
                for ref in referrals_result.scalars().all():
                    await session.delete(ref)
                await session.delete(u)
        await session.commit()
        print("Clean complete.")

    # 2. Player Sign-up & Referral Flow
    print("\n[STEP 2] Simulating Player Registrations & Referral Flow...")
    async with AsyncSessionLocal() as session:
        # Create Ancestor, Grandparent, Parent, P1 and P2
        ancestor = await user_crud.create_user(session, telegram_id=77777, first_name="P_Ancestor", username="ancestor")
        ancestor.is_premium = True
        ancestor.balance = 0
        session.add(ancestor)

        grandparent = await user_crud.create_user(session, telegram_id=66666, first_name="P_Grandparent", username="grandparent")
        grandparent.is_premium = True
        grandparent.balance = 0
        session.add(grandparent)

        parent = await user_crud.create_user(session, telegram_id=55555, first_name="P_Parent", username="parent")
        parent.is_premium = True
        parent.balance = 0
        session.add(parent)

        p1 = await user_crud.create_user(session, telegram_id=11111, first_name="P1_Hacker", username="hacker_p1")
        p1.is_premium = True
        p1.balance = 10000  # $100.00
        session.add(p1)

        p2 = await user_crud.create_user(session, telegram_id=22222, first_name="P2_Grandmaster", username="gmaster_p2")
        p2.is_premium = True
        p2.balance = 10000  # $100.00
        session.add(p2)

        await session.commit()
        await session.refresh(ancestor)
        await session.refresh(grandparent)
        await session.refresh(parent)
        await session.refresh(p1)
        await session.refresh(p2)

        # Build 3-tier parent referral chain
        session.add(Referral(referrer_id=ancestor.id, referred_user_id=grandparent.id))
        session.add(Referral(referrer_id=grandparent.id, referred_user_id=parent.id))
        session.add(Referral(referrer_id=parent.id, referred_user_id=p1.id))
        
        await session.commit()
        
        # Simulating P1 inviting P2
        print(f"Registered Referrer Chain: Ancestor (77777) -> Grandparent (66666) -> Parent (55555) -> P1_Hacker (11111)")
        print(f"Registered Recruit: {p2.first_name} (ID: {p2.telegram_id})")

        success = await GamificationService.process_referral(session, p2, p1.referral_code)
        if success:
            print("Referral linked successfully!")
            await session.refresh(p1)
            await session.refresh(p2)
            print(f"  - Referrer P1 XP: {p1.xp} (Awarded 50 XP)")
            print(f"  - Referred P2 XP: {p2.xp} (Awarded 20 XP welcome bonus)")

    # 3. Matchmaking & Wager Lock Simulation
    print("\n[STEP 3] Simulating Wager Matchmaking Queue & Balance Verification...")
    wager_amount = 5000  # $50.00 wager (5000 cents)
    
    # Verify balances before matchmaking
    async with AsyncSessionLocal() as session:
        u1 = await user_crud.get_user_by_telegram_id(session, 11111)
        u2 = await user_crud.get_user_by_telegram_id(session, 22222)
        assert u1.balance >= wager_amount, "P1 Insufficient funds"
        assert u2.balance >= wager_amount, "P2 Insufficient funds"
        print("✓ Balance verification passed for both players.")

    # Matchmaker joins
    matchmaker = MatchmakerService()
    await matchmaker.add_to_queue(user_id=11111, bid_amount=wager_amount, sid="sid_p1", elo=1000)
    await matchmaker.add_to_queue(user_id=22222, bid_amount=wager_amount, sid="sid_p2", elo=1000)
    
    opponent = await matchmaker.find_opponent(wager_amount, exclude_user_id=11111, user_elo=1000)
    if opponent and opponent["user_id"] == 22222:
        print("✓ Matchmaker: Match Found! Opponent P2 matched with P1.")
        
        import time
        game_id = f"sim_match_11111_22222_{int(time.time())}"

        # Deduct wagers and record transactions in DB
        async with AsyncSessionLocal() as session:
            white = await user_crud.get_user_by_telegram_id(session, 11111)
            black = await user_crud.get_user_by_telegram_id(session, 22222)
            
            # Deduct wager
            white.balance -= wager_amount
            session.add(white)
            tx_w = Transaction(
                user_id=white.telegram_id,
                type="game_wager",
                amount=-wager_amount,
                reference_id=game_id,
                status="completed"
            )
            session.add(tx_w)
            
            black.balance -= wager_amount
            session.add(black)
            tx_b = Transaction(
                user_id=black.telegram_id,
                type="game_wager",
                amount=-wager_amount,
                reference_id=game_id,
                status="completed"
            )
            session.add(tx_b)
            
            await session.commit()
            print(f"✓ Locked Wager Stake for Game ID: {game_id}")
            print(f"  - Player 1 Balance: ${white.balance / 100:.2f} USDT (-${wager_amount/100:.2f})")
            print(f"  - Player 2 Balance: ${black.balance / 100:.2f} USDT (-${wager_amount/100:.2f})")

        await matchmaker.remove_match_pair(wager_amount, 11111, 22222)

    # 4. End Game & Profit Distribution (ELO + Financial)
    print("\n[STEP 4] Simulating Chess Battle Resolution & Commissions Rake Distribution...")
    # Setup initial game state schema
    state = GameState(
        fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        white_player_id=11111,
        black_player_id=22222,
        turn="b",
        is_check=False,
        is_checkmate=True,
        is_stalemate=False,
        legal_moves=[],
        is_game_over=True,
        winner="w", # P1 (White) Wins
        move_history=["e2e4", "e7e5", "d1h5", "b8c6", "f1c4", "g8f6", "h5f7"] # Scholar's Mate
    )
    # Set wager in state
    state.bid_amount = wager_amount
    
    # Process game over payouts & ELO adjustments
    game_service = GameService()
    await game_service.end_game(game_id=game_id, state=state)
    
    # Inspect final ratings and balances
    async with AsyncSessionLocal() as session:
        u1 = await user_crud.get_user_by_telegram_id(session, 11111)
        u2 = await user_crud.get_user_by_telegram_id(session, 22222)
        parent = await user_crud.get_user_by_telegram_id(session, 55555)
        grandparent = await user_crud.get_user_by_telegram_id(session, 66666)
        ancestor = await user_crud.get_user_by_telegram_id(session, 77777)
        
        print(f"✓ Battle Result: White (Player 1) wins by Checkmate!")
        print(f"✓ Rating System ELO Shifts:")
        print(f"  - Player 1 ELO: 1000 -> {u1.elo} (Gain: +{u1.elo - 1000})")
        print(f"  - Player 2 ELO: 1000 -> {u2.elo} (Loss: {u2.elo - 1000})")
        
        # Verify stake payout and rakes
        # Stake pool: 10000 cents ($100.00). Rake (3%): 300 cents ($3.00). Payout: 9700 cents ($97.00).
        # Referral payouts:
        # P1 gets Tier 1 commission from P2's wager = int(150 * 0.10) = 15 cents
        # Parent gets Tier 1 from P1's wager (15 cents) + Tier 2 from P2's wager (7 cents) = 22 cents
        # Grandparent gets Tier 2 from P1's wager (7 cents) + Tier 3 from P2's wager (3 cents) = 10 cents
        # Ancestor gets Tier 3 from P1's wager (3 cents) = 3 cents
        print(f"\n✓ Profit & Commission Ledger Verification:")
        print(f"  - Total Match Stake Pool: ${(wager_amount * 2) / 100:.2f} USDT")
        print(f"  - Platform Rake Collected (3%): $3.00 USDT (Commissions paid from this rake)")
        print(f"  - Net Winner Payout (97%): $97.00 USDT")
        print(f"  - Player 1 (Winner) Final Wallet Balance: ${u1.balance / 100:.2f} USDT (Expected $147.15 USDT)")
        print(f"  - Player 2 (Loser) Final Wallet Balance: ${u2.balance / 100:.2f} USDT (Expected $50.00 USDT)")
        print(f"  - Parent (Tier 1 Referrer) Balance: ${parent.balance / 100:.2f} USDT (Expected $0.22 USDT)")
        print(f"  - Grandparent (Tier 2 Referrer) Balance: ${grandparent.balance / 100:.2f} USDT (Expected $0.10 USDT)")
        print(f"  - Ancestor (Tier 3 Referrer) Balance: ${ancestor.balance / 100:.2f} USDT (Expected $0.03 USDT)")
        
        assert u1.balance == 14715, f"P1 Balance incorrect, got {u1.balance}"
        assert u2.balance == 5000, f"P2 Balance incorrect, got {u2.balance}"
        assert parent.balance == 22, f"Parent Balance incorrect, got {parent.balance}"
        assert grandparent.balance == 10, f"Grandparent Balance incorrect, got {grandparent.balance}"
        assert ancestor.balance == 3, f"Ancestor Balance incorrect, got {ancestor.balance}"
        print("✓ balance verification assert passed. ledger matches expected calculations.")

        # 5. Print Transaction Ledger history
        print("\n[STEP 5] Ledger Transaction Records in DB:")
        txs_result = await session.execute(
            select(Transaction).order_by(Transaction.id.asc())
        )
        txs = txs_result.scalars().all()
        for idx, tx in enumerate(txs):
            sign = "+" if tx.amount > 0 else ""
            print(f"  [{idx + 1}] User ID: {tx.user_id} | Type: {tx.type.upper():<20} | Amount: {sign}${tx.amount / 100:<6.2f} USDT | Ref: {tx.reference_id}")

    print("\n" + "=" * 60)
    print("✓ END-TO-END SIMULATION COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_simulation())
