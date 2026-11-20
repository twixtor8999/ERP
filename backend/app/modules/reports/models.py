"""SQLAlchemy 2.x models for Reports, Filter Presets, and Export Jobs."""

from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import JSON_TYPE, Base, TimestampMixin, generate_uuid


class ReportDefinition(Base, TimestampMixin):
    """Report template metadata and query configuration."""

    __tablename__ = "report_definitions"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_report_def_org_code"),
        Index("ix_report_def_org_code", "organization_id", "code"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    organization_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    report_type: Mapped[str] = mapped_column(String(50), nullable=False)  # FINANCIAL, SALES, INVENTORY, TAX, AUDIT
    query_template: Mapped[str | None] = mapped_column(Text, nullable=True)
    parameters_schema: Mapped[Any] = mapped_column(JSON_TYPE, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    saved_filters: Mapped[list["SavedReportFilter"]] = relationship(
        "SavedReportFilter", back_populates="report_definition", cascade="all, delete-orphan"
    )


class SavedReportFilter(Base, TimestampMixin):
    """User-saved parameter filter preset for reports."""

    __tablename__ = "saved_report_filters"

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
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    report_definition_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("report_definitions.id", ondelete="CASCADE"),
        nullable=False,
    )
    filter_name: Mapped[str] = mapped_column(String(100), nullable=False)
    filter_values: Mapped[Any] = mapped_column(JSON_TYPE, nullable=False)

    report_definition: Mapped["ReportDefinition"] = relationship("ReportDefinition", back_populates="saved_filters")


class ExportJob(Base, TimestampMixin):
    """Asynchronous background data export job."""

    __tablename__ = "export_jobs"

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
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    report_name: Mapped[str] = mapped_column(String(150), nullable=False)
    export_format: Mapped[str] = mapped_column(String(20), default="CSV", nullable=False)  # CSV, XLSX, PDF
    status: Mapped[str] = mapped_column(String(30), default="PENDING", nullable=False)
    file_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
