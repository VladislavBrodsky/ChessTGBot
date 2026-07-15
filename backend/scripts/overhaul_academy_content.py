import asyncio
import os
import sys
import json
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select

# Setup paths
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app.models.content import LessonStep  # noqa: E402

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./chess.db")
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

# AsyncOpenAI reads OPENAI_API_KEY from the environment.
client = AsyncOpenAI()

# Target languages
LANGUAGES = {
    "en": "English",
    "es": "Spanish",
    "ru": "Russian",
    "pt": "Portuguese",
    "fr": "French",
    "de": "German",
    "ar": "Arabic",
    "hi": "Hindi",
    "ja": "Japanese",
    "zh": "Chinese (Simplified)"
}

SYSTEM_PROMPT = """You are a world-class professional EdTech Chess Coach. 
Your job is to rewrite chess lesson steps to be extremely engaging, highly encouraging, and exceptionally easy to understand.
Explain the concepts like the student is a 5-year-old child (ELI5).
Keep the formatting in HTML (using <strong>, <em>, <br/>, or basic Tailwind-like utility classes if appropriate, but stick to simple HTML tags primarily).

CRITICAL INSTRUCTIONS:
- You will receive the original raw English text.
- Rewrite it in the EdTech ELI5 persona.
- Then, translate your rewritten text into all the requested languages.
- You MUST output ONLY a valid JSON object where the keys are the language codes (en, es, ru, pt, fr, de, ar, hi, ja, zh) and the values are the rewritten HTML strings. 
- Do not output markdown code blocks (e.g., ```json). Just the raw JSON object.
"""

async def rewrite_step(step_content: str) -> str:
    # If it's already JSON and has 'en', just re-read the english part or skip.
    try:
        parsed = json.loads(step_content)
        if isinstance(parsed, dict) and "en" in parsed:
            original_text = parsed["en"]
        else:
            original_text = step_content
    except Exception:
        original_text = step_content

    prompt = f"Original Text:\n{original_text}\n\nRewrite this text and translate it into: {', '.join(LANGUAGES.keys())}. Return ONLY a raw JSON dictionary mapping language code to string."
    
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
    )
    
    output = response.choices[0].message.content.strip()
    
    # Strip markdown block if model ignored instructions
    if output.startswith("```json"):
        output = output[7:-3].strip()
    elif output.startswith("```"):
        output = output[3:-3].strip()
        
    return output

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(LessonStep).order_by(LessonStep.id))
        steps = result.scalars().all()
        
        total = len(steps)
        print(f"Found {total} steps to rewrite and translate.")
        
        for i, step in enumerate(steps):
            try:
                # Basic check to avoid re-running if it's already a dict with 10 languages
                try:
                    parsed = json.loads(step.content)
                    if isinstance(parsed, dict) and len(parsed.keys()) >= 9:
                        print(f"[{i+1}/{total}] Step {step.id} already translated. Skipping.")
                        continue
                except Exception:
                    pass

                print(f"[{i+1}/{total}] Rewriting step {step.id}...")
                new_json_content = await rewrite_step(step.content)
                
                # Verify it's valid JSON
                json.loads(new_json_content)
                
                step.content = new_json_content
                await db.commit()
                print(f"[{i+1}/{total}] Successfully updated step {step.id}.")
                
            except Exception as e:
                print(f"[{i+1}/{total}] Error on step {step.id}: {e}")
                await db.rollback()
                
        print("Completed!")

if __name__ == "__main__":
    asyncio.run(main())
