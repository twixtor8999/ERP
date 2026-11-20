"""Generate initial schema migration via Alembic."""
import subprocess
import sys


def create_migration():
    cmd = ["alembic", "revision", "--autogenerate", "-m", "initial_schema_baseline"]
    print(f"Executing: {' '.join(cmd)}")
    result = subprocess.run(cmd)
    return result.returncode


if __name__ == "__main__":
    sys.exit(create_migration())
