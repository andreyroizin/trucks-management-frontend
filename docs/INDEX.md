# VervoerManager – Documentation Index

**Start here.** Read this to find what to read next. All paths are relative to `docs/`.

---

## System overview

| Doc | Description |
|-----|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Deployment, services, URLs, infra |
| [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) | Domain, Dutch terms, roles, workflows |

---

## API & Auth

| Doc | Description |
|-----|-------------|
| [api/CONTRACT.md](api/CONTRACT.md) | Response envelope, pagination, DTOs |
| [api/ENDPOINTS.md](api/ENDPOINTS.md) | All API endpoints by resource |
| [auth/FLOW.md](auth/FLOW.md) | JWT, login, logout, roles |

---

## Data

| Doc | Description |
|-----|-------------|
| [data/SCHEMA.md](data/SCHEMA.md) | ER sketch, entities, relationships |
| [data/ENTITIES.md](data/ENTITIES.md) | Detailed entity descriptions (extend per entity) |

---

## Features (source of truth for behavior)

| Doc | Description |
|-----|-------------|
| [features/DRIVERS.md](features/DRIVERS.md) | Driver management, contracts, onboarding |
| [features/CONTRACT_TYPES.md](features/CONTRACT_TYPES.md) | R24 – CAO / ZZP / Inleen / Brief Loonschaal contract types |
| [features/RIDES.md](features/RIDES.md) | Ride planning, assignment, execution |
| [features/PARTRIDES.md](features/PARTRIDES.md) | Part rides, approvals, disputes |
| [features/CLIENTS.md](features/CLIENTS.md) | Client CRUD, rates, surcharges |
| [features/COMPANIES.md](features/COMPANIES.md) | Company management |
| [features/PLANNING.md](features/PLANNING.md) | Weekly/daily planning, capacity |
| [features/INVOICING.md](features/INVOICING.md) | Driver invoices, reports |
| [features/MODULE_TOGGLES.md](features/MODULE_TOGGLES.md) | Module toggle system — per-admin feature access control |
| [features/ANNUAL_STATEMENTS.md](features/ANNUAL_STATEMENTS.md) | Jaaropgave: year-end & departure statements |

---

## Setup & Deployment

| Doc | Description |
|-----|-------------|
| [setup/DEVELOPMENT.md](setup/DEVELOPMENT.md) | Local dev setup |
| [setup/DEPLOYMENT.md](setup/DEPLOYMENT.md) | AWS Lightsail deployment |
| [setup/SSH_SERVER_ACCESS.md](setup/SSH_SERVER_ACCESS.md) | SSH to production (Lightsail key, AWS CLI) |
| [setup/ENV_REFERENCE.md](setup/ENV_REFERENCE.md) | Environment variables |

---

## Technical guides (frontend)

| Doc | Description |
|-----|-------------|
| [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md) | Next.js structure, hooks, patterns |

---

## Requirements

| Doc | Description |
|-----|-------------|
| [requirements/PHASE1_INDEX.md](requirements/PHASE1_INDEX.md) | Phase 1 requirements index |
| [requirements/GLOSSARY.md](requirements/GLOSSARY.md) | Dutch & domain glossary |

---

## Contributing to docs

See [CONTRIBUTING_DOCS.md](CONTRIBUTING_DOCS.md) for how to extend this documentation.
