# Plan: Feature Toggles — UI Only

## Context

VervoerManager needs per-customerAdmin module subscriptions. The backend + database is the **single source of truth** for all feature toggle state. Feature toggles are assigned **per customerAdmin** — when an admin has access to a feature, it's enabled for all their companies (customers). This plan covers **only the frontend UI** — a beautiful MUI admin page where a globalAdmin can view and manage feature toggles per customerAdmin. No backend wiring, no providers, no route guards, no middleware changes. Those will be built in a follow-up task.

---

## What We're Building

A **Feature Toggles management page** accessible to globalAdmin users, built with Material UI, matching the existing app's design language. The page shows a list of companies with toggle switches for each optional module.

### Module Structure (display only)

| Module | Description | Always On |
|--------|-------------|-----------|
| **Base** | Drivers, Vehicles, Clients, Companies | Yes (shown as always-on, not toggleable) |
| **Planning** | Ride planning, scheduling, hours | No |
| **Finance** | Payroll, invoicing, reports | No |
| **HR** | Contracts, HR letters, employee management | No |

---

## Implementation

### Step 1: Feature Toggles Page

**CREATE** `app/[locale]/admins/feature-toggles/page.tsx`

- `'use client'` component
- globalAdmin role check (redirect if not globalAdmin, matching existing pattern from other admin pages)
- Page title: "Feature Toggles"
- Search bar to filter companies by name
- Renders `<FeatureToggleManager />` component

### Step 2: FeatureToggleManager Component

**CREATE** `components/FeatureToggleManager.tsx`

MUI-based table/card view displaying companies and their module toggles.

**Layout options (cards approach recommended for visual appeal):**

- **Card grid**: Each company is an MUI `Card` with the company name as header and a list of module toggles inside. Visually rich, easy to scan.
- Module rows inside each card show: module name, description, and an MUI `Switch`
- Base module shown with a disabled/always-on switch + chip label "Always included"
- Optional modules (Planning, Finance, HR) each get an active `Switch`
- Color coding: enabled = primary color, disabled = grey

**UI Elements:**
- `TextField` with search icon for company filter
- `Card` per company with `CardHeader` (company name) and `CardContent` (module list)
- `Switch` components for each toggleable module
- `Chip` labels showing module status
- `Pagination` component at the bottom
- Loading skeleton while data would load (placeholder with mock data for now)
- Empty state if no companies match the search

**Mock data**: Use hardcoded sample data (5-6 companies with various toggle states) so the UI can be reviewed visually. The mock data will be replaced with real API calls in the next task.

### Step 3: Module Config Constants

**CREATE** `utils/constants/featureModules.ts`

Central definition of modules for the UI to reference:

```ts
export const FEATURE_MODULES = [
  { id: 'base', label: 'Base', description: 'Drivers, Vehicles, Clients, Companies', alwaysOn: true },
  { id: 'planning', label: 'Planning', description: 'Ride planning, scheduling, hours', alwaysOn: false },
  { id: 'finance', label: 'Finance', description: 'Payroll, invoicing, reports', alwaysOn: false },
  { id: 'hr', label: 'HR', description: 'Contracts, HR letters, employee management', alwaysOn: false },
];
```

### Step 4: Navigation Link

**MODIFY** `components/SideNavigation.tsx`

Add a "Feature Toggles" nav item visible only to globalAdmin, under or near the existing "Admins" item. Uses an appropriate MUI icon (e.g., `ToggleOnIcon` or `TuneIcon`).

### Step 5: Translations

**MODIFY** `messages/en.json`, `messages/nl.json`, `messages/bg.json`

Add `featureToggles` namespace:
- `title`: "Feature Toggles" / "Functie Schakelaars" / "Превключватели на функции"
- `search`: "Search companies..."
- `base`, `planning`, `finance`, `hr`: module labels
- `alwaysIncluded`: "Always included"
- `enabled`, `disabled`: toggle status labels
- `description_base`, `description_planning`, `description_finance`, `description_hr`: module descriptions
- `noResults`: "No companies found"

---

## Files Summary

| File | Action |
|------|--------|
| `utils/constants/featureModules.ts` | CREATE |
| `components/FeatureToggleManager.tsx` | CREATE |
| `app/[locale]/admins/feature-toggles/page.tsx` | CREATE |
| `components/SideNavigation.tsx` | MODIFY (add nav item) |
| `messages/en.json` | MODIFY (add translations) |
| `messages/nl.json` | MODIFY (add translations) |
| `messages/bg.json` | MODIFY (add translations) |

---

## What This Plan Does NOT Include (deferred to next task)

- Backend API integration (hooks, data fetching)
- FeatureToggleProvider / context
- ModuleGuard route protection
- Middleware changes
- Navigation gating (hiding nav items based on toggles)
- Cookie sync

---

## Verification

1. Navigate to `/admins/feature-toggles` as globalAdmin — page renders with mock company data
2. Toggle switches are interactive (local state only, no API calls)
3. Search filters companies by name
4. "Feature Toggles" nav item appears in sidebar for globalAdmin only
5. UI matches MUI design language of the rest of the app
6. `npm run build` passes
