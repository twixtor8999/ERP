"""Database transaction boundaries and context managers."""

from collections.abc import Generator
from contextlib import contextmanager

from sqlalchemy.orm import Session

from app.core.logging import logger


@contextmanager
def transaction_scope(session: Session) -> Generator[Session, None, None]:
    """Execute a series of operations atomically with commit and rollback handling."""
    try:
        yield session
        session.commit()
    except Exception as exc:
        session.rollback()
        logger.error(f"Transaction aborted and rolled back: {exc}", exc_info=True)
        raise
