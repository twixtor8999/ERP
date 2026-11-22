import json
import psycopg
import uuid
from datetime import datetime, timezone
from decimal import Decimal

conn_str = 'postgresql://postgres:TZXznyoTXjmtZcoiAyIdjoLUDxIyEhvg@crossover.proxy.rlwy.net:23275/railway'

with open('backend/scripts/siddeshwar_complete_crm_data.json', 'r') as f:
    crm_data = json.load(f)

print("[*] Loaded scraped CRM dataset.")
customers_raw = crm_data.get('customers', [])
skus_raw = crm_data.get('skus_products', [])
orders_raw = crm_data.get('orders', [])
calls_raw = crm_data.get('call_logs', [])

now_iso = datetime.now(timezone.utc)

with psycopg.connect(conn_str) as conn:
    with conn.cursor() as cur:
        # 1. Fetch organization & branch
        cur.execute("SELECT id FROM organizations WHERE organization_code = 'SIDD-ENT' LIMIT 1;")
        row = cur.fetchone()
        org_id = row[0] if row else 'b3687dc0-a8cd-4cdb-add6-62404a03f5b9'

        cur.execute("SELECT id FROM branches WHERE organization_id = %s LIMIT 1;", (org_id,))
        row = cur.fetchone()
        branch_id = row[0] if row else 'f7db7496-cae4-43df-9e30-9b1ab080a3bf'

        # 2. Fetch Users
        cur.execute("SELECT id, full_name, phone FROM users WHERE organization_id = %s;", (org_id,))
        user_rows = cur.fetchall()
        user_by_name = {r[1].strip().lower(): r[0] for r in user_rows if r[1]}
        default_user_id = user_rows[0][0] if user_rows else None

        # 3. Fetch Product Variants
        cur.execute("SELECT id, name FROM products WHERE organization_id = %s;", (org_id,))
        prod_by_name = {r[1].strip().lower(): r[0] for r in cur.fetchall() if r[1]}

        cur.execute("SELECT id, product_id, sku FROM product_variants;")
        var_rows = cur.fetchall()
        var_by_prod_id = {r[1]: r[0] for r in var_rows if r[1]}
        default_variant_id = var_rows[0][0] if var_rows else None

        # Build legacy SKU mapping
        legacy_sku_map = {s['id']: s for s in skus_raw if 'id' in s}
        sku_to_db = {}
        for leg_id, s_obj in legacy_sku_map.items():
            s_name = s_obj.get('name', '').strip()
            p_id = prod_by_name.get(s_name.lower())
            if p_id:
                v_id = var_by_prod_id.get(p_id, default_variant_id)
                sku_to_db[leg_id] = (p_id, v_id, s_name)

        print(f"[+] Mapped {len(sku_to_db)} legacy SKUs to database variants.")

        # 4. Map & Upsert Customers
        cur.execute("SELECT id, phone, display_name FROM customers WHERE organization_id = %s;", (org_id,))
        cust_rows = cur.fetchall()
        cust_by_phone = {r[1].strip(): r[0] for r in cust_rows if r[1]}

        legacy_cust_to_db = {}
        new_cust_records = []
        new_address_records = []

        for c in customers_raw:
            leg_c_id = c.get('id')
            ph = (c.get('ph') or '').strip()
            name = (c.get('name') or 'Customer').strip()
            shop = (c.get('shop') or '').strip()
            display_name = f"{shop} - {name}" if shop and shop != name else name
            village = (c.get('village') or '').strip() or 'Vijayapura'
            route = (c.get('route') or '').strip() or 'Bijapur'
            pincode = (c.get('pincode') or '586101').strip()
            taluka = (c.get('taluka') or 'Vijayapura').strip()
            landmark = (c.get('lm') or '').strip()

            db_c_id = cust_by_phone.get(ph)
            if not ph:
                ph = f"99{str(leg_c_id)[-8:]}"
            if not db_c_id:
                db_c_id = str(uuid.uuid4())
                new_cust_records.append((
                    db_c_id, org_id, f"CUST-{str(uuid.uuid4())[:8].upper()}",
                    'retail', shop or display_name, name, '', display_name,
                    f"c_{ph}@siddeshwar.in", ph,
                    Decimal("0.00"), 15, Decimal("0.00"), Decimal("0.00"), True, now_iso, now_iso
                ))
                if ph:
                    cust_by_phone[ph] = db_c_id

            if leg_c_id:
                legacy_cust_to_db[leg_c_id] = db_c_id

            addr_id = str(uuid.uuid4())
            new_address_records.append((
                addr_id, db_c_id, 'shipping', village, landmark,
                taluka, 'Karnataka', pincode, 'India', True, now_iso, now_iso,
                display_name, ph, landmark
            ))

        if new_cust_records:
            cur.executemany("""
                INSERT INTO customers (
                    id, organization_id, customer_code, customer_type, company_name,
                    first_name, last_name, display_name, email, phone,
                    credit_limit, credit_period_days, opening_balance, current_balance,
                    is_active, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING;
            """, new_cust_records)
            print(f"[+] Inserted {len(new_cust_records)} new customers.")

        # Re-populate customer addresses with real routes and villages
        cur.execute("DELETE FROM customer_addresses WHERE customer_id IN (SELECT id FROM customers WHERE organization_id = %s);", (org_id,))
        cur.executemany("""
            INSERT INTO customer_addresses (
                id, customer_id, address_type, address_line1, address_line2,
                city, state, postal_code, country, is_default, created_at, updated_at,
                recipient_name, phone, landmark
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """, new_address_records)
        print(f"[+] Inserted {len(new_address_records)} customer addresses with routes and villages.")

        # 5. Ingest Orders and Order Items
        order_insert_records = []
        item_insert_records = []
        order_no_seen = set()

        for o in orders_raw:
            order_no = o.get('no')
            if not order_no or order_no in order_no_seen:
                continue
            order_no_seen.add(order_no)

            leg_cust_id = o.get('cust')
            db_c_id = legacy_cust_to_db.get(leg_cust_id)
            if not db_c_id and cust_by_phone:
                db_c_id = list(cust_by_phone.values())[0]
            if not db_c_id:
                continue

            order_id = str(uuid.uuid4())
            date_str = o.get('date') or '2026-11-20'
            try:
                order_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except Exception:
                order_date = now_iso.date()

            raw_status = o.get('st') or 'completed'
            status_map = {
                'completed': 'delivered',
                'dispatched': 'shipped',
                'packed': 'processing',
                'placed': 'confirmed',
                'cancelled': 'cancelled'
            }
            order_status = status_map.get(raw_status, 'delivered')

            items = o.get('items', [])
            total_amt = Decimal("0.00")
            for itm in items:
                q = Decimal(str(itm.get('q', 1)))
                p = Decimal(str(itm.get('p', 0)))
                total_amt += (q * p)

            by_person = (o.get('by') or '').strip().lower()
            emp_id = user_by_name.get(by_person, default_user_id)

            order_insert_records.append((
                order_id, org_id, branch_id, db_c_id, order_no,
                order_date, order_status, 'b2b', total_amt, Decimal("0.00"),
                Decimal("0.00"), total_amt, f"Synced legacy order by {o.get('by', 'Telecaller')}",
                now_iso, now_iso, Decimal("0.00"), 0, 'cash', 'paid', 1
            ))

            for itm in items:
                s_id = itm.get('s')
                q = Decimal(str(itm.get('q', 1)))
                p = Decimal(str(itm.get('p', 0)))
                itm_tot = q * p
                mapping = sku_to_db.get(s_id)
                v_id = mapping[1] if mapping else default_variant_id
                p_name = mapping[2] if mapping else f"SKU #{s_id}"

                item_insert_records.append((
                    str(uuid.uuid4()), order_id, v_id, p_name,
                    f"SKU-{str(s_id)[-8:]}", q, p, Decimal("0.00"),
                    Decimal("0.00"), Decimal("0.00"), Decimal("0.00"), itm_tot,
                    now_iso, now_iso, q, 'picked'
                ))

        if order_insert_records:
            # Check existing order numbers to avoid duplicate key error
            cur.execute("SELECT order_number FROM orders WHERE organization_id = %s;", (org_id,))
            existing_orders = {r[0] for r in cur.fetchall()}
            filtered_orders = [rec for rec in order_insert_records if rec[4] not in existing_orders]
            valid_order_ids = {rec[0] for rec in filtered_orders}
            filtered_items = [itm for itm in item_insert_records if itm[1] in valid_order_ids]

            cur.executemany("""
                INSERT INTO orders (
                    id, organization_id, branch_id, customer_id, order_number,
                    order_date, status, order_type, subtotal, discount_amount,
                    tax_amount, total_amount, notes, created_at, updated_at,
                    delivery_charge, delivery_otp_attempts, payment_method,
                    payment_status, delivery_attempt_count
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING;
            """, filtered_orders)
            print(f"[+] Inserted {len(filtered_orders)} orders.")

            if filtered_items:
                cur.executemany("""
                    INSERT INTO order_items (
                        id, order_id, product_variant_id, product_name, sku,
                        quantity, unit_price, discount_percent, discount_amount,
                        tax_rate, tax_amount, total_amount, created_at, updated_at,
                        picked_quantity, picking_status
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING;
                """, filtered_items)
                print(f"[+] Inserted {len(filtered_items)} order line items.")

        # 6. Ingest Call Logs
        call_records = []
        for cl in calls_raw:
            c_leg_id = cl.get('cust')
            db_c_id = legacy_cust_to_db.get(c_leg_id)
            if not db_c_id:
                continue

            by_person = (cl.get('by') or '').strip().lower()
            caller_uid = user_by_name.get(by_person, default_user_id)
            call_t = cl.get('t') or cl.get('d')
            try:
                call_dt = datetime.fromisoformat(call_t.replace('Z', '+00:00'))
            except Exception:
                call_dt = now_iso

            call_records.append((
                str(uuid.uuid4()), org_id, db_c_id, call_dt,
                60, 'telecall', 'connected', f"Telecall log by {cl.get('by', 'Executive')}",
                caller_uid, now_iso, now_iso
            ))

        if call_records:
            cur.executemany("""
                INSERT INTO call_logs (
                    id, organization_id, customer_id, call_date, duration_seconds,
                    call_type, outcome, notes, logged_by, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING;
            """, call_records)
            print(f"[+] Inserted {len(call_records)} call logs.")

        conn.commit()
        print("\n[SUCCESS] Ingestion completed and committed to Railway PostgreSQL!")
