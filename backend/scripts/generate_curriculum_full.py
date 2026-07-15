import os
import json
import asyncio
import httpx
import re

def parse_curriculum_md():
    md_path = "/Users/grandmaestro/.gemini/antigravity/brain/eddbcdaa-1d0a-4afa-b8fe-713c9d806d82/academy_curriculum_plan.md"
    lessons = []
    with open(md_path, 'r') as f:
        lines = f.readlines()
    
    current_difficulty = "Beginner"
    for line in lines:
        if line.startswith("### Phase 1:"): current_difficulty = "Beginner"
        elif line.startswith("### Phase 2:"): current_difficulty = "Intermediate"
        elif line.startswith("### Phase 3:"): current_difficulty = "Intermediate"
        elif line.startswith("### Phase 4:"): current_difficulty = "Advanced"
        elif line.startswith("### Phase 5:"): current_difficulty = "Expert"
        
        # Matches markdown table rows like: | 1 | The Chessboard | Board Geography | ...
        match = re.match(r'\|\s*\d+\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|', line)
        if match:
            title = match.group(1).replace("**", "").strip()
            focus = match.group(2).strip()
            # skip already completed ones
            if title in ["Piece Values", "Forks"]:
                continue
            lessons.append({
                "title": title,
                "difficulty": current_difficulty,
                "focus": focus
            })
    return lessons

async def generate_lesson(client: httpx.AsyncClient, api_key: str, lesson: dict, idx: int) -> dict:
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
    
    retries = 3
    for attempt in range(retries):
        try:
            response = await client.post(url, headers=headers, json=data, timeout=45.0)
            response.raise_for_status()
            result_text = response.json()['choices'][0]['message']['content']
            lesson_data = json.loads(result_text)
            lesson_data["order_index"] = idx + 1 # Use sequential ordering
            return lesson_data
        except Exception as e:
            if attempt == retries - 1:
                print(f"Failed {lesson['title']}: {e}")
                return None
            await asyncio.sleep(2)

async def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY environment variable not set.")
        return
        
    lessons_to_generate = parse_curriculum_md()
    print(f"Parsed {len(lessons_to_generate)} lessons to generate concurrently...")
    
    # Run with a semaphore to limit concurrency if needed, but httpx is fast
    semaphore = asyncio.Semaphore(15) # 15 concurrent requests to avoid rate limits
    
    async def bound_generate(client, lesson, idx):
        async with semaphore:
            return await generate_lesson(client, api_key, lesson, idx)

    async with httpx.AsyncClient() as client:
        tasks = [
            bound_generate(client, lesson, idx) 
            for idx, lesson in enumerate(lessons_to_generate)
        ]
        results = await asyncio.gather(*tasks)
        
    generated = [r for r in results if r]
    
    output_file = os.path.join(os.path.dirname(__file__), "generated_lessons_full.json")
    with open(output_file, 'w') as f:
        json.dump(generated, f, indent=2)
        
    print(f"Success! Generated {len(generated)} lessons.")
    print(f"Output saved to: {output_file}")

if __name__ == "__main__":
    asyncio.run(main())
