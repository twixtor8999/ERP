"""Alembic migration: add vehicle_settlement_denominations table.

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-11-28 22:10:00
"""

from alembic import op
import sqlalchemy as sa


revision = "d4e5f6a7b8c9"
down_revision = "c3d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "vehicle_settlement_denominations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("organization_id", sa.String(length=36), nullable=False),
        sa.Column("branch_id", sa.String(length=36), nullable=False),
        sa.Column("settlement_date", sa.Date(), nullable=False),
        sa.Column("vehicle_id", sa.String(length=36), nullable=False),
        sa.Column("vehicle_number", sa.String(length=50), nullable=False),
        sa.Column("orders_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("net_amount", sa.Numeric(14, 2), nullable=False, server_default="0.00"),
        sa.Column("note_500", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("note_200", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("note_100", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("note_50", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("note_20", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("note_10", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("coins_amount", sa.Numeric(14, 2), nullable=False, server_default="0.00"),
        sa.Column("cash_total", sa.Numeric(14, 2), nullable=False, server_default="0.00"),
        sa.Column("qr_total", sa.Numeric(14, 2), nullable=False, server_default="0.00"),
        sa.Column("difference", sa.Numeric(14, 2), nullable=False, server_default="0.00"),
        sa.Column("verified_by_user_id", sa.String(length=36), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["branch_id"], ["branches.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["verified_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", "settlement_date", "vehicle_id", name="uq_veh_settle_date"),
    )
    op.create_index("ix_veh_settle_date", "vehicle_settlement_denominations", ["organization_id", "settlement_date"])


def downgrade() -> None:
    op.drop_index("ix_veh_settle_date", table_name="vehicle_settlement_denominations")
    op.drop_table("vehicle_settlement_denominations")
