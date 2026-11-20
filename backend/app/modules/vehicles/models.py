"""SQLAlchemy 2.x models for Vehicles, Assignments, and Maintenance."""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import MONEY_TYPE, Base, TimestampMixin, generate_uuid


class Vehicle(Base, TimestampMixin):
    """Company transport vehicle for inventory logistics and deliveries."""

    __tablename__ = "vehicles"
    __table_args__ = (
        UniqueConstraint("organization_id", "vehicle_number", name="uq_vehicle_org_number"),
        Index("ix_vehicle_org_number", "organization_id", "vehicle_number"),
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
    branch_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("branches.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    vehicle_number: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    make: Mapped[str] = mapped_column(String(100), nullable=False)
    vehicle_type: Mapped[str] = mapped_column(String(50), default="DELIVERY_VAN", nullable=False)
    capacity: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="AVAILABLE", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    assignments: Mapped[list["VehicleAssignment"]] = relationship(
        "VehicleAssignment", back_populates="vehicle", cascade="all, delete-orphan"
    )
    maintenance_records: Mapped[list["VehicleMaintenanceRecord"]] = relationship(
        "VehicleMaintenanceRecord", back_populates="vehicle", cascade="all, delete-orphan"
    )


class VehicleAssignment(Base, TimestampMixin):
    """Assignment log of a vehicle to an employee/driver."""

    __tablename__ = "vehicle_assignments"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    vehicle_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("vehicles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    employee_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("employees.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    assigned_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    returned_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="assignments")


class VehicleMaintenanceRecord(Base, TimestampMixin):
    """Service, repair, and fuel/insurance log for a vehicle."""

    __tablename__ = "vehicle_maintenance_records"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    vehicle_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("vehicles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    maintenance_date: Mapped[date] = mapped_column(Date, nullable=False)
    service_type: Mapped[str] = mapped_column(String(100), nullable=False)
    cost: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    vendor_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    odometer_reading: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="maintenance_records")
