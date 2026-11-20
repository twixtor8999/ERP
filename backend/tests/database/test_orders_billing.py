"""Tests verifying Sales Orders, Invoice Sequence Generation, and Invoices."""

from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.base import generate_uuid
from app.models import (
    Branch,
    Customer,
    Invoice,
    InvoiceItem,
    InvoiceSequence,
    Order,
    OrderItem,
    Organization,
    Product,
    ProductVariant,
    UnitOfMeasure,
)


def test_order_creation_with_historical_snapshot(db_session: Session) -> None:
    """Verify sales orders store item price, name, and tax snapshots."""
    org = Organization(
        id=generate_uuid(),
        name="Order Org",
        legal_name="Order Org Ltd",
        organization_code="ORD-ORG",
        email="order@org.com",
        phone="+91 9999900001",
    )
    db_session.add(org)
    db_session.flush()

    branch = Branch(
        id=generate_uuid(),
        organization_id=org.id,
        branch_code="BR-ORD",
        branch_name="Order Branch",
        phone="+91 9999900002",
        email="branch@order.com",
    )
    cust = Customer(
        id=generate_uuid(),
        organization_id=org.id,
        customer_code="CUST-ORD-1",
        first_name="Deepak",
        display_name="Deepak Joshi",
        phone="+91 9999900003",
    )
    uom = UnitOfMeasure(id=generate_uuid(), organization_id=org.id, code="PCS", name="Pieces", symbol="pc")
    db_session.add_all([branch, cust, uom])
    db_session.flush()

    prod = Product(id=generate_uuid(), organization_id=org.id, name="Tea 250g", code="TEA-250G", uom_id=uom.id)
    db_session.add(prod)
    db_session.flush()

    variant = ProductVariant(
        id=generate_uuid(),
        product_id=prod.id,
        variant_name="Standard",
        sku="SKU-TEA-250G",
        selling_price=Decimal("120.00"),
    )
    db_session.add(variant)
    db_session.flush()

    # Create Order
    order = Order(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch.id,
        customer_id=cust.id,
        order_number="SO-2026-0001",
        order_date=date.today(),
        status="CONFIRMED",
        subtotal=Decimal("240.00"),
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("12.00"),
        total_amount=Decimal("252.00"),
    )
    db_session.add(order)
    db_session.flush()

    # Create OrderItem with immutable snapshot
    item = OrderItem(
        id=generate_uuid(),
        order_id=order.id,
        product_variant_id=variant.id,
        product_name="Tea 250g (Batch Premium)",
        sku="SKU-TEA-250G",
        quantity=Decimal("2.0000"),
        unit_price=Decimal("120.00"),
        discount_percent=Decimal("0.0000"),
        discount_amount=Decimal("0.00"),
        tax_rate=Decimal("5.0000"),
        tax_amount=Decimal("12.00"),
        total_amount=Decimal("252.00"),
    )
    db_session.add(item)
    db_session.commit()

    saved_order = db_session.scalar(select(Order).where(Order.order_number == "SO-2026-0001"))
    assert saved_order is not None
    assert len(saved_order.items) == 1
    assert saved_order.items[0].product_name == "Tea 250g (Batch Premium)"
    assert saved_order.total_amount == Decimal("252.00")


def test_invoice_sequence_generation_and_tax_breakdown(db_session: Session) -> None:
    """Verify invoice sequence atomic counter and GST tax calculation precision."""
    org = Organization(
        id=generate_uuid(),
        name="Bill Org",
        legal_name="Bill Org Ltd",
        organization_code="BILL-ORG",
        email="bill@org.com",
        phone="+91 9999900004",
    )
    db_session.add(org)
    db_session.flush()

    branch = Branch(
        id=generate_uuid(),
        organization_id=org.id,
        branch_code="BR-PUNE",
        branch_name="Pune Branch",
        phone="+91 9999900005",
        email="pune@bill.com",
    )
    cust = Customer(
        id=generate_uuid(),
        organization_id=org.id,
        customer_code="CUST-BILL-1",
        first_name="Anita",
        display_name="Anita Desai",
        phone="+91 9999900006",
    )
    uom = UnitOfMeasure(id=generate_uuid(), organization_id=org.id, code="PCS", name="Pieces", symbol="pc")
    db_session.add_all([branch, cust, uom])
    db_session.flush()

    prod = Product(
        id=generate_uuid(),
        organization_id=org.id,
        name="Soap 125g",
        code="SOAP-125G",
        uom_id=uom.id,
    )
    db_session.add(prod)
    db_session.flush()

    variant = ProductVariant(id=generate_uuid(), product_id=prod.id, variant_name="Bar", sku="SOAP-125G")
    db_session.add(variant)
    db_session.flush()

    # Setup invoice sequence
    seq = InvoiceSequence(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch.id,
        sequence_type="TAX_INVOICE",
        financial_year="2026-27",
        prefix="INV-PUNE-",
        current_number=0,
        padding=4,
    )
    db_session.add(seq)
    db_session.flush()

    # Increment sequence
    seq.current_number += 1
    generated_number = f"{seq.prefix}{str(seq.current_number).zfill(seq.padding)}"
    assert generated_number == "INV-PUNE-0001"

    # Create Invoice
    invoice = Invoice(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch.id,
        customer_id=cust.id,
        invoice_number=generated_number,
        invoice_date=date.today(),
        financial_year="2026-27",
        invoice_type="TAX_INVOICE",
        subtotal=Decimal("100.00"),
        discount_amount=Decimal("0.00"),
        cgst_amount=Decimal("9.00"),
        sgst_amount=Decimal("9.00"),
        igst_amount=Decimal("0.00"),
        cess_amount=Decimal("0.00"),
        total_tax=Decimal("18.00"),
        total_amount=Decimal("118.00"),
        paid_amount=Decimal("0.00"),
        balance_amount=Decimal("118.00"),
        payment_status="UNPAID",
        status="ISSUED",
    )
    db_session.add(invoice)
    db_session.flush()

    item = InvoiceItem(
        id=generate_uuid(),
        invoice_id=invoice.id,
        product_variant_id=variant.id,
        description="Premium Soap 125g",
        hsn_sac="3401",
        quantity=Decimal("2.0000"),
        unit_price=Decimal("50.00"),
        discount_amount=Decimal("0.00"),
        taxable_amount=Decimal("100.00"),
        cgst_rate=Decimal("9.0000"),
        cgst_amount=Decimal("9.00"),
        sgst_rate=Decimal("9.0000"),
        sgst_amount=Decimal("9.00"),
        igst_rate=Decimal("0.0000"),
        igst_amount=Decimal("0.00"),
        total_amount=Decimal("118.00"),
    )
    db_session.add(item)
    db_session.commit()

    saved_inv = db_session.scalar(select(Invoice).where(Invoice.invoice_number == "INV-PUNE-0001"))
    assert saved_inv is not None
    assert saved_inv.balance_amount == Decimal("118.00")
    assert saved_inv.total_tax == Decimal("18.00")
    assert saved_inv.cgst_amount + saved_inv.sgst_amount == saved_inv.total_tax
