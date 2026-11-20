#!/usr/bin/env bash
set -e

echo "=== Starting AI Smart Bazar ERP Local Servers ==="

trap 'kill $(jobs -p) 2>/dev/null || true' EXIT

# Start backend
echo "Starting FastAPI Backend on http://localhost:8000..."
cd backend
./venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Start frontend
echo "Starting Vite Frontend on http://localhost:5173..."
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!
cd ..

wait $BACKEND_PID $FRONTEND_PID

