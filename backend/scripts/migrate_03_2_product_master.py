import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from app.database.session import engine
import app.models

def run_migrations():
    print("Running Product Master 03.2 database migrations...")
    # First create all tables from metadata
    app.models.Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        # 1. Update product_categories
        conn.execute(text("ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS image_url TEXT;"))
        conn.execute(text("ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;"))
        conn.execute(text("ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;"))

        # 2. Update products
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;"))
        conn.execute(text("ALTER TABLE products ALTER COLUMN image_url TYPE TEXT;"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS is_saleable BOOLEAN NOT NULL DEFAULT TRUE;"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS is_purchasable BOOLEAN NOT NULL DEFAULT TRUE;"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS is_inventory_tracked BOOLEAN NOT NULL DEFAULT TRUE;"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS is_perishable BOOLEAN NOT NULL DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS is_batch_tracked BOOLEAN NOT NULL DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS is_expiry_tracked BOOLEAN NOT NULL DEFAULT FALSE;"))

        # 3. Update product_variants
        conn.execute(text("ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS wholesale_price NUMERIC(15,2) NOT NULL DEFAULT 0.00;"))
        conn.execute(text("ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS min_selling_price NUMERIC(15,2) NOT NULL DEFAULT 0.00;"))

    print("Product Master 03.2 database migrations completed successfully!")

if __name__ == "__main__":
    run_migrations()
