import json
import os
import re
import sys
import uuid
from decimal import Decimal

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import app.models  # Register all models
from app.database.session import SessionLocal
from app.models import (
    Branch,
    BranchProductSetting,
    Customer,
    DeliveryTrip,
    Organization,
    Product,
    ProductBarcode,
    ProductCategory,
    ProductTaxConfiguration,
    ProductVariant,
    StockBalance,
    Supplier,
    UnitOfMeasure,
    Vehicle,
    Warehouse,
)

BACKUP_PATHS = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "PK-Smart-Bazar-FULL-backup-2026-11-21.json")),
    r"c:\Users\sanju\Desktop\ERP\PK-Smart-Bazar-FULL-backup-2026-11-21.json",
    r"c:\Users\sanju\Desktop\PK-Smart-Bazar-FULL-backup-2026-11-21.json",
]
BACKUP_FILE = next((p for p in BACKUP_PATHS if os.path.exists(p)), BACKUP_PATHS[0])


def slugify(text: str) -> str:
    s = re.sub(r"[^\w\s-]", "", text.strip()).strip().lower()
    return re.sub(r"[-\s]+", "_", s)


def seed_backup():
    print("Reading backup file...")
    with open(BACKUP_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    pk3d = json.loads(data["keys"]["pk3d_owner0"])

    db = SessionLocal()
    try:
        # 1. Organization & Branch
        org = db.query(Organization).first()
        if not org:
            org = Organization(
                id=str(uuid.uuid4()),
                name="Siddeshwar Enterprises",
                legal_name="Siddeshwar Enterprises",
                tax_id="29FMEPK5524A1Z8",
                currency="INR",
            )
            db.add(org)
            db.flush()
        else:
            org.name = "Siddeshwar Enterprises"
            org.legal_name = "Siddeshwar Enterprises"
            org.tax_id = "29FMEPK5524A1Z8"
            db.flush()

        branch = db.query(Branch).filter(Branch.organization_id == org.id).first()
        if not branch:
            branch = Branch(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                branch_code="BR-MAIN",
                branch_name="Main Headquarters & Retail Flagship",
                branch_type="RETAIL",
                gstin="29FMEPK5524A1Z8",
                phone="9739396236",
                email="contact@siddeshwar.in",
                address="648/1 Flat No 28, Akashvani Road, Vijayapura, Karnataka, 586101",
                state="Karnataka",
                is_active=True,
            )
            db.add(branch)
            db.flush()

        warehouse = db.query(Warehouse).filter(Warehouse.branch_id == branch.id).first()
        if not warehouse:
            warehouse = Warehouse(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                branch_id=branch.id,
                warehouse_code="WH-MAIN",
                name="Central Godown & Storage",
                is_active=True,
            )
            db.add(warehouse)
            db.flush()

        print(f"Using Org: {org.id}, Branch: {branch.id}, Warehouse: {warehouse.id}")

        # 2. Units of Measure
        uom_map = {}
        standard_uoms = [
            ("Pieces", "PCS", "pcs"),
            ("Kilograms", "KG", "kg"),
            ("Liters", "LTR", "ltr"),
            ("Boxes", "BOX", "box"),
            ("Packets", "PKT", "pkt"),
            ("Bags", "BAG", "bag"),
            ("Grams", "GM", "gm"),
            ("Milliliters", "ML", "ml"),
        ]
        for name, code, symbol in standard_uoms:
            uom = db.query(UnitOfMeasure).filter(
                UnitOfMeasure.organization_id == org.id,
                UnitOfMeasure.code == code,
            ).first()
            if not uom:
                uom = UnitOfMeasure(
                    id=str(uuid.uuid4()),
                    organization_id=org.id,
                    name=name,
                    code=code,
                    symbol=symbol,
                )
                db.add(uom)
                db.flush()
            uom_map[code] = uom.id
        default_uom_id = uom_map["PCS"]

        # 3. Tax Configurations (from hsn)
        tax_map = {}  # hsn -> tax_id
        hsn_list = pk3d.get("hsn", [])
        for h in hsn_list:
            code = str(h.get("code", "")).strip()
            if not code:
                continue
            gst_pct = Decimal(str(h.get("gst", 0)))
            rate = gst_pct / Decimal(100)
            half_rate = rate / Decimal(2)
            desc = h.get("desc") or f"GST {gst_pct}%"

            tax = db.query(ProductTaxConfiguration).filter(
                ProductTaxConfiguration.organization_id == org.id,
                ProductTaxConfiguration.hsn_sac_code == code,
            ).first()
            if not tax:
                tax = ProductTaxConfiguration(
                    id=str(uuid.uuid4()),
                    organization_id=org.id,
                    hsn_sac_code=code,
                    tax_rate=rate,
                    cgst_rate=half_rate,
                    sgst_rate=half_rate,
                    igst_rate=rate,
                    description=desc,
                )
                db.add(tax)
                db.flush()
            tax_map[code] = tax.id

        # Standard default tax (GST 5% and GST 0%)
        def_tax = db.query(ProductTaxConfiguration).filter(
            ProductTaxConfiguration.organization_id == org.id,
            ProductTaxConfiguration.hsn_sac_code == "DEFAULT05",
        ).first()
        if not def_tax:
            def_tax = ProductTaxConfiguration(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                hsn_sac_code="DEFAULT05",
                tax_rate=Decimal("0.05"),
                cgst_rate=Decimal("0.025"),
                sgst_rate=Decimal("0.025"),
                igst_rate=Decimal("0.05"),
                description="Standard GST 5%",
            )
            db.add(def_tax)
            db.flush()
        tax_map["DEFAULT_5"] = def_tax.id

        # 4. Product Categories (catImg + skus) - Deduplicate case-insensitively
        cat_map = {}  # cat_name.lower() -> cat_id
        cat_imgs = pk3d.get("catImg", {})
        # Map normalized lowercase -> canonical name
        normalized_cats = {}
        for c in cat_imgs.keys():
            normalized_cats[c.strip().lower()] = c.strip()

        skus = pk3d.get("skus", [])
        for s in skus:
            cat = s.get("cat")
            if cat and cat.strip():
                c_clean = cat.strip()
                if c_clean.lower() not in normalized_cats:
                    normalized_cats[c_clean.lower()] = c_clean

        order_idx = 0
        for norm_name, canon_name in sorted(normalized_cats.items(), key=lambda x: x[1]):
            code = slugify(canon_name).upper()[:50]
            # Get image (check canonical or upper/lower)
            img_data = cat_imgs.get(canon_name) or cat_imgs.get(canon_name.upper()) or cat_imgs.get(canon_name.title())

            cat = db.query(ProductCategory).filter(
                ProductCategory.organization_id == org.id,
                (ProductCategory.code == code) | (ProductCategory.name.ilike(canon_name)),
            ).first()

            if not cat:
                cat = ProductCategory(
                    id=str(uuid.uuid4()),
                    organization_id=org.id,
                    name=canon_name,
                    code=code,
                    description=f"{canon_name} Category",
                    image_url=img_data,
                    sort_order=order_idx,
                    is_active=True,
                )
                db.add(cat)
                db.flush()
            else:
                if img_data and not cat.image_url:
                    cat.image_url = img_data
                cat.is_active = True
                cat.sort_order = order_idx

            cat_map[norm_name] = cat.id
            order_idx += 1

        print(f"Loaded {len(cat_map)} categories, {len(tax_map)} tax configurations, {len(uom_map)} UOMs.")

        # 5. SKUs / Products
        seeded_products = 0
        for idx, s in enumerate(skus):
            sku_id = str(s.get("id"))
            p_name = s.get("name", "").strip() or f"Product {sku_id}"
            p_code = f"SKU-{sku_id[-8:]}" if len(sku_id) >= 8 else f"PROD-{idx+1:04d}"
            display_name = s.get("kn") or p_name
            cat_name = (s.get("cat") or "").strip().lower()
            cat_id = cat_map.get(cat_name)
            hsn_code = str(s.get("hsn") or "").strip()
            tax_id = tax_map.get(hsn_code, tax_map.get("DEFAULT_5"))

            # Determine UOM
            uom_id = default_uom_id
            name_lower = p_name.lower()
            if "50kg" in name_lower or "25kg" in name_lower or "bag" in name_lower:
                uom_id = uom_map.get("BAG", default_uom_id)
            elif "kg" in name_lower:
                uom_id = uom_map.get("KG", default_uom_id)
            elif "ltr" in name_lower or "liter" in name_lower:
                uom_id = uom_map.get("LTR", default_uom_id)
            elif "box" in name_lower:
                uom_id = uom_map.get("BOX", default_uom_id)
            elif "pkt" in name_lower or "packet" in name_lower:
                uom_id = uom_map.get("PKT", default_uom_id)

            cost = Decimal(str(s.get("cost") or 0.0))
            price = Decimal(str(s.get("price") or 0.0))
            mrp = Decimal(str(s.get("mrp") or price))
            if mrp < price:
                mrp = price
            wholesale = Decimal(str(round(float(cost) * 1.05, 2))) if cost > 0 else price
            if wholesale > price:
                wholesale = price
            min_price = cost
            stock_qty = Decimal(str(s.get("stock") or 0))
            min_stock = Decimal(str(s.get("min") or 5))

            # Product record
            prod = db.query(Product).filter(
                Product.organization_id == org.id,
                (Product.name == p_name) | (Product.code == p_code),
            ).first()

            if not prod:
                prod = Product(
                    id=str(uuid.uuid4()),
                    organization_id=org.id,
                    name=p_name,
                    code=p_code,
                    display_name=display_name,
                    category_id=cat_id,
                    uom_id=uom_id,
                    tax_config_id=tax_id,
                    image_url=s.get("img"),
                    description=f"{p_name} - Retail and Wholesale Master Catalog",
                    is_saleable=True,
                    is_purchasable=True,
                    is_inventory_tracked=True,
                    is_perishable=any(w in name_lower for w in ["oil", "rice", "flour", "atta", "sugar", "milk", "biscuit"]),
                    is_batch_tracked=bool(s.get("bt")),
                    is_expiry_tracked=True,
                    has_variants=True,
                    is_active=True,
                )
                db.add(prod)
                db.flush()
            else:
                prod.display_name = display_name
                if cat_id:
                    prod.category_id = cat_id
                if tax_id:
                    prod.tax_config_id = tax_id
                if s.get("img"):
                    prod.image_url = s.get("img")

            # Product Variant
            variant = db.query(ProductVariant).filter(
                ProductVariant.product_id == prod.id,
            ).first()

            if not variant:
                variant = ProductVariant(
                    id=str(uuid.uuid4()),
                    product_id=prod.id,
                    variant_name="Standard",
                    sku=p_code,
                    barcode=sku_id,
                    cost_price=cost,
                    selling_price=price,
                    mrp=mrp,
                    wholesale_price=wholesale,
                    min_selling_price=min_price,
                    is_active=True,
                )
                db.add(variant)
                db.flush()
            else:
                variant.cost_price = cost
                variant.selling_price = price
                variant.mrp = mrp
                variant.wholesale_price = wholesale
                variant.min_selling_price = min_price
                if not variant.barcode:
                    variant.barcode = sku_id

            # Alternate barcode if needed
            if sku_id != variant.barcode:
                alt_bc = db.query(ProductBarcode).filter(
                    ProductBarcode.product_variant_id == variant.id,
                    ProductBarcode.barcode == sku_id,
                ).first()
                if not alt_bc:
                    alt_bc = ProductBarcode(
                        id=str(uuid.uuid4()),
                        product_variant_id=variant.id,
                        barcode=sku_id,
                        barcode_type="CODE128",
                    )
                    db.add(alt_bc)

            # Stock Balance in Warehouse
            stock_bal = db.query(StockBalance).filter(
                StockBalance.warehouse_id == warehouse.id,
                StockBalance.product_variant_id == variant.id,
            ).first()

            if not stock_bal:
                stock_bal = StockBalance(
                    id=str(uuid.uuid4()),
                    organization_id=org.id,
                    warehouse_id=warehouse.id,
                    branch_id=branch.id,
                    product_variant_id=variant.id,
                    quantity_on_hand=stock_qty,
                    quantity_reserved=Decimal("0.0000"),
                )
                db.add(stock_bal)
            else:
                stock_bal.quantity_on_hand = stock_qty

            # Branch Product Setting
            setting = db.query(BranchProductSetting).filter(
                BranchProductSetting.branch_id == branch.id,
                BranchProductSetting.product_variant_id == variant.id,
            ).first()

            if not setting:
                setting = BranchProductSetting(
                    id=str(uuid.uuid4()),
                    organization_id=org.id,
                    branch_id=branch.id,
                    product_variant_id=variant.id,
                    is_available=True,
                    branch_selling_price=price,
                    branch_min_stock=min_stock,
                    branch_reorder_level=min_stock,
                )
                db.add(setting)
            else:
                setting.branch_selling_price = price
                setting.branch_min_stock = min_stock

            seeded_products += 1

        db.commit()
        print(f"Successfully seeded {seeded_products} master products with stock, pricing, and branch settings!")

        # 6. Customers (all 2,169 from cust)
        cust_list = pk3d.get("cust", [])
        seeded_customers = 0
        existing_phones = set(
            row[0] for row in db.query(Customer.phone).filter(Customer.organization_id == org.id).all() if row[0]
        )
        existing_codes = set(
            row[0] for row in db.query(Customer.customer_code).filter(Customer.organization_id == org.id).all() if row[0]
        )
        for idx, c in enumerate(cust_list):
            c_name = (c.get("name") or "").strip() or f"Customer {idx+1}"
            shop = (c.get("shop") or "").strip()
            display = f"{shop} - {c_name}" if shop and shop != c_name else c_name
            phone = str(c.get("ph") or "").strip()
            if not phone:
                phone = f"90000{idx:05d}"
            code = f"CUST-{idx+1:05d}"

            if phone not in existing_phones and code not in existing_codes:
                new_c = Customer(
                    id=str(uuid.uuid4()),
                    organization_id=org.id,
                    first_name=c_name.split()[0] if c_name else "Kirana",
                    last_name=" ".join(c_name.split()[1:]) if len(c_name.split()) > 1 else "Store",
                    display_name=display,
                    company_name=shop or display,
                    customer_code=code,
                    phone=phone,
                    email=f"kirana_{idx+1}@siddeshwar.local",
                    gstin=c.get("gstin") or None,
                    credit_limit=Decimal("50000.00"),
                    current_balance=Decimal("0.00"),
                    is_active=True,
                )
                db.add(new_c)
                existing_phones.add(phone)
                existing_codes.add(code)
                seeded_customers += 1

            if seeded_customers % 500 == 0 and seeded_customers > 0:
                db.flush()
                print(f"  Flushed {seeded_customers} customers...")

        db.commit()
        print(f"Successfully ingested {seeded_customers} Kirana retail store customers!")

        # 7. Vendors (all 14 from ven)
        ven_list = pk3d.get("ven", [])
        seeded_vendors = 0
        for idx, v in enumerate(ven_list):
            v_name = (v.get("name") or "").strip()
            if not v_name:
                continue
            code = f"VEN-{idx+1:03d}"
            phone = str(v.get("ph") or f"98800{idx:05d}").strip()

            existing_ven = db.query(Supplier).filter(
                Supplier.organization_id == org.id,
                Supplier.company_name == v_name,
            ).first()

            if not existing_ven:
                new_ven = Supplier(
                    id=str(uuid.uuid4()),
                    organization_id=org.id,
                    supplier_code=code,
                    company_name=v_name,
                    phone=phone,
                    gstin=v.get("gstin") or None,
                    pan=v.get("pan") or None,
                    payment_terms_days=30,
                    opening_balance=Decimal("0.00"),
                    current_balance=Decimal("0.00"),
                    is_active=True,
                )
                db.add(new_ven)
                seeded_vendors += 1

        db.commit()
        print(f"Successfully ingested {seeded_vendors} wholesale FMCG suppliers/vendors!")

        # 8. Vehicles & Delivery Trips (from veh & trips)
        veh_list = pk3d.get("veh", [])
        seeded_vehs = {}
        for idx, v in enumerate(veh_list):
            v_no = str(v.get("no") or f"KA-28-V-{idx+1:04d}").strip().upper()
            veh_rec = db.query(Vehicle).filter(
                Vehicle.organization_id == org.id,
                Vehicle.vehicle_number == v_no,
            ).first()
            if not veh_rec:
                veh_rec = Vehicle(
                    id=str(uuid.uuid4()),
                    organization_id=org.id,
                    branch_id=branch.id,
                    vehicle_number=v_no,
                    make=v.get("own") or "Tata",
                    model=v.get("model") or "Ace Super Light Truck",
                    vehicle_type="DELIVERY_VAN",
                    status="AVAILABLE",
                    is_active=True,
                )
                db.add(veh_rec)
                db.flush()
            seeded_vehs[str(v.get("id"))] = veh_rec.id

        # Fallback default vehicle
        default_veh = db.query(Vehicle).filter(Vehicle.organization_id == org.id).first()
        if not default_veh:
            default_veh = Vehicle(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                branch_id=branch.id,
                vehicle_number="KA-28-TR-1001",
                make="Tata Motors",
                model="Tata Ace Gold Super",
                vehicle_type="DELIVERY_VAN",
                status="AVAILABLE",
                is_active=True,
            )
            db.add(default_veh)
            db.flush()
        default_veh_id = default_veh.id

        trip_list = pk3d.get("trips", [])
        seeded_trips = 0
        for t in trip_list:
            trip_no = f"TRIP-{t.get('id', seeded_trips+1)}"
            existing_t = db.query(DeliveryTrip).filter(
                DeliveryTrip.branch_id == branch.id,
                DeliveryTrip.trip_number == trip_no,
            ).first()

            if not existing_t:
                status_val = "COMPLETED" if t.get("st") == "done" else "SCHEDULED"
                target_veh_id = seeded_vehs.get(str(t.get("veh")), default_veh_id)
                new_t = DeliveryTrip(
                    id=str(uuid.uuid4()),
                    organization_id=org.id,
                    branch_id=branch.id,
                    vehicle_id=target_veh_id,
                    trip_number=trip_no,
                    trip_date=t.get("date") or "2026-11-20",
                    route_name="Vijayapura Rural & Retail Route",
                    status=status_val,
                    total_stops=len(t.get("ords", [])) or 1,
                    fuel_expense=Decimal(str(t.get("cost") or 0.0)),
                    driver_allowance=Decimal(str(t.get("rent") or 0.0)),
                    notes=f"Vehicle run: {t.get('veh')}",
                )
                db.add(new_t)
                seeded_trips += 1

        db.commit()
        print(f"Successfully ingested {len(seeded_vehs)} fleet vehicles and {seeded_trips} delivery trips!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_backup()
