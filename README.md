# AI Smart Bazar — Enterprise ERP

**AI Smart Bazar** is a modern, modular-monolith Enterprise Resource Planning (ERP) platform developed for **Siddeshwar Enterprises**. The application is designed desktop-first with comprehensive responsive support across tablets and mobile web browsers (including Chrome, Edge, and Android Chrome).

---

## 🏛️ Architecture Overview

The system follows a strict **Modular Monolith** architecture designed for cloud deployment:

- **Frontend**: React 18/19, Vite, TypeScript (strict mode), Tailwind CSS, shadcn/ui (Radix UI primitives), Lucide React, TanStack Query, Zustand, React Hook Form, Zod, and Sonner.
- **Backend**: Python 3.12, FastAPI, Uvicorn, SQLAlchemy 2.x, Psycopg 3, Pydantic v2, Alembic, and Argon2 password hashing.
- **Database**: PostgreSQL 16+ with connection pooling and multi-branch isolation scoping.
- **Security**: In-memory access token storage (zero tokens in browser `localStorage`), rotating HttpOnly secure refresh cookies, server-side branch authorization validation, rate limiting, and structured JSON audit logging.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.12+
- Node.js 20+ (v22 recommended) and npm
- Docker and Docker Compose (optional for containerized runtime)

### Local Development Setup

1. **Automated Setup**:
   ```bash
   make setup
   ```

2. **Launch Dev Servers**:
   ```bash
   make dev
   ```
   - **Frontend UI**: http://localhost:5173
   - **Backend API & Swagger Docs**: http://localhost:8000/docs
   - **Health Check**: http://localhost:8000/api/v1/health

3. **Run Quality Assurance**:
   ```bash
   make test
   make lint
   ```

---

## 🐳 Docker Compose Deployment

To spin up the entire multi-service stack locally:
```bash
docker compose up -d
```
Services initialized:
- `frontend`: Nginx container serving optimized SPA build (Port 5173)
- `backend`: FastAPI Uvicorn service with health probes (Port 8000)
- `postgres`: Isolated PostgreSQL 16 database with persistent storage volume

---

## 📚 Technical Documentation Directory

Comprehensive architectural specifications are located in the [`docs/`](./docs) directory:

| Document | Purpose |
| :--- | :--- |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | High-level system architecture, tiers, and data flow |
| [PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md) | Directory structure, module layout, and naming conventions |
| [DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md) | Multi-tenant schema design, entities, and relationship models |
| [API_CONVENTIONS.md](./docs/API_CONVENTIONS.md) | REST design, response shapes, error handling, and headers |
| [RBAC_DESIGN.md](./docs/RBAC_DESIGN.md) | Roles, permissions matrix, and authorization policies |
| [MULTI_BRANCH_DESIGN.md](./docs/MULTI_BRANCH_DESIGN.md) | Multi-branch scoping, data isolation, and branch switching |
| [DEVELOPMENT_SETUP.md](./docs/DEVELOPMENT_SETUP.md) | Step-by-step developer environment setup for Linux, macOS, and Windows |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Cloud-agnostic container deployment specifications |
| [DATA_MIGRATION_PLAN.md](./docs/DATA_MIGRATION_PLAN.md) | Legacy client data ingestion, mapping, and validation framework |
| [IMPLEMENTATION_STATUS.md](./docs/IMPLEMENTATION_STATUS.md) | Phase roadmap, completed components, and milestone tracking |
