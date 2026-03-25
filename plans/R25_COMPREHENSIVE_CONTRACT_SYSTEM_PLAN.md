# R25 — Comprehensive Contract System (All Employees + Contract Variations): Implementation Plan

**Requirement**: Expand contract management to ALL employees (not just drivers) with support for 9 contract types, contract variations (fixed-term/permanent, full-time/part-time), and a unified employee model.

**Status in requirements doc**: ⚠️ **BLOCKED — needs critical client decisions before any code is written.**
(line 1172 in `plans/requirments/Phase 1 Business Requirements final.md`)

**Estimated complexity**: Very Large — architectural change (~25% of Phase 1 budget per requirements doc)

---

## How R25 Relates to R23 and R24

This is the single most important thing to understand before touching any code.

### Dependency chain

```
R24 (4 contract types, drivers only)
  └── R25 DIRECTLY BUILDS ON THIS
        ├── Reuses the ContractType enum → adds 5 more values
        ├── Reuses the EmployeeContract entity → adds more fields for new types
        └── Adds a new Employee concept that uses EmployeeContract too

R23 (Potential Driver pipeline)
  └── R25 AFFECTS THIS INDIRECTLY
        ├── R23 converts PotentialDriver → Driver
        ├── R25 may expand Driver into a unified Employee model
        └── If R25 is done after R23, the conversion link (ConvertedToDriverId)
            must be updated to point at the new Employee model
```

### What this means in practice

| Scenario | Impact |
|---|---|
| **R24 done, R25 not started** | Fine. R25 extends R24's enum and entity. No conflict. |
| **R23 done, R25 not started** | Fine. R23 is self-contained. When R25 lands, one FK rename migration needed. |
| **R25 started before R24** | ❌ Bad. R25 has nothing to extend. R24 must be the foundation. |
| **R25 started before R23** | Fine either way. R23 is independent. |
| **All three done in order: R24 → R25 → R23 last** | Optimal: R23 can use the final Employee model from R25 directly. |
| **All three done in order: R24 → R23 → R25** | Also fine: just add a migration in R25 to update the FK. |

**Recommended order**: R24 first → then R25 → R23 can go in parallel with either.

---

## Current State (What Exists)

### Entities relevant to R25

| Entity | File | Notes |
|---|---|---|
| `ApplicationUser` | `Entities/ApplicationUser.cs` | Has `FirstName`, `LastName`, `Address`. Has navigation to `Driver?` and `ContactPerson?`. This is the identity anchor for all users. |
| `Driver` | `Entities/Driver.cs` | Has `AspNetUserId`, `CompanyId`, `CarId`, soft-delete, Telegram fields. **No employment/payroll data** — that's in `EmployeeContract`. |
| `ContactPerson` | `Entities/ContactPerson.cs` | Almost empty: just `AspNetUserId` + soft-delete + `ContactPersonClientCompanies`. Used for planners/customer-admins. **No contract data.** |
| `EmployeeContract` | `Entities/EmployeeContract.cs` | Has all employment fields (CAO) + after R24: type-specific fields. Currently linked to Driver only via `DriverId`. |

### Key observation
`ContactPerson` is a thin wrapper around `ApplicationUser`. There is no contract, salary, or employment data for non-driver staff. Planners (Suzan, Musa, Yordan) and accountants (Gülşen, Michael, Hubeyb) exist in the system as `ContactPerson` records but have zero contractual data attached.

---

## Spreadsheet References for R25

