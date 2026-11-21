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


class DeliveryTrip(Base, TimestampMixin):
    """Logistics dispatch trip grouping deliveries for retail stores."""

    __tablename__ = "delivery_trips"
    __table_args__ = (
        UniqueConstraint("organization_id", "trip_number", name="uq_trip_org_number"),
        Index("ix_trip_org_number", "organization_id", "trip_number"),
        Index("ix_trip_org_date", "organization_id", "trip_date"),
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
    trip_number: Mapped[str] = mapped_column(String(50), nullable=False)
    vehicle_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("vehicles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    driver_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    trip_date: Mapped[date] = mapped_column(Date, nullable=False)
    route_name: Mapped[str] = mapped_column(String(150), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="SCHEDULED", nullable=False)  # SCHEDULED, DISPATCHED, COMPLETED, CANCELLED
    total_stops: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_invoice_amount: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    cod_to_collect: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    cod_collected: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    fuel_expense: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    toll_expense: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    driver_allowance: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    start_odometer: Mapped[int | None] = mapped_column(Integer, nullable=True)
    end_odometer: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    vehicle: Mapped["Vehicle"] = relationship("Vehicle")
    stops: Mapped[list["DeliveryTripStop"]] = relationship(
        "DeliveryTripStop", back_populates="trip", cascade="all, delete-orphan"
    )


class DeliveryTripStop(Base, TimestampMixin):
    """Individual customer stop or store delivery inside a dispatch trip."""

    __tablename__ = "delivery_trip_stops"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
    )
    trip_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("delivery_trips.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    customer_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("customers.id", ondelete="SET NULL"),
        nullable=True,
    )
    customer_name: Mapped[str] = mapped_column(String(150), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(50), nullable=False)
    delivery_address: Mapped[str] = mapped_column(Text, nullable=False)
    invoice_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    amount_to_collect: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    amount_collected: Mapped[Decimal] = mapped_column(MONEY_TYPE, default=Decimal("0.00"), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="PENDING", nullable=False)  # PENDING, DELIVERED, FAILED
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    trip: Mapped["DeliveryTrip"] = relationship("DeliveryTrip", back_populates="stops")
