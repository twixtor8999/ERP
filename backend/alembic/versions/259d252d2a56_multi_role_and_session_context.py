"""multi_role_and_session_context

Revision ID: 259d252d2a56
Revises: 48c033b54de0
Create Date: 2026-11-20 14:17:00.372887

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import Text
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '259d252d2a56'
down_revision: Union[str, None] = '48c033b54de0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'role_assignment_history',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('assignment_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('role_id', sa.String(length=36), nullable=False),
        sa.Column('organization_id', sa.String(length=36), nullable=False),
        sa.Column('branch_id', sa.String(length=36), nullable=True),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('performed_by', sa.String(length=36), nullable=True),
        sa.Column('details', postgresql.JSONB(astext_type=Text()).with_variant(sa.JSON(), 'sqlite'), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['branch_id'], ['branches.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_role_history_assignment', 'role_assignment_history', ['assignment_id'], unique=False)
    op.create_index('ix_role_history_user', 'role_assignment_history', ['user_id', 'created_at'], unique=False)

    with op.batch_alter_table('auth_sessions') as batch_op:
        batch_op.add_column(sa.Column('organization_id', sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column('active_branch_id', sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column('active_role_id', sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column('status', sa.String(length=30), nullable=False, server_default='ACTIVE'))
        batch_op.create_index(batch_op.f('ix_auth_sessions_active_branch_id'), ['active_branch_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_auth_sessions_active_role_id'), ['active_role_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_auth_sessions_organization_id'), ['organization_id'], unique=False)
        batch_op.create_foreign_key('fk_auth_sessions_active_branch_id', 'branches', ['active_branch_id'], ['id'], ondelete='SET NULL')
        batch_op.create_foreign_key('fk_auth_sessions_active_role_id', 'roles', ['active_role_id'], ['id'], ondelete='SET NULL')
        batch_op.create_foreign_key('fk_auth_sessions_organization_id', 'organizations', ['organization_id'], ['id'], ondelete='CASCADE')

    with op.batch_alter_table('user_branch_access') as batch_op:
        batch_op.add_column(sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()))
        batch_op.add_column(sa.Column('assigned_by', sa.String(length=36), nullable=True))

    with op.batch_alter_table('user_role_assignments') as batch_op:
        batch_op.add_column(sa.Column('assigned_by', sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column('assigned_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()))
        batch_op.add_column(sa.Column('valid_from', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('valid_until', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()))
        batch_op.add_column(sa.Column('status', sa.String(length=30), nullable=False, server_default='ACTIVE'))
        batch_op.add_column(sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('revoked_by', sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column('notes', sa.Text(), nullable=True))
        batch_op.create_index('ix_user_role_status', ['user_id', 'status'], unique=False)

    with op.batch_alter_table('users') as batch_op:
        batch_op.create_index('ix_user_org_phone', ['organization_id', 'phone'], unique=False)
        batch_op.create_index('ix_user_phone', ['phone'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_index('ix_user_phone')
        batch_op.drop_index('ix_user_org_phone')

    with op.batch_alter_table('user_role_assignments') as batch_op:
        batch_op.drop_index('ix_user_role_status')
        batch_op.drop_column('notes')
        batch_op.drop_column('revoked_by')
        batch_op.drop_column('revoked_at')
        batch_op.drop_column('status')
        batch_op.drop_column('is_active')
        batch_op.drop_column('valid_until')
        batch_op.drop_column('valid_from')
        batch_op.drop_column('assigned_at')
        batch_op.drop_column('assigned_by')

    with op.batch_alter_table('user_branch_access') as batch_op:
        batch_op.drop_column('assigned_by')
        batch_op.drop_column('is_active')

    with op.batch_alter_table('auth_sessions') as batch_op:
        batch_op.drop_constraint('fk_auth_sessions_organization_id', type_='foreignkey')
        batch_op.drop_constraint('fk_auth_sessions_active_role_id', type_='foreignkey')
        batch_op.drop_constraint('fk_auth_sessions_active_branch_id', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_auth_sessions_organization_id'))
        batch_op.drop_index(batch_op.f('ix_auth_sessions_active_role_id'))
        batch_op.drop_index(batch_op.f('ix_auth_sessions_active_branch_id'))
        batch_op.drop_column('status')
        batch_op.drop_column('active_role_id')
        batch_op.drop_column('active_branch_id')
        batch_op.drop_column('organization_id')

    op.drop_index('ix_role_history_user', table_name='role_assignment_history')
    op.drop_index('ix_role_history_assignment', table_name='role_assignment_history')
    op.drop_table('role_assignment_history')
