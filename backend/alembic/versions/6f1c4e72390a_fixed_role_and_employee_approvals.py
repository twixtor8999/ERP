"""fixed role and employee approvals

Revision ID: 6f1c4e72390a
Revises: 259d252d2a56
Create Date: 2026-11-20 15:10:00.000000

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "6f1c4e72390a"
down_revision: str | None = "259d252d2a56"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Update users table with approval status and requested role slug
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("approval_status", sa.String(length=30), server_default="APPROVED", nullable=False)
        )
        batch_op.add_column(
            sa.Column("requested_role_slug", sa.String(length=100), nullable=True)
        )
        batch_op.create_index("ix_users_approval_status", ["approval_status"], unique=False)

    # 2. Update user_role_assignments table with is_primary flag
    with op.batch_alter_table("user_role_assignments", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("is_primary", sa.Boolean(), server_default=sa.text("false"), nullable=False)
        )
        batch_op.create_index(
            "ix_user_role_primary", ["user_id", "organization_id", "is_primary"], unique=False
        )


def downgrade() -> None:
    with op.batch_alter_table("user_role_assignments", schema=None) as batch_op:
        batch_op.drop_index("ix_user_role_primary")
        batch_op.drop_column("is_primary")

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_index("ix_users_approval_status")
        batch_op.drop_column("requested_role_slug")
        batch_op.drop_column("approval_status")

