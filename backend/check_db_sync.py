import psycopg2
import os

# Use synchronous psycopg2 to avoid async driver issues
conn_str = "postgresql://neondb_owner:npg_L1xJ5IquYoSQ@ep-lively-dawn-aov7g6op-pooler.c-2.ap-southeast-1.aws.neon.tech/dealflow?sslmode=require&channel_binding=require"

try:
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()

    # Check enum values
    try:
        cur.execute("SELECT enum_range(NULL::userrole)")
        print("DB Enum values:", cur.fetchone())
    except Exception as e:
        print(f"Enum check: {e}")
        conn.rollback()

    # Check existing users
    try:
        cur.execute("SELECT email, role, first_name, last_name, is_active FROM users ORDER BY created_at")
        rows = cur.fetchall()
        print(f"\nExisting users ({len(rows)}):")
        for r in rows:
            print(f"  email={r[0]} | role={r[1]} | name={r[2]} {r[3]} | active={r[4]}")
    except Exception as e:
        print(f"Users query error: {e}")

    cur.close()
    conn.close()
except Exception as e:
    print(f"Connection error: {e}")