| File | Sheet | What it tells R25 |
|---|---|---|
| `BemiddelingZZP.xlsx` | **Raam** | Exact legal template for "Raamovereenkomst ZZP-Dienstverlening" — the framework contract between Boratech (Bemiddelaar) and a transport company (Opdrachtgever). This IS the Raam contract type. |
| `BemiddelingZZP.xlsx` | **Bemiddeling** | Exact legal template for "Bemiddelingsovereenkomst" between Boratech and a ZZP driver. This IS the Bemiddeling contract type. |
| `BemiddelingZZP.xlsx` | **NBBU_Raam** | Alternative NBBU-style framework template — same Raam structure but different legal wording. |
| `BemiddelingZZP.xlsx` | **NBBU_OB** | Opdrachtbevestiging — order confirmation, a variant of Deelovereenkomst. Part of the Raam/Bemiddeling workflow. |
| `BemiddelingZZP.xlsx` | **Deel** | Deelovereenkomst (sub-agreement) — concrete assignment document. The third layer of the 3-layer ZZP/Bemiddeling structure. |
| `BemiddelingZZP.xlsx` | **Рамков/Посредник/Задача** | Bulgarian-language versions of Raam, Bemiddeling, Deel — confirms the same contract set is used for Bulgarian-speaking drivers/clients (multilingual PDF generation needed). |
| `BemiddelingZZP.xlsx` | **CRM** | Full client/ZZP contact database with 1800+ records. Fields: KvKNaam, Bedrijfsnaam, SBI_Code, HoofdTel, Email, address, BTW, KvK, BSN, GeborteDatum, Taal, IDSoort, IDNummer — the full data model for a non-driver staff/contractor record. |
| `BemiddelingZZP.xlsx` | **Klanten** | Client directory (simpler CRM): company name, contact, address, BTW nr, KvK, payment terms. |
| `FunctieSchalenCAO-Vervoer.xlsx` | **FSchalen2026/2025** | CAO wage scales apply to non-driver employees too (planners, admins on CAO contract). |
| `Lening Calculator.xlsx` | **CRM** | Same client data structure as BemiddelingZZP CRM — reinforces which fields are needed. |

### Key insight from spreadsheets
The `BemiddelingZZP.xlsx` CRM sheet reveals the complete field set needed for non-driver employees/contractors: full personal data (BSN, date of birth, nationality, ID type/number, IBAN), company data (SBI code, KvK, BTW), language preference, and a unique client number (`KlantNr`). This is significantly richer than what `ContactPerson` currently stores. **R25's Employee entity should be modeled after this CRM schema.**

---

## BLOCKING DECISIONS (Must Be Made Before Any Code)

These are the questions from the requirements doc that must have answers:

### Decision 1 — Architecture choice ⚠️ CRITICAL

**Option A: Keep Driver, add separate Employee entity** (Recommended)

```
ApplicationUser (existing)
  ├── Driver? (existing) → drivers only, keeps all car/ride relations
  ├── ContactPerson? (existing) → keep as-is or deprecate
  └── Employee? (NEW) → planners, admins, accountants, managers
        └── EmployeeContract (existing, R24-extended)
```

**Option B: Unified Employee table** (More ambitious, higher risk)

```
ApplicationUser (existing)
  └── Employee (NEW, replaces Driver + ContactPerson)
        ├── EmployeeRole: Driver | Planner | Admin | Manager | Accountant
        ├── EmployeeContract
        └── (Driver-specific: Car, Rides, PartRides → FK to Employee instead of Driver)
```

**Why Option A is recommended**:
- `Driver` has 10+ dependent entities (Car, PartRide, RideDriverAssignment, RideDriverExecution, DriverFile, DriverUsedByCompany, etc.)
- Migrating all of these to `Employee` is a massive refactor with high regression risk
- `ApplicationUser` already has `Driver?` and `ContactPerson?` — adding `Employee?` is consistent
- Zero breaking changes to the existing driver-related pages and API

**Why Option B could be right**:
- Cleaner long-term model
- Single employee list across all roles
- But should be Phase 2 unless the client insists

