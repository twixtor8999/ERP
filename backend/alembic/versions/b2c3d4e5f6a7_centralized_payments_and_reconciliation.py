"""centralized payments and reconciliation

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-11-21 14:00:00.000000

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: str | None = "a1b2c3d4e5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("payment_transactions", schema=None) as batch_op:
        batch_op.add_column(sa.Column("order_id", sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column("invoice_id", sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column("collector_id", sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column("collector_role", sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column("reconciled_by", sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column("reconciled_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("reconciliation_notes", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("dispute_reason", sa.Text(), nullable=True))

        batch_op.create_foreign_key(
            "fk_pay_tx_order_id", "orders", ["order_id"], ["id"], ondelete="SET NULL"
        )
        batch_op.create_foreign_key(
            "fk_pay_tx_invoice_id", "invoices", ["invoice_id"], ["id"], ondelete="SET NULL"
        )
        batch_op.create_foreign_key(
            "fk_pay_tx_collector_id", "users", ["collector_id"], ["id"], ondelete="SET NULL"
        )
        batch_op.create_foreign_key(
            "fk_pay_tx_reconciled_by", "users", ["reconciled_by"], ["id"], ondelete="SET NULL"
        )
        batch_op.create_index("ix_pay_tx_order_id", ["order_id"])
        batch_op.create_index("ix_pay_tx_invoice_id", ["invoice_id"])
        batch_op.create_index("ix_pay_tx_collector_id", ["collector_id"])
        batch_op.create_index("ix_pay_tx_status", ["organization_id", "status"])


def downgrade() -> None:
    with op.batch_alter_table("payment_transactions", schema=None) as batch_op:
        batch_op.drop_index("ix_pay_tx_status")
        batch_op.drop_index("ix_pay_tx_collector_id")
        batch_op.drop_index("ix_pay_tx_invoice_id")
        batch_op.drop_index("ix_pay_tx_order_id")

        batch_op.drop_constraint("fk_pay_tx_reconciled_by", type_="foreignkey")
        batch_op.drop_constraint("fk_pay_tx_collector_id", type_="foreignkey")
        batch_op.drop_constraint("fk_pay_tx_invoice_id", type_="foreignkey")
        batch_op.drop_constraint("fk_pay_tx_order_id", type_="foreignkey")

        batch_op.drop_column("dispute_reason")
        batch_op.drop_column("reconciliation_notes")
        batch_op.drop_column("reconciled_at")
        batch_op.drop_column("reconciled_by")
        batch_op.drop_column("collector_role")
        batch_op.drop_column("collector_id")
        batch_op.drop_column("invoice_id")
        batch_op.drop_column("order_id")

