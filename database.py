
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# db_url = "postgresql://postgres:12345678@localhost:5432/telusko"
# engine = create_engine(db_url)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db_url = os.getenv(
	"DATABASE_URL",
	"postgresql://postgres:postgres123@localhost:5432/fastapidb",
)
engine = create_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