### Decision 2 — Contract types priority
Which of the 5 new types are urgent for Phase 1?
- **Raam**: Template is in spreadsheet. Likely needed for ZZP onboarding workflow.
- **Bemiddeling**: Template is in spreadsheet. Core to Boratech's ZZP mediation business.
- **Deeltijd**: Simple (part-time variation of CAO/Brief). Low added complexity.
- **Uitzend**: Agency work — fields similar to Inleen. Moderate complexity.
- **OVO**: Training agreement — no template in spreadsheets yet. Needs client spec.

### Decision 3 — Staff payroll
Do planners/admins also need weekly timesheets and payslips, or just contracts?

### Decision 4 — Existing ContactPerson migration
Should existing 3 planners + 3 accountants be migrated to the new Employee model automatically, or left as ContactPerson?

---

## Proposed Architecture (Option A — Recommended)

### New `Employee` entity

**File to create**: `backend/TruckManagement/Entities/Employee.cs`

```csharp
public class Employee
{
    public Guid Id { get; set; }

    // Identity link (same pattern as Driver and ContactPerson)
    public string AspNetUserId { get; set; } = default!;
    [ForeignKey(nameof(AspNetUserId))]
    public ApplicationUser User { get; set; } = default!;

    // Company (the employer)
    public Guid? CompanyId { get; set; }
    public Company? Company { get; set; }

    // Role within the company
    public EmployeeRole Role { get; set; } = EmployeeRole.Other;
    // Values: Planner | Admin | Manager | Accountant | HR | Other

    // CRM data (from BemiddelingZZP.xlsx CRM sheet)
    public string? ExternalClientNumber { get; set; }  // KlantNr
    public string? SbiCode { get; set; }               // SBI_Code
    public string? Language { get; set; }              // Taal (nl/bg/en etc.)
    public string? BulgarianName { get; set; }         // BulgaarseNaam (multilingual support)

    // Contract
    public Guid? EmployeeContractId { get; set; }
    public EmployeeContract? EmployeeContract { get; set; }

    // Audit
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
```

### New `EmployeeRole` enum

**File to create**: `backend/TruckManagement/Enums/EmployeeRole.cs`

```csharp
public enum EmployeeRole
{
    Planner,
    Admin,
    Manager,
    Accountant,
    HR,
    Other
}
```

### Extend `ApplicationUser`

**File to edit**: `backend/TruckManagement/Entities/ApplicationUser.cs`

Add navigation property:
```csharp
public Employee? Employee { get; set; }
```

### Extend `EmployeeContract`

**File to edit** (already edited in R24): `backend/TruckManagement/Entities/EmployeeContract.cs`

R25 requires two changes on top of R24:

**1. Loosen the Driver-only FK**: `EmployeeContract.DriverId` becomes optional (already is `Guid?`). Add `EmployeeId` FK:
```csharp
public Guid? EmployeeId { get; set; }
[ForeignKey(nameof(EmployeeId))]
public Employee? Employee { get; set; }
```

**2. Extend `ContractType` enum** with 5 new values (in `Enums/ContractType.cs`, already created in R24):
```csharp
public enum ContractType
{
    // From R24 (existing)
    CAO,
    ZZP,
    Inleen,
    BriefLoonschaal,

    // New in R25
    OVO,          // Opleidings- en Vormingsovereenkomst (training agreement)
    Uitzend,      // Temporary/agency work
    Raam,         // Framework agreement (see BemiddelingZZP.xlsx Raam sheet)
    Bemiddeling,  // Intermediary/placement (see BemiddelingZZP.xlsx Bemiddeling sheet)
    Deeltijd      // Part-time employment
}
```

