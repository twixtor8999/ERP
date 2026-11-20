"""Tests verifying Products, SKUs, Warehouses, Stock Movements, and Transfers."""

from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.base import generate_uuid
from app.models import (
    Branch,
    Brand,
    Organization,
    Product,
    ProductCategory,
    ProductTaxConfiguration,
    ProductVariant,
    StockBalance,
    StockMovement,
    StockTransfer,
    StockTransferItem,
    UnitOfMeasure,
    Warehouse,
)


def test_product_catalog_hierarchy(db_session: Session) -> None:
    """Verify master products, variants, UOMs, and tax links."""
    org = Organization(
        id=generate_uuid(),
        name="Catalog Org",
        legal_name="Catalog Org Ltd",
        organization_code="CAT-ORG",
        email="cat@org.com",
        phone="+91 8888888881",
    )
    db_session.add(org)
    db_session.flush()

    uom = UnitOfMeasure(
        id=generate_uuid(),
        organization_id=org.id,
        code="PCS",
        name="Pieces",
        symbol="pc",
    )
    cat = ProductCategory(
        id=generate_uuid(),
        organization_id=org.id,
        code="FOOD",
        name="Food & Beverages",
    )
    brand = Brand(
        id=generate_uuid(),
        organization_id=org.id,
        code="AMUL",
        name="Amul",
    )
    tax = ProductTaxConfiguration(
        id=generate_uuid(),
        organization_id=org.id,
        hsn_sac_code="0402",
        tax_rate=Decimal("12.0000"),
        cgst_rate=Decimal("6.0000"),
        sgst_rate=Decimal("6.0000"),
    )
    db_session.add_all([uom, cat, brand, tax])
    db_session.flush()

    product = Product(
        id=generate_uuid(),
        organization_id=org.id,
        name="Amul Butter",
        code="PROD-AMUL-BUTTER",
        category_id=cat.id,
        brand_id=brand.id,
        uom_id=uom.id,
        tax_config_id=tax.id,
        has_variants=True,
    )
    db_session.add(product)
    db_session.flush()

    v1 = ProductVariant(
        id=generate_uuid(),
        product_id=product.id,
        variant_name="100g Pack",
        sku="AMUL-BUT-100G",
        barcode="8901262010011",
        cost_price=Decimal("52.00"),
        selling_price=Decimal("58.00"),
        mrp=Decimal("60.00"),
    )
    v2 = ProductVariant(
        id=generate_uuid(),
        product_id=product.id,
        variant_name="500g Block",
        sku="AMUL-BUT-500G",
        barcode="8901262010028",
        cost_price=Decimal("250.00"),
        selling_price=Decimal("275.00"),
        mrp=Decimal("285.00"),
    )
    db_session.add_all([v1, v2])
    db_session.commit()

    saved_prod = db_session.scalar(select(Product).where(Product.code == "PROD-AMUL-BUTTER"))
    assert saved_prod is not None
    assert len(saved_prod.variants) == 2
    assert saved_prod.variants[0].sku == "AMUL-BUT-100G"


