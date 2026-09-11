from sqlalchemy import create_engine, text
from database import SessionLocal, engine

print("Engine URL:", engine.url)

with engine.connect() as conn:
    try:
        res = conn.execute(text("SELECT current_database() as db, current_schema() as schema, count(*) as cnt FROM product WHERE id = 4"))
        row = res.fetchone()
        print("Query result:", dict(row) if row is not None else None)
    except Exception as e:
        print("Query failed:", e)
        # try generic count
        try:
            res2 = conn.execute(text("SELECT current_database() as db, current_schema() as schema"))
            print("Fallback DB info:", dict(res2.fetchone()))
        except Exception as e2:
            print("Fallback failed:", e2)

# also try using SessionLocal
print('\nTrying via SessionLocal:')
s = SessionLocal()
try:
    r = s.execute(text('select * from product where id = :id'), {'id': 4}).mappings().all()
    print('Session result rows:', r)
finally:
    s.close()
