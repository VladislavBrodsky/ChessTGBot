import asyncio
import sys
import os

# Adjust PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.game_service import GameService, compute_best_bot_move
from concurrent.futures import ProcessPoolExecutor

async def main():
    print("Initializing process pool...")
    GameService.initialize_process_pool()
    
    from app.services.game_service import _process_pool
    if _process_pool is None:
        print("Error: Process pool was not initialized!")
        return
        
    print("Submitting move task to executor...")
    try:
        loop = asyncio.get_running_loop()
        fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        result = await loop.run_in_executor(_process_pool, compute_best_bot_move, fen, "medium")
        print(f"Task completed successfully! Move: {result}")
    except Exception as e:
        print("Task failed with exception:")
        import traceback
        traceback.print_exc()
    finally:
        print("Shutting down process pool...")
        GameService.shutdown_process_pool()

if __name__ == "__main__":
    asyncio.run(main())
