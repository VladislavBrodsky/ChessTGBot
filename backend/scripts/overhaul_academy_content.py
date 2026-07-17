import asyncio
import os
import sys
import json
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app.models.content import LessonStep

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./chess.db")
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

LANGUAGES = {
    "en": "English", "es": "Spanish", "ru": "Russian", "pt": "Portuguese", 
    "fr": "French", "de": "German", "ar": "Arabic", "hi": "Hindi", 
    "ja": "Japanese", "zh": "Chinese (Simplified)"
}

SYSTEM_PROMPT = """You are a world-class professional EdTech Chess Coach. 
Your job is to rewrite chess lesson steps to be extremely engaging, highly encouraging, and exceptionally easy to understand.
Explain the concepts like the student is a 5-year-old child (ELI5).
Keep the formatting in HTML (using <strong>, <em>, <br/>, or basic Tailwind-like utility classes if appropriate, but stick to simple HTML tags primarily).

CRITICAL INSTRUCTIONS:
- You will receive the original raw English text.
- Rewrite it in the EdTech ELI5 persona.
- Then, translate your rewritten text into all the requested languages.
- You MUST output ONLY a valid JSON object where the keys are the language codes and the values are the rewritten HTML strings. 
- Do not output markdown code blocks. Just the raw JSON object.
"""

async def rewrite_step(step_content: str) -> str:
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
        messages=[{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": prompt}],
        temperature=0.7,
    )
    
    output = response.choices[0].message.content.strip()
    if output.startswith("```json"): output = output[7:-3].strip()
    elif output.startswith("```"): output = output[3:-3].strip()
    return output

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(LessonStep.id).order_by(LessonStep.id))
        step_ids = result.scalars().all()
        
        total = len(step_ids)
        print(f"Found {total} steps to rewrite and translate.")
        
        for i, sid in enumerate(step_ids):
            # Fetch fresh each loop iteration to avoid greenlet errors
            result = await db.execute(select(LessonStep).filter(LessonStep.id == sid))
            step = result.scalars().first()
            if not step: continue

            try:
                parsed = json.loads(step.content)
                if isinstance(parsed, dict) and len(parsed.keys()) >= 9:
                    print(f"[{i+1}/{total}] Step {step.id} already translated. Skipping.")
                    continue
            except Exception:
                pass

            print(f"[{i+1}/{total}] Rewriting step {step.id}...")
            try:
                new_json_content = await rewrite_step(step.content)
                json.loads(new_json_content) # verify
                step.content = new_json_content
                await db.commit()
                print(f"[{i+1}/{total}] Successfully updated step {step.id}.")
            except Exception as e:
                print(f"[{i+1}/{total}] Error on step {step.id}: {e}")
                await db.rollback()

if __name__ == "__main__":
    asyncio.run(main())
