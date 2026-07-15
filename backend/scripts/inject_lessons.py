import json
import os
import pprint

def main():
    json_path = "backend/scripts/generated_lessons_full.json"
    alembic_path = "backend/alembic/versions/c7d20b3f9e14_seed_academy_content_and_gamification.py"
    
    with open(json_path, 'r') as f:
        generated = json.load(f)
        
    with open(alembic_path, 'r') as f:
        alembic_content = f.read()
        
    # Find the LESSONS = [ ... ] block
    # We'll just replace everything between LESSONS = [ and the PUZZLES = [
    # But wait, it's safer to just split by "PUZZLES = [" and replace the LESSONS part.
    
    # Original 2 lessons to keep them as is:
    original_lessons = [
        {
            "slug": "piece-values",
            "title": "Piece Values",
            "description": "Learn the relative values of each chess piece to make better trades.",
            "difficulty": "Beginner",
            "order_index": 1,
            "xp_reward": 50,
            "steps": [
                {"order_index": 1, "content": "A pawn is worth 1 point. Knights and Bishops are worth 3 points.", "fen": None},
                {"order_index": 2, "content": "A rook is worth 5 points, and a queen is worth 9. The king's value is infinite!", "fen": None},
            ],
        },
        {
            "slug": "forks",
            "title": "Forks",
            "description": "Attack two pieces at once to gain a material advantage.",
            "difficulty": "Intermediate",
            "order_index": 2,
            "xp_reward": 100,
            "steps": [
                {"order_index": 1, "content": "A fork happens when a single piece attacks two or more of the opponent's pieces simultaneously.", "fen": "8/8/8/3N4/8/2q1k3/8/8 w - - 0 1"},
                {"order_index": 2, "content": "Knights are especially famous for their forks, often attacking a king and a queen.", "fen": None},
            ],
        }
    ]
    
    all_lessons = original_lessons + generated
    
    # Use pprint.pformat to generate valid Python instead of JSON (which has null, true, false)
    lessons_str = "LESSONS = " + pprint.pformat(all_lessons, indent=4, sort_dicts=False)
    
    # Use string splitting to avoid re.sub escape character issues
    parts = alembic_content.split("PUZZLES = [")
    if len(parts) == 2:
        # Find the start of LESSONS = [
        prefix = parts[0][:parts[0].find("LESSONS = [")]
        new_content = prefix + lessons_str + "\n\nPUZZLES = [" + parts[1]
    else:
        print("Could not find PUZZLES = [ to anchor the split.")
        return
    
    with open(alembic_path, 'w') as f:
        f.write(new_content)
        
    print(f"Successfully injected {len(all_lessons)} lessons into Alembic seed.")

if __name__ == "__main__":
    main()
