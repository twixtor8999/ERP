"""Utility script to verify PostgreSQL database connectivity."""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text

from app.database.session import engine


def check_db():
    print("Testing connection to PostgreSQL...")
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();")).scalar()
            print("Database connection successful!")
            print(f"PostgreSQL Version: {result}")
            return 0
    except Exception as exc:
        print(f"Database connection failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(check_db())
