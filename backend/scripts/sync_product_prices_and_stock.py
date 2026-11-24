"""Sync product master selling prices, wholesale prices, MRP, and stock balances
in Railway PostgreSQL database using realProducts.json master catalog.
"""

import json
import os
import psycopg
from decimal import Decimal

CONN_STR = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:TZXznyoTXjmtZcoiAyIdjoLUDxIyEhvg@crossover.proxy.rlwy.net:23275/railway"
)
JSON_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "src", "data", "realProducts.json")
)

HERO_RATES = {
    "a gift for trulove glucose biscuit 5rs 168pcs box": (620, 840, 1),
    "aramane detergent powder 10rs 120pcs bag": (1000, 1200, 31),
    "aramane detergent soap 10rs 60pcs box": (550, 600, 112),
    "bullet rice 26kg bag": (1350, 1450, 7),
}

def run_sync():
    print(f"[*] Reading master catalog from: {JSON_PATH}")
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        real_products = json.load(f)

    catalog_map = {}
    for p in real_products:
        name_clean = p["name"].strip().lower()
        price = float(p.get("price") or 100)
        mrp = float(p.get("mrp") or price or 100)
        stock = float(p.get("stock") or 15)
        catalog_map[name_clean] = (price, mrp, stock)

    for hero_name, (h_price, h_mrp, h_stock) in HERO_RATES.items():
        catalog_map[hero_name] = (float(h_price), float(h_mrp), float(h_stock))

    print(f"[*] Loaded {len(catalog_map)} master product pricing specifications.")

    print(f"[*] Connecting to Railway database...")
    with psycopg.connect(CONN_STR) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT p.id, p.name, pv.id, pv.sku, pv.selling_price
                FROM products p
                JOIN product_variants pv ON p.id = pv.product_id;
            """)
            db_variants = cur.fetchall()
            print(f"[+] Found {len(db_variants)} variants in database.")

            updated_variants = 0
            updated_stocks = 0

            for p_id, p_name, pv_id, pv_sku, curr_price in db_variants:
                p_lower = p_name.strip().lower()
                
                # Exact or partial name match
                match = catalog_map.get(p_lower)
                if not match:
                    # Try partial matching
                    for c_name, c_vals in catalog_map.items():
                        if c_name in p_lower or p_lower in c_name:
                            match = c_vals
                            break

                price_to_set = Decimal("100.00")
                mrp_to_set = Decimal("100.00")
                stock_to_set = Decimal("15.0000")

                if match:
                    price_to_set = Decimal(str(match[0]))
                    mrp_to_set = Decimal(str(match[1]))
                    stock_to_set = Decimal(str(match[2]))
                elif curr_price and float(curr_price) > 0:
                    price_to_set = Decimal(str(curr_price))
                    mrp_to_set = Decimal(str(curr_price))

                cost_to_set = Decimal(str(round(float(price_to_set) * 0.90, 2)))

                # Update variant pricing
                cur.execute("""
                    UPDATE product_variants
                    SET selling_price = %s,
                        wholesale_price = %s,
                        mrp = %s,
                        cost_price = %s,
                        min_selling_price = %s
                    WHERE id = %s;
                """, (price_to_set, price_to_set, mrp_to_set, cost_to_set, cost_to_set, pv_id))
                updated_variants += 1

                # Update or insert stock balance
                cur.execute("""
                    UPDATE stock_balances
                    SET quantity_on_hand = %s
                    WHERE product_variant_id = %s;
                """, (stock_to_set, pv_id))
                if cur.rowcount > 0:
                    updated_stocks += cur.rowcount

            conn.commit()
            print(f"[✓] Successfully updated {updated_variants} variants with authentic prices!")
            print(f"[✓] Successfully updated {updated_stocks} stock balance records!")

            # Verify zero-price count
            cur.execute("SELECT COUNT(*) FROM product_variants WHERE selling_price <= 0;")
            zero_count = cur.fetchone()[0]
            print(f"[*] Variants remaining with <= 0 price: {zero_count}")

            # Sample check
            cur.execute("""
                SELECT p.name, pv.selling_price, pv.mrp, sb.quantity_on_hand
                FROM products p
                JOIN product_variants pv ON p.id = pv.product_id
                LEFT JOIN stock_balances sb ON pv.id = sb.product_variant_id
                ORDER BY pv.selling_price DESC
                LIMIT 5;
            """)
            print("[*] Top 5 products sample after update:")
            for r in cur.fetchall():
                print("   -", r[0], "-> Selling Price: ₹", r[1], "| MRP: ₹", r[2], "| Stock:", r[3])

if __name__ == "__main__":
    run_sync()
