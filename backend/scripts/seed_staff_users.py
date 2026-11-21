import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import app.models
from app.database.session import SessionLocal
from app.modules.users.models import User, UserBranchAccess
from app.modules.roles.models import Role, UserRoleAssignment
from app.modules.organizations.models import Organization
from app.modules.branches.models import Branch
from app.core.security import hash_password
from sqlalchemy import select, or_

def seed_staff():
    db = SessionLocal()
    try:
        org = db.scalar(select(Organization).where(Organization.organization_code == "SIDD-ENT"))
        if not org:
            print("Org not found!")
            return
        branch = db.scalar(select(Branch).where(Branch.organization_id == org.id))
        
        roles = {r.slug: r for r in db.scalars(select(Role)).all()}
        print("Available roles:", list(roles.keys()))

        backup_paths = [
            r"c:\Users\sanju\Desktop\ERP\PK-Smart-Bazar-FULL-backup-2026-11-21.json",
            r"c:\Users\sanju\Desktop\PK-Smart-Bazar-FULL-backup-2026-11-21.json",
        ]
        backup_path = next((p for p in backup_paths if os.path.exists(p)), None)
        if not backup_path:
            print("Backup file not found in paths!")
            return

        with open(backup_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        owner_data = json.loads(data.get("keys", {}).get("pk3d_owner0", "{}"))
        raw_users = owner_data.get("users", [])
        print(f"Found {len(raw_users)} users in backup JSON.")

        # Known staff credentials and role mappings
        staff_configs = {
            "9739396236": {"name": "Vijaykumar Shantagiri", "role": "super_admin", "pwd": "Vijay@123"},
            "9663447859": {"name": "Pushpa Patil", "role": "crm_executive", "pwd": "123456"},
            "8971098968": {"name": "Prashant Kalamadi", "role": "super_admin", "pwd": "Admin@123456"},
            "8904548204": {"name": "Anand Kattimani", "role": "auditor_ca", "pwd": "CA@123456"},
            "9916801495": {"name": "Arun Patil", "role": "branch_manager", "pwd": "Arun@123456"},
            "8861629653": {"name": "Dhruthi A S", "role": "crm_executive", "pwd": "123456"},
            "8197353836": {"name": "Mahalaxmi Hiremath", "role": "crm_executive", "pwd": "123456"},
            "9880801735": {"name": "Store Owner", "role": "business_owner", "pwd": "Owner@123456"},
        }

        for udata in raw_users:
            phone = str(udata.get("uname") or udata.get("ph") or "").strip().replace(" ", "").replace("+91", "")
            if not phone:
                continue
            name = udata.get("name") or f"Staff {phone}"
            
            config = staff_configs.get(phone, {
                "name": name,
                "role": "cashier",
                "pwd": "Password@123"
            })

            email = f"staff_{phone}@siddeshwar.com"
            existing = db.scalar(select(User).where(or_(User.phone == phone, User.email == email)))
            target_role_slug = config["role"] if config["role"] in roles else "cashier"
            target_role = roles.get(target_role_slug) or roles.get("cashier")

            if existing:
                print(f"Updating user: {phone} - {config['name']} ({target_role_slug})")
                existing.full_name = config["name"]
                existing.phone = phone
                existing.password_hash = hash_password(config["pwd"])
                existing.approval_status = "APPROVED"
                existing.is_active = True
                user_obj = existing
            else:
                print(f"Creating user: {phone} - {config['name']} ({target_role_slug})")
                user_obj = User(
                    organization_id=org.id,
                    email=email,
                    phone=phone,
                    full_name=config["name"],
                    password_hash=hash_password(config["pwd"]),
                    is_active=True,
                    is_verified=True,
                    approval_status="APPROVED",
                )
                db.add(user_obj)
                db.flush()

                # Add branch access
                db.add(UserBranchAccess(
                    user_id=user_obj.id,
                    branch_id=branch.id,
                    is_default=True,
                ))

            # Ensure role assignment
            existing_role = db.scalar(
                select(UserRoleAssignment).where(
                    UserRoleAssignment.user_id == user_obj.id,
                    UserRoleAssignment.role_id == target_role.id
                )
            )
            if not existing_role:
                db.add(UserRoleAssignment(
                    user_id=user_obj.id,
                    role_id=target_role.id,
                    organization_id=org.id,
                    branch_id=branch.id,
                ))

        db.commit()
        print("Successfully seeded all 8 staff accounts into PostgreSQL!")
    except Exception as e:
        db.rollback()
        print("Error seeding staff:", e)
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_staff()
