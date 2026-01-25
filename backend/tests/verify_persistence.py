import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.core.database import AsyncSessionLocal, init_db
from app.crud import user as user_crud
from app.services.game_service import GameService
from app.schemas.game_state import GameState

async def verify_persistence():
    print("1. Initializing DB...")
    try:
        await init_db()
    except Exception as e:
        print(f"Failed to init DB (Is Postgres running?): {e}")
        return

    async with AsyncSessionLocal() as session:
        print("2. Creating Mock Users...")
        # Clean up existing test users if any (optional, or just use random IDs)
        p1_id = 9999901
        p2_id = 9999902
        
        u1 = await user_crud.get_user_by_telegram_id(session, p1_id)
        if not u1:
            u1 = await user_crud.create_user(session, p1_id, "TestUser1")
        
        u2 = await user_crud.get_user_by_telegram_id(session, p2_id)
        if not u2:
            u2 = await user_crud.create_user(session, p2_id, "TestUser2")
            
        print(f"User 1 ELO: {u1.elo}, Wins: {u1.wins}")
        print(f"User 2 ELO: {u2.elo}, Wins: {u2.wins}")
        
        initial_wins_u1 = u1.wins
        initial_losses_u2 = u2.losses

    print("3. Simulating Game (White Wins)...")
    service = GameService()
    game_id = "test_game_persistence"
    
    # Create Game
    await service.create_game(game_id)
    
    # Join Game (Assign players)
    await service.join_game(game_id, p1_id) # White
    await service.join_game(game_id, p2_id) # Black
    
    # Fool's Mate
    moves = ["f2f3", "e7e5", "g2g4", "d8h4"]
    for move in moves:
        await service.make_move(game_id, move)
        
    state = await service.get_game_state(game_id)
    print(f"Game Over: {state.is_game_over}, Winner: {state.winner}")
    
    if not state.is_game_over:
        print("ERROR: Game did not end as expected.")
        return

    print("4. Verifying Persistent Stats...")
    async with AsyncSessionLocal() as session:
        u1_new = await user_crud.get_user_by_telegram_id(session, p1_id)
        u2_new = await user_crud.get_user_by_telegram_id(session, p2_id)
        
        print(f"User 1 New Wins: {u1_new.wins} (Expected {initial_wins_u1 + 1})")
        print(f"User 2 New Losses: {u2_new.losses} (Expected {initial_losses_u2 + 1})")
        
        if u1_new.wins == initial_wins_u1 + 1 and u2_new.losses == initial_losses_u2 + 1:
             print("SUCCESS: Stats retrieved from DB match expected results.")
        else:
             print("FAILURE: Stats do not match.")

if __name__ == "__main__":
    try:
        asyncio.run(verify_persistence())
    except KeyboardInterrupt:
        pass