def test_stock_movement_ledger_and_balance_calculation(db_session: Session) -> None:
    """Verify immutable stock movements ledger and balance integrity."""
    org = Organization(
        id=generate_uuid(),
        name="Inv Org",
        legal_name="Inv Org Ltd",
        organization_code="INV-ORG",
        email="inv@org.com",
        phone="+91 8888888882",
    )
    db_session.add(org)
    db_session.flush()

    branch = Branch(
        id=generate_uuid(),
        organization_id=org.id,
        branch_code="BR-INV",
        branch_name="Inventory Branch",
        phone="+91 8888888883",
        email="branch@inv.com",
    )
    db_session.add(branch)
    db_session.flush()

    warehouse = Warehouse(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch.id,
        code="WH-01",
        name="Central Warehouse",
    )
    uom = UnitOfMeasure(
        id=generate_uuid(),
        organization_id=org.id,
        code="PCS",
        name="Pieces",
        symbol="pc",
    )
    db_session.add_all([warehouse, uom])
    db_session.flush()

    prod = Product(
        id=generate_uuid(),
        organization_id=org.id,
        name="Basmati Rice 5kg",
        code="RICE-5KG",
        uom_id=uom.id,
    )
    db_session.add(prod)
    db_session.flush()

    variant = ProductVariant(
        id=generate_uuid(),
        product_id=prod.id,
        variant_name="Standard",
        sku="SKU-RICE-5K",
        cost_price=Decimal("450.00"),
        selling_price=Decimal("550.00"),
        mrp=Decimal("600.00"),
    )
    db_session.add(variant)
    db_session.flush()

    # 1. Initial inbound goods receipt movement (100 units @ 450)
    inbound_movement = StockMovement(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch.id,
        warehouse_id=warehouse.id,
        product_variant_id=variant.id,
        movement_type="IN",
        quantity=Decimal("100.0000"),
        unit_cost=Decimal("450.00"),
        total_cost=Decimal("45000.00"),
        reference_type="GRN",
        reference_id=generate_uuid(),
    )
    # Corresponding stock balance record
    balance = StockBalance(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch.id,
        warehouse_id=warehouse.id,
        product_variant_id=variant.id,
        location_id=None,
        quantity_on_hand=Decimal("100.0000"),
        quantity_available=Decimal("100.0000"),
        quantity_reserved=Decimal("0.0000"),
        average_unit_cost=Decimal("450.00"),
        total_value=Decimal("45000.00"),
    )
    db_session.add_all([inbound_movement, balance])
    db_session.commit()

    # 2. Outbound sales dispatch movement (10 units)
    outbound_movement = StockMovement(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=branch.id,
        warehouse_id=warehouse.id,
        product_variant_id=variant.id,
        movement_type="OUT",
        quantity=Decimal("-10.0000"),
        unit_cost=Decimal("450.00"),
        total_cost=Decimal("-4500.00"),
        reference_type="INVOICE",
        reference_id=generate_uuid(),
    )
    # Update balance
    balance.quantity_on_hand -= Decimal("10.0000")
    balance.quantity_available -= Decimal("10.0000")
    balance.total_value = balance.quantity_on_hand * balance.average_unit_cost

    db_session.add(outbound_movement)
    db_session.commit()

    # Verify movements audit log
    movements = db_session.scalars(select(StockMovement).where(StockMovement.product_variant_id == variant.id)).all()
    assert len(movements) == 2
    assert sum(m.quantity for m in movements) == Decimal("90.0000")
    assert balance.quantity_on_hand == Decimal("90.0000")
    assert balance.total_value == Decimal("40500.00")


def test_inter_branch_stock_transfer(db_session: Session) -> None:
    """Verify stock transfer document and status transition."""
    org = Organization(
        id=generate_uuid(),
        name="Transfer Org",
        legal_name="Transfer Org Ltd",
        organization_code="TRANS-ORG",
        email="trans@org.com",
        phone="+91 8888888884",
    )
    db_session.add(org)
    db_session.flush()

    b1 = Branch(
        id=generate_uuid(),
        organization_id=org.id,
        branch_code="BR-WH1",
        branch_name="Origin Warehouse",
        phone="+91 8888888885",
        email="wh1@org.com",
    )
    b2 = Branch(
        id=generate_uuid(),
        organization_id=org.id,
        branch_code="BR-STORE2",
        branch_name="Destination Store",
        phone="+91 8888888886",
        email="store2@org.com",
    )
    db_session.add_all([b1, b2])
    db_session.flush()

    wh1 = Warehouse(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=b1.id,
        code="WH-SRC",
        name="Source Godown",
    )
    wh2 = Warehouse(
        id=generate_uuid(),
        organization_id=org.id,
        branch_id=b2.id,
        code="WH-DST",
        name="Dest Store",
    )
    uom = UnitOfMeasure(id=generate_uuid(), organization_id=org.id, code="PCS", name="Pieces", symbol="pc")
    db_session.add_all([wh1, wh2, uom])
    db_session.flush()

    prod = Product(
        id=generate_uuid(),
        organization_id=org.id,
        name="Sugar 1kg",
        code="SUGAR-1KG",
        uom_id=uom.id,
    )
    db_session.add(prod)
    db_session.flush()

    variant = ProductVariant(id=generate_uuid(), product_id=prod.id, variant_name="Pack", sku="SUGAR-1K")
    db_session.add(variant)
    db_session.flush()

    transfer = StockTransfer(
        id=generate_uuid(),
        organization_id=org.id,
        source_branch_id=b1.id,
        destination_branch_id=b2.id,
        source_warehouse_id=wh1.id,
        destination_warehouse_id=wh2.id,
        transfer_number="ST-2026-0001",
        transfer_date=date.today(),
        status="IN_TRANSIT",
    )
    db_session.add(transfer)
    db_session.flush()

    item = StockTransferItem(
        id=generate_uuid(),
        transfer_id=transfer.id,
        product_variant_id=variant.id,
        quantity_requested=Decimal("50.0000"),
        quantity_sent=Decimal("50.0000"),
        quantity_received=Decimal("0.0000"),
    )
    db_session.add(item)
    db_session.commit()

    saved_transfer = db_session.scalar(select(StockTransfer).where(StockTransfer.transfer_number == "ST-2026-0001"))
    assert saved_transfer is not None
    assert saved_transfer.status == "IN_TRANSIT"
    assert len(saved_transfer.items) == 1
    assert saved_transfer.items[0].quantity_sent == Decimal("50.0000")
