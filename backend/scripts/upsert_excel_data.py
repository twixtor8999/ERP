"""Upsert Customers_N_Export_2026-11-28.xlsx and SKUs_with_Kannada_2026-11-28.xlsx into Railway PostgreSQL."""
from __future__ import annotations

import uuid
import zipfile
import xml.etree.ElementTree as ET
from decimal import Decimal
from pathlib import Path

from sqlalchemy import func, select

from app.database.session import SessionLocal
from app.models import (
    Branch,
    Customer,
    CustomerAddress,
    Organization,
    Product,
    ProductCategory,
    ProductTaxConfiguration,
    ProductVariant,
    StockBalance,
    UnitOfMeasure,
    Warehouse,
)


def read_xlsx_rows(xlsx_path: Path) -> list[dict[str, str]]:
    """Read first worksheet of an .xlsx file into a list of dicts keyed by header."""
    ns_uri = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    ns = {"s": ns_uri}
    with zipfile.ZipFile(xlsx_path) as z:
        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" in z.namelist():
            ss_root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in ss_root.findall("s:si", ns):
                shared_strings.append("".join(t.text or "" for t in si.iter(f"{{{ns_uri}}}t")))

        sheet_root = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
        raw_rows: list[list[str]] = []
        for row in sheet_root.findall(".//s:sheetData/s:row", ns):
            vals: list[str] = []
            for c in row.findall("s:c", ns):
                cell_type = c.attrib.get("t")
                v_el = c.find("s:v", ns)
                if v_el is None or v_el.text is None:
                    vals.append("")
                elif cell_type == "s":
                    vals.append(shared_strings[int(v_el.text)])
                else:
                    vals.append(v_el.text)
            raw_rows.append(vals)

    if not raw_rows:
        return []
    headers = [h.strip() for h in raw_rows[0]]
    out: list[dict[str, str]] = []
    for row_vals in raw_rows[1:]:
        if not any(str(x).strip() for x in row_vals):
            continue
        padded = row_vals + [""] * max(0, len(headers) - len(row_vals))
        out.append({headers[i]: str(padded[i]).strip() for i in range(len(headers))})
    return out


def norm(val: str | None) -> str:
    return " ".join((val or "").strip().lower().split())


