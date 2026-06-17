import chess
import math
from app.services.game_engine import GameEngine
from app.services.session_manager import SessionManager
from app.schemas.game_state import GameState
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
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
        async with AsyncSessionLocal() as session:
            user = await user_crud.get_user_by_telegram_id(session, user_id)
            username = user.first_name if user else f"Player {user_id}"
            elo = user.elo if user else 1000

            if not state.white_player_id:
                state.white_player_id = user_id
                state.white_username = username
                state.white_elo = elo
                changed = True
            elif not state.black_player_id and state.white_player_id != user_id:
                state.black_player_id = user_id
                state.black_username = username
                state.black_elo = elo
                changed = True
        
        # If it's a bot game, assign bot details
        if state.black_player_id == -1 and not state.black_username:
            state.black_username = "AI Engine"
            state.black_elo = 1200
            changed = True
        
        if changed:
            await self.session_manager.save_game(game_id, state)
        
        return state

    async def monitor_timeout(self, game_id: str, expected_move_count: int, time_left: float, turn: str):
        """
        Background task that sleeps for the remaining time of the player whose turn it is.
        If the time expires and no move has been made, it flags the player and ends the game.
        """
        import asyncio
        # Sleep for the duration of the player's time, plus a small buffer (0.5s) to allow network lag
        await asyncio.sleep(time_left + 0.5)
        
        # Fetch fresh state from Redis
        state = await self.session_manager.get_game(game_id)
        if not state or state.is_game_over:
            return
            
        current_move_count = len(state.move_history) if hasattr(state, 'move_history') else 0
        if current_move_count == expected_move_count and state.turn == turn:
            print(f"[GameService] Timeout detected for {game_id} (Turn: {turn}, Move Count: {current_move_count})")
            
            # Update state to reflect timeout
            if turn == 'w':
                state.white_time_left = 0.0
                state.winner = 'b'
            else:
                state.black_time_left = 0.0
                state.winner = 'w'
                
            state.is_game_over = True
            state.result_type = 'timeout'
            
            # Save to Redis
            await self.session_manager.save_game(game_id, state)
            
            # Settle ELO and wagers
            await self.end_game(game_id, state)
            
            # Broadcast the updated game state to all players in the room
            from app.core.socket import sio
            await sio.emit('game_state', state.model_dump(), room=game_id)

    async def monitor_first_move_abort(self, game_id: str, expected_move_count: int, time_limit: float, player_color: str):
        """
        Monitors the first move of White (move 0) or Black (move 1). If the player
        does not make their first move within 30 seconds, the game is aborted and wagers refunded.
        """
        import asyncio
        await asyncio.sleep(time_limit)
        
        state = await self.session_manager.get_game(game_id)
        if not state or state.is_game_over:
            return
            
        current_move_count = len(state.move_history) if hasattr(state, 'move_history') else 0
        if current_move_count == expected_move_count and state.turn == player_color:
            print(f"[GameService] First-move abort triggered for {game_id} (Expected count: {expected_move_count}, color: {player_color})")
            
            state.is_game_over = True
            state.winner = None
            state.result_type = 'aborted'
            
            await self.session_manager.save_game(game_id, state)
            await self.end_game(game_id, state)
            
            from app.core.socket import sio
            await sio.emit('game_state', state.model_dump(), room=game_id)

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

    def calculate_k_factor(self, rating: int, games_played: int) -> int:
        if games_played < 30:
            return 40
        if rating >= 2400:
            return 10
        return 20

    def calculate_new_elo(self, rating1: int, rating2: int, actual_score: float, k: int = 32) -> int:
        expected_score = 1 / (1 + 10 ** ((rating2 - rating1) / 400))
        new_rating = round(rating1 + k * (actual_score - expected_score))
        return max(100, new_rating)

    async def get_user_win_streak(self, db: AsyncSession, telegram_id: int) -> int:
        from app.models.game_history import GameHistory
        from sqlalchemy import select
        # Select last matches ended, ordered by ended_at desc
        stmt = select(GameHistory).where(
            (GameHistory.white_player_id == telegram_id) | (GameHistory.black_player_id == telegram_id)
        ).order_by(GameHistory.ended_at.desc()).limit(15)
        
        res = await db.execute(stmt)
        histories = res.scalars().all()
        
        streak = 0
        for h in histories:
            user_won = False
            if h.winner == 'w' and h.white_player_id == telegram_id:
                user_won = True
            elif h.winner == 'b' and h.black_player_id == telegram_id:
                user_won = True
                
            if user_won:
                streak += 1
            else:
                break
                
        return streak

    async def end_game(self, game_id: str, state: GameState):
        """Process game result and update ELO."""
        async with AsyncSessionLocal() as session:
            # Check for duplicate processing (idempotency guard)
            from app.models.game_history import GameHistory
            from sqlalchemy.future import select
            dup_check = await session.execute(select(GameHistory).where(GameHistory.game_id == game_id))
            if dup_check.scalars().first():
                print(f"[GameService] Game {game_id} already ended/processed. Skipping duplicate end_game call.")
                return

            white_id = state.white_player_id
            black_id = state.black_player_id
            
            # Fetch users
            white_user = await user_crud.get_user_by_telegram_id(session, white_id, for_update=True) if white_id and white_id != -1 else None
            black_user = await user_crud.get_user_by_telegram_id(session, black_id, for_update=True) if black_id and black_id != -1 else None

            if not white_user:
                return

            white_elo_before = white_user.elo
            black_elo_before = black_user.elo if black_user else 1000

            # ── Aborted Game Handler ──────────────────────────────────
            if state.result_type == 'aborted':
                print(f"[GameService] Processing aborted game refund for {game_id}")
                
                # Refund wager amount
                bid_amount = getattr(state, "bid_amount", 0)
                if bid_amount > 0 and white_user and black_user:
                    white_user.balance += bid_amount
                    black_user.balance += bid_amount
                    session.add(white_user)
                    session.add(black_user)
                    
                    # Log refund transactions
                    from app.models.transaction import Transaction
                    tx_w = Transaction(
                        user_id=white_id,
                        type="refund",
                        amount=bid_amount,
                        fee=0,
                        status="completed",
                        reference_id=game_id
                    )
                    tx_b = Transaction(
                        user_id=black_id,
                        type="refund",
                        amount=bid_amount,
                        fee=0,
                        status="completed",
                        reference_id=game_id
                    )
                    session.add(tx_w)
                    session.add(tx_b)
                    
                    # Send telegram notifications
                    try:
                        from app.services.telegram_bot import TelegramService
                        abort_msg_w = (
                            f"<b>🛡️ Cyber Chess Match Aborted</b>\n\n"
                            f"• <b>Game ID:</b> <code>{game_id}</code>\n"
                            f"• <b>Refunded Wager:</b> +${bid_amount / 100:.2f} USDT\n\n"
                            f"<i>The game was aborted because a player did not make their first move. Your wager has been fully refunded.</i>"
                        )
                        abort_msg_b = (
                            f"<b>🛡️ Cyber Chess Match Aborted</b>\n\n"
                            f"• <b>Game ID:</b> <code>{game_id}</code>\n"
                            f"• <b>Refunded Wager:</b> +${bid_amount / 100:.2f} USDT\n\n"
                            f"<i>The game was aborted because a player did not make their first move. Your wager has been fully refunded.</i>"
                        )
                        await TelegramService.send_notification(white_user.telegram_id, abort_msg_w)
                        await TelegramService.send_notification(black_user.telegram_id, abort_msg_b)
                    except Exception:
                        pass
                
                await session.commit()
                
                # Cache ratings and save aborted game history
                state.white_elo_before = white_elo_before
                state.white_elo_after = white_elo_before
                state.black_elo_before = black_elo_before
                state.black_elo_after = black_elo_before
                state.payout_amount = 0
                state.platform_rake = 0
                await self.session_manager.save_game(game_id, state)
                
                # Save game history
                from app.crud import game_history as game_history_crud
                import json
                try:
                    await game_history_crud.create_game_history(
                        db=session,
                        game_id=game_id,
                        white_player_id=white_id,
                        black_player_id=black_id,
                        winner=None,
                        result_type='aborted',
                        white_elo_before=white_elo_before,
                        white_elo_after=white_elo_before,
                        black_elo_before=black_elo_before,
                        black_elo_after=black_elo_before,
                        total_moves=0,
                        duration_seconds=None,
                        final_fen=state.fen,
                        game_type='online',
                        bid_amount=bid_amount,
                        platform_rake=0,
                        payout_amount=0,
                        moves_json=json.dumps([])
                    )
                    await session.commit()
                except Exception as hist_err:
                    print(f"[GameService] WARNING: Failed to save aborted game history: {hist_err}")
                    await session.rollback()
                
                # Broadcast aborted state
                from app.core.socket import sio
                await sio.emit('game_state', state.model_dump(), room=game_id)
                return
            # ──────────────────────────────────────────────────────────

            if not black_user or black_id == -1:
                # Bot game / Training: update tasks progress, stats, and create game history
                from app.services.gamification_service import GamificationService, TaskType
                await GamificationService.update_task_progress(session, white_user.id, TaskType.PLAY)
                
                # Determine game result for bot game
                ai_xp = 5  # Draw
                if state.winner == 'w':
                    await GamificationService.update_task_progress(session, white_user.id, TaskType.WIN)
                    ai_xp = 10  # Win
                    white_user.wins += 1
                elif state.winner == 'b':
                    ai_xp = 2  # Loss
                    white_user.losses += 1
                else:
                    white_user.draws += 1
                
                white_user.games_played += 1
                session.add(white_user)
                await GamificationService.add_xp(session, white_user, ai_xp, trigger_kickback=True, apply_booster=True)
                
                # Save bot game history
                from app.crud import game_history as game_history_crud
                total_moves = len(state.move_history) if hasattr(state, 'move_history') else 0
                result_type = getattr(state, "result_type", None) or ('checkmate' if state.winner else 'draw')
                import json
                moves_json = json.dumps(getattr(state, 'move_history', []))
                
                try:
                    await game_history_crud.create_game_history(
                        db=session,
                        game_id=game_id,
                        white_player_id=white_id,
                        black_player_id=-1, # -1 for AI
                        winner=state.winner,
                        result_type=result_type,
                        white_elo_before=white_user.elo,
                        white_elo_after=white_user.elo, # ELO doesn't change for bot games
                        black_elo_before=1000,
                        black_elo_after=1000,
                        total_moves=total_moves,
                        duration_seconds=None,
                        final_fen=state.fen,
                        game_type='computer',
                        bid_amount=0,
                        platform_rake=0,
                        payout_amount=0,
                        moves_json=moves_json
                    )
                    await session.commit()
                    print(f"[GameService] Bot game history saved: {game_id} ({result_type}, winner={state.winner})")
                except Exception as hist_err:
                    print(f"[GameService] WARNING: Failed to save bot game history for {game_id}: {hist_err}")
                    await session.rollback()
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
            
            # Calculate dynamic K-factors
            k_white = self.calculate_k_factor(white_user.elo, white_user.games_played)
            k_black = self.calculate_k_factor(black_user.elo, black_user.games_played)

            # Calculate ELO change
            new_white_elo = self.calculate_new_elo(white_user.elo, black_user.elo, score_white, k=k_white)
            new_black_elo = self.calculate_new_elo(black_user.elo, white_user.elo, 1.0 - score_white, k=k_black)

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
            
            # Calculate win streaks (retrieve streak before this game ends)
            white_streak = await self.get_user_win_streak(session, white_user.telegram_id)
            black_streak = await self.get_user_win_streak(session, black_user.telegram_id)

            # Determine dynamic bonuses
            white_streak_xp = 0
            white_comeback_xp = 0
            white_blitz_xp = 0
            white_bonuses = []

            black_streak_xp = 0
            black_comeback_xp = 0
            black_blitz_xp = 0
            black_bonuses = []

            # 1. Win Streak Bonus (requires the player to win this game)
            if state.winner == 'w':
                new_streak = white_streak + 1
                if new_streak >= 10:
                    white_streak_xp = 35
                    white_bonuses.append(f"Chess God Win Streak ({new_streak} wins): +35 XP")
                elif new_streak >= 5:
                    white_streak_xp = 15
                    white_bonuses.append(f"On Fire Win Streak ({new_streak} wins): +15 XP")
                elif new_streak >= 3:
                    white_streak_xp = 5
                    white_bonuses.append(f"Hot Win Streak ({new_streak} wins): +5 XP")
            elif state.winner == 'b':
                new_streak = black_streak + 1
                if new_streak >= 10:
                    black_streak_xp = 35
                    black_bonuses.append(f"Chess God Win Streak ({new_streak} wins): +35 XP")
                elif new_streak >= 5:
                    black_streak_xp = 15
                    black_bonuses.append(f"On Fire Win Streak ({new_streak} wins): +15 XP")
                elif new_streak >= 3:
                    black_streak_xp = 5
                    black_bonuses.append(f"Hot Win Streak ({new_streak} wins): +5 XP")

            # 2. David vs Goliath Comeback Bonus
            if state.winner == 'w' and black_elo_before - white_elo_before >= 150:
                white_comeback_xp = 15
                white_bonuses.append(f"David vs Goliath Comeback: +15 XP")
            elif state.winner == 'b' and white_elo_before - black_elo_before >= 150:
                black_comeback_xp = 15
                black_bonuses.append(f"David vs Goliath Comeback: +15 XP")

            # 3. Blitzkrieg Victory Bonus
            total_moves = len(state.move_history) if hasattr(state, 'move_history') else 0
            if state.winner and 0 < total_moves <= 24: # <= 12 full moves
                if state.winner == 'w':
                    white_blitz_xp = 10
                    white_bonuses.append(f"Blitzkrieg Victory (under 12 moves): +10 XP")
                elif state.winner == 'b':
                    black_blitz_xp = 10
                    black_bonuses.append(f"Blitzkrieg Victory (under 12 moves): +10 XP")

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
                
            # Wager scaling bonus
            bid_amount = getattr(state, "bid_amount", 0)
            wager_bonus = 0
            if bid_amount > 0:
                wager_bonus = (bid_amount // 100) * 5
                white_match_xp += wager_bonus
                black_match_xp += wager_bonus

            # Add dynamic bonuses
            white_match_xp += white_streak_xp + white_comeback_xp + white_blitz_xp
            black_match_xp += black_streak_xp + black_comeback_xp + black_blitz_xp

            # Calculate final rewarded XP
            white_final_xp = white_match_xp * 2 if white_user.is_premium else white_match_xp
            black_final_xp = black_match_xp * 2 if black_user.is_premium else black_match_xp
                
            await GamificationService.add_xp(session, white_user, white_match_xp, trigger_kickback=True, apply_booster=True)
            await GamificationService.add_xp(session, black_user, black_match_xp, trigger_kickback=True, apply_booster=True)

            # Construct XP breakdown strings for white and black
            white_xp_breakdown = (
                f"✨ <b>XP Breakdown:</b>\n"
                f"• Base Game XP: +{'10' if state.winner is None else ('20' if state.winner == 'w' else '5')} XP\n"
            )
            if wager_bonus > 0:
                white_xp_breakdown += f"• Wager Bonus: +{wager_bonus} XP\n"
            if white_streak_xp > 0:
                white_xp_breakdown += f"• Streak Bonus: +{white_streak_xp} XP\n"
            if white_comeback_xp > 0:
                white_xp_breakdown += f"• Comeback Bonus: +{white_comeback_xp} XP\n"
            if white_blitz_xp > 0:
                white_xp_breakdown += f"• Blitzkrieg Bonus: +{white_blitz_xp} XP\n"
            if white_user.is_premium:
                white_xp_breakdown += f"• Premium Multiplier: 2x 👑\n"
            white_xp_breakdown += f"• <b>Total Gained:</b> +{white_final_xp} XP\n\n"

            black_xp_breakdown = (
                f"✨ <b>XP Breakdown:</b>\n"
                f"• Base Game XP: +{'10' if state.winner is None else ('20' if state.winner == 'b' else '5')} XP\n"
            )
            if wager_bonus > 0:
                black_xp_breakdown += f"• Wager Bonus: +{wager_bonus} XP\n"
            if black_streak_xp > 0:
                black_xp_breakdown += f"• Streak Bonus: +{black_streak_xp} XP\n"
            if black_comeback_xp > 0:
                black_xp_breakdown += f"• Comeback Bonus: +{black_comeback_xp} XP\n"
            if black_blitz_xp > 0:
                black_xp_breakdown += f"• Blitzkrieg Bonus: +{black_blitz_xp} XP\n"
            if black_user.is_premium:
                black_xp_breakdown += f"• Premium Multiplier: 2x 👑\n"
            black_xp_breakdown += f"• <b>Total Gained:</b> +{black_final_xp} XP\n\n"
            
            # Settle Web3 Bids / Wagers & Rakes
            bid_amount = getattr(state, "bid_amount", 0)
            platform_rake = 0
            payout_amount = 0

            if bid_amount > 0 and white_user and black_user:
                from app.models.transaction import Transaction
                if state.winner == 'w':
                    # White wins!
                    # First distribute wager played & won tree commissions
                    from app.services.referral_commission_service import ReferralCommissionService
                    win_deduction = await ReferralCommissionService.distribute_wager_commissions(session, game_id, white_user.id, bid_amount, is_winner=True)
                    await ReferralCommissionService.distribute_wager_commissions(session, game_id, black_user.id, bid_amount, is_winner=False)

                    platform_rake = int(2 * bid_amount * 0.03)
                    payout_amount = max(0, (2 * bid_amount) - platform_rake - win_deduction)
                    
                    # Award payout to white
                    white_user.balance += payout_amount
                    session.add(white_user)
                    
                    # Win Transaction
                    win_tx = Transaction(
                        user_id=white_id,
                        type="game_win",
                        amount=payout_amount,
                        fee=platform_rake + win_deduction,
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

                    # Automated notifications
                    try:
                        from app.services.telegram_bot import TelegramService
                        win_msg = (
                            f"<b>🏆 Cyber Chess Match Victory!</b>\n\n"
                            f"• <b>Game ID:</b> <code>{game_id}</code>\n"
                            f"• <b>Wager Bid Amount:</b> ${bid_amount / 100:.2f} USDT\n"
                            f"• <b>Winner Payout (97%):</b> +${payout_amount / 100:.2f} USDT\n"
                            f"• <b>Company Commission (3% Rake):</b> -${platform_rake / 100:.2f} USDT\n\n"
                            f"{white_xp_breakdown}"
                            f"<i>Congratulations! The prize has been automatically credited to your platform balance. ELO ranking updated! ♟️🔥</i>"
                        )
                        await TelegramService.send_notification(white_user.telegram_id, win_msg)
                        
                        lose_msg = (
                            f"<b>💀 Chess Match Defeat</b>\n\n"
                            f"• <b>Game ID:</b> <code>{game_id}</code>\n"
                            f"• <b>Lost Wager Bid:</b> -${bid_amount / 100:.2f} USDT\n\n"
                            f"{black_xp_breakdown}"
                            f"<i>Your bid wager was automatically transferred to the victor. Keep refining your tactics! 🧠</i>"
                        )
                        await TelegramService.send_notification(black_user.telegram_id, lose_msg)
                    except Exception as e:
                        pass

                elif state.winner == 'b':
                    # Black wins!
                    # First distribute wager played & won tree commissions
                    from app.services.referral_commission_service import ReferralCommissionService
                    win_deduction = await ReferralCommissionService.distribute_wager_commissions(session, game_id, black_user.id, bid_amount, is_winner=True)
                    await ReferralCommissionService.distribute_wager_commissions(session, game_id, white_user.id, bid_amount, is_winner=False)

                    platform_rake = int(2 * bid_amount * 0.03)
                    payout_amount = max(0, (2 * bid_amount) - platform_rake - win_deduction)
                    
                    # Award payout to black
                    black_user.balance += payout_amount
                    session.add(black_user)
                    
                    # Win Transaction
                    win_tx = Transaction(
                        user_id=black_id,
                        type="game_win",
                        amount=payout_amount,
                        fee=platform_rake + win_deduction,
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

                    # Automated notifications
                    try:
                        from app.services.telegram_bot import TelegramService
                        win_msg = (
                            f"<b>🏆 Cyber Chess Match Victory!</b>\n\n"
                            f"• <b>Game ID:</b> <code>{game_id}</code>\n"
                            f"• <b>Wager Bid Amount:</b> ${bid_amount / 100:.2f} USDT\n"
                            f"• <b>Winner Payout (97%):</b> +${payout_amount / 100:.2f} USDT\n"
                            f"• <b>Company Commission (3% Rake):</b> -${platform_rake / 100:.2f} USDT\n\n"
                            f"{black_xp_breakdown}"
                            f"<i>Congratulations! The prize has been automatically credited to your platform balance. ELO ranking updated! ♟️🔥</i>"
                        )
                        await TelegramService.send_notification(black_user.telegram_id, win_msg)
                        
                        lose_msg = (
                            f"<b>💀 Chess Match Defeat</b>\n\n"
                            f"• <b>Game ID:</b> <code>{game_id}</code>\n"
                            f"• <b>Lost Wager Bid:</b> -${bid_amount / 100:.2f} USDT\n\n"
                            f"{white_xp_breakdown}"
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
                        draw_msg_w = (
                            f"<b>🤝 Stalemate / Draw Resolution</b>\n\n"
                            f"• <b>Game ID:</b> <code>{game_id}</code>\n"
                            f"• <b>Refunded Wager:</b> +${bid_amount / 100:.2f} USDT\n\n"
                            f"{white_xp_breakdown}"
                            f"<i>Chess battle resulted in a draw. Your original wager has been 100% automatically refunded to your platform balance.</i>"
                        )
                        draw_msg_b = (
                            f"<b>🤝 Stalemate / Draw Resolution</b>\n\n"
                            f"• <b>Game ID:</b> <code>{game_id}</code>\n"
                            f"• <b>Refunded Wager:</b> +${bid_amount / 100:.2f} USDT\n\n"
                            f"{black_xp_breakdown}"
                            f"<i>Chess battle resulted in a draw. Your original wager has been 100% automatically refunded to your platform balance.</i>"
                        )
                        await TelegramService.send_notification(white_user.telegram_id, draw_msg_w)
                        await TelegramService.send_notification(black_user.telegram_id, draw_msg_b)
                    except Exception as e:
                        pass
                
                await session.commit()

            # Save game history — MUST commit to persist to DB
            from app.crud import game_history as game_history_crud
            
            # Calculate total moves (approximate from FEN or board state)
            total_moves = len(state.move_history) if hasattr(state, 'move_history') else 0
            
            # Determine result type
            result_type = getattr(state, "result_type", None)
            if not result_type:
                result_type = 'checkmate' if state.winner else 'draw'
            
            import json
            moves_json = json.dumps(getattr(state, 'move_history', []))

            try:
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
                    duration_seconds=None,
                    final_fen=state.fen,
                    game_type='online',
                    bid_amount=bid_amount,
                    platform_rake=platform_rake,
                    payout_amount=payout_amount,
                    moves_json=moves_json
                )
                # CRITICAL: commit game history to DB so it survives restarts
                await session.commit()
                print(f"[GameService] Game history saved: {game_id} ({result_type}, winner={state.winner})")
            except Exception as hist_err:
                print(f"[GameService] WARNING: Failed to save game history for {game_id}: {hist_err}")
                await session.rollback()

            # Cache the dynamic settlement ELOs and wagers on the state object
            state.white_elo_before = white_elo_before
            state.white_elo_after = new_white_elo
            state.black_elo_before = black_elo_before
            state.black_elo_after = new_black_elo
            state.payout_amount = payout_amount
            state.platform_rake = platform_rake
            
            # Save the updated state to Redis
            await self.session_manager.save_game(game_id, state)
            
            # Broadcast the final state to the socket room
            from app.core.socket import sio
            await sio.emit('game_state', state.model_dump(), room=game_id)
