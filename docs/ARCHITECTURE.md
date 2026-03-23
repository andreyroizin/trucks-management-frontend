# VervoerManager – System Architecture

## High-Level Overview

```
┌─────────────────────┐     HTTPS      ┌─────────────────────┐
│   Users (Browser)   │ ◄────────────►│  AWS Lightsail      │
│   vervoermanager.nl │                │  3.73.183.137       │
└─────────────────────┘                │                     │
                                       │  Nginx (reverse     │
                                       │   proxy)             │
                                       │                     │
                                       │  ┌───────────────┐  │
                                       │  │ Frontend      │  │
                                       │  │ Next.js + PM2 │  │
                                       │  │ Port 3000     │  │
                                       │  └───────┬───────┘  │
                                       │          │         │
                                       │  ┌───────▼───────┐  │
                                       │  │ Backend API   │  │
                                       │  │ .NET 9 Docker │  │
                                       │  │ Port 9090     │  │
                                       │  └───────┬───────┘  │
                                       │          │         │
                                       │  ┌───────▼───────┐  │
                                       │  │ PostgreSQL    │  │
                                       │  │ Port 5460     │  │
                                       │  └───────────────┘  │
                                       └─────────────────────┘
```

## Repositories

| Repo | Purpose | URL |
|------|---------|-----|
| trucks-management-frontend | Next.js web app | https://github.com/andreyroizin/trucks-management-frontend |
| trucks-management-backend | .NET API + DB | https://github.com/Misha0501/trucks-management-backend |

## Live URLs
- **Website**: https://vervoermanager.nl
- **API**: https://api.vervoermanager.nl
- **Server**: `ubuntu@3.73.183.137` (AWS Lightsail)

## Data Flow
1. User → Frontend (Next.js) → API calls via Axios
2. API calls include `Authorization: Bearer <JWT>` and `Accept-Language`
3. Backend → PostgreSQL, file storage (`/var/www/storage`)
4. Backend uses JWT auth, CORS AllowAll (same origin in prod)

## Deployment Model
- **Trigger**: Push to `main` on either repo
- **CI**: GitHub Actions validates build (no deploy from CI)
- **Server**: Cron every 2 min checks for new commits, runs deploy script
- **Backend deploy**: `git pull` → `docker compose build truckmanagement` → `up -d --no-deps`
- **Frontend deploy**: `git pull` → `npm ci` → `npm run build` → `pm2 reload trucks-frontend`
