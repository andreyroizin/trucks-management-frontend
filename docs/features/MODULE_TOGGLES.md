# Module Toggles

Module Toggles is a subscription-tier access control system that allows the **globalAdmin** to enable or disable feature modules for each **customerAdmin**. When a module is enabled for a customerAdmin, it is automatically enabled for all companies and drivers under their account.

---

## Modules

| Module | Always On | What it controls |
|--------|-----------|-----------------|
| **Base** | Yes | Drivers, vehicles, clients, companies — core functionality always available |
| **Planning** | No | Ride planning, work management, scheduling, driver ride history |
| **Finance** | No | Invoice generation for drivers |
| **HR** | No | Contract generation, PDF download, contract history on driver detail page |

---

## How it works

### Backend

Three API endpoints power this feature:

| Method | Endpoint | Who can call | Description |
|--------|----------|--------------|-------------|
| `GET` | `/my-modules` | Any authenticated user | Returns the list of enabled module names for the current user |
| `GET` | `/admins/{adminUserId}/modules` | globalAdmin | Returns all modules (enabled/disabled) for a specific customerAdmin |
| `PUT` | `/admins/{adminUserId}/modules/{module}` | globalAdmin | Enables or disables a module for a customerAdmin |

The `GET /my-modules` response shape:
```json
{ "enabledModules": ["Base", "Planning", "Finance", "HR"] }
```

The `GET /admins/{id}/modules` response shape (array of `AdminModuleDto`):
```json
[
  { "module": "Base", "isEnabled": true, "enabledAt": "...", "disabledAt": null },
  { "module": "Planning", "isEnabled": false, "enabledAt": null, "disabledAt": "..." }
]
```

**globalAdmin always has access to all modules** — the backend bypasses module checks for globalAdmin.

---

### Frontend files

| File | Purpose |
|------|---------|
| `hooks/useFeatureModules.ts` | TanStack Query hooks: `useMyModules`, `useAdminModules`, `useToggleAdminModule` |
| `providers/FeatureModuleProvider.tsx` | React context exposing `isModuleEnabled(module)` to all components |
| `utils/constants/featureModules.ts` | Static module definitions (id, label key, description key, icon, alwaysOn flag) |
| `components/FeatureToggleManager.tsx` | Admin UI — grid of customerAdmin cards with per-module toggle switches |
| `app/[locale]/admins/module-toggles/page.tsx` | Page wrapping `FeatureToggleManager`, restricted to globalAdmin |

---

### Provider behaviour

`FeatureModuleProvider` wraps the app inside `AuthProvider` (see `app/[locale]/providers.tsx`). It calls `GET /my-modules` once when the user is authenticated and caches the result for 5 minutes.

```
QueryClientProvider
  └── AuthProvider
        └── FeatureModuleProvider   ← loads /my-modules
              └── page content
```

`isModuleEnabled(module: string): boolean` rules:
- `'Base'` → always `true`
- While loading → returns `true` (prevents content flash)
- Otherwise → checks if the module name is in `enabledModules[]`

---

## Navigation gating

Modules gate navigation items so disabled users do not see irrelevant sections.

| Module | Gated UI |
|--------|---------|
| **Planning** | Side navigation: Planning section, Work Management section. Mobile navigation: My Rides, Pending, Disputes, Archived |
| **Finance** | Side navigation: Reports link |
| **HR** | _(no nav items gated — HR features are within existing pages)_ |

---

## In-page gating

Modules also gate specific actions inside pages. The general pattern is:

- Content is **visible but greyed out** (`opacity: 0.45`, `pointerEvents: none`)
- A **warning message** explains why the action is unavailable
- A **lock chip or tooltip** labels the restriction
- **Background processing continues** — nothing is prevented at the data level, only the UI interaction is blocked

### Contract section (Driver detail page)

**File:** `app/[locale]/drivers/[id]/page.tsx`
**Module:** HR

When HR is disabled for the driver's customerAdmin:
- The entire Contract section (version info, status, file size, Download PDF, Regenerate Contract, version history) is overlaid with a semi-transparent mask
- A lock chip labelled "HR module required" appears in the top-right corner of the section
- Buttons cannot be clicked

### Generate Invoice button (Signed week page)

**File:** `app/[locale]/weeks/signed/[key]/page.tsx`
**Module:** Finance

When Finance is disabled for the driver's customerAdmin:
- A warning alert appears above the button: _"Invoice generation is disabled because the Finance module is turned off for your organization. Please contact your administrator to enable it."_
- The Generate Invoice button is disabled and greyed out
- Hovering shows a tooltip: "Finance module required"

---

## Admin UI — Module Toggles page

**Route:** `/admins/module-toggles` (globalAdmin only)

The page shows a paginated, searchable grid of customerAdmin cards. Each card:
- Shows the admin's name, email, avatar initials
- Lists their associated companies as chips (up to 3, then `+N`)
- Shows all 4 modules with a toggle switch for each toggleable one
- Base module shows a lock icon with "Always included" — cannot be toggled
- Toggling a switch calls `PUT /admins/{adminUserId}/modules/{module}` immediately
- The enabled count chip (e.g. `3/4 active`) updates optimistically via TanStack Query cache

Search filters admins by name, email, or company. Pagination supports 6, 9, or 12 cards per page.

---

## Adding a new module gate

1. Add the module to `FEATURE_MODULES` in `utils/constants/featureModules.ts`
2. Use `const { isModuleEnabled } = useFeatureModules()` in the target component
3. Wrap the gated UI following the in-page gating pattern above (overlay + warning message)
4. Add translation keys under `moduleToggles.modules.<id>` in all 3 message files (`en`, `nl`, `bg`)
5. If a nav item should be hidden, add `{isModuleEnabled('ModuleName') && (...)}` in `SideNavigation.tsx` and/or `MobileNavigationDriver.tsx`

---

## Translation keys

All module toggle UI strings live under the `moduleToggles` namespace in `messages/{en,nl,bg}.json`:

```
moduleToggles.title
moduleToggles.subtitle
moduleToggles.searchPlaceholder
moduleToggles.active
moduleToggles.alwaysIncluded
moduleToggles.noResults
moduleToggles.loadError
moduleToggles.noPermission
moduleToggles.modules.base.label / .description
moduleToggles.modules.planning.label / .description
moduleToggles.modules.finance.label / .description
moduleToggles.modules.hr.label / .description
```

In-page gate strings live alongside their feature's existing namespace (e.g. `drivers.detail.contracts.hrModuleRequired`, `weeks.driver.signed.financeModuleDisabledMessage`).
