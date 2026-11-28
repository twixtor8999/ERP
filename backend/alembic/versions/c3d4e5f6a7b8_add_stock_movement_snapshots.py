"""Alembic migration: add opening_quantity and closing_quantity snapshots to stock_movements."""

from alembic import op
import sqlalchemy as sa


revision = "c3d4e5f6a7b8"
down_revision = "f62ac260596c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("stock_movements", sa.Column("opening_quantity", sa.Numeric(14, 4), nullable=True))
    op.add_column("stock_movements", sa.Column("closing_quantity", sa.Numeric(14, 4), nullable=True))


def downgrade() -> None:
    op.drop_column("stock_movements", "closing_quantity")
    op.drop_column("stock_movements", "opening_quantity")
