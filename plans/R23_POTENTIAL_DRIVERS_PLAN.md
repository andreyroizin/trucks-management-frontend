# R23 — Potential Driver Management: Implementation Plan

**Requirement**: Customer admins can add, track, and convert potential driver candidates (prospects) linked to their company before they become active drivers.

**Status in requirements doc**: ✅ READY TO IMPLEMENT (line 370 in `plans/requirments/Phase 1 Business Requirements final.md`)

**Estimated complexity**: Medium (new entity + CRUD + conversion flow, no breaking changes)

---

## What Exists Today

| Area | File / Location | Notes |
|---|---|---|
| Driver entity | `backend/TruckManagement/Entities/Driver.cs` | Full driver record; no "prospect" state |
| Company entity | `backend/TruckManagement/Entities/Company.cs` | Companies that drivers belong to |
| Driver endpoints | `backend/TruckManagement/Endpoints/DriverEndpoints.cs` | Full CRUD for active drivers |
| Driver list page | `frontend/app/[locale]/drivers/page.tsx` | Lists active drivers only |
| Driver create page | `frontend/app/[locale]/drivers/create/page.tsx` | Creates full driver immediately |
| Driver detail page | `frontend/app/[locale]/drivers/[id]/page.tsx` | Shows full active driver |
| useDrivers hook | `frontend/hooks/useDrivers.ts` | Fetches active drivers |
| useCreateDriver hook | `frontend/hooks/useCreateDriver.ts` | Creates active driver |

**Nothing** currently tracks candidates before they become drivers. There is no Prospect/PotentialDriver concept anywhere in backend or frontend.

---

## Implementation Steps

### STEP 1 — Backend: New `PotentialDriver` Entity

**File to create**: `backend/TruckManagement/Entities/PotentialDriver.cs`

```csharp
public class PotentialDriver
{
    public Guid Id { get; set; }

    // Company link
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = default!;

    // Basic info
    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }

    // Recruitment tracking
    public string Status { get; set; } = "New";
    // Valid values: New | Contacted | Interviewing | OfferMade | Accepted | Rejected | Converted
    public string? Notes { get; set; }
    public string? Source { get; set; }
    // Valid values: Referral | JobBoard | LinkedIn | WalkIn | Other
    public int? ExperienceYears { get; set; }
    public bool? HasCELicense { get; set; }

    // Dates
    public DateTime? FirstContactDate { get; set; }
    public DateTime? LastContactDate { get; set; }
    public DateTime? ExpectedStartDate { get; set; }

    // Conversion
    public Guid? ConvertedToDriverId { get; set; }
    public Driver? ConvertedToDriver { get; set; }
    public DateTime? ConvertedAt { get; set; }

    // Audit
    public string? CreatedByUserId { get; set; }
    public ApplicationUser? CreatedByUser { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; } = false;
}
```

**File to edit**: `backend/TruckManagement/Data/ApplicationDbContext.cs`

Add `DbSet`:
```csharp
public DbSet<PotentialDriver> PotentialDrivers { get; set; }
```

Add to `OnModelCreating`:
```csharp
modelBuilder.Entity<PotentialDriver>(e =>
{
    e.HasKey(x => x.Id);
    e.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
    e.HasOne(x => x.ConvertedToDriver).WithMany().HasForeignKey(x => x.ConvertedToDriverId).OnDelete(DeleteBehavior.SetNull);
    e.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedByUserId).OnDelete(DeleteBehavior.SetNull);
    e.Property(x => x.Status).HasMaxLength(50);
    e.Property(x => x.Source).HasMaxLength(100);
});
```

---

### STEP 2 — Backend: EF Core Migration

Run from backend project root:
```bash
dotnet ef migrations add AddPotentialDrivers
dotnet ef database update
```

This creates the `PotentialDrivers` table. No existing tables are touched.

---

### STEP 3 — Backend: DTOs

**File to create**: `backend/TruckManagement/DTOs/PotentialDriverDto.cs`

```csharp
public class PotentialDriverDto
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string Status { get; set; } = default!;
    public string? Notes { get; set; }
    public string? Source { get; set; }
    public int? ExperienceYears { get; set; }
    public bool? HasCELicense { get; set; }
    public DateTime? FirstContactDate { get; set; }
    public DateTime? LastContactDate { get; set; }
    public DateTime? ExpectedStartDate { get; set; }
    public Guid? ConvertedToDriverId { get; set; }
    public DateTime? ConvertedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
```

