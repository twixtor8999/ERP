#!/usr/bin/env bash
set -e

echo "=== Running Backend Tests (Pytest) ==="
cd backend
./venv/bin/pytest
cd ..

echo "=== Running Frontend Tests (Vitest) ==="
cd frontend
npm run test
cd ..

echo "=== All Tests Passed Successfully! ==="

