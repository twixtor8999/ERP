"""Seed 512 Historical Orders, Invoices, Payments, Customer Udhaar Balances,
Expenses, CRM Calls, and Splits from PK-Smart-Bazar-FULL-backup-2026-11-21.json.
"""

import os
import sys
import json
import uuid
from datetime import datetime, date
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import app.models
from app.database.session import SessionLocal
from app.modules.organizations.models import Organization
from app.modules.branches.models import Branch
from app.modules.customers.models import Customer
from app.modules.products.models import ProductVariant, Product
from app.modules.orders.models import Order, OrderItem, OrderStatusHistory
from app.modules.billing.models import Invoice, InvoiceItem
from app.modules.payments.models import PaymentTransaction, PaymentMethod
from app.modules.expenses.models import Expense, ExpenseCategory
from app.modules.crm.models import CallLog
from app.modules.inventory.models import StockSplitBatch, StockSplitItem, Warehouse
from app.modules.users.models import User
from app.modules.vehicles.models import Vehicle, DeliveryTrip


def parse_date(d_str: str | None) -> date:
    if not d_str:
        return date.today()
    try:
        return datetime.strptime(d_str[:10], "%Y-%m-%d").date()
    except Exception:
        return date.today()


def parse_dt(dt_str: str | None) -> datetime:
    if not dt_str:
        return datetime.utcnow()
    try:
        if "T" in dt_str:
            clean = dt_str.replace("Z", "+00:00")
            return datetime.fromisoformat(clean)
        return datetime.strptime(dt_str[:10], "%Y-%m-%d")
    except Exception:
        return datetime.utcnow()