def main() -> None:
    root_dir = Path(__file__).resolve().parents[2]
    cust_xlsx = root_dir / "Customers_N_Export_2026-11-28.xlsx"
    sku_xlsx = root_dir / "SKUs_with_Kannada_2026-11-28.xlsx"

    db = SessionLocal()
    try:
        org = db.scalar(select(Organization).limit(1))
        if not org:
            raise RuntimeError("No Organization found in database")
        org_id = org.id

        branch = db.scalar(select(Branch).where(Branch.organization_id == org_id).limit(1))
        warehouse = db.scalar(select(Warehouse).where(Warehouse.organization_id == org_id).limit(1))
        default_uom = db.scalar(select(UnitOfMeasure).where(UnitOfMeasure.code == "PCS").limit(1)) or db.scalar(select(UnitOfMeasure).limit(1))

        # ------------------------------------------------------------------
        # 1. UPSERT CUSTOMERS
        # ------------------------------------------------------------------
        existing_customers = db.scalars(
            select(Customer).where(Customer.organization_id == org_id)
        ).all()
        cust_by_disp: dict[str, Customer] = {}
        cust_by_name_shop: dict[tuple[str, str], Customer] = {}
        cust_by_first: dict[str, Customer] = {}
        for c in existing_customers:
            if c.display_name:
                cust_by_disp[norm(c.display_name)] = c
            cust_by_name_shop[(norm(c.first_name), norm(c.company_name))] = c
            if c.first_name:
                cust_by_first[norm(c.first_name)] = c

        existing_addrs = {
            a.customer_id: a
            for a in db.scalars(
                select(CustomerAddress).join(Customer).where(Customer.organization_id == org_id)
            ).all()
        }

        cust_count_seq = len(existing_customers)
        cust_rows = read_xlsx_rows(cust_xlsx)
        cust_inserted = 0
        cust_updated = 0

        for row in cust_rows:
            c_name = row.get("Customer Name", "").strip()
            shop_name = row.get("Shop Name", "").strip()
            kannada_name = row.get("ಹೆಸರು (Kannada)", "").strip()
            landmark = row.get("Landmark", "").strip()
            village = row.get("Village", "").strip()
            kannada_village = row.get("ಹಳ್ಳಿ (Kannada)", "").strip()
            taluka = row.get("Taluka", "").strip() or "Vijayapura"
            route = row.get("Route", "").strip()
            pincode = row.get("Pincode", "").strip()
            gstin = row.get("GSTIN", "").strip()

            if not c_name and not shop_name:
                continue

            disp_name = f"{shop_name} - {c_name}" if shop_name and c_name and norm(shop_name) != norm(c_name) else (shop_name or c_name)
            match = (
                cust_by_name_shop.get((norm(c_name), norm(shop_name)))
                or cust_by_disp.get(norm(disp_name))
                or cust_by_first.get(norm(c_name))
            )

            city_val = route or taluka or "Vijayapura"
            addr_line1 = village or "Bijapur (Rural)"
            addr_line2 = landmark or village or "Nil"

            if match:
                match.company_name = shop_name or match.company_name or c_name
                if c_name:
                    match.first_name = c_name
                match.display_name = disp_name
                if gstin:
                    match.gstin = gstin
                match.is_active = True
                cust_updated += 1

                addr = existing_addrs.get(match.id)
                if addr:
                    addr.address_line1 = addr_line1
                    addr.address_line2 = addr_line2
                    addr.landmark = landmark or addr.landmark
                    addr.city = city_val
                    addr.state = "Karnataka"
                    if pincode:
                        addr.postal_code = pincode
                else:
                    new_addr = CustomerAddress(
                        id=str(uuid.uuid4()),
                        customer_id=match.id,
                        address_type="BILLING",
                        recipient_name=c_name or shop_name,
                        phone=match.phone or "",
                        address_line1=addr_line1,
                        address_line2=addr_line2,
                        landmark=landmark or None,
                        city=city_val,
                        state="Karnataka",
                        postal_code=pincode or None,
                        country="India",
                        is_default=True,
                    )
                    db.add(new_addr)
                    existing_addrs[match.id] = new_addr
            else:
                cust_count_seq += 1
                cust_code = f"CUST-{cust_count_seq:05d}"
                new_cust = Customer(
                    id=str(uuid.uuid4()),
                    organization_id=org_id,
                    customer_code=cust_code,
                    customer_type="RETAIL",
                    company_name=shop_name or c_name,
                    first_name=c_name or shop_name,
                    last_name=kannada_name or None,
                    display_name=disp_name,
                    phone="",
                    email=None,
                    gstin=gstin or None,
                    credit_limit=Decimal("50000.00"),
                    current_balance=Decimal("0.00"),
                    is_active=True,
                )
                db.add(new_cust)
                db.flush()
                new_addr = CustomerAddress(
                    id=str(uuid.uuid4()),
                    customer_id=new_cust.id,
                    address_type="BILLING",
                    recipient_name=c_name or shop_name,
                    phone="",
                    address_line1=addr_line1,
                    address_line2=addr_line2,
                    landmark=landmark or None,
                    city=city_val,
                    state="Karnataka",
                    postal_code=pincode or None,
                    country="India",
                    is_default=True,
                )
                db.add(new_addr)
                cust_by_disp[norm(disp_name)] = new_cust
                cust_by_name_shop[(norm(c_name), norm(shop_name))] = new_cust
                cust_by_first[norm(c_name)] = new_cust
                existing_addrs[new_cust.id] = new_addr
                cust_inserted += 1

        # ------------------------------------------------------------------
        # 2. UPSERT SKUS (PRODUCTS + VARIANTS + STOCK BALANCES)
        # ------------------------------------------------------------------
        categories = {
            norm(cat.name): cat
            for cat in db.scalars(select(ProductCategory).where(ProductCategory.organization_id == org_id)).all()
        }
        tax_configs = db.scalars(select(ProductTaxConfiguration)).all()
        tax_by_rate: dict[int, ProductTaxConfiguration] = {}
        for tc in tax_configs:
            rate_val = getattr(tc, "rate", None) or getattr(tc, "cgst_rate", 0) + getattr(tc, "sgst_rate", 0)
            try:
                tax_by_rate[int(round(float(rate_val)))] = tc
            except Exception:
                pass

        existing_products = db.scalars(select(Product).where(Product.organization_id == org_id)).all()
        prod_by_name: dict[str, Product] = {norm(p.name): p for p in existing_products}
        existing_variants = {
            v.product_id: v
            for v in db.scalars(select(ProductVariant).join(Product).where(Product.organization_id == org_id)).all()
        }
        existing_stocks = {
            sb.product_variant_id: sb
            for sb in db.scalars(select(StockBalance).where(StockBalance.organization_id == org_id)).all()
        }

        sku_rows = read_xlsx_rows(sku_xlsx)
        sku_inserted = 0
        sku_updated = 0
        prod_seq = len(existing_products)

        for row in sku_rows:
            sku_name = row.get("SKU Name", "").strip()
            kannada_name = row.get("ಹೆಸರು (Kannada)", "").strip()
            cat_name = row.get("Category", "").strip() or "Grocery"
            gst_pct = int(round(float(row.get("GST %", "5") or 5)))
            grn_price = Decimal(str(round(float(row.get("GRN Price (incl. GST)", "0") or 0), 2)))
            sell_price = Decimal(str(round(float(row.get("Selling Price (incl. GST)", "0") or 0), 2)))
            curr_stock = Decimal(str(round(float(row.get("Current Stock", "0") or 0), 4)))

            if not sku_name:
                continue

            cat_obj = categories.get(norm(cat_name))
            if not cat_obj:
                cat_obj = ProductCategory(
                    id=str(uuid.uuid4()),
                    organization_id=org_id,
                    name=cat_name,
                    code=cat_name[:12].upper().replace(" ", "_"),
                    is_active=True,
                )
                db.add(cat_obj)
                db.flush()
                categories[norm(cat_name)] = cat_obj

            tax_obj = tax_by_rate.get(gst_pct)

            prod = prod_by_name.get(norm(sku_name))
            if prod:
                prod.name = sku_name
                if kannada_name:
                    prod.display_name = kannada_name
                prod.category_id = cat_obj.id
                if tax_obj:
                    prod.tax_config_id = tax_obj.id
                prod.is_active = True
                prod.is_saleable = True
                prod.is_purchasable = True
                prod.is_inventory_tracked = True
                sku_updated += 1

                var = existing_variants.get(prod.id)
                if var:
                    if grn_price > 0:
                        var.cost_price = grn_price
                    if sell_price > 0:
                        var.selling_price = sell_price
                        var.wholesale_price = sell_price
                        var.mrp = sell_price
                    var.is_active = True
                else:
                    var = ProductVariant(
                        id=str(uuid.uuid4()),
                        product_id=prod.id,
                        variant_name="Standard",
                        sku=prod.code,
                        cost_price=grn_price,
                        selling_price=sell_price,
                        wholesale_price=sell_price,
                        mrp=sell_price,
                        is_active=True,
                    )
                    db.add(var)
                    db.flush()
                    existing_variants[prod.id] = var

                if var.id not in existing_stocks and branch and warehouse:
                    sb = StockBalance(
                        id=str(uuid.uuid4()),
                        organization_id=org_id,
                        branch_id=branch.id,
                        warehouse_id=warehouse.id,
                        product_variant_id=var.id,
                        quantity_on_hand=curr_stock,
                        quantity_reserved=Decimal("0.0000"),
                        quantity_available=curr_stock,
                        average_unit_cost=grn_price,
                        total_value=(curr_stock * grn_price),
                    )
                    db.add(sb)
                    existing_stocks[var.id] = sb
            else:
                prod_seq += 1
                sku_code = f"SKU-{15418000 + prod_seq}"
                prod = Product(
                    id=str(uuid.uuid4()),
                    organization_id=org_id,
                    name=sku_name,
                    code=sku_code,
                    category_id=cat_obj.id,
                    uom_id=default_uom.id if default_uom else None,
                    tax_config_id=tax_obj.id if tax_obj else None,
                    display_name=kannada_name or sku_name,
                    description=f"{sku_name} - Retail and Wholesale Master Catalog",
                    is_saleable=True,
                    is_purchasable=True,
                    is_inventory_tracked=True,
                    is_active=True,
                )
                db.add(prod)
                db.flush()
                prod_by_name[norm(sku_name)] = prod

                var = ProductVariant(
                    id=str(uuid.uuid4()),
                    product_id=prod.id,
                    variant_name="Standard",
                    sku=sku_code,
                    cost_price=grn_price,
                    selling_price=sell_price,
                    wholesale_price=sell_price,
                    mrp=sell_price,
                    is_active=True,
                )
                db.add(var)
                db.flush()
                existing_variants[prod.id] = var

                if branch and warehouse:
                    sb = StockBalance(
                        id=str(uuid.uuid4()),
                        organization_id=org_id,
                        branch_id=branch.id,
                        warehouse_id=warehouse.id,
                        product_variant_id=var.id,
                        quantity_on_hand=curr_stock,
                        quantity_reserved=Decimal("0.0000"),
                        quantity_available=curr_stock,
                        average_unit_cost=grn_price,
                        total_value=(curr_stock * grn_price),
                    )
                    db.add(sb)
                    existing_stocks[var.id] = sb
                sku_inserted += 1

        db.commit()
        total_cust = db.scalar(select(func.count(Customer.id)).where(Customer.organization_id == org_id))
        total_prod = db.scalar(select(func.count(Product.id)).where(Product.organization_id == org_id))
        print(f"Customers: updated={cust_updated}, inserted={cust_inserted}, total_in_db={total_cust}")
        print(f"SKUs: updated={sku_updated}, inserted={sku_inserted}, total_in_db={total_prod}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
