"""employee order processing and delivery

Revision ID: a1b2c3d4e5f6
Revises: e73b18d2f140
Create Date: 2026-11-20 21:30:00.000000

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str | None = "e73b18d2f140"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Update order_items: add picked_quantity and picking_status
    with op.batch_alter_table("order_items", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("picked_quantity", sa.Numeric(12, 4), server_default="0.0000", nullable=False)
        )
        batch_op.add_column(
            sa.Column("picking_status", sa.String(30), server_default="PENDING_PICK", nullable=False)
        )

    # 2. Update orders: add picking, packing, and delivery attempt fields
    with op.batch_alter_table("orders", schema=None) as batch_op:
        batch_op.add_column(sa.Column("picking_started_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("picking_completed_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("package_count", sa.Integer(), server_default="1", nullable=True))
        batch_op.add_column(sa.Column("delivery_started_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("delivery_failed_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("delivery_failure_reason", sa.String(255), nullable=True))
        batch_op.add_column(
            sa.Column("delivery_attempt_count", sa.Integer(), server_default="0", nullable=False)
        )

    # 3. Create order_delivery_attempts table
    op.create_table(
        "order_delivery_attempts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("order_id", sa.String(36), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("employee_id", sa.String(36), sa.ForeignKey("employees.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("attempt_number", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("failure_reason", sa.String(255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("attempted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_order_delivery_attempts_order_id", "order_delivery_attempts", ["order_id"])
    op.create_index("ix_order_delivery_attempts_employee_id", "order_delivery_attempts", ["employee_id"])


def downgrade() -> None:
    op.drop_index("ix_order_delivery_attempts_employee_id", table_name="order_delivery_attempts")
    op.drop_index("ix_order_delivery_attempts_order_id", table_name="order_delivery_attempts")
    op.drop_table("order_delivery_attempts")

    with op.batch_alter_table("orders", schema=None) as batch_op:
        batch_op.drop_column("delivery_attempt_count")
        batch_op.drop_column("delivery_failure_reason")
        batch_op.drop_column("delivery_failed_at")
        batch_op.drop_column("delivery_started_at")
        batch_op.drop_column("package_count")
        batch_op.drop_column("picking_completed_at")
        batch_op.drop_column("picking_started_at")

    with op.batch_alter_table("order_items", schema=None) as batch_op:
        batch_op.drop_column("picking_status")
        batch_op.drop_column("picked_quantity")
