import os
import json
import time
import requests
from typing import List, Dict

# The 98 remaining lessons mapped from our Academy GTM Plan
# (Abbreviated to 5 for the first batch to avoid rate limits, run in batches)
LESSONS_TO_GENERATE = [
    {"title": "The Chessboard & Coordinates", "difficulty": "Beginner", "focus": "Board Geography"},
    {"title": "The Mighty Pawns", "difficulty": "Beginner", "focus": "Movement & Capturing"},
    {"title": "The Noble Knights", "difficulty": "Beginner", "focus": "L-Shapes & Jumping"},
    {"title": "The Swift Bishops", "difficulty": "Beginner", "focus": "Diagonals"},
    {"title": "The Heavy Rooks", "difficulty": "Beginner", "focus": "Files & Ranks"},
]

def generate_lesson_content(api_key: str, lesson: Dict) -> Dict:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    prompt = f"""
    You are an expert chess coach. Generate an interactive chess lesson for a web application.
    Lesson Title: {lesson['title']}
    Difficulty: {lesson['difficulty']}
    Focus Area: {lesson['focus']}
    
    Respond ONLY with a raw, valid JSON object (no markdown formatting, no code blocks) matching this exact schema:
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
        // Provide 2 to 4 steps total.
      ]
    }}
    """
    
    headers = {'Content-Type': 'application/json'}
    data = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }
    
    response = requests.post(url, headers=headers, json=data)
    response.raise_for_status()
    
    result_text = response.json()['candidates'][0]['content']['parts'][0]['text']
    try:
        return json.loads(result_text)
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON for {lesson['title']}: {e}")
        return None

def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY environment variable not set.")
        print("Run with: GEMINI_API_KEY='your_key' python backend/scripts/generate_curriculum.py")
        return
        
    generated = []
    output_file = os.path.join(os.path.dirname(__file__), "generated_lessons.json")
    
    print(f"Generating {len(LESSONS_TO_GENERATE)} lessons...")
    for idx, lesson in enumerate(LESSONS_TO_GENERATE):
        print(f"[{idx+1}/{len(LESSONS_TO_GENERATE)}] Generating '{lesson['title']}'...")
        try:
            lesson_data = generate_lesson_content(api_key, lesson)
            if lesson_data:
                # Add order index
                lesson_data["order_index"] = idx + 3  # offset by existing 2 lessons
                generated.append(lesson_data)
            # Sleep to respect rate limits
            time.sleep(2)
        except Exception as e:
            print(f"Error generating {lesson['title']}: {e}")
            
    with open(output_file, 'w') as f:
        json.dump(generated, f, indent=2)
        
    print(f"Success! Generated {len(generated)} lessons.")
    print(f"Output saved to: {output_file}")
    print("You can now copy these into backend/alembic/versions/c7d20b3f9e14_seed_academy_content_and_gamification.py")

if __name__ == "__main__":
    main()