**3. Add contract variation fields** (fixed-term/permanent, full-time/part-time):
```csharp
// Contract variations (R25)
public ContractDuration? ContractDuration { get; set; }
// Values: Permanent | FixedTerm
public EmploymentType? EmploymentType { get; set; }
// Values: FullTime | PartTime
public double? PartTimePercentage { get; set; }
// e.g. 50.0 for 50% (20h/week)
public string? PartTimeDays { get; set; }
// e.g. "Mon, Tue, Wed"

// OVO-specific fields
public string? OvoTrainingInstitution { get; set; }
public DateTime? OvoTrainingStart { get; set; }
public DateTime? OvoTrainingEnd { get; set; }
public decimal? OvoTrainingAllowance { get; set; }
public string? OvoObligations { get; set; }

// Uitzend-specific fields
public Guid? UitzendAgencyCompanyId { get; set; }
public Company? UitzendAgencyCompany { get; set; }
public Guid? UitzendClientCompanyId { get; set; }
public Company? UitzendClientCompany { get; set; }
public decimal? UitzendHourlyRate { get; set; }
public DateTime? UitzendStartDate { get; set; }
public DateTime? UitzendEndDate { get; set; }

// Raam-specific fields (from BemiddelingZZP.xlsx Raam sheet)
public string? RaamContractNumber { get; set; }  // e.g. "20260201-02"
public DateTime? RaamStartDate { get; set; }
public string? RaamWorkDescription { get; set; }
public string? RaamLocation { get; set; }

// Bemiddeling-specific fields (from BemiddelingZZP.xlsx Bemiddeling sheet)
public string? BemiddelingContractNumber { get; set; }
public Guid? BemiddelingOpdrachtgeverId { get; set; } // Transport company (Opdrachtgever)
public Company? BemiddelingOpdrachtgever { get; set; }
public decimal? BemiddelingMediationFeePerWeek { get; set; } // e.g. €50/week
public bool? BemiddelingIncludesFacturing { get; set; }
public bool? BemiddelingIncludesPrefinancing { get; set; }

// Deeltijd (part-time) — uses existing WorkweekDuration + new PartTimePercentage above
```

### New enums for contract variations

**File to create**: `backend/TruckManagement/Enums/ContractDuration.cs`
```csharp
public enum ContractDuration { Permanent, FixedTerm }
```

**File to create**: `backend/TruckManagement/Enums/EmploymentType.cs`
```csharp
public enum EmploymentType { FullTime, PartTime }
```

---

## Implementation Steps

### STEP 1 — Prerequisite: R24 must be complete

All of the following must exist before starting R25:
- `ContractType` enum with 4 values
- `EmployeeContract` extended with ZZP/Inleen/Brief fields
- The contract form in frontend supports 4 types

### STEP 2 — Client decisions confirmed

Do not write code until the 4 blocking decisions above are answered.

### STEP 3 — Backend: New enums

Create:
- `Enums/EmployeeRole.cs`
- `Enums/ContractDuration.cs`
- `Enums/EmploymentType.cs`

### STEP 4 — Backend: Extend `ContractType` enum

**File to edit**: `Enums/ContractType.cs` (created in R24)

Add OVO, Uitzend, Raam, Bemiddeling, Deeltijd.

### STEP 5 — Backend: Create `Employee` entity

**File to create**: `Entities/Employee.cs` (schema above)

### STEP 6 — Backend: Extend `ApplicationUser`

**File to edit**: `Entities/ApplicationUser.cs`

Add `Employee? Employee`.

### STEP 7 — Backend: Extend `EmployeeContract`

**File to edit**: `Entities/EmployeeContract.cs` (already edited in R24)

Add:
- `EmployeeId` FK (for non-driver employees)
- `ContractDuration`, `EmploymentType`, `PartTimePercentage`, `PartTimeDays`
- OVO fields
- Uitzend fields
- Raam fields (contract number, start date, work description, location)
- Bemiddeling fields (contract number, opdrachtgever, mediation fee, factoring flags)

### STEP 8 — Backend: EF Core Migration

```bash
dotnet ef migrations add AddEmployeeEntityAndR25ContractTypes
dotnet ef database update
```

Creates `Employees` table. Adds new columns to `EmployeeContracts`. No existing data touched.

### STEP 9 — Backend: DTOs

