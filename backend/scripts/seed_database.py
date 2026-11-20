"""CLI script to seed foundational ERP database records."""

import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database.seed import bootstrap_organization, seed_permissions, seed_system_roles
from app.database.session import SessionLocal


def main() -> None:
    print("Beginning database seed operation...")
    db = SessionLocal()
    try:
        print("1. Seeding system permission matrix...")
        perm_map = seed_permissions(db)
        print(f"   -> {len(perm_map)} permissions cataloged.")

        print("2. Seeding 13 system role templates...")
        role_map = seed_system_roles(db, perm_map)
        print(f"   -> {len(role_map)} system roles configured with permission links.")

        print("3. Bootstrapping Siddeshwar Enterprises organization...")
        org, branch, user = bootstrap_organization(db)
        print(f"   -> Organization: {org.name} ({org.organization_code})")
        print(f"   -> Flagship Branch: {branch.branch_name} ({branch.branch_code})")
        print(f"   -> Root Administrator: {user.email}")

        db.commit()
        print("Database seed completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error during database seed: {e}", file=sys.stderr)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
