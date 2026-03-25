# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

VervoerManager — a truck/transport management system frontend. Live at https://vervoermanager.nl.

Stack: Next.js 15, React 19, MUI v6, Tailwind CSS, TanStack Query, Axios, next-intl, react-hook-form + yup.

## Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
```

No testing framework is configured. There are no test files.

## Environment

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_BASE_URL` (e.g. `https://api.vervoermanager.nl`).

## Architecture

### Routing & i18n

All routes live under `app/[locale]/` with Next.js App Router. Supported locales: `en`, `nl`, `bg`. Locale is always in the URL path. Translation files are in `messages/{en,nl,bg}.json`. The `middleware.ts` handles locale detection (from `NEXT_LOCALE` cookie), auth token extraction, and role-based route redirection.

### Providers (app/[locale]/providers.tsx)

Root layout wraps the app in: `QueryClientProvider` (TanStack Query) → `LanguageProvider` → `SnackProvider` (toast notifications) → `AuthProvider`.

### API Layer

`utils/api.ts` — Axios instance with interceptors that attach `Authorization: Bearer <token>` from localStorage and `Accept-Language` from locale cookie. All API responses follow `ApiResponse<T>` envelope: `{ isSuccess, statusCode, data, errors }`.

### Data Fetching Pattern

Each entity has hooks in `hooks/` (128 total). Pattern: `useQuery` with `queryKey: ['entityName', ...params]` and `keepPreviousData` for pagination. Mutations use `useMutation`. One hook file per entity (e.g. `hooks/useClients.ts`, `hooks/useDrivers.ts`).

### Auth

JWT stored in `localStorage['authToken']` + cookie `auth`. `hooks/useAuth.tsx` provides AuthContext. Roles: `driver`, `customerAdmin`, `globalAdmin`, `customerAccountant`, `employer`, `customer` (defined in `utils/constants/roles.ts`). Components check `user?.roles.includes(role)` for conditional rendering.

### Forms

react-hook-form with yup schemas via `@hookform/resolvers/yup`. Validation messages use `next-intl` translations.

### Components

58 reusable components in `components/`. Feature pages in `app/[locale]/`. Most components are client components (`'use client'`). UI combines MUI components with Tailwind utility classes.

## Documentation

Extensive docs in `docs/` — start with `docs/INDEX.md`. Feature docs in `docs/features/`. When changing features, update corresponding docs per `docs/CONTRIBUTING_DOCS.md` and `.cursorrules`.

## Path Alias

`@/*` maps to the project root (e.g. `@/components/...`, `@/hooks/...`).

## Deployment

Push to `main` → auto-deploy within ~2 minutes (cron pulls, builds, restarts via PM2 on AWS Lightsail).