**File to create**: `backend/TruckManagement/DTOs/CreatePotentialDriverRequest.cs`

```csharp
public class CreatePotentialDriverRequest
{
    [Required] public string CompanyId { get; set; } = default!;
    [Required, MaxLength(100)] public string FirstName { get; set; } = default!;
    [Required, MaxLength(100)] public string LastName { get; set; } = default!;
    [EmailAddress] public string? Email { get; set; }
    [MaxLength(50)] public string? PhoneNumber { get; set; }
    public string Status { get; set; } = "New";
    public string? Notes { get; set; }
    public string? Source { get; set; }
    public int? ExperienceYears { get; set; }
    public bool? HasCELicense { get; set; }
    public DateTime? FirstContactDate { get; set; }
    public DateTime? LastContactDate { get; set; }
    public DateTime? ExpectedStartDate { get; set; }
}
```

**File to create**: `backend/TruckManagement/DTOs/UpdatePotentialDriverRequest.cs`

```csharp
public class UpdatePotentialDriverRequest
{
    [MaxLength(100)] public string? FirstName { get; set; }
    [MaxLength(100)] public string? LastName { get; set; }
    [EmailAddress] public string? Email { get; set; }
    [MaxLength(50)] public string? PhoneNumber { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
    public string? Source { get; set; }
    public int? ExperienceYears { get; set; }
    public bool? HasCELicense { get; set; }
    public DateTime? FirstContactDate { get; set; }
    public DateTime? LastContactDate { get; set; }
    public DateTime? ExpectedStartDate { get; set; }
}
```

---

### STEP 4 — Backend: Endpoints

**File to create**: `backend/TruckManagement/Endpoints/PotentialDriverEndpoints.cs`

Register in `Program.cs` alongside other endpoint groups.

**Endpoints to implement**:

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/potential-drivers` | customerAdmin, globalAdmin, employer | List (auto-filtered by company for customerAdmin) |
| `GET` | `/api/potential-drivers/{id}` | customerAdmin, globalAdmin, employer | Get single prospect |
| `POST` | `/api/potential-drivers` | customerAdmin, globalAdmin | Create new prospect |
| `PUT` | `/api/potential-drivers/{id}` | customerAdmin, globalAdmin | Update prospect |
| `DELETE` | `/api/potential-drivers/{id}` | customerAdmin, globalAdmin | Soft-delete prospect |
| `POST` | `/api/potential-drivers/{id}/convert-to-driver` | customerAdmin, globalAdmin | Convert prospect to driver |

**Authorization logic** (same pattern as `DriverEndpoints.cs`):
- `globalAdmin` → sees/manages all companies' prospects
- `customerAdmin` → auto-filters to their `CompanyId`, cannot access other companies' prospects
- `employer` → read-only access to their managed companies

**Filtering on GET /api/potential-drivers**:
- Query params: `?status=Contacted&search=Jan&companyId=...&page=1&pageSize=20`
- `customerAdmin` ignores `companyId` param; uses their own company

**Convert-to-driver logic** (`POST /api/potential-drivers/{id}/convert-to-driver`):
- Validates prospect is not already converted (`ConvertedToDriverId == null`)
- Returns pre-filled driver creation data (FirstName, LastName, Email, PhoneNumber, CompanyId) as a `ConvertToDriverPrefilledDto`
- Does NOT create the driver itself — the frontend then opens the driver creation form pre-filled
- After the driver is created via `POST /api/drivers`, call `PATCH /api/potential-drivers/{id}/mark-converted?driverId={newDriverId}` to link them

**Alternative simpler convert flow**: `POST /api/potential-drivers/{id}/convert-to-driver` accepts an optional `CreateDriverRequest` body. If provided, creates the driver atomically and links. If not, returns pre-fill data. **Recommended**: simpler for the frontend.

---

### STEP 5 — Backend: Register Endpoints in Program.cs

**File to edit**: `backend/TruckManagement/Program.cs`

Add alongside existing endpoint registrations:
```csharp
app.MapPotentialDriverEndpoints();
```

---

### STEP 6 — Frontend: API Types

**File to create/edit**: `frontend/types/potentialDriver.ts`

```typescript
export type PotentialDriverStatus =
  | 'New'
  | 'Contacted'
  | 'Interviewing'
  | 'OfferMade'
  | 'Accepted'
  | 'Rejected'
  | 'Converted';

