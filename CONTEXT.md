# VervoerManager Frontend – Context for AI Assistants

**Audience**: AI coding assistants (Cursor, Claude, etc.) and developers helping on this project.

## Start Here

1. **Read `docs/INDEX.md` first** – Master map of all documentation.
2. For a specific feature, read `docs/features/<FEATURE>.md`.
3. For API/auth/data, read `docs/api/`, `docs/auth/`, `docs/data/`.

## Project Identity

- **Name**: VervoerManager (Truck Management System)
- **Repo**: https://github.com/andreyroizin/trucks-management-frontend
- **Live URL**: https://vervoermanager.nl
- **Stack**: Next.js 15, React 19, MUI, next-intl, TanStack Query, Axios

## Quick Reference

- **i18n**: All routes under `/[locale]/`. Locales: `en`, `nl`, `bg`
- **Auth**: JWT in `localStorage` key `authToken`. Cookie `auth`. See `docs/auth/FLOW.md`
- **API**: `utils/api.ts`, `NEXT_PUBLIC_API_BASE_URL`. See `docs/api/CONTRACT.md`, `docs/api/ENDPOINTS.md`
- **Critical paths**: `utils/api.ts`, `hooks/useAuth.tsx`, `middleware.ts`, `app/[locale]/layout.tsx`

## When Implementing a Feature

1. Read the relevant `docs/features/<FEATURE>.md`
2. Update it (or create it) when you change behavior
3. See `docs/CONTRIBUTING_DOCS.md` for the doc extension checklist

## Related Repos

- **Backend**: https://github.com/Misha0501/trucks-management-backend
- **API**: https://api.vervoermanager.nl
