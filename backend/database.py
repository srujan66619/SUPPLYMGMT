from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os

# Resolve the database path relative to the project root (parent of backend/)
# This ensures it works whether started from project root (python app.py)
# or from within backend/ (fastapi dev main.py)
_this_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.dirname(_this_dir)  # parent of backend/
_db_path = os.path.join(_project_root, "data", "nexusflow.db")

# Ensure data directory exists
os.makedirs(os.path.dirname(_db_path), exist_ok=True)

SQLALCHEMY_DATABASE_URL = f"sqlite:///{_db_path}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
