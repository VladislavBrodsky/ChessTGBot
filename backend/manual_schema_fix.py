import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Database URL from .env (manually extracted to avoid pydantic-settings issues)
DATABASE_URL = "postgresql+asyncpg://postgres:xEAphyQJxPBBRgOcDVkdaeuTcPJluchM@postgres.railway.internal:5432/railway"

async def update_schema():
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        print("Checking for missing columns...")
        
        # Add columns one by one, ignore if they already exist
        columns = [
            ("is_premium", "BOOLEAN DEFAULT FALSE"),
            ("premium_tier", "VARCHAR"),
            ("premium_expires_at", "TIMESTAMP"),
            ("balance", "INTEGER DEFAULT 0"),
            ("wallet_address", "VARCHAR")
        ]
        
        for col_name, col_type in columns:
            try:
                await conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                print(f"Added column: {col_name}")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print(f"Column {col_name} already exists.")
                else:
                    print(f"Error adding {col_name}: {e}")

    await engine.dispose()
    print("Schema update complete.")

if __name__ == "__main__":
    asyncio.run(update_schema())