**File to create**: `DTOs/EmployeeDto.cs`

```csharp
public class EmployeeDto
{
    public Guid Id { get; set; }
    public string AspNetUserId { get; set; } = default!;
    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public Guid? CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public EmployeeRole Role { get; set; }
    public Guid? EmployeeContractId { get; set; }
    public ContractType? ContractType { get; set; }
    public string? ExternalClientNumber { get; set; }
    public string? Language { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

**File to create**: `DTOs/CreateEmployeeRequest.cs`

```csharp
public class CreateEmployeeRequest
{
    [Required] public string CompanyId { get; set; } = default!;
    [Required] public EmployeeRole Role { get; set; }
    // User creation fields (or link to existing user)
    [Required, EmailAddress] public string Email { get; set; } = default!;
    [Required] public string FirstName { get; set; } = default!;
    [Required] public string LastName { get; set; } = default!;
    public string? PhoneNumber { get; set; }
    public string? Language { get; set; }
    public string? ExternalClientNumber { get; set; }
}
```

**File to create**: `DTOs/UpdateEmployeeRequest.cs` (all nullable)

**Extend**: `DTOs/CreateEmployeeContractRequest.cs` and `DTOs/UpdateEmployeeContractRequest.cs`

Add all new R25 fields (OVO, Uitzend, Raam, Bemiddeling, ContractDuration, EmploymentType, PartTime).

### STEP 10 — Backend: Employee Endpoints

**File to create**: `Endpoints/EmployeeEndpoints.cs`

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/employees` | List employees (filter by company, role, contractType) |
| `GET` | `/api/employees/{id}` | Get employee detail with contract |
| `POST` | `/api/employees` | Create employee (creates `ApplicationUser` + `Employee`) |
| `PUT` | `/api/employees/{id}` | Update employee |
| `DELETE` | `/api/employees/{id}` | Soft-delete employee |

Authorization: same pattern as `DriverEndpoints.cs` — `customerAdmin` filtered to own company, `globalAdmin` sees all.

### STEP 11 — Backend: Extend Existing Endpoints for New Contract Types

**File to edit**: `Endpoints/EmployeeContractsEndpoints.cs`

Map new fields (OVO, Uitzend, Raam, Bemiddeling, ContractDuration, EmploymentType) from request → entity. Link to `Employee` via `EmployeeId` when the contract is for a non-driver.

### STEP 12 — Backend: Extend `ReportCalculationService`

**File to edit**: `Services/Reports/ReportCalculationService.cs` (already branched in R24)

Add to the switch statement:
```csharp
ContractType.Raam       => await BuildZzpReportAsync(rawData, timeframe),    // Raam = ZZP-style billing
ContractType.Bemiddeling => await BuildZzpReportAsync(rawData, timeframe),   // Bemiddeling = ZZP-style + mediation fee
ContractType.OVO        => await BuildOvoReportAsync(rawData, timeframe),    // Training allowance only
ContractType.Uitzend    => await BuildUitzendReportAsync(rawData, timeframe),// Hours × uitzend rate
ContractType.Deeltijd   => await BuildCaoReportAsync(rawData, timeframe),    // Same as CAO, pro-rated
```

### STEP 13 — Backend: PDF Builders for New Contract Types

**File to edit**: `Services/DriverContractPdfBuilder.cs` (renamed/extended in R24)

Referencing `BemiddelingZZP.xlsx`:

**Raam PDF** — based on `BemiddelingZZP.xlsx` Raam sheet:
- Parties: Bemiddelaar (Boratech) ↔ Opdrachtgever (transport company)
- Articles: doel, juridische kwalificatie, positie bemiddelaar, totstandkoming opdrachten
- Data: `RaamContractNumber`, company details, `RaamStartDate`, `RaamWorkDescription`

