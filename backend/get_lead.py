import psycopg2
conn = psycopg2.connect('postgresql://neondb_owner:npg_L1xJ5IquYoSQ@ep-lively-dawn-aov7g6op-pooler.c-2.ap-southeast-1.aws.neon.tech/dealflow?sslmode=require&channel_binding=require')
cur = conn.cursor()
cur.execute("SELECT id, first_name, last_name, email FROM leads WHERE first_name ILIKE '%Ash%' OR last_name ILIKE '%Kannan%'")
rows = cur.fetchall()
print("Matches found:", len(rows))
for r in rows:
    print(r)
cur.close()
conn.close()
