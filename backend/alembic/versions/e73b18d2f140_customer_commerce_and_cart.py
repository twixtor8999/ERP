"""customer commerce and cart

Revision ID: e73b18d2f140
Revises: 6f1c4e72390a
Create Date: 2026-11-20 17:15:00.000000

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e73b18d2f140"
down_revision: str | None = "6f1c4e72390a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Update customers table: add user_id foreign key
    with op.batch_alter_table("customers", schema=None) as batch_op:
        batch_op.add_column(sa.Column("user_id", sa.String(length=36), nullable=True))
        batch_op.create_foreign_key("fk_customer_user_id", "users", ["user_id"], ["id"], ondelete="SET NULL")
        batch_op.create_index("ix_customers_user_id", ["user_id"], unique=False)

    # 2. Update customer_addresses table: add recipient_name, phone, landmark
    with op.batch_alter_table("customer_addresses", schema=None) as batch_op:
        batch_op.add_column(sa.Column("recipient_name", sa.String(length=150), nullable=True))
        batch_op.add_column(sa.Column("phone", sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column("landmark", sa.String(length=255), nullable=True))

    # 3. Update orders table with e-commerce snapshots and lifecycle timestamps
    with op.batch_alter_table("orders", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("delivery_charge", sa.Numeric(precision=14, scale=2), server_default="0.00", nullable=False)
        )
        batch_op.add_column(sa.Column("shipping_recipient_name", sa.String(length=150), nullable=True))
        batch_op.add_column(sa.Column("shipping_phone", sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column("shipping_address_line1", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("shipping_address_line2", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("shipping_city", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("shipping_state", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("shipping_postal_code", sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column("shipping_landmark", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("delivery_employee_id", sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column("delivery_notes", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("delivery_slot", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("delivery_otp", sa.String(length=128), nullable=True))
        batch_op.add_column(sa.Column("delivery_otp_encrypted", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("delivery_otp_expires_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("delivery_otp_attempts", sa.Integer(), server_default="0", nullable=False))
        batch_op.add_column(
            sa.Column("payment_method", sa.String(length=30), server_default="CASH_ON_DELIVERY", nullable=False)
        )
        batch_op.add_column(
            sa.Column("payment_status", sa.String(length=30), server_default="PENDING", nullable=False)
        )
        batch_op.add_column(sa.Column("payment_transaction_id", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("placed_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("packed_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("dispatched_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("cancellation_reason", sa.String(length=255), nullable=True))
        batch_op.create_foreign_key(
            "fk_order_delivery_employee", "employees", ["delivery_employee_id"], ["id"], ondelete="SET NULL"
        )
        batch_op.create_index("ix_orders_delivery_employee_id", ["delivery_employee_id"], unique=False)

    # 4. Create carts table
    op.create_table(
        "carts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("organization_id", sa.String(length=36), nullable=False),
        sa.Column("branch_id", sa.String(length=36), nullable=True),
        sa.Column("customer_id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["branch_id"], ["branches.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["customer_id"], ["customers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", "customer_id", name="uq_cart_org_customer"),
    )
    op.create_index("ix_cart_org_customer", "carts", ["organization_id", "customer_id"], unique=False)
    op.create_index("ix_carts_organization_id", "carts", ["organization_id"], unique=False)
    op.create_index("ix_carts_branch_id", "carts", ["branch_id"], unique=False)
    op.create_index("ix_carts_customer_id", "carts", ["customer_id"], unique=False)

    # 5. Create cart_items table
    op.create_table(
        "cart_items",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("cart_id", sa.String(length=36), nullable=False),
        sa.Column("product_id", sa.String(length=36), nullable=False),
        sa.Column("product_variant_id", sa.String(length=36), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=14, scale=4), server_default="1.0000", nullable=False),
        sa.Column("unit_price", sa.Numeric(precision=14, scale=2), server_default="0.00", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["cart_id"], ["carts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_variant_id"], ["product_variants.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cart_id", "product_variant_id", name="uq_cart_item_variant"),
    )
    op.create_index("ix_cart_item_cart_variant", "cart_items", ["cart_id", "product_variant_id"], unique=False)
    op.create_index("ix_cart_items_cart_id", "cart_items", ["cart_id"], unique=False)
    op.create_index("ix_cart_items_product_id", "cart_items", ["product_id"], unique=False)
    op.create_index("ix_cart_items_product_variant_id", "cart_items", ["product_variant_id"], unique=False)


def downgrade() -> None:
    op.drop_table("cart_items")
    op.drop_table("carts")

    with op.batch_alter_table("orders", schema=None) as batch_op:
        batch_op.drop_index("ix_orders_delivery_employee_id")
        batch_op.drop_constraint("fk_order_delivery_employee", type_="foreignkey")
        batch_op.drop_column("cancellation_reason")
        batch_op.drop_column("cancelled_at")
        batch_op.drop_column("delivered_at")
        batch_op.drop_column("dispatched_at")
        batch_op.drop_column("packed_at")
        batch_op.drop_column("confirmed_at")
        batch_op.drop_column("placed_at")
        batch_op.drop_column("payment_transaction_id")
        batch_op.drop_column("payment_status")
        batch_op.drop_column("payment_method")
        batch_op.drop_column("delivery_otp_attempts")
        batch_op.drop_column("delivery_otp_expires_at")
        batch_op.drop_column("delivery_otp_encrypted")
        batch_op.drop_column("delivery_otp")
        batch_op.drop_column("delivery_slot")
        batch_op.drop_column("delivery_notes")
        batch_op.drop_column("delivery_employee_id")
        batch_op.drop_column("shipping_landmark")
        batch_op.drop_column("shipping_postal_code")
        batch_op.drop_column("shipping_state")
        batch_op.drop_column("shipping_city")
        batch_op.drop_column("shipping_address_line2")
        batch_op.drop_column("shipping_address_line1")
        batch_op.drop_column("shipping_phone")
        batch_op.drop_column("shipping_recipient_name")
        batch_op.drop_column("delivery_charge")

    with op.batch_alter_table("customer_addresses", schema=None) as batch_op:
        batch_op.drop_column("landmark")
        batch_op.drop_column("phone")
        batch_op.drop_column("recipient_name")

    with op.batch_alter_table("customers", schema=None) as batch_op:
        batch_op.drop_index("ix_customers_user_id")
        batch_op.drop_constraint("fk_customer_user_id", type_="foreignkey")
        batch_op.drop_column("user_id")