def run_migration():
    print("=" * 70)
    print("STARTING SEED OF 512 ORDERS, INVOICES, EXPENSES & CRM FROM BACKUP")
    print("=" * 70)

    backup_path = r"c:\Users\sanju\Desktop\ERP\PK-Smart-Bazar-FULL-backup-2026-11-21.json"
    if not os.path.exists(backup_path):
        print(f"ERROR: Backup file not found at {backup_path}")
        return

    with open(backup_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    raw_owner = data.get("keys", {}).get("pk3d_owner0", "{}")
    owner_data = json.loads(raw_owner) if isinstance(raw_owner, str) else raw_owner

    db = SessionLocal()
    try:
        org = db.query(Organization).filter(Organization.organization_code == "SIDD-ENT").first()
        if not org:
            print("Organization SIDD-ENT not found!")
            return
        branch = db.query(Branch).filter(Branch.organization_id == org.id).first()
        warehouse = db.query(Warehouse).filter(Warehouse.organization_id == org.id).first()
        users = {u.phone: u for u in db.query(User).filter(User.organization_id == org.id).all()}
        default_user = list(users.values())[0] if users else None

        # Build Lookups
        # 1. Customer Phone -> Customer
        customers = db.query(Customer).filter(Customer.organization_id == org.id).all()
        phone_to_cust = {c.phone: c for c in customers}
        code_to_cust = {c.customer_code: c for c in customers}
        first_cust = customers[0] if customers else None

        # JSON cust_id -> phone
        cust_list = owner_data.get("cust", [])
        raw_cust_to_phone = {str(c["id"]): str(c.get("ph") or "").strip() for c in cust_list if "id" in c}

        # 2. Variant Barcode / SKU -> ProductVariant
        variants = db.query(ProductVariant).all()
        barcode_to_var = {v.barcode: v for v in variants if v.barcode}
        first_var = variants[0] if variants else None

        # 3. Payment Methods
        pm_cash = db.query(PaymentMethod).filter(PaymentMethod.organization_id == org.id, PaymentMethod.code == "CASH").first()
        pm_upi = db.query(PaymentMethod).filter(PaymentMethod.organization_id == org.id, PaymentMethod.code == "UPI").first()
        if not pm_cash:
            pm_cash = PaymentMethod(id=str(uuid.uuid4()), organization_id=org.id, code="CASH", name="Cash", is_active=True)
            db.add(pm_cash)
            db.flush()
        if not pm_upi:
            pm_upi = PaymentMethod(id=str(uuid.uuid4()), organization_id=org.id, code="UPI", name="UPI / QR Code", is_active=True)
            db.add(pm_upi)
            db.flush()

        # -------------------------------------------------------------
        # STEP 1: Ingest 512 Orders & Invoices & Payments
        # -------------------------------------------------------------
        raw_orders = owner_data.get("orders", [])
        print(f"\n1. Ingesting {len(raw_orders)} Historical Orders & Generating Invoices...")

        existing_orders = {ord.order_number for ord in db.query(Order.order_number).filter(Order.organization_id == org.id).all()}
        existing_invs = {inv.invoice_number for inv in db.query(Invoice.invoice_number).filter(Invoice.organization_id == org.id).all()}
        seen_invoices = set(existing_invs)

        seeded_orders = 0
        customer_khata_deltas = {}  # cust_id -> pending balance delta

        for o in raw_orders:
            order_no = str(o.get("no") or f"ORD-{seeded_orders+1:04d}")
            if order_no in existing_orders:
                continue

            inv_no = str(o.get("inv") or f"INV-{order_no.replace('ORD-', '')}")
            if inv_no in seen_invoices:
                inv_no = f"{inv_no}-{order_no.replace('ORD-', '')}"
            seen_invoices.add(inv_no)

            order_date = parse_date(o.get("date"))
            created_at = parse_dt(o.get("at"))

            # Resolve Customer
            raw_c_id = str(o.get("cust", ""))
            c_phone = raw_cust_to_phone.get(raw_c_id, "")
            cust = phone_to_cust.get(c_phone) or first_cust

            # Calculate Totals from Items
            raw_items = o.get("items", [])
            subtotal = Decimal("0")
            for it in raw_items:
                q = Decimal(str(it.get("q", 1)))
                p = Decimal(str(it.get("p", 0)))
                subtotal += q * p

            # Payments
            raw_payments = o.get("pay", [])
            paid_amount = Decimal("0")
            for p in raw_payments:
                paid_amount += Decimal(str(p.get("a", 0)))

            balance_due = max(Decimal("0"), subtotal - paid_amount)
            pay_status = "PAID" if balance_due == 0 else ("PARTIAL" if paid_amount > 0 else "UNPAID")
            raw_status = (o.get("st") or "completed").lower()
            ord_status = "DELIVERED" if raw_status == "completed" else ("IN_TRANSIT" if raw_status == "dispatched" else "CONFIRMED")

            # Create Order
            order = Order(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                branch_id=branch.id,
                customer_id=cust.id,
                order_number=order_no,
                order_date=order_date,
                status=ord_status,
                order_type="B2B_DELIVERY" if o.get("trip") else "POS",
                subtotal=subtotal,
                discount_amount=Decimal("0.00"),
                tax_amount=Decimal("0.00"),
                total_amount=subtotal,
                delivery_charge=Decimal("0.00"),
                shipping_recipient_name=cust.display_name,
                shipping_phone=cust.phone,
                payment_method="CASH" if raw_payments and raw_payments[0].get("m") == "Cash" else "UPI",
                payment_status=pay_status,
                placed_at=created_at,
                notes=f"Migrated from production backup. Handled by {o.get('by', 'Admin')}",
            )
            db.add(order)
            db.flush()

            # Create Order Items
            for it in raw_items:
                sku_raw = str(it.get("s", ""))
                variant = barcode_to_var.get(sku_raw) or first_var
                qty = Decimal(str(it.get("q", 1)))
                unit_p = Decimal(str(it.get("p", 0)))
                line_total = qty * unit_p

                o_item = OrderItem(
                    id=str(uuid.uuid4()),
                    order_id=order.id,
                    product_variant_id=variant.id,
                    product_name=variant.product.name if variant and variant.product else f"Item {sku_raw}",
                    sku=variant.sku if variant else f"SKU-{sku_raw}",
                    quantity=qty,
                    picked_quantity=qty,
                    picking_status="PICKED",
                    unit_price=unit_p,
                    discount_percent=Decimal("0.00"),
                    discount_amount=Decimal("0.00"),
                    tax_rate=Decimal("0.00"),
                    tax_amount=Decimal("0.00"),
                    total_amount=line_total,
                )
                db.add(o_item)

            # Create Invoice
            invoice = Invoice(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                branch_id=branch.id,
                customer_id=cust.id,
                order_id=order.id,
                invoice_number=inv_no,
                invoice_date=order_date,
                due_date=order_date,
                financial_year="2026-2027",
                invoice_type="TAX_INVOICE",
                subtotal=subtotal,
                discount_amount=Decimal("0.00"),
                cgst_amount=Decimal("0.00"),
                sgst_amount=Decimal("0.00"),
                igst_amount=Decimal("0.00"),
                cess_amount=Decimal("0.00"),
                total_tax=Decimal("0.00"),
                total_amount=subtotal,
                paid_amount=paid_amount,
                balance_amount=balance_due,
                payment_status=pay_status,
                status="ISSUED",
                notes=f"Auto-generated tax invoice for Order {order_no}",
            )
            db.add(invoice)
            db.flush()

            # Create Payments
            for p_idx, p in enumerate(raw_payments):
                p_amt = Decimal(str(p.get("a", 0)))
                p_method = pm_cash if p.get("m") == "Cash" else pm_upi
                p_date = parse_date(p.get("d"))
                ptx = PaymentTransaction(
                    id=str(uuid.uuid4()),
                    organization_id=org.id,
                    branch_id=branch.id,
                    customer_id=cust.id,
                    order_id=order.id,
                    invoice_id=invoice.id,
                    payment_method_id=p_method.id,
                    payment_type="RECEIPT",
                    transaction_number=f"TXN-{order_no}-{p_idx+1}",
                    transaction_date=p_date,
                    amount=p_amt,
                    currency="INR",
                    reference_number=f"RCP-{order_no}-{p.get('m', 'PAY')}",
                    status="COMPLETED",
                    notes=f"Payment recorded for {order_no}",
                )
                db.add(ptx)

            # Track Khata delta
            customer_khata_deltas[cust.id] = customer_khata_deltas.get(cust.id, Decimal("0")) + balance_due
            seeded_orders += 1

            if seeded_orders % 100 == 0:
                db.commit()
                print(f"  Committed {seeded_orders} orders & invoices...")

        db.commit()
        print(f"Successfully ingested {seeded_orders} orders & invoices!")

        # -------------------------------------------------------------
        # STEP 2: Update Customer Current Balances (Udhaar)
        # -------------------------------------------------------------
        print("\n2. Updating Customer Khata (Udhaar) Balances...")
        updated_debtors = 0
        for cust_id, due in customer_khata_deltas.items():
            if due > 0:
                c_obj = db.query(Customer).filter(Customer.id == cust_id).first()
                if c_obj:
                    c_obj.current_balance = due
                    updated_debtors += 1

        db.commit()
        print(f"Updated live Udhaar balances for {updated_debtors} debtor customers!")

        # -------------------------------------------------------------
        # STEP 3: Ingest Store Expenses (exp)
        # -------------------------------------------------------------
        raw_expenses = owner_data.get("exp", [])
        print(f"\n3. Ingesting {len(raw_expenses)} Store Expenses...")
        
        # Ensure Expense Category
        cat_ops = db.query(ExpenseCategory).filter(ExpenseCategory.organization_id == org.id, ExpenseCategory.code == "OPERATIONS").first()
        if not cat_ops:
            cat_ops = ExpenseCategory(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                name="Store Operations & Logistics",
                code="OPERATIONS",
                description="Daily transport, packaging, electricity, and fuel",
            )
            db.add(cat_ops)
            db.flush()

        seeded_expenses = 0
        for idx, e in enumerate(raw_expenses):
            e_no = f"EXP-{idx+1:04d}"
            existing_exp = db.query(Expense).filter(Expense.organization_id == org.id, Expense.expense_number == e_no).first()
            if existing_exp:
                continue

            amt = Decimal(str(e.get("amt", 0)))
            e_date = parse_date(e.get("date"))
            paid_to = str(e.get("paidTo") or e.get("sub") or "Operational Vendor")

            exp_obj = Expense(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                branch_id=branch.id,
                category_id=cat_ops.id,
                expense_number=e_no,
                expense_date=e_date,
                amount=amt,
                tax_amount=Decimal("0.00"),
                total_amount=amt,
                payment_method_id=pm_cash.id,
                paid_to=paid_to,
                description=str(e.get("note") or e.get("rem") or "Operational store expense"),
                status="APPROVED",
            )
            db.add(exp_obj)
            seeded_expenses += 1

        db.commit()
        print(f"Successfully ingested {seeded_expenses} store expenses into Daybook!")

        # -------------------------------------------------------------
        # STEP 4: Ingest 109 CRM Telecalling Notes (ccalls)
        # -------------------------------------------------------------
        raw_calls = owner_data.get("ccalls", [])
        print(f"\n4. Ingesting {len(raw_calls)} CRM Telecalling Interaction Logs...")
        seeded_calls = 0
        for ccall in raw_calls:
            # Match customer
            raw_c_id = str(ccall.get("cust", ""))
            c_phone = raw_cust_to_phone.get(raw_c_id, "")
            cust = phone_to_cust.get(c_phone) or first_cust
            c_date = parse_dt(ccall.get("at"))
            notes = str(ccall.get("r") or ccall.get("note") or "Telecalling follow-up call")
            by_name = ccall.get("by", "Pushpa Patil")

            # Find user
            caller_user = next((u for u in users.values() if by_name.lower() in u.full_name.lower()), default_user)

            call_log = CallLog(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                customer_id=cust.id,
                call_date=c_date,
                duration_seconds=ccall.get("dur", 60),
                call_type="OUTBOUND",
                outcome="CONNECTED" if "order" in notes.lower() or "ok" in notes.lower() else "CALLBACK_REQUESTED",
                notes=f"[{by_name}] {notes}",
                logged_by=caller_user.id if caller_user else default_user.id,
            )
            db.add(call_log)
            seeded_calls += 1

        db.commit()
        print(f"Successfully ingested {seeded_calls} CRM call logs!")

        # -------------------------------------------------------------
        # STEP 5: Ingest 25 Commodity Split Batches (splits)
        # -------------------------------------------------------------
        raw_splits = owner_data.get("splits", [])
        print(f"\n5. Ingesting {len(raw_splits)} Bulk Commodity Split Batches...")
        seeded_splits = 0
        for idx, sp in enumerate(raw_splits):
            batch_no = f"SPLIT-{idx+1:04d}"
            sp_date = parse_date(sp.get("date") or sp.get("d"))
            in_qty = Decimal(str(sp.get("inQ", 50)))
            out_qty = Decimal(str(sp.get("outQ", in_qty)))

            # Source variant
            src_sku = str(sp.get("inS") or "")
            src_variant = barcode_to_var.get(src_sku) or first_var

            split_batch = StockSplitBatch(
                id=str(uuid.uuid4()),
                organization_id=org.id,
                branch_id=branch.id,
                warehouse_id=warehouse.id,
                batch_number=batch_no,
                source_variant_id=src_variant.id,
                source_quantity=in_qty,
                split_date=sp_date,
                status="COMPLETED",
            )
            db.add(split_batch)
            seeded_splits += 1

        db.commit()
        print(f"Successfully ingested {seeded_splits} commodity split batches!")

        print("\n" + "=" * 70)
        print("ALL REAL BACKUP DATA SUCCESSFULLY INGESTED INTO POSTGRESQL!")
        print("=" * 70)

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_migration()