export type PotentialDriverSource =
  | 'Referral'
  | 'JobBoard'
  | 'LinkedIn'
  | 'WalkIn'
  | 'Other';

export interface PotentialDriver {
  id: string;
  companyId: string;
  companyName?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  status: PotentialDriverStatus;
  notes?: string;
  source?: PotentialDriverSource;
  experienceYears?: number;
  hasCELicense?: boolean;
  firstContactDate?: string;
  lastContactDate?: string;
  expectedStartDate?: string;
  convertedToDriverId?: string;
  convertedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePotentialDriverRequest {
  companyId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  status?: PotentialDriverStatus;
  notes?: string;
  source?: PotentialDriverSource;
  experienceYears?: number;
  hasCELicense?: boolean;
  expectedStartDate?: string;
}

export interface UpdatePotentialDriverRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  status?: PotentialDriverStatus;
  notes?: string;
  source?: PotentialDriverSource;
  experienceYears?: number;
  hasCELicense?: boolean;
  expectedStartDate?: string;
}
```

---

### STEP 7 — Frontend: Hooks

**File to create**: `frontend/hooks/usePotentialDrivers.ts`

Follows the same pattern as `hooks/useDrivers.ts`. Fetches list with optional filters (status, search, companyId).

**File to create**: `frontend/hooks/usePotentialDriverDetail.ts`

Follows `hooks/useDriverWithContract.ts` pattern. Fetches single prospect by ID.

**File to create**: `frontend/hooks/useCreatePotentialDriver.ts`

Mutation hook. Posts to `/api/potential-drivers`.

**File to create**: `frontend/hooks/useUpdatePotentialDriver.ts`

Mutation hook. Puts to `/api/potential-drivers/{id}`.

**File to create**: `frontend/hooks/useDeletePotentialDriver.ts`

Mutation hook. Soft-deletes via DELETE `/api/potential-drivers/{id}`.

**File to create**: `frontend/hooks/useConvertToDriver.ts`

Mutation hook. Posts to `/api/potential-drivers/{id}/convert-to-driver`. Returns pre-filled driver data.

---

### STEP 8 — Frontend: Pages

**Directory structure to create**:
```
app/[locale]/potential-drivers/
  page.tsx               ← List of prospects
  create/
    page.tsx             ← Add new prospect form
  [id]/
    page.tsx             ← Prospect detail view
  edit/
    [id]/
      page.tsx           ← Edit prospect form
