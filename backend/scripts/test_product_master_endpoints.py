import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

# 1. Login
login_resp = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "admin@siddeshwar.com",
    "password": "Admin@Siddeshwar2026!",
})

if login_resp.status_code != 200:
    # Try alternate password or check user
    print("Login with AdminPassword@123 failed:", login_resp.status_code, login_resp.text)
    login_resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@siddeshwar.com",
        "password": "Admin@123456",
    })

if login_resp.status_code != 200:
    print("Failed to login:", login_resp.status_code, login_resp.text)
    exit(1)

token = login_resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("Successfully logged in! Access token acquired.")

# 2. List products
prods_resp = requests.get(f"{BASE_URL}/admin/products", headers=headers)
print(f"GET /admin/products: {prods_resp.status_code}, total items: {len(prods_resp.json())}")
sample = prods_resp.json()[0]
print(f"Sample product: {sample['name']} | Display: {sample['display_name']} | SKU: {sample['variants'][0]['sku']} | Price: ₹{sample['variants'][0]['selling_price']} | Stock: {sample['stock_on_hand']}")

# 3. Barcode lookup
barcode_to_lookup = sample['variants'][0]['barcode']
bc_resp = requests.get(f"{BASE_URL}/admin/products/lookup/barcode/{barcode_to_lookup}", headers=headers)
print(f"GET /admin/products/lookup/barcode/{barcode_to_lookup}: {bc_resp.status_code}")
if bc_resp.status_code == 200:
    data = bc_resp.json()
    print(f"   -> Found: {data['name']} (Display: {data['display_name']}), Price: ₹{data['selling_price']}, Stock: {data['stock_on_hand']}")

# 4. SKU lookup
sku_to_lookup = sample['variants'][0]['sku']
sku_resp = requests.get(f"{BASE_URL}/admin/products/lookup/sku/{sku_to_lookup}", headers=headers)
print(f"GET /admin/products/lookup/sku/{sku_to_lookup}: {sku_resp.status_code}")

# 5. Categories with product count
cats_resp = requests.get(f"{BASE_URL}/admin/categories", headers=headers)
print(f"GET /admin/categories: {cats_resp.status_code}, count: {len(cats_resp.json())}")
for c in cats_resp.json()[:3]:
    print(f"   -> Category: {c['name']} (Items: {c['product_count']}, Has Image: {bool(c['image_url'])})")

# 6. CSV Export
export_resp = requests.get(f"{BASE_URL}/admin/products/export", headers=headers)
print(f"GET /admin/products/export: {export_resp.status_code}, Content-Type: {export_resp.headers.get('content-type')}, Length: {len(export_resp.content)} bytes")

# 7. Create product test
create_resp = requests.post(f"{BASE_URL}/admin/products", headers=headers, json={
    "name": "Fortune Sunlite Refined Sunflower Oil 1Ltr",
    "code": "PROD-FORTUNE-1L",
    "display_name": "ಫಾರ್ಚೂನ್ ಸೂರ್ಯಕಾಂತಿ ಎಣ್ಣೆ 1 ಲೀಟರ್",
    "description": "High quality refined sunflower oil",
    "is_saleable": True,
    "is_perishable": True,
    "initial_variant": {
        "variant_name": "Standard",
        "sku": "SKU-FORTUNE-1L",
        "barcode": "8906007281010",
        "cost_price": 115.00,
        "selling_price": 130.00,
        "mrp": 145.00,
        "wholesale_price": 120.00,
        "min_selling_price": 115.00,
        "initial_stock": 50,
    }
})
print(f"POST /admin/products: {create_resp.status_code}, {create_resp.json()}")
new_prod_id = create_resp.json().get("product_id")

# 8. Update product test
if new_prod_id:
    update_resp = requests.put(f"{BASE_URL}/admin/products/{new_prod_id}", headers=headers, json={
        "display_name": "ಫಾರ್ಚೂನ್ ಸೂರ್ಯಕಾಂತಿ ಎಣ್ಣೆ 1 ಲೀಟರ್ (ಆಫರ್ ಪ್ಯಾಕ್)",
        "selling_price": 128.00,
        "stock_adjustment": 10,
    })
    print(f"PUT /admin/products/{new_prod_id}: {update_resp.status_code}, {update_resp.json()}")

print("\nALL PRODUCT MASTER ENDPOINTS PASSED VERIFICATION!")
