# Development Setup Guide — AI Smart Bazar ERP

This document outlines instructions for setting up the local development environment across Linux, macOS, and Windows.

---

## 1. Prerequisites

- **Python**: Version 3.12+
- **Node.js**: Version 20+ (v22 recommended) with npm 10+
- **PostgreSQL**: Version 16+ (or Docker)
- **Docker & Docker Compose** (Optional, recommended for isolated dependencies)
- **Make** (Native on Linux/macOS; available on Windows via WSL2 or Chocolatey)

---

## 2. Linux & macOS Setup Instructions

### Automated Setup
```bash
# Clone the repository
git clone <repository-url>
cd ai-smart-bazar

# Run automated dependency installation
make setup
```

### Starting Local Development
```bash
# Start backend (port 8000) and frontend (port 5173) concurrently
make dev
```

### Running Tests and Linting
```bash
# Run all frontend Vitest and backend Pytest test suites
make test

# Run Ruff, MyPy, and Vite TypeScript checks
make lint
```

---

## 3. Windows Setup Instructions (Native PowerShell / CMD)

### Backend Setup:
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements-dev.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup:
```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

---

## 4. Docker Compose Setup (All Operating Systems)

To run the complete stack including PostgreSQL 16 container, FastAPI backend, and Vite Nginx frontend:

```bash
docker compose up -d
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Swagger Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/v1/health

