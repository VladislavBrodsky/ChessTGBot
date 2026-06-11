import chess
import math
from app.services.game_engine import GameEngine
from app.services.session_manager import SessionManager
from app.schemas.game_state import GameState
from typing import Optional
from app.core.database import get_db, AsyncSessionLocal
from app.crud import user as user_crud

class GameService:
    def __init__(self):
        self.session_manager = SessionManager()

    async def create_game(self, game_id: str, is_bot_game: bool = False, time_control_seconds: int = 600) -> GameState:
        """Initialize a new game and save to Redis."""
        engine = GameEngine() # Starts with new board
        state = engine.get_state()
        if is_bot_game:
            state.black_player_id = -1 # Special ID for bot
        state.time_control_seconds = time_control_seconds
        state.white_time_left = float(time_control_seconds)
        state.black_time_left = float(time_control_seconds)
        state.last_move_at = None
        state.move_history = []
        state.result_type = None
        await self.session_manager.save_game(game_id, state)
        return state

    async def get_game_state(self, game_id: str) -> Optional[GameState]:
        """Fetch current state from Redis."""
        state = await self.session_manager.get_game(game_id)
        if not state or state.is_game_over:
            return state

        # Lazy clock timeout check
        if state.last_move_at is not None:
            import time
            now = time.time()
            elapsed = now - state.last_move_at
            
            if state.turn == 'w':
                time_left = max(0.0, state.white_time_left - elapsed)
                if time_left <= 0.0:
                    state.white_time_left = 0.0
                    state.is_game_over = True
                    state.winner = 'b'
                    state.result_type = 'timeout'
                    await self.session_manager.save_game(game_id, state)
                    await self.end_game(game_id, state)
            else:
                time_left = max(0.0, state.black_time_left - elapsed)
                if time_left <= 0.0:
                    state.black_time_left = 0.0
                    state.is_game_over = True
                    state.winner = 'w'
                    state.result_type = 'timeout'
                    await self.session_manager.save_game(game_id, state)
                    await self.end_game(game_id, state)
                    
        return state

    async def join_game(self, game_id: str, user_id: int) -> Optional[GameState]:
        """Assign user to White or Black if available."""
        state = await self.session_manager.get_game(game_id)
        if not state:
            return None
        
        changed = False
        if not state.white_player_id:
            state.white_player_id = user_id
            changed = True
        elif not state.black_player_id and state.white_player_id != user_id:
            state.black_player_id = user_id
            changed = True
        
        # If it's a bot game, ensure player 1 is white or black correctly
        # Usually player 1 is white in bot games for mobile simplicity
        
        if changed:
            await self.session_manager.save_game(game_id, state)
        
        return state

    async def make_move(self, game_id: str, uci: str) -> Optional[GameState]:
        """Load state, apply move, save state. Returns new state if valid."""
        # 1. Load from Redis
        current_state = await self.session_manager.get_game(game_id)
        if not current_state:
            return None

        # 2. Reconstruct Board
        board = chess.Board(current_state.fen)
        engine = GameEngine()
        engine.board = board # Inject state

        # 3. Validate & Move
        if engine.make_move(uci):
            new_state = engine.get_state()
            
            # Preserve Players and Configs
            new_state.white_player_id = current_state.white_player_id
            new_state.black_player_id = current_state.black_player_id
            new_state.time_control_seconds = current_state.time_control_seconds
            new_state.move_history = current_state.move_history + [uci]
            new_state.bid_amount = getattr(current_state, "bid_amount", 0)

            # Update Clocks
            import time
            now = time.time()
            if current_state.last_move_at is not None:
                elapsed = now - current_state.last_move_at
                if current_state.turn == 'w':  # White just moved
                    new_state.white_time_left = max(0.0, current_state.white_time_left - elapsed)
                    new_state.black_time_left = current_state.black_time_left
                else:  # Black just moved
                    new_state.black_time_left = max(0.0, current_state.black_time_left - elapsed)
                    new_state.white_time_left = current_state.white_time_left
            else:
                new_state.white_time_left = current_state.white_time_left
                new_state.black_time_left = current_state.black_time_left
            
            new_state.last_move_at = now

            # Check for Timeouts
            if new_state.white_time_left <= 0:
                new_state.is_game_over = True
                new_state.winner = 'b'
                new_state.result_type = 'timeout'
            elif new_state.black_time_left <= 0:
                new_state.is_game_over = True
                new_state.winner = 'w'
                new_state.result_type = 'timeout'

            # If ended by normal checkmate or stalemate
            if new_state.is_game_over and not new_state.result_type:
                if new_state.winner:
                    new_state.result_type = 'checkmate'
                else:
                    new_state.result_type = 'draw'

            # 4. Save to Redis
            await self.session_manager.save_game(game_id, new_state)
            
            # 5. Handle Game Over in Background
            if new_state.is_game_over:
                import asyncio
                asyncio.create_task(self.end_game(game_id, new_state))
            
            return new_state
        
        return None

    async def make_bot_move(self, game_id: str) -> Optional[GameState]:
        """Calculates and applies the best move for the bot."""
        current_state = await self.session_manager.get_game(game_id)
        if not current_state or current_state.is_game_over:
            return None

        board = chess.Board(current_state.fen)
        engine = GameEngine()
        engine.board = board

        bot_move_uci = engine.get_best_move()
        if bot_move_uci and engine.make_move(bot_move_uci):
            new_state = engine.get_state()
            new_state.white_player_id = current_state.white_player_id
            new_state.black_player_id = current_state.black_player_id
            new_state.time_control_seconds = current_state.time_control_seconds
            new_state.move_history = current_state.move_history + [bot_move_uci]
            new_state.bid_amount = getattr(current_state, "bid_amount", 0)

            # Update Clocks
            import time
            now = time.time()
            if current_state.last_move_at is not None:
                elapsed = now - current_state.last_move_at
                if current_state.turn == 'w':  # White just moved
                    new_state.white_time_left = max(0.0, current_state.white_time_left - elapsed)
                    new_state.black_time_left = current_state.black_time_left
                else:  # Black just moved
                    new_state.black_time_left = max(0.0, current_state.black_time_left - elapsed)
                    new_state.white_time_left = current_state.white_time_left
            else:
                new_state.white_time_left = current_state.white_time_left
                new_state.black_time_left = current_state.black_time_left
            
            new_state.last_move_at = now

            # Check for Timeouts
            if new_state.white_time_left <= 0:
                new_state.is_game_over = True
                new_state.winner = 'b'
                new_state.result_type = 'timeout'
            elif new_state.black_time_left <= 0:
                new_state.is_game_over = True
                new_state.winner = 'w'
                new_state.result_type = 'timeout'

            # If ended by checkmate or stalemate
            if new_state.is_game_over and not new_state.result_type:
                if new_state.winner:
                    new_state.result_type = 'checkmate'
                else:
                    new_state.result_type = 'draw'

            await self.session_manager.save_game(game_id, new_state)
            
            if new_state.is_game_over:
                await self.end_game(game_id, new_state)

            return new_state
        return None

    async def resign_game(self, game_id: str, player_id: int) -> Optional[GameState]:
        """Mark game as resigned by player_id and distribute payouts."""
        state = await self.session_manager.get_game(game_id)
        if not state or state.is_game_over:
            return None

        # Determine winner
        if state.white_player_id == player_id:
            state.winner = 'b'
        elif state.black_player_id == player_id:
            state.winner = 'w'
        else:
            return None # Player not in game

        state.is_game_over = True
        state.result_type = 'resignation'
        
        # Save to Redis
        await self.session_manager.save_game(game_id, state)
        
        # Settle game payouts and ELO changes
        await self.end_game(game_id, state)
        return state

    async def settle_draw(self, game_id: str) -> Optional[GameState]:
        """Manually settle game as a draw by mutual agreement."""
        state = await self.session_manager.get_game(game_id)
        if not state or state.is_game_over:
            return None

        state.is_game_over = True
        state.winner = None
        state.result_type = 'draw'
        
        # Save to Redis
        await self.session_manager.save_game(game_id, state)
        
        # Settle refunds
        await self.end_game(game_id, state)
        return state

    def calculate_new_elo(self, rating1: int, rating2: int, actual_score: float, k: int = 32) -> int:
        expected_score = 1 / (1 + 10 ** ((rating2 - rating1) / 400))
        return round(rating1 + k * (actual_score - expected_score))

    async def end_game(self, game_id: str, state: GameState):
        """Process game result and update ELO."""
        async with AsyncSessionLocal() as session:
            white_id = state.white_player_id
            black_id = state.black_player_id
            
            # Fetch users
            white_user = await user_crud.get_user_by_telegram_id(session, white_id) if white_id and white_id != -1 else None
            black_user = await user_crud.get_user_by_telegram_id(session, black_id) if black_id and black_id != -1 else None

            if not white_user:
                return

            if not black_user or black_id == -1:
                # Bot game / Training: update tasks progress, skip ELO & financial wager transfers
                from app.services.gamification_service import GamificationService, TaskType
                await GamificationService.update_task_progress(session, white_user.id, TaskType.PLAY)
                # Award XP for playing AI game
                ai_xp = 5  # Draw
                if state.winner == 'w':
                    await GamificationService.update_task_progress(session, white_user.id, TaskType.WIN)
                    ai_xp = 10  # Win
                elif state.winner == 'b':
                    ai_xp = 2  # Loss
                await GamificationService.add_xp(session, white_user, ai_xp)
                await session.commit()
                return

            # Store current ELO before changes
            white_elo_before = white_user.elo
            black_elo_before = black_user.elo

            # Determine Result
            score_white = 0.5
            if state.winner == 'w':
                score_white = 1.0
            elif state.winner == 'b':
                score_white = 0.0
            
            # Calculate ELO change
            new_white_elo = self.calculate_new_elo(white_user.elo, black_user.elo, score_white)
            new_black_elo = self.calculate_new_elo(black_user.elo, white_user.elo, 1.0 - score_white)

            # Update DB
            if state.winner == 'w':
                await user_crud.update_elo(session, white_user, new_white_elo, 'win')
                await user_crud.update_elo(session, black_user, new_black_elo, 'loss')
            elif state.winner == 'b':
                await user_crud.update_elo(session, white_user, new_white_elo, 'loss')
                await user_crud.update_elo(session, black_user, new_black_elo, 'win')
            else:
                 await user_crud.update_elo(session, white_user, new_white_elo, 'draw')
                 await user_crud.update_elo(session, black_user, new_black_elo, 'draw')
            
            # Update Daily Tasks Progress for online games
            from app.services.gamification_service import GamificationService, TaskType
            await GamificationService.update_task_progress(session, white_user.id, TaskType.PLAY)
            await GamificationService.update_task_progress(session, black_user.id, TaskType.PLAY)
            
            # Award XP for playing PVP match
            white_match_xp = 10  # Draw
            black_match_xp = 10  # Draw
            if state.winner == 'w':
                await GamificationService.update_task_progress(session, white_user.id, TaskType.WIN)
                white_match_xp = 20  # Win
                black_match_xp = 5  # Loss
            elif state.winner == 'b':
                await GamificationService.update_task_progress(session, black_user.id, TaskType.WIN)
                white_match_xp = 5  # Loss
                black_match_xp = 20  # Win
                
            await GamificationService.add_xp(session, white_user, white_match_xp)
            await GamificationService.add_xp(session, black_user, black_match_xp)
            
            # Settle Web3 Bids / Wagers & Rakes
            bid_amount = getattr(state, "bid_amount", 0)
            platform_rake = 0
            payout_amount = 0

            if bid_amount > 0 and white_user and black_user:
                from app.models.transaction import Transaction
                if state.winner == 'w':
                    # White wins!
                    platform_rake = int(2 * bid_amount * 0.03)
                    payout_amount = (2 * bid_amount) - platform_rake
                    
                    # Award payout to white
                    white_user.balance += payout_amount
                    session.add(white_user)
                    
                    # Win Transaction
                    win_tx = Transaction(
                        user_id=white_id,
                        type="game_win",
                        amount=payout_amount,
                        fee=platform_rake,
                        reference_id=game_id
                    )
                    session.add(win_tx)
                    
                    # Route company commissions details (rake) to ledger
                    rake_tx = Transaction(
                        user_id=white_id,
                        type="game_rake",
                        amount=-platform_rake,
                        fee=0,
                        reference_id=game_id,
                        status="completed"
                    )
                    session.add(rake_tx)

                    # Distribute referral commissions for both players
                    from app.services.referral_commission_service import ReferralCommissionService
                    await ReferralCommissionService.distribute_wager_commissions(session, game_id, white_user.id, bid_amount)
                    await ReferralCommissionService.distribute_wager_commissions(session, game_id, black_user.id, bid_amount)

                    # Automated notifications
                    try:
                        from app.services.telegram_bot import TelegramService
                        win_msg = (
                            f"<b>🏆 Cyber Chess Match Victory!</b>\n\n"
                            f"• <b>Game ID:</b> <code>{game_id}</code>\n"
                            f"• <b>Wager Bid Amount:</b> ${bid_amount / 100:.2f} USDT\n"
                            f"• <b>Winner Payout (97%):</b> +${payout_amount / 100:.2f} USDT\n"
                            f"• <b>Company Commission (3% Rake):</b> -${platform_rake / 100:.2f} USDT\n\n"
                            f"<i>Congratulations! The prize has been automatically credited to your platform balance. ELO ranking updated! ♟️🔥</i>"
                        )
                        await TelegramService.send_notification(white_user.telegram_id, win_msg)
                        
                        lose_msg = (
                            f"<b>💀 Chess Match Defeat</b>\n\n"
                            f"• <b>Game ID:</b> <code>{game_id}</code>\n"
                            f"• <b>Lost Wager Bid:</b> -${bid_amount / 100:.2f} USDT\n\n"
                            f"<i>Your bid wager was automatically transferred to the victor. Keep refining your tactics! 🧠</i>"
                        )
                        await TelegramService.send_notification(black_user.telegram_id, lose_msg)
                    except Exception as e:
                        pass

                elif state.winner == 'b':
                    # Black wins!
                    platform_rake = int(2 * bid_amount * 0.03)
                    payout_amount = (2 * bid_amount) - platform_rake
                    
                    # Award payout to black
                    black_user.balance += payout_amount
                    session.add(black_user)
                    
                    # Win Transaction
                    win_tx = Transaction(
                        user_id=black_id,
                        type="game_win",
                        amount=payout_amount,
                        fee=platform_rake,
                        reference_id=game_id
                    )
                    session.add(win_tx)
                    
                    # Route company commissions details (rake) to ledger
                    rake_tx = Transaction(
                        user_id=black_id,
                        type="game_rake",
                        amount=-platform_rake,
                        fee=0,
                        reference_id=game_id,
                        status="completed"
                    )
                    session.add(rake_tx)

                    # Distribute referral commissions for both players
                    from app.services.referral_commission_service import ReferralCommissionService
                    await ReferralCommissionService.distribute_wager_commissions(session, game_id, white_user.id, bid_amount)
                    await ReferralCommissionService.distribute_wager_commissions(session, game_id, black_user.id, bid_amount)

                    # Automated notifications
                    try:
                        from app.services.telegram_bot import TelegramService
                        win_msg = (
                            f"<b>🏆 Cyber Chess Match Victory!</b>\n\n"
                            f"• <b>Game ID:</b> <code>{game_id}</code>\n"
                            f"• <b>Wager Bid Amount:</b> ${bid_amount / 100:.2f} USDT\n"
                            f"• <b>Winner Payout (97%):</b> +${payout_amount / 100:.2f} USDT\n"
                            f"• <b>Company Commission (3% Rake):</b> -${platform_rake / 100:.2f} USDT\n\n"
                            f"<i>Congratulations! The prize has been automatically credited to your platform balance. ELO ranking updated! ♟️🔥</i>"
                        )
                        await TelegramService.send_notification(black_user.telegram_id, win_msg)
                        
                        lose_msg = (
                            f"<b>💀 Chess Match Defeat</b>\n\n"
                            f"• <b>Game ID:</b> <code>{game_id}</code>\n"
                            f"• <b>Lost Wager Bid:</b> -${bid_amount / 100:.2f} USDT\n\n"
                            f"<i>Your bid wager was automatically transferred to the victor. Keep refining your tactics! 🧠</i>"
                        )
                        await TelegramService.send_notification(white_user.telegram_id, lose_msg)
                    except Exception as e:
                        pass
                else:
                    # Draw / Stalemate: Refund wagers in full to both players
                    white_user.balance += bid_amount
                    black_user.balance += bid_amount
                    session.add(white_user)
                    session.add(black_user)
                    
                    # Refund Transactions
                    tx_w = Transaction(
                        user_id=white_id,
                        type="deposit",
                        amount=bid_amount,
                        reference_id=game_id
                    )
                    tx_b = Transaction(
                        user_id=black_id,
                        type="deposit",
                        amount=bid_amount,
                        reference_id=game_id
                    )
                    session.add(tx_w)
                    session.add(tx_b)

                    # Automated notifications
                    try:
                        from app.services.telegram_bot import TelegramService
                        draw_msg = (
                            f"<b>🤝 Stalemate / Draw Resolution</b>\n\n"
                            f"• <b>Game ID:</b> <code>{game_id}</code>\n"
                            f"• <b>Refunded Wager:</b> +${bid_amount / 100:.2f} USDT\n\n"
                            f"<i>Chess battle resulted in a draw. Your original wager has been 100% automatically refunded to your platform balance.</i>"
                        )
                        await TelegramService.send_notification(white_user.telegram_id, draw_msg)
                        await TelegramService.send_notification(black_user.telegram_id, draw_msg)
                    except Exception as e:
                        pass
                
                await session.commit()

            # Save game history
            from app.crud import game_history as game_history_crud
            
            # Calculate total moves (approximate from FEN or board state)
            total_moves = len(state.move_history) if hasattr(state, 'move_history') else 0
            
            # Determine result type
            result_type = getattr(state, "result_type", None)
            if not result_type:
                result_type = 'checkmate' if state.winner else 'draw'
            
            import json
            moves_json = json.dumps(getattr(state, 'move_history', []))

            await game_history_crud.create_game_history(
                db=session,
                game_id=game_id,
                white_player_id=white_id,
                black_player_id=black_id,
                winner=state.winner,
                result_type=result_type,
                white_elo_before=white_elo_before,
                white_elo_after=new_white_elo,
                black_elo_before=black_elo_before,
                black_elo_after=new_black_elo,
                total_moves=total_moves,
                duration_seconds=None,  # Can be tracked later by storing game start time
                final_fen=state.fen,
                game_type='online',
                bid_amount=bid_amount,
                platform_rake=platform_rake,
                payout_amount=payout_amount,
                moves_json=moves_json
            )