**Bemiddeling PDF** — based on `BemiddelingZZP.xlsx` Bemiddeling + Bemiddel_ZZP sheets:
- Parties: Bemiddelaar (Boratech) ↔ ZZP driver (Opdrachtnemer)
- Includes: mediation fee (€50/week), factoring option, debtor management option
- Data: `BemiddelingContractNumber`, `BemiddelingMediationFeePerWeek`, `BemiddelingOpdrachtgever`

**Multilingual support**: The Bulgarian sheets (Рамков, Посредник, Задача) confirm the same contract must be generated in Dutch AND Bulgarian. Use `Employee.Language` field to select the template language.

**OVO PDF** — training agreement template (need client spec, not in spreadsheets)

**Uitzend PDF** — agency work contract between agency, client company, and worker

**Deeltijd PDF** — standard employment contract with part-time clauses (uses existing CAO template, adds part-time articles)

---

## Frontend Changes

### STEP 14 — Frontend: New Types

**File to create/edit**: `types/employee.ts`

```typescript
export type EmployeeRole = 'Planner' | 'Admin' | 'Manager' | 'Accountant' | 'HR' | 'Other';
export type ContractDuration = 'Permanent' | 'FixedTerm';
export type EmploymentType = 'FullTime' | 'PartTime';

export interface Employee {
  id: string;
  aspNetUserId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  companyId?: string;
  companyName?: string;
  role: EmployeeRole;
  contractId?: string;
  contractType?: ContractType;
  externalClientNumber?: string;
  language?: string;
  createdAt: string;
}
```

**Extend** `types/employeeContract.ts` (from R24) with:
- `contractDuration?: ContractDuration`
- `employmentType?: EmploymentType`
- `partTimePercentage?: number`
- `partTimeDays?: string`
- OVO, Uitzend, Raam, Bemiddeling field groups

### STEP 15 — Frontend: New Employee Hooks

Create (following patterns from existing hooks):
- `hooks/useEmployees.ts` — list with filters
- `hooks/useEmployeeDetail.ts` — single employee
- `hooks/useCreateEmployee.ts` — POST to `/api/employees`
- `hooks/useUpdateEmployee.ts` — PUT
- `hooks/useDeleteEmployee.ts` — soft-delete

### STEP 16 — Frontend: Employee Pages

**New directory structure**:
```
app/[locale]/employees/
  page.tsx               ← Employee list (all non-driver staff)
  create/
    page.tsx             ← Create employee + assign contract
  [id]/
    page.tsx             ← Employee detail with contract info
  edit/
    [id]/
      page.tsx           ← Edit employee
```

**Employee list page** — similar to drivers list:
- Table: Name | Role (chip) | Company | Contract Type (chip) | Status
- Filters: Role dropdown, Contract Type dropdown, Company (globalAdmin only), Search
- Actions: View | Edit | Delete

**Employee detail page**:
- Info section: personal details, role, company
- Contract section: type-specific display (same pattern as driver detail extended in R24)

### STEP 17 — Frontend: Extend Contract Form for New Types

**Files to edit**: `contracts/create/page.tsx` and `contracts/edit/[id]/page.tsx`

Extend the type selector and conditional sections (from R24) with 5 new types:

**Contract variation section** (shown for all types):
```tsx
<Select label="Looptijd">
  <MenuItem value="Permanent">Onbepaalde tijd</MenuItem>
  <MenuItem value="FixedTerm">Bepaalde tijd</MenuItem>
</Select>

{employmentType === 'PartTime' && (
  <>
    <TextField label="Percentage (%)" type="number" />
    <TextField label="Werkdagen" placeholder="ma, di, wo" />
  </>
)}
```

**Raam section** (shown when `contractType === 'Raam'`):
- Contract Number (e.g. `20260201-02`)
- Raam Start Date
- Work Description
- Location
- Reference: `BemiddelingZZP.xlsx` Raam sheet for field labels and legal context

