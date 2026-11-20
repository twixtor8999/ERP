#!/usr/bin/env bash
set -e

echo "=== Initializing AI Smart Bazar ERP Development Environment ==="

# Check requirements
command -v python3 >/dev/null 2>&1 || { echo "Error: Python 3 is required."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Error: Node.js is required."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "Error: npm is required."; exit 1; }

echo "1. Configuring Backend Python Environment..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements-dev.txt
if [ ! -f ".env" ]; then
    cp .env.example .env
fi
cd ..

echo "2. Configuring Frontend Node Environment..."
cd frontend
npm install
if [ ! -f ".env" ]; then
    cp .env.example .env
fi
cd ..

if [ ! -f ".env" ]; then
    cp .env.example .env
fi

echo "=== Setup Completed Successfully! ==="
echo "Run 'make dev' to start local development servers."