```

#### A. List Page — `app/[locale]/potential-drivers/page.tsx`

Layout follows `app/[locale]/drivers/page.tsx` pattern.

**UI elements**:
- Page header: "Potentiële chauffeurs" + "Nieuwe toevoegen" button
- Filter bar: Status dropdown (All / New / Contacted / Interviewing / OfferMade / Accepted / Rejected / Converted) + search field
- MUI `DataGrid` or table with columns:
  - Name (linked to detail page)
  - Phone
  - Email
  - Status (colored chip: New=gray, Contacted=blue, Interviewing=orange, OfferMade=purple, Accepted=green, Rejected=red, Converted=teal)
  - Expected Start
  - Company (globalAdmin only)
  - Actions: View | Edit | Convert (hidden if already Converted)
- Pagination

#### B. Create/Edit Form — `create/page.tsx` and `edit/[id]/page.tsx`

Shared form component. Uses `react-hook-form` + `yup` (same pattern as driver forms).

**Fields**:
- First Name (`required`)
- Last Name (`required`)
- Email (`optional`, email validation)
- Phone Number (`optional`)
- Company (`Select` — pre-filled + read-only for customerAdmin; editable for globalAdmin)
- Status (`Select` — defaults to "New")
- Source (`Select` — optional: Referral, JobBoard, LinkedIn, WalkIn, Other)
- Expected Start Date (`DatePicker`)
- Experience Years (`number`, optional)
- CE License (`Checkbox`, optional)
- Notes (`Textarea`, optional)

#### C. Detail Page — `[id]/page.tsx`

**Layout**:
- Back button → `/potential-drivers`
- Info card: all prospect fields displayed
- Status chip (colored)
- Action buttons:
  - "Bewerken" → edit page
  - "Verwijderen" → confirmation dialog → soft delete
  - "Converteren naar chauffeur" → only shown if `status !== 'Converted'`
- If `convertedToDriverId` is set: "Bekijk chauffeursprofiel" link → `/drivers/{convertedToDriverId}`

#### D. Convert Flow

When "Converteren naar chauffeur" is clicked:
1. Call `useConvertToDriver` → backend returns pre-filled driver data
2. Navigate to `/drivers/create?prefill=...` (pass data via URL query params or session state)
3. On the driver create page, detect prefill params and populate the form
4. On successful driver creation, the backend links `PotentialDriver.ConvertedToDriverId` and sets status to "Converted"

---

### STEP 9 — Frontend: Navigation

**File to edit**: The sidebar/nav component (find via `Glob **/sidebar*` or `**/nav*` in frontend).

Add menu item:
- Icon: `PersonSearch` or `PersonAdd` (MUI)
- Label: "Potentiële chauffeurs"
- Route: `/potential-drivers`
- Visible to: `customerAdmin`, `globalAdmin`, `employer`

---

### STEP 10 — Internationalization (i18n)

**Files to edit**: `frontend/messages/nl.json` and `frontend/messages/en.json` (or equivalent locale files).

Add translation keys for:
- Page titles, button labels, status values, column headers, form field labels, error messages

---

## Authorization Summary

| Role | Can Do |
|---|---|
| `globalAdmin` | Full CRUD on all companies' prospects |
| `customerAdmin` | Full CRUD on own company's prospects only |
| `employer` | Read own managed companies' prospects |
| `planner` | No access |
| `driver` | No access |

---

## Execution Order

1. ✅ STEP 1 — Create `PotentialDriver` entity
2. ✅ STEP 2 — Run EF migration
3. ✅ STEP 3 — Create DTOs
4. ✅ STEP 4 — Create endpoints
5. ✅ STEP 5 — Register in Program.cs
6. ✅ STEP 6 — Create frontend types
7. ✅ STEP 7 — Create frontend hooks (one at a time)
8. ✅ STEP 8A — List page
9. ✅ STEP 8B — Create/Edit form
10. ✅ STEP 8C — Detail page
11. ✅ STEP 8D — Convert flow
12. ✅ STEP 9 — Add to navigation
13. ✅ STEP 10 — Add translations

---

## Files Changed Summary

### Backend (new files)
- `Entities/PotentialDriver.cs`
- `DTOs/PotentialDriverDto.cs`
- `DTOs/CreatePotentialDriverRequest.cs`
- `DTOs/UpdatePotentialDriverRequest.cs`
- `Endpoints/PotentialDriverEndpoints.cs`
- `Migrations/XXXXXX_AddPotentialDrivers.cs` (generated)

### Backend (edited files)
- `Data/ApplicationDbContext.cs` — add DbSet + model config
- `Program.cs` — register endpoints

### Frontend (new files)
- `types/potentialDriver.ts`
- `hooks/usePotentialDrivers.ts`
- `hooks/usePotentialDriverDetail.ts`
- `hooks/useCreatePotentialDriver.ts`
- `hooks/useUpdatePotentialDriver.ts`
- `hooks/useDeletePotentialDriver.ts`
- `hooks/useConvertToDriver.ts`
- `app/[locale]/potential-drivers/page.tsx`
- `app/[locale]/potential-drivers/create/page.tsx`
- `app/[locale]/potential-drivers/[id]/page.tsx`
- `app/[locale]/potential-drivers/edit/[id]/page.tsx`

### Frontend (edited files)
- Sidebar/nav component — add menu item
- `app/[locale]/drivers/create/page.tsx` — handle prefill query params from conversion
- Locale message files — add translation keys

---

## Notes & Decisions

- **No breaking changes** to existing Driver, Company, or any existing entity.
- Status is stored as `VARCHAR(50)` not an enum — easier to add values later without migrations.
- The convert flow is **two-step** (get prefill data → user fills remaining driver fields → create driver), not one-click, because creating a full driver requires many required fields that are not present on a prospect.
- Soft-delete only (`IsDeleted = true`). Converted prospects are kept for historical tracking.
- Prospects with `Status = 'Converted'` should appear grayed out in the list but not disappear, to allow viewing the link to the driver.
