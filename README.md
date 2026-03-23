# VervoerManager Frontend

Next.js frontend for the VervoerManager truck/transport management system.

**Live**: https://vervoermanager.nl

## Quick Start

```bash
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` (e.g. `https://api.vervoermanager.nl` or local backend URL).

## Documentation

**Start here:** [docs/INDEX.md](docs/INDEX.md) – Master map of all documentation.

| Doc | Description |
|-----|-------------|
| [CONTEXT.md](CONTEXT.md) | Entry point for AI tools & teammates |
| [docs/CONTRIBUTING_DOCS.md](docs/CONTRIBUTING_DOCS.md) | How to extend docs when adding features |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture |
| [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) | Domain & Dutch terms |
| [docs/FRONTEND_GUIDE.md](docs/FRONTEND_GUIDE.md) | Next.js structure, patterns |
| [docs/api/CONTRACT.md](docs/api/CONTRACT.md) | API response envelope, DTOs |
| [docs/api/ENDPOINTS.md](docs/api/ENDPOINTS.md) | All API endpoints |
| [docs/auth/FLOW.md](docs/auth/FLOW.md) | JWT, login, roles |
| [docs/data/SCHEMA.md](docs/data/SCHEMA.md) | Database entities |
| [docs/setup/DEVELOPMENT.md](docs/setup/DEVELOPMENT.md) | Local dev setup |
| [docs/setup/DEPLOYMENT.md](docs/setup/DEPLOYMENT.md) | AWS Lightsail deployment |
| [docs/setup/ENV_REFERENCE.md](docs/setup/ENV_REFERENCE.md) | Environment variables |
| [docs/features/](docs/features/) | Feature docs (DRIVERS, RIDES, PARTRIDES, etc.) |
| [docs/requirements/](docs/requirements/) | Phase 1 index, glossary |

## Deploy

Merge to `main` → auto-deploy within ~2 minutes.

**Manual deploy:**
```bash
ssh ubuntu@3.73.183.137 "sudo /usr/local/bin/deploy-frontend"
```

**Logs:**
```bash
ssh ubuntu@3.73.183.137 "tail -f /var/log/auto-deploy-frontend.log"
```
