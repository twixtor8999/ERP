"""SQLAlchemy 2.x models for Client Data Migration and Import Batches."""

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import JSON_TYPE, Base, TimestampMixin, generate_uuid


class DataImportBatch(Base, TimestampMixin):
    """Batch execution envelope for legacy client data imports."""

    __tablename__ = "data_import_batches"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    import_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # CUSTOMERS, PRODUCTS, SUPPLIERS, INVENTORY, COA
    status: Mapped[str] = mapped_column(
        String(30), default="PENDING", nullable=False
    )  # PENDING, PROCESSING, COMPLETED, FAILED
    total_records: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    successful_records: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failed_records: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    files: Mapped[list["DataImportFile"]] = relationship(
        "DataImportFile", back_populates="batch", cascade="all, delete-orphan"
    )
    records: Mapped[list["DataImportRecord"]] = relationship(
        "DataImportRecord", back_populates="batch", cascade="all, delete-orphan"
    )
    errors: Mapped[list["DataImportError"]] = relationship(
        "DataImportError", back_populates="batch", cascade="all, delete-orphan"
    )


class DataImportFile(Base, TimestampMixin):
    """Uploaded spreadsheet / CSV file attached to an import batch."""

    __tablename__ = "data_import_files"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    batch_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("data_import_batches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    row_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    batch: Mapped["DataImportBatch"] = relationship("DataImportBatch", back_populates="files")


class DataImportRecord(Base, TimestampMixin):
    """Raw vs Parsed intermediate representation for an imported row."""

    __tablename__ = "data_import_records"
    __table_args__ = (Index("ix_import_record_lookup", "batch_id", "row_index"),)

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    batch_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("data_import_batches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    row_index: Mapped[int] = mapped_column(Integer, nullable=False)
    raw_data: Mapped[Any] = mapped_column(JSON_TYPE, nullable=False)
    parsed_data: Mapped[Any] = mapped_column(JSON_TYPE, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="PENDING", nullable=False)  # SUCCESS, ERROR
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    batch: Mapped["DataImportBatch"] = relationship("DataImportBatch", back_populates="records")
    errors: Mapped[list["DataImportError"]] = relationship(
        "DataImportError", back_populates="record", cascade="all, delete-orphan"
    )


class DataImportError(Base):
    """Granular column validation error discovered during import staging."""

    __tablename__ = "data_import_errors"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    batch_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("data_import_batches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    record_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("data_import_records.id", ondelete="CASCADE"),
        nullable=True,
    )
    column_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    error_code: Mapped[str] = mapped_column(String(50), nullable=False)
    error_message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    batch: Mapped["DataImportBatch"] = relationship("DataImportBatch", back_populates="errors")
    record: Mapped["DataImportRecord | None"] = relationship("DataImportRecord", back_populates="errors")


class LegacyIdMapping(Base, TimestampMixin):
    """Translation map linking legacy source ERP IDs to new PostgreSQL UUIDs."""

    __tablename__ = "legacy_id_mappings"
    __table_args__ = (
        UniqueConstraint("organization_id", "entity_type", "legacy_id", name="uq_legacy_id_map"),
        Index("ix_legacy_id_map", "organization_id", "entity_type", "legacy_id"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)  # Customer, Product, Supplier
    legacy_id: Mapped[str] = mapped_column(String(100), nullable=False)
    new_id: Mapped[str] = mapped_column(String(36), nullable=False)
    batch_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("data_import_batches.id", ondelete="SET NULL"),
        nullable=True,
    )
