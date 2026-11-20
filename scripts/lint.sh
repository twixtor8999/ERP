#!/usr/bin/env bash
set -e

echo "=== Running Backend Code Quality Checks ==="
cd backend
./venv/bin/ruff check app tests
./venv/bin/mypy --explicit-package-bases app
cd ..

echo "=== Running Frontend Code Quality Checks ==="
cd frontend
npm run build
cd ..

echo "=== All Lint and Strict Typing Checks Passed! ==="
