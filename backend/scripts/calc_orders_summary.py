import json
from decimal import Decimal

path = r"c:\Users\sanju\Desktop\ERP\PK-Smart-Bazar-FULL-backup-2026-11-21.json"
with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

owner_data = json.loads(data["keys"]["pk3d_owner0"])
orders = owner_data.get("orders", [])

total_sales = Decimal("0")
total_paid = Decimal("0")
customer_balances = {}

for o in orders:
    order_total = Decimal("0")
    for it in o.get("items", []):
        qty = Decimal(str(it.get("q", 0)))
        price = Decimal(str(it.get("p", 0)))
        order_total += qty * price
    total_sales += order_total

    order_paid = Decimal("0")
    for p in o.get("pay", []):
        order_paid += Decimal(str(p.get("a", 0)))
    total_paid += order_paid

    cust_id = str(o.get("cust"))
    bal = order_total - order_paid
    customer_balances[cust_id] = customer_balances.get(cust_id, Decimal("0")) + bal

total_udhaar = total_sales - total_paid
debtors_count = sum(1 for b in customer_balances.values() if b > 0)

print(f"512 Historical Orders Summary:")
print(f"  Total Order Value: Rs. {total_sales:,.2f}")
print(f"  Total Payments Collected: Rs. {total_paid:,.2f}")
print(f"  Total Outstanding Udhaar (Khata Balance): Rs. {total_udhaar:,.2f}")
print(f"  Number of Debtors owing money: {debtors_count}")
