# AI Smart Bazar ERP — Alembic Migration Management

## 1. Migration Versioning Standards

Alembic migrations are stored in `backend/alembic/versions/`.
All revisions must:
1. Include unambiguous docstrings describing the schema transformation.
2. Provide both `upgrade()` and `downgrade()` functions.
3. Use explicit foreign key names and index names.
4. Support cross-dialect execution for offline SQL inspection.

---

## 2. Standard Migration Commands

### Generate a New Migration Revision
```bash
cd backend
venv/bin/alembic revision --autogenerate -m "describe_changes_here"
```

### Apply Migrations (Online)
```bash
cd backend
venv/bin/alembic upgrade head
```

### Generate Offline SQL Script (Pre-Deployment Review)
```bash
cd backend
venv/bin/alembic upgrade head --sql > migration_review.sql
```

### Rollback Previous Migration
```bash
cd backend
venv/bin/alembic downgrade -1
```

---

## 3. Seed Execution
After running migrations, the initial RBAC permissions, 13 system role templates, and organization bootstrap records can be populated via:
```bash
cd backend
PYTHONPATH=. venv/bin/python scripts/seed_database.py
```
