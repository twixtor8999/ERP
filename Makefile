.PHONY: help setup dev test lint migrate backend frontend docker-up docker-down

help:
	@echo "AI Smart Bazar ERP — Development Commands:"
	@echo "  make setup     - Initialize python venv, dependencies, and frontend packages"
	@echo "  make dev       - Run backend and frontend concurrently for local development"
	@echo "  make test      - Run all frontend and backend tests"
	@echo "  make lint      - Run code quality linters (Ruff, ESLint, TypeScript check)"
	@echo "  make migrate   - Run Alembic database migrations"
	@echo "  make backend   - Start backend FastAPI development server"
	@echo "  make frontend  - Start frontend Vite development server"
	@echo "  make docker-up - Launch Docker Compose stack"
	@echo "  make docker-down - Stop Docker Compose stack"

setup:
	@bash scripts/setup.sh

dev:
	@bash scripts/dev.sh

test:
	@bash scripts/test.sh

lint:
	@bash scripts/lint.sh

migrate:
	@cd backend && venv/bin/alembic upgrade head

backend:
	@cd backend && venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend:
	@cd frontend && npm run dev

docker-up:
	@docker compose up -d

docker-down:
	@docker compose down
