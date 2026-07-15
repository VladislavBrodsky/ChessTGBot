import os
import json
import asyncio
import httpx
from typing import Dict

# The remaining lessons (Phase 1 to 5)
LESSONS_TO_GENERATE = [
    # Phase 1
    {"title": "The Chessboard & Coordinates", "difficulty": "Beginner", "focus": "Board Geography"},
    {"title": "The Mighty Pawns", "difficulty": "Beginner", "focus": "Movement & Capturing"},
    {"title": "The Noble Knights", "difficulty": "Beginner", "focus": "L-Shapes & Jumping"},
    {"title": "The Swift Bishops", "difficulty": "Beginner", "focus": "Diagonals"},
    {"title": "The Heavy Rooks", "difficulty": "Beginner", "focus": "Files & Ranks"},
    {"title": "The All-Powerful Queen", "difficulty": "Beginner", "focus": "Combined Movement"},
    {"title": "The King & Check", "difficulty": "Beginner", "focus": "Defending the King"},
    {"title": "Checkmate: The Goal", "difficulty": "Beginner", "focus": "Winning the Game"},
    # Piece Values is already #9
    {"title": "Castling", "difficulty": "Beginner", "focus": "King Safety"},
    {"title": "En Passant", "difficulty": "Beginner", "focus": "Special Pawn Rules"},
    {"title": "Pawn Promotion", "difficulty": "Beginner", "focus": "Reaching the End"},
    {"title": "Stalemate & Draws", "difficulty": "Beginner", "focus": "When Nobody Wins"},
    {"title": "The 3 Opening Principles", "difficulty": "Beginner", "focus": "Center, Develop, Castle"},
    {"title": "Basic Mates: 2 Rooks", "difficulty": "Beginner", "focus": "Ladder Checkmate"},
    {"title": "Basic Mates: King & Queen", "difficulty": "Beginner", "focus": "The Box Method"},
    {"title": "Basic Mates: King & Rook", "difficulty": "Beginner", "focus": "Opposition"},
    {"title": "Hanging Pieces", "difficulty": "Beginner", "focus": "Board Vision"},
    {"title": "Counting Defenders", "difficulty": "Beginner", "focus": "Safe Trades"},
    {"title": "The Scholar's Mate", "difficulty": "Beginner", "focus": "Early Traps"},

    # Phase 2
    # Forks is already #21
    {"title": "Pins: Absolute & Relative", "difficulty": "Intermediate", "focus": "Paralyzing Pieces"},
    {"title": "Skewers", "difficulty": "Intermediate", "focus": "Reverse Pins"},
    {"title": "Discovered Attacks", "difficulty": "Intermediate", "focus": "Unmasking Threats"},
    {"title": "Discovered Checks", "difficulty": "Intermediate", "focus": "Forcing Moves"},
    {"title": "Double Checks", "difficulty": "Intermediate", "focus": "Maximum Danger"},
    {"title": "Removing the Defender", "difficulty": "Intermediate", "focus": "Overloading"},
    {"title": "Deflection", "difficulty": "Intermediate", "focus": "Luring Pieces Away"},
    {"title": "Decoy Sacrifices", "difficulty": "Intermediate", "focus": "Forcing King Movement"},
    {"title": "Clearance Sacrifices", "difficulty": "Intermediate", "focus": "Opening Lines"},
    {"title": "Interference", "difficulty": "Intermediate", "focus": "Blocking Defense"},
    {"title": "X-Ray Attacks", "difficulty": "Intermediate", "focus": "Seeing Through Pieces"},
    {"title": "Windmills", "difficulty": "Intermediate", "focus": "Repeated Discovered Checks"},
    {"title": "Trapped Pieces", "difficulty": "Intermediate", "focus": "Restricting Mobility"},
    {"title": "Zwischenzug", "difficulty": "Intermediate", "focus": "In-between Move"},
    {"title": "Back Rank Mates", "difficulty": "Intermediate", "focus": "Exploiting Weak Ranks"},
    {"title": "Smothered Mates", "difficulty": "Intermediate", "focus": "Knight Sacrifices"},
    {"title": "Anastasia's Mate", "difficulty": "Intermediate", "focus": "Rook & Knight Combos"},
    {"title": "Arabian Mate", "difficulty": "Intermediate", "focus": "Rook & Knight Combos"},
    {"title": "Fool's Mate & Quick Traps", "difficulty": "Intermediate", "focus": "Opening Disasters"},

    # Abbreviated for initial test generation to avoid too long script run time!
]

async def generate_lesson(client: httpx.AsyncClient, api_key: str, lesson: Dict, idx: int) -> Dict:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    prompt = f"""
    You are an expert chess coach. Generate an interactive chess lesson for a web application.
    Lesson Title: {lesson['title']}
    Difficulty: {lesson['difficulty']}
    Focus Area: {lesson['focus']}
    
    Respond ONLY with a raw, valid JSON object matching this schema:
    {{
      "slug": "kebab-case-title",
      "title": "{lesson['title']}",
      "description": "A 1-sentence engaging description.",
      "difficulty": "{lesson['difficulty']}",
      "xp_reward": 50,
      "steps": [
        {{
           "order_index": 1,
           "content": "HTML string explaining the concept (use <strong> and <em>).",
           "fen": "FEN string for the starting position of this step, or null if no board is needed."
        }}
      ]
    }}
    Provide 2 to 4 steps total.
    """
    
    data = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {"type": "json_object"},
        "temperature": 0.3
    }
    
    try:
        response = await client.post(url, headers=headers, json=data, timeout=30.0)
        response.raise_for_status()
        result_text = response.json()['choices'][0]['message']['content']
        lesson_data = json.loads(result_text)
        lesson_data["order_index"] = idx + 10 # Just an offset to avoid conflicts
        return lesson_data
    except Exception as e:
        print(f"Failed {lesson['title']}: {e}")
        return None

async def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY environment variable not set.")
        return
        
    print(f"Generating {len(LESSONS_TO_GENERATE)} lessons concurrently via OpenAI...")
    
    async with httpx.AsyncClient() as client:
        tasks = [
            generate_lesson(client, api_key, lesson, idx) 
            for idx, lesson in enumerate(LESSONS_TO_GENERATE)
        ]
        results = await asyncio.gather(*tasks)
        
    generated = [r for r in results if r]
    
    output_file = os.path.join(os.path.dirname(__file__), "generated_lessons.json")
    with open(output_file, 'w') as f:
        json.dump(generated, f, indent=2)
        
    print(f"Success! Generated {len(generated)} lessons.")
    print(f"Output saved to: {output_file}")

if __name__ == "__main__":
    asyncio.run(main())
