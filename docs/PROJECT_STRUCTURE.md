# Project Structure Specification — AI Smart Bazar

## 1. Monorepo Directory Topology

```
ai-smart-bazar/
├── frontend/                     # React + Vite TypeScript Single-Page Application
│   ├── public/                   # Static public assets (favicons, SVG logos)
│   ├── src/
│   │   ├── app/                  # Application bootstrap, routing, providers, and query client
│   │   ├── assets/               # Fonts, shared static images, and brand vector icons
│   │   ├── components/           # Reusable UI component library (shadcn/ui, layout, navigation)
│   │   ├── config/               # App metadata, environment configuration, navigation routes
│   │   ├── features/             # Feature-packaged domain slices (auth, billing, products...)
│   │   ├── hooks/                # Global generic React custom hooks
│   │   ├── lib/                  # Centralized utilities, Axios API client, auth, formatters
│   │   ├── stores/               # Zustand state stores (auth, branch context)
│   │   ├── styles/               # Tailwind globals, color themes, responsive utilities
│   │   ├── types/                # Global domain interfaces and common response models
│   │   └── test/                 # Vitest test setup and unit test suites
│   ├── tests/                    # Playwright end-to-end integration test suites
│   ├── components.json           # shadcn/ui component configuration
│   ├── package.json              # Frontend dependencies and npm scripts
│   ├── tsconfig.json             # Root TypeScript project references configuration
│   ├── tsconfig.app.json         # Strict TypeScript application compiler options
│   └── vite.config.ts            # Vite bundler, path aliases, proxy, and build settings
│
├── backend/                      # FastAPI Python Modular Monolith API
│   ├── app/
│   │   ├── main.py               # FastAPI entry point, CORS, lifespan, and middleware registration
│   │   ├── core/                 # Configuration, logging, security, constants, and exceptions
│   │   ├── api/                  # API version router groupings (v1)
│   │   │   └── v1/
│   │   │       ├── router.py     # Central v1 endpoint aggregation
│   │   │       └── endpoints/    # Core endpoints (health checks, authentication, user identity)
│   │   ├── database/             # SQLAlchemy engine, session factory, mixins, and transactions
│   │   ├── modules/              # 24 standardized business domain packages
│   │   │   ├── organizations/    # Organization entity, schemas, and services
│   │   │   ├── branches/         # Multi-branch directory and access rules
│   │   │   ├── users/            # Enterprise user accounts
│   │   │   ├── products/         # Product catalog and SKU classifications
│   │   │   ├── inventory/        # Stock management and branch warehouse levels
│   │   │   ├── billing/          # POS counter checkout and invoicing
│   │   │   └── ...               # Additional business domains
│   │   ├── integrations/         # Cloud storage (S3/Local) and payment abstractions
│   │   └── utils/                # Shared pure utility functions
│   ├── alembic/                  # Database migration configuration and version scripts
│   ├── tests/                    # Pytest test suites (unit, integration, security)
│   ├── scripts/                  # Database verification and migration automation scripts
│   ├── requirements.txt          # Production Python dependencies
│   ├── requirements-dev.txt      # Development, testing, and linting tools
│   └── pyproject.toml            # Ruff, MyPy, and Pytest configuration
│
├── infrastructure/               # Deployment, containerization, and networking configs
│   ├── docker/                   # Optimized multi-stage Dockerfiles for backend and frontend
│   ├── nginx/                    # Production reverse proxy and static asset delivery config
│   └── deployment/               # Cloud architecture guidelines and hosting instructions
│
├── scripts/                      # Unified developer automation shell scripts (setup, dev, test, lint)
├── docs/                         # Technical documentation and architecture records
├── .github/workflows/            # GitHub Actions Continuous Integration automation
├── docker-compose.yml            # Multi-container local development orchestration
├── Makefile                      # Standardized developer CLI interface
└── README.md                     # Project introduction and developer quickstart
```

---

## 2. Feature Slicing Contract (Frontend)

Every domain feature inside `frontend/src/features/<feature-name>` must follow this sub-directory contract:
- `components/`: UI components exclusive to this feature (e.g. `ProductCard.tsx`, `InvoiceTable.tsx`).
- `hooks/`: Feature-scoped custom React hooks (e.g. `useProductSearch.ts`).
- `services/`: Axios endpoint invocations (e.g. `productService.ts`).
- `schemas/`: Zod validation schemas for inputs and mutations (e.g. `productFormSchema.ts`).
- `types/`: Domain-specific TypeScript types and payload interfaces.
- `pages/`: Route-level entry page components.

---

## 3. Module Slicing Contract (Backend)

Every domain module inside `backend/app/modules/<module_name>` contains:
- `models.py`: SQLAlchemy database entities mapped with `BranchScopedMixin`.
- `schemas.py`: Pydantic input/output validation models.
- `repository.py`: Encapsulated database queries.
- `service.py`: Business workflow logic and transaction handling.
- `router.py`: FastAPI endpoints.
