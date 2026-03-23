# VervoerManager Frontend – Technical Guide

## Tech Stack
- **Framework**: Next.js 15.1.4 (App Router), React 19
- **UI**: MUI (Material-UI) v6, Tailwind CSS
- **Data**: TanStack Query, Axios
- **i18n**: next-intl (en, nl, bg)
- **Forms**: react-hook-form, yup
- **Date**: dayjs, @mui/x-date-pickers

## Folder Structure

```
app/
  [locale]/                 # All routes under locale
    layout.tsx              # Root layout
    page.tsx                # Home
    auth/                   # Login, register, forgot password
    drivers/                # Driver list, create, edit, detail
    clients/                # Client CRUD
    rides/                  # Ride planning
    partrides/              # Part rides
    ...
components/                 # Reusable UI
hooks/                      # useAuth, useClients, useDrivers, etc.
utils/                      # api.ts, constants
messages/                   # en.json, nl.json, bg.json
types/                      # TypeScript types
providers/                  # LanguageProvider, SnackProvider
```

## API Usage
- **Client**: `utils/api.ts` – Axios instance with `Authorization: Bearer <token>`
- **Base URL**: `process.env.NEXT_PUBLIC_API_BASE_URL` (e.g. https://api.vervoermanager.nl)
- **Auth**: JWT in `localStorage.getItem('authToken')`. Cookie `auth` for middleware
- **Locale**: `Accept-Language` header from `Cookies.get('NEXT_LOCALE')`
- **Hooks**: `hooks/use*.ts` – Each entity has a hook (e.g. `useClients`, `useDrivers`)

## Routing & Auth
- **Middleware** (`middleware.ts`): Handles locale, role-based redirects for `/partrides`, `/disputes`
- **Roles**: From JWT claim `http://schemas.microsoft.com/ws/2008/06/identity/claims/role`
- **Protected routes**: Middleware can redirect unauthenticated users (currently relaxed)

## Key Patterns
1. **Pages**: Server components by default. Use `'use client'` for interactivity
2. **Data**: Hooks call `api.get/post/put/delete`. TanStack Query for caching
3. **Forms**: react-hook-form + yup validation
4. **Tables**: MUI DataGrid or custom tables with pagination
5. **Dialogs**: MUI Dialog for create/edit modals

## Environment
- `.env.local`: `NEXT_PUBLIC_API_BASE_URL`
- Build-time: `NEXT_PUBLIC_*` baked into client bundle
