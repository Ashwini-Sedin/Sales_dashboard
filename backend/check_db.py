import asyncio
from sqlalchemy import text
from app.core.database import AsyncSessionLocal

async def main():
    async with AsyncSessionLocal() as session:
        # Check actual enum values in PostgreSQL
        try:
            result = await session.execute(text(
                "SELECT enum_range(NULL::userrole)"
            ))
            print("DB Enum values:", result.scalar())
        except Exception as e:
            print(f"Enum check error: {e}")

        # Check existing users
        try:
            result = await session.execute(text(
                "SELECT email, role, first_name, last_name, is_active FROM users ORDER BY created_at LIMIT 20"
            ))
            rows = result.fetchall()
            print(f"\nExisting users ({len(rows)}):")
            for r in rows:
                print(f"  {r.email} | role={r.role} | {r.first_name} {r.last_name} | active={r.is_active}")
        except Exception as e:
            print(f"Users query error: {e}")

asyncio.run(main())