**Bemiddeling section** (shown when `contractType === 'Bemiddeling'`):
- Contract Number
- Opdrachtgever (company selector — the transport company being served)
- Mediation Fee per Week (default €50 from spreadsheet)
- Toggle: Includes Factoring?
- Toggle: Includes Pre-financing?
- Reference: `BemiddelingZZP.xlsx` Bemiddeling + Bemiddel_ZZP sheets

**OVO section** (shown when `contractType === 'OVO'`):
- Training Institution
- Training Start Date / End Date
- Training Allowance (monthly)
- Post-training obligations (text)

**Uitzend section** (shown when `contractType === 'Uitzend'`):
- Agency Company (selector from companies)
- Client Company (selector from companies)
- Hourly Rate
- Start Date / End Date

**Deeltijd section** (shown when `contractType === 'Deeltijd'`):
- Uses base CAO/Brief fields
- Part-time % is handled by the contract variation section above

### STEP 18 — Frontend: Unified Employee View (Optional for Phase 1)

Add a "Medewerkers" section in navigation that shows BOTH drivers and non-driver employees in one table, filterable by role. This requires a combined API endpoint or client-side merging of `GET /api/drivers` + `GET /api/employees`.

### STEP 19 — Frontend: Navigation Updates

Add "Medewerkers" (or "Personeel") menu item pointing to `/employees`. Visible to `globalAdmin`, `customerAdmin`, `employer`.

---

## Phased Delivery Recommendation

Because R25 is large, break it into three shippable sub-phases:

### Phase 1 of R25 — Foundation (20 hours estimate)

**Deliverable**: Non-driver staff can have contracts.

- STEP 3–8: `Employee` entity, enums, migration
- STEP 9–11: Employee DTOs and endpoints (CRUD only)
- STEP 14–16: Employee list, create, detail pages in frontend
- STEP 17 (partial): Contract form — only ContractDuration + EmploymentType variations (no new contract types yet)

**Result**: A planner (Suzan) can be added as an Employee with a CAO or BriefLoonschaal contract. This is the minimum viable state.

### Phase 2 of R25 — Raam + Bemiddeling (20 hours estimate)

**Deliverable**: Full ZZP mediation document set.

- STEP 4: Add Raam + Bemiddeling to `ContractType` enum
- STEP 7: Add Raam/Bemiddeling fields to `EmployeeContract`
- STEP 13: PDF builders for Raam + Bemiddeling (based on spreadsheet templates)
- STEP 17 (partial): Raam + Bemiddeling form sections
- Multilingual PDF (Dutch + Bulgarian) using `Employee.Language`

**Result**: Full Raam → Bemiddeling → Deel document set can be generated from the system, replacing the spreadsheet workflow.

### Phase 3 of R25 — Remaining Types + Payroll (25 hours estimate)

**Deliverable**: OVO, Uitzend, Deeltijd + payroll for office staff.

- OVO + Uitzend + Deeltijd contract types (once client provides specs for OVO)
- `ReportCalculationService` extensions for non-driver staff
- Payroll/timesheet generation for employees
- Unified employee view (drivers + staff in one table)

---

## Files Changed Summary

### Backend (new files)
- `Entities/Employee.cs`
- `Enums/EmployeeRole.cs`
- `Enums/ContractDuration.cs`
- `Enums/EmploymentType.cs`
- `DTOs/EmployeeDto.cs`
- `DTOs/CreateEmployeeRequest.cs`
- `DTOs/UpdateEmployeeRequest.cs`
- `Endpoints/EmployeeEndpoints.cs`
- `Migrations/XXXXXX_AddEmployeeEntityAndR25ContractTypes.cs` (generated)

