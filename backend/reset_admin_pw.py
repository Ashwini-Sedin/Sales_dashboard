import psycopg2
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
conn_str = "postgresql://neondb_owner:npg_L1xJ5IquYoSQ@ep-lively-dawn-aov7g6op-pooler.c-2.ap-southeast-1.aws.neon.tech/dealflow?sslmode=require&channel_binding=require"

new_password = "Admin@1234"
hashed = pwd_context.hash(new_password)

try:
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    cur.execute(
        "UPDATE users SET hashed_password = %s WHERE email = %s",
        (hashed, "ceo@dealflow.com")
    )
    conn.commit()
    print(f"[OK] Password reset for ceo@dealflow.com -> {new_password}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"[ERROR] {e}")
