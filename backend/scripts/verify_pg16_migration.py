"""PostgreSQL 16 Migration and Schema Integrity Verification Script."""
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker

from app.database.base import generate_uuid
from app.database.seed import seed_permissions, seed_system_roles
from app.models import Branch, Organization, User, UserRoleAssignment

PG_URL = "postgresql+psycopg://postgres:postgres@localhost:5439/test_siddeshwar"

def run_verification():
    print(f"Connecting to PostgreSQL 16 at {PG_URL}...")
    engine = create_engine(PG_URL)
    session_factory = sessionmaker(bind=engine)
    session = session_factory()

    try:
        # Check PG version
        res = session.execute(select(func.version())).scalar()
        print(f"Connected to: {res}")
        assert "PostgreSQL 16" in res, f"Expected PostgreSQL 16, got {res}"

        # Seed RBAC templates
        print("Seeding permissions and system roles...")
        perm_map = seed_permissions(session)
        role_map = seed_system_roles(session, perm_map)
        print(f"Seeded {len(perm_map)} permissions and {len(role_map)} system roles.")

        # Create organization and branch
        org = Organization(
            id=generate_uuid(),
            name="Siddeshwar Verification Corp",
            legal_name="Siddeshwar Verification Corp Pvt Ltd",
            organization_code="SIDDVER",
            email="verify@siddeshwar.in",
            phone="+91 9999900000",
            is_active=True,
        )
        session.add(org)
        session.flush()

        branch = Branch(
            id=generate_uuid(),
            organization_id=org.id,
            branch_code="VER-HQ",
            branch_name="Verification HQ",
            branch_type="HEADQUARTERS",
            phone="+91 20 99999999",
            email="ver-hq@siddeshwar.in",
            is_active=True,
        )
        session.add(branch)
        session.flush()

        # Insert user to verify default columns
        test_user = User(
            id=generate_uuid(),
            organization_id=org.id,
            email="pg16.test@siddeshwar.in",
            password_hash="argon2_fake_hash_value_12345678",
            full_name="Postgres16 Verifier",
            phone="9876543999",
            is_active=True,
            is_verified=True,
        )
        session.add(test_user)
        session.flush()

        # Check default value of approval_status
        assert test_user.approval_status == "APPROVED", f"Expected APPROVED, got {test_user.approval_status}"
        assert test_user.requested_role_slug is None
        print("User default approval_status = APPROVED verified.")

        # Assign role to verify is_primary default and index
        cashier_role = role_map["cashier"]
        assignment = UserRoleAssignment(
            id=generate_uuid(),
            user_id=test_user.id,
            role_id=cashier_role.id,
            organization_id=org.id,
            branch_id=branch.id,
            is_active=True,
            status="ACTIVE",
        )
        session.add(assignment)
        session.flush()

        assert assignment.is_primary is False, f"Expected is_primary=False by default, got {assignment.is_primary}"
        print("UserRoleAssignment default is_primary = False verified.")

        # Verify transaction safety: Unique constraint on (user_id, role_id, organization_id, branch_id)
        duplicate_assignment = UserRoleAssignment(
            id=generate_uuid(),
            user_id=test_user.id,
            role_id=cashier_role.id,
            organization_id=org.id,
            branch_id=branch.id,
            is_active=True,
            status="ACTIVE",
        )
        session.add(duplicate_assignment)
        failed = False
        try:
            session.flush()
        except Exception:
            failed = True
            session.rollback()
            print("Unique constraint on user_role_assignment successfully prevented duplicate assignment.")

        assert failed, "Expected duplicate assignment to raise IntegrityError"

        print("\nALL POSTGRESQL 16 MIGRATION AND INTEGRITY CHECKS PASSED.")
    finally:
        session.close()

if __name__ == "__main__":
    run_verification()

