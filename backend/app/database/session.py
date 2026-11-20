"""Database engine and session factory configuration using SQLAlchemy 2.x."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.logging import logger

# Initialize SQLAlchemy 2.x engine with pooling
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    echo=settings.DB_ECHO,
    pool_pre_ping=True,  # Proactively test connection liveliness
)

# Thread-safe session factory
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding an isolated database session."""
    session: Session = SessionLocal()
    try:
        yield session
    except Exception as exc:
        logger.error(f"Database session rolled back due to error: {exc}", exc_info=True)
        session.rollback()
        raise
    finally:
        session.close()