### Backend (edited files)
- `Entities/ApplicationUser.cs` — add `Employee?` navigation
- `Entities/EmployeeContract.cs` — add `EmployeeId` FK + 5 new type fields + contract variation fields
- `Enums/ContractType.cs` — add 5 new values (R24 created this)
- `DTOs/CreateEmployeeContractRequest.cs` — add new fields
- `DTOs/UpdateEmployeeContractRequest.cs` — add new fields
- `DTOs/DriverWithContractDto.cs` — add new fields
- `Endpoints/EmployeeContractsEndpoints.cs` — map new fields
- `Services/Reports/ReportCalculationService.cs` — add Raam/Bemiddeling/OVO/Uitzend/Deeltijd branches
- `Services/DriverContractPdfBuilder.cs` — add Raam/Bemiddeling/OVO/Uitzend PDF builders
- `Data/ApplicationDbContext.cs` — add `DbSet<Employee>` + model config

### Frontend (new files)
- `types/employee.ts`
- `hooks/useEmployees.ts`
- `hooks/useEmployeeDetail.ts`
- `hooks/useCreateEmployee.ts`
- `hooks/useUpdateEmployee.ts`
- `hooks/useDeleteEmployee.ts`
- `app/[locale]/employees/page.tsx`
- `app/[locale]/employees/create/page.tsx`
- `app/[locale]/employees/[id]/page.tsx`
- `app/[locale]/employees/edit/[id]/page.tsx`

### Frontend (edited files)
- `types/employeeContract.ts` — new type fields + variation fields
- `app/[locale]/contracts/create/page.tsx` — 5 new type sections + variation fields
- `app/[locale]/contracts/edit/[id]/page.tsx` — same
- `app/[locale]/contracts/[id]/page.tsx` — display for new types
- `hooks/useCreateEmployeeContract.ts` — updated payload
- `hooks/useEmployeeContractUpdate.ts` — updated payload
- Sidebar/nav component — add "Medewerkers" menu item
- Locale message files

---

## Impact on R23 (Potential Drivers)

After R25 ships, one migration is needed to align R23 with the new Employee model:

**If Option A architecture is chosen** (keep Driver, add Employee):
- `PotentialDriver.ConvertedToDriverId` stays as-is — conversion still goes to `Driver`
- No change needed

**If Option B architecture is chosen** (unified Employee):
- `PotentialDriver.ConvertedToDriverId` becomes `PotentialDriver.ConvertedToEmployeeId`
- One EF migration: rename FK column
- One frontend change: redirect after conversion goes to `/employees/{id}` instead of `/drivers/{id}`

This is exactly why Option A (additive) is recommended — it eliminates this R23/R25 coupling entirely.

---

## Summary: R23 + R24 + R25 Together

```
TODAY                 R24                    R25 Phase 1         R25 Phase 2 & 3
─────────             ─────────────────────  ──────────────────  ─────────────────────
EmployeeContract      EmployeeContract       EmployeeContract    EmployeeContract
  (CAO only)           (+ ZZP/Inleen/Brief    (+ Employee FK      (+ Raam/Bemiddeling/
                        fields + enum)         + variations)       OVO/Uitzend/Deeltijd)

Driver ──────────────── Driver ──────────────── Driver ──────────── Driver
  (active employees)                                                  │
                                                                      │
PotentialDriver ─────── PotentialDriver ──────── PotentialDriver ──── PotentialDriver
  (none, new in R23)       (new in R23)              (new in R23)      (+ maybe → Employee)

ContactPerson ─────────── ContactPerson ──────── ContactPerson ──── Employee (NEW)
  (thin wrapper)           (unchanged)             (unchanged)        (planners, admins)
```

**Recommended execution**:
1. **R24 first** — lays the contract type foundation (no dependencies)
2. **R25 Phase 1** — Employee entity + basic CRUD (depends on R24 enum)
3. **R23** — can go in parallel with R25, or after (no blocking dependency)
4. **R25 Phase 2** — Raam + Bemiddeling PDFs (depends on R25 Phase 1)
5. **R25 Phase 3** — remaining types + payroll expansion (depends on Phase 2 + client specs)
```
