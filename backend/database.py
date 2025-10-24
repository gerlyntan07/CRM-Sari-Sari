#database.py
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine import Engine

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")

if DATABASE_URL:
    engine: Engine = create_engine(DATABASE_URL, echo=True)
else:
    engine = None

if engine:
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
else:
    SessionLocal = None

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
        print("Database session yield successfully")
    finally:
        db.close()
        print("Database session closed")

def test_connection():
    try:
        with engine.connect() as connection:
            print("Database connection successful")
    except Exception as e:
        print(f"Database connection failed: {e}")
test_connection()
