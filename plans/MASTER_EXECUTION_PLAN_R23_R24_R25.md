# Master Execution Plan — R23 + R24 + R25

**Date**: March 2026  
**Status**: ✅ All blocking decisions answered — ready to execute

---

## Critical Architectural Finding: HR Module Gate

During the pre-execution code review we discovered that the codebase already ships a **full Module/Feature Toggle system** (merged into main). This is the subscription layer that controls which product modules are available per `customerAdmin`.

**4 modules exist:**

| Module | Backend enum | Content | Always on |
|---|---|---|---|
| Base | `SystemModule.Base` | Drivers, Vehicles, Clients, Companies | Yes |
| Planning | `SystemModule.Planning` | Ride scheduling, assignments, hours | Toggleable |
| Finance | `SystemModule.Finance` | Payroll, invoicing, reports | Toggleable |
| **HR** | **`SystemModule.HR`** | **Contracts, HR letters, employee management** | **Toggleable** |

The `HR` module is already defined and wired into the gating infrastructure but **not yet assigned to any endpoint or navigation item**. All of R23, R24, and R25 belong under this module.

### What this means for every task in this plan

**Backend** — every new endpoint group must be gated:
```csharp
var group = app.MapGroup("").RequireModule(SystemModule.HR);
```
`globalAdmin` bypasses the check automatically (see `ModuleAccessFilter`). `customerAdmin` and `driver` roles are subject to it.

**Frontend** — every new sidebar item must be conditionally rendered:
```tsx
const { isModuleEnabled } = useFeatureModules(); // from FeatureModuleProvider
// ...
{isModuleEnabled('HR') && (
    <NavItem onClick={() => go('/potential-drivers')}>...</NavItem>
)}
```

**No new provider or context is needed** — `FeatureModuleProvider` is already in the layout and `useFeatureModules()` is available everywhere.

---

## Confirmed Decisions

| # | Question | Answer |
|---|---|---|
| R25-1 | Architecture for non-driver staff | **Option A** — Keep `Driver` entity as-is, create a new separate `Employee` entity for planners/admins/accountants |
| R25-2 | New contract types for Phase 1 | **Raam + Bemiddeling** only (those with templates in `BemiddelingZZP.xlsx`) |
| R25-3 | What staff need from the system | **Contracts only** — generate and store employment contract PDFs. No timesheets or payslips yet. |
| R25-4 | Staff headcount | **Unknown / growing** — system must support unlimited; no hard-coded limit |
| R24-1 | ZZP invoicing model | **Driver invoices directly** — the system generates the invoice PDF on the ZZP driver's behalf, addressed to the transport company |
| R24-2 | ZZP BTW percentage | **Always 21%** — hardcode default, no 9% variant needed |
| R24-3 | Existing driver contracts | **All CAO** — all existing `EmployeeContract` records default to `ContractType = CAO` in the migration |
| R24-4 | Brief Loonschaal definition | **Fixed monthly salary per contract letter, standard Dutch labor law** — custom monthly amount agreed in the contract; same overtime and vacation rules as CAO apply (not bound by TLN wage tables) |
| R23-1 | Minimum info for prospect | **Name + phone + email + company** (all four required) |
| R23-2 | Conversion flow | **Manual with record kept** — admin clicks Convert, fills remaining driver fields, saves. Prospect record is kept with status "Converted" and link to new driver. |
| R23-3 | Planner visibility | **No** — only `customerAdmin` and `globalAdmin` can see/manage prospects |

---

## Execution Order

```
PHASE 1: R24 Foundation (no dependencies)
  └── All contract types on drivers: CAO, ZZP, Inleen, BriefLoonschaal

PHASE 2: R23 (parallel or after Phase 1)
  └── Potential driver pipeline — no dependency on R24, can run in parallel

PHASE 3: R25 — Employee Entity (depends on Phase 1)
  └── Non-driver staff get their own Employee record + CAO/Brief contracts

PHASE 4: R25 — Raam + Bemiddeling (depends on Phase 3)
  └── Two new contract types from the spreadsheet templates
```

Total steps: **43 discrete tasks** numbered below.

---

## PHASE 1 — R24: Multiple Contract Types for Drivers

### What we are building
Extend the existing CAO-only driver contract system to support 4 contract types: CAO (unchanged), ZZP (freelance), Inleen (secondment), and BriefLoonschaal (fixed-salary employment). This includes DB migration, payment calculation branching, invoice PDF generation for ZZP, and updated forms.

---

### TASK 1.1 — Create `ContractType` enum

**File**: `backend/TruckManagement/Enums/ContractType.cs` *(new)*

```csharp
namespace TruckManagement.Enums;

public enum ContractType
{
    CAO,             // Collective Labor Agreement (existing)
    ZZP,             // Self-employed/freelance
    Inleen,          // Secondment (borrowed from another company)
    BriefLoonschaal  // Fixed monthly salary, standard Dutch labor rules
    // NOTE: Raam and Bemiddeling added in Phase 4
}
```

---

### TASK 1.2 — Extend `EmployeeContract` entity

**File**: `backend/TruckManagement/Entities/EmployeeContract.cs` *(edit)*

Add after the existing `Status` field:

```csharp
// ── Contract type (defaults to CAO for all existing records) ────────────────
public ContractType ContractType { get; set; } = ContractType.CAO;

// ── ZZP-specific ────────────────────────────────────────────────────────────
public string? ZzpBtwNumber { get; set; }           // e.g. NL123456789B01
public string? ZzpKvkNumber { get; set; }           // e.g. 12345678
public decimal? ZzpHourlyRateExclBtw { get; set; } // agreed hourly rate
public decimal? ZzpBtwPercentage { get; set; }      // always 21 per decision
public decimal? ZzpMediationFeePerWeek { get; set; }// e.g. €50/week (from spreadsheet)
public string? ZzpContractNumber { get; set; }      // e.g. "20260201-02"
public string? ZzpWorkDescription { get; set; }     // e.g. "Vervoer van goederen over de weg"
public string? ZzpLocation { get; set; }            // e.g. "s-Gravenhage"

// ── Inleen-specific ─────────────────────────────────────────────────────────
public Guid? InleenLendingCompanyId { get; set; }
[ForeignKey(nameof(InleenLendingCompanyId))]
public Company? InleenLendingCompany { get; set; }

public Guid? InleenBorrowingCompanyId { get; set; }
[ForeignKey(nameof(InleenBorrowingCompanyId))]
public Company? InleenBorrowingCompany { get; set; }

public DateTime? InleenStartDate { get; set; }
public DateTime? InleenEndDate { get; set; }
public decimal? InleenHourlyRate { get; set; }
public string? InleenWorkDescription { get; set; }
public string? InleenLocation { get; set; }

// ── BriefLoonschaal-specific ─────────────────────────────────────────────────
// Fixed monthly salary — agreed in the contract letter, NOT from the CAO table
// All standard Dutch overtime and vacation rules still apply
public decimal? BriefMonthlySalary { get; set; }
public string? BriefGrade { get; set; }             // optional label, e.g. "Schaal 5"
public double? BriefExpectedMonthlyHours { get; set; } // default 173.33 for full-time
```

---

### TASK 1.3 — Run EF Migration

```bash
cd backend/TruckManagement
dotnet ef migrations add AddContractTypesAndTypeSpecificFields
dotnet ef database update
```

**Result**: New nullable columns added to `EmployeeContracts`. All existing rows get `ContractType = 'CAO'` by default. Zero downtime.

---

### TASK 1.4 — Extend DTOs

**File**: `backend/TruckManagement/DTOs/CreateEmployeeContractRequest.cs` *(edit)*  
**File**: `backend/TruckManagement/DTOs/UpdateEmployeeContractRequest.cs` *(edit)*  
**File**: `backend/TruckManagement/DTOs/DriverWithContractDto.cs` *(edit)*

Add to all three:
- `ContractType ContractType`
- All ZZP fields (BtwNumber, KvkNumber, HourlyRateExclBtw, BtwPercentage=21, MediationFeePerWeek, ContractNumber, WorkDescription, Location)
- All Inleen fields (LendingCompanyId, BorrowingCompanyId, StartDate, EndDate, HourlyRate, WorkDescription, Location)
- All Brief fields (MonthlySalary, Grade, ExpectedMonthlyHours)

---

### TASK 1.5 — Map new fields in `EmployeeContractsEndpoints.cs`

**File**: `backend/TruckManagement/Endpoints/EmployeeContractsEndpoints.cs` *(edit)*

In the POST and PUT handlers: map all new fields from request → entity.  
For ZZP: default `BtwPercentage = 21m` if not supplied.

---

### TASK 1.6 — Extend `ReportCalculationService` with contract type branching

**File**: `backend/TruckManagement/Services/Reports/ReportCalculationService.cs` *(edit)*

Wrap the existing logic in `BuildCaoReportAsync`. Add dispatch:

```csharp
public async Task<DriverTimesheetReport> BuildReportAsync(ReportTimeframe timeframe)
{
    var rawData = await GatherRawDataAsync(timeframe);
    return (rawData.Contract?.ContractType ?? ContractType.CAO) switch
    {
        ContractType.CAO            => await BuildCaoReportAsync(rawData, timeframe),
        ContractType.ZZP            => await BuildZzpReportAsync(rawData, timeframe),
        ContractType.Inleen         => await BuildInleenReportAsync(rawData, timeframe),
        ContractType.BriefLoonschaal => await BuildBriefReportAsync(rawData, timeframe),
        _ => throw new NotSupportedException()
    };
}
```

**ZZP calculation** (confirmed: driver invoices directly, 21% BTW, no vacation/TvT):
```
subtotal = hours × ZzpHourlyRateExclBtw
btwAmount = subtotal × 0.21
total = subtotal + btwAmount
// No vacation accrual. No TvT. No ATV.
```

**Inleen calculation**:
```
total = hours × InleenHourlyRate
// Apply same 1.25× overtime after 40h/week (same as CAO, confirm with client if different)
```

**Brief calculation** (confirmed: fixed monthly salary + standard Dutch overtime):
```
derivedHourlyRate = BriefMonthlySalary / BriefExpectedMonthlyHours (default 173.33)
normalPay = normalHours × derivedHourlyRate
overtimePay = overtimeHours × derivedHourlyRate × 1.25
// Vacation accrual and ATV apply same as CAO
```

---

### TASK 1.7 — Extend `DriverTimesheetReport` DTO

**File**: `backend/TruckManagement/DTOs/Reports/DriverTimesheetReport.cs` *(edit)*

Add:
```csharp
public ContractType ContractType { get; set; } = ContractType.CAO;

// ZZP output
public decimal? ZzpSubtotalExclBtw { get; set; }
public decimal? ZzpBtwAmount { get; set; }
public decimal? ZzpTotalInclBtw { get; set; }
public decimal? ZzpMediationFee { get; set; }

// Inleen output
public string? InleenBorrowingCompanyName { get; set; }
public decimal? InleenHourlyRate { get; set; }

// Brief output
public decimal? BriefDerivedHourlyRate { get; set; }
```

---

### TASK 1.8 — Extend `DriverContractPdfBuilder` for new contract types

**File**: `backend/TruckManagement/Services/DriverContractPdfBuilder.cs` *(edit)*

Add dispatch method:
```csharp
public byte[] BuildContractPdfForType(EmployeeContract contract, CAOPayScale? payScale,
    CAOVacationDays? vacationDays, ApplicationUser? createdByUser)
{
    return contract.ContractType switch
    {
        ContractType.CAO            => BuildContractPdf(contract, payScale!, vacationDays!, createdByUser),
        ContractType.ZZP            => BuildZzpContractPdf(contract, createdByUser),
        ContractType.Inleen         => BuildInleenContractPdf(contract, createdByUser),
        ContractType.BriefLoonschaal => BuildBriefContractPdf(contract, createdByUser),
        _ => throw new NotSupportedException()
    };
}
```

**ZZP contract PDF** (combined document: Raam + Bemiddeling + Deel sections in one file):
- Source: `BemiddelingZZP.xlsx` sheets Raam, Bemiddeling, Deel
- Data bindings: `ZzpContractNumber`, company fields, `ZzpHourlyRateExclBtw`, `ZzpLocation`, `ZzpWorkDescription`, period (DateOfEmployment → LastWorkingDay)
- Mediation fee clause from Bemiddel_ZZP sheet Article 2 (€50/week)

**Inleen contract PDF**:
- Source: `BemiddelingZZP.xlsx` Inleen sheet
- Parties: `InleenLendingCompany` (Uitlener) ↔ `InleenBorrowingCompany` (Inlener)
- CAO wage obligation clause (from Inleen sheet Article 1)

**Brief contract PDF**:
- Standard Dutch employment contract, same visual as CAO but references `BriefMonthlySalary` + `BriefGrade` instead of PayScale/Step

---

### TASK 1.9 — Update `DriverContractService` call site

**File**: `backend/TruckManagement/Services/DriverContractService.cs` *(edit)*

Change `BuildContractPdf(...)` call to `BuildContractPdfForType(...)`.

---

### TASK 1.10 — Extend `DriverInvoicePdfBuilder` for ZZP

**File**: `backend/TruckManagement/Services/DriverInvoicePdfBuilder.cs` *(edit)*

> ⚠️ `DriverInvoicePdfBuilder` **already exists** (merged in main). The current implementation generates a CAO-style invoice without BTW. We **extend** it — we do NOT rewrite it. The existing `BuildInvoicePdf(...)` method stays untouched; we add a new `BuildZzpInvoicePdf(...)` overload.
> The `DriverInvoiceEndpoints` is already gated under `SystemModule.Finance` — leave that as-is. The ZZP invoice is a Finance-module concern, not HR.

For ZZP contracts, generate an invoice PDF that the driver sends to the transport company (confirmed: driver invoices directly). Format based on `BemiddelingZZP.xlsx` Factuur sheet:

```
Header:   [Driver's company name, KvK, BTW, IBAN, address]
Recipient: [Transport company name, address, BTW, KvK]
Line item: Work description | Hours | Rate excl. BTW | Subtotal
BTW row:   21% × subtotal
Total:     incl. BTW
Footer:    Payment term 14 days | reference: contract number + week
```

---

### TASK 1.11 — Frontend: Add contract type to types file

**File**: `frontend/types/employeeContract.ts` *(create/edit)*

```typescript
export type ContractType = 'CAO' | 'ZZP' | 'Inleen' | 'BriefLoonschaal';
// Raam + Bemiddeling added in Phase 4

export interface ZzpContractFields {
  zzpBtwNumber?: string;
  zzpKvkNumber?: string;
  zzpHourlyRateExclBtw?: number;
  zzpBtwPercentage: number;        // always 21
  zzpMediationFeePerWeek?: number; // default 50
  zzpContractNumber?: string;
  zzpWorkDescription?: string;
  zzpLocation?: string;
}

export interface InleenContractFields {
  inleenLendingCompanyId?: string;
  inleenBorrowingCompanyId?: string;
  inleenStartDate?: string;
  inleenEndDate?: string;
  inleenHourlyRate?: number;
  inleenWorkDescription?: string;
  inleenLocation?: string;
}

export interface BriefContractFields {
  briefMonthlySalary?: number;
  briefGrade?: string;
  briefExpectedMonthlyHours?: number; // default 173.33
}
```

---

### TASK 1.12 — Frontend: Contract create/edit form — type selector + conditional fields

**Files**:
- `frontend/app/[locale]/contracts/create/page.tsx` *(edit)*
- `frontend/app/[locale]/contracts/edit/[id]/page.tsx` *(edit)*

Add **Contract Type selector** near top of form (before type-specific fields):
- Options: CAO / ZZP (Zelfstandige) / Inleen / Brief Loonschaal

**CAO section** (existing fields, shown when type = CAO):
- Pay Scale (A–H dropdown, from `FunctieSchalenCAO-Vervoer.xlsx`)
- Pay Scale Step (1–7)
- Hourly Wage 100%
- etc. (existing fields unchanged)

**ZZP section** (shown when type = ZZP):
- BTW Number (`required`, NL format)
- KvK Number (`required`)
- Hourly Rate excl. BTW (`required`, number)
- BTW % (read-only display: 21%, per decision)
- Mediation Fee per week (number, default 50)
- Contract Number (text, e.g. "20260201-02")
- Work Description (text)
- Location (text)

**Inleen section** (shown when type = Inleen):
- Lending Company (company selector — Uitlener)
- Borrowing Company (company selector — Inlener)
- Start Date / End Date
- Hourly Rate (number)
- Work Description / Location

**Brief section** (shown when type = BriefLoonschaal):
- Monthly Salary (number, `required`)
- Grade/Level (text, optional)
- Expected Monthly Hours (number, default 173.33)
- ℹ️ Helper text: "Standaard Nederlandse arbeidsregels gelden (overwerk, vakantie, ATV)"

---

### TASK 1.13 — Frontend: Update hooks payload types

**Files**:
- `frontend/hooks/useCreateEmployeeContract.ts` *(edit)*
- `frontend/hooks/useEmployeeContractUpdate.ts` *(edit)*
- `frontend/hooks/useEmployeeContractDetail.ts` *(edit)*

Include `contractType` and all type-specific fields in request/response types.

---

### TASK 1.14 — Frontend: Driver list — contract type badge

**File**: `frontend/app/[locale]/drivers/page.tsx` *(edit)*

Add "Contract" column with colored MUI Chip:
- CAO → blue
- ZZP → orange
- Inleen → purple
- BriefLoonschaal → teal

---

### TASK 1.15 — Frontend: Driver / contract detail — type-specific display

**Files**:
- `frontend/app/[locale]/drivers/[id]/page.tsx` *(edit)*
- `frontend/app/[locale]/contracts/[id]/page.tsx` *(edit)*

Show the matching field group based on `contractType`. CAO → existing fields; ZZP → BTW/KvK/rate; Inleen → companies/period/rate; Brief → salary/grade.

---

### TASK 1.16 — Frontend: Timesheet/report display — ZZP invoice breakdown

**File**: Report display pages *(edit)*

For ZZP: show `SubtotalExclBtw`, `BTW 21%`, `TotalInclBtw`, optional mediation fee note.

---

## PHASE 1 — Testing Plan

### TDD Order for Phase 1
Write tests → run (all fail RED) → implement code → run (all pass GREEN) → refactor.

---

### Backend Tests — Write These FIRST

#### `TruckManagement.Tests/Services/ContractTypeCalculationTests.cs` *(new)*

Uses `InMemoryDatabase` + direct `ReportCalculationService` instantiation.

```csharp
// ── ZZP calculation ──────────────────────────────────────────────────────────
[Fact] ZzpReport_HoursTimesRate_EqualsSubtotal()
  // 10h × €50/h = €500 subtotal

[Fact] ZzpReport_Btw21Percent_CalculatedOnSubtotal()
  // subtotal €500 → BTW €105 → total €605

[Fact] ZzpReport_NoVacationAccrual()
  // report.VacationHoursAccrued == 0

[Fact] ZzpReport_NoAtvAccrual()
  // report.AtvHoursAccrued == 0

// ── Brief calculation ────────────────────────────────────────────────────────
[Fact] BriefReport_DerivedHourlyRate_IsMonthlyDivided173()
  // monthlySalary 3000 / 173.33 ≈ 17.31 hourlyRate

[Fact] BriefReport_OvertimeOver40h_Gets125Multiplier()
  // 45h total: 40h normal + 5h × 1.25

[Fact] BriefReport_Under40h_NoOvertimePremium()
  // 35h at derived rate, no multiplier

[Fact] BriefReport_VacationAccrualSameAsCAO()
  // vacation days > 0

// ── Inleen calculation ───────────────────────────────────────────────────────
[Fact] InleenReport_HoursTimesInleenRate_EqualsTotalPay()
  // 10h × €30/h = €300

// ── CAO regression ───────────────────────────────────────────────────────────
[Fact] CaoReport_ExistingBehavior_Unchanged()
  // same result before and after ContractType field added
```

#### `TruckManagement.Tests/Endpoints/EmployeeContractEndpointTests.cs` *(new)*

Uses `TestServer` + `TestAuthHandler`.

```csharp
// ── HR module gate ────────────────────────────────────────────────────────────
[Fact] PostDriverWithContract_HRModuleDisabled_Returns403()
  // customerAdmin without HR module → 403

[Fact] PostDriverWithContract_HRModuleEnabled_Returns201()
  // customerAdmin with HR enabled → 201

// ── ZZP validation ────────────────────────────────────────────────────────────
[Fact] PostZzpContract_MissingBtwNumber_Returns400()
  // type=ZZP, no ZzpBtwNumber → 400

[Fact] PostZzpContract_MissingKvkNumber_Returns400()
  // type=ZZP, no ZzpKvkNumber → 400

[Fact] PostZzpContract_AllRequiredFields_Returns201()
  // valid ZZP body → 201, ContractType=ZZP in response

[Fact] PostZzpContract_DefaultsBtwTo21_WhenNotSupplied()
  // ZzpBtwPercentage not sent → response.ZzpBtwPercentage == 21

// ── Inleen validation ─────────────────────────────────────────────────────────
[Fact] PostInleenContract_MissingLendingCompany_Returns400()

[Fact] PostInleenContract_ValidBody_Returns201()

// ── Brief validation ──────────────────────────────────────────────────────────
[Fact] PostBriefContract_MissingMonthlySalary_Returns400()

[Fact] PostBriefContract_ValidBody_Returns201()

// ── GET — ContractType in response ───────────────────────────────────────────
[Fact] GetDriverWithContract_ReturnsContractTypeField()
  // existing driver → GET response contains "contractType"

[Fact] GetDriverWithContract_ExistingDriver_DefaultsToCAO()
  // driver with no explicit ContractType → returns "CAO"

// ── PUT — switch contract type ────────────────────────────────────────────────
[Fact] PutContract_SwitchFromCAOToZZP_Persists()
  // driver was CAO, PUT with ZZP body → GET returns ZZP

[Fact] PutContract_SwitchFromZZPToCAO_ClearsZzpFields()
  // ZZP → CAO: ZzpBtwNumber is null in response
```

#### Run command (before writing any implementation)
```bash
cd /Users/maksimdrigval/Desktop/Boratech/trucks-management-backend
dotnet test TruckManagement.Tests --filter "FullyQualifiedName~ContractTypeCalculation|FullyQualifiedName~EmployeeContractEndpoint"
# Expected: all FAIL (RED)
```

---

### Frontend — Manual UX Verification (Phase 1)

Execute in order. Use a browser with DevTools network tab open.

#### Checklist: Contract type selector on create/edit form

| # | Step | Expected result |
|---|---|---|
| 1 | Navigate to `/drivers/create` | Form renders with Contract Type selector near top |
| 2 | Default value in selector | "CAO" is pre-selected |
| 3 | Select "ZZP (Zelfstandige)" | CAO pay-scale fields disappear; ZZP section appears (BTW nr, KvK nr, hourly rate, BTW%, mediation fee, contract nr, description, location) |
| 4 | BTW % field | Shows "21%" as read-only / pre-filled; cannot be changed |
| 5 | Select "Inleen" | ZZP section hides; Inleen section appears (lending company, borrowing company, dates, rate) |
| 6 | Select "Brief Loonschaal" | Inleen section hides; Brief section appears (monthly salary required, grade optional, expected hours default 173.33) |
| 7 | Info text under Brief section | "Standaard Nederlandse arbeidsregels gelden (overwerk, vakantie, ATV)" visible |
| 8 | Select back to "CAO" | CAO section reappears; all other sections hidden |
| 9 | Submit ZZP form with empty BTW nr | Inline validation error on BTW nr field |
| 10 | Submit valid ZZP form | Network POST succeeds (201); redirected to driver detail |

#### Checklist: Driver list — contract type badge

| # | Step | Expected result |
|---|---|---|
| 11 | Navigate to `/drivers` | "Contract" column visible |
| 12 | CAO driver | Blue "CAO" chip |
| 13 | ZZP driver (after creating in step 10) | Orange "ZZP" chip |

#### Checklist: Driver detail — type-specific fields

| # | Step | Expected result |
|---|---|---|
| 14 | Click ZZP driver → detail page | ZZP section visible: BTW nr, KvK nr, hourly rate; CAO pay-scale section NOT shown |
| 15 | Click "Contract bewerken" | Edit form opens pre-filled with ZZP type and ZZP fields |

#### Checklist: Report / timesheet — ZZP breakdown

| # | Step | Expected result |
|---|---|---|
| 16 | Open weekly report for ZZP driver | Shows: Subtotaal excl. BTW, BTW 21%, Totaal incl. BTW (no vacation/TvT rows) |
| 17 | Open weekly report for CAO driver | Normal CAO rows still intact (regression check) |

---

## PHASE 2 — R23: Potential Driver Pipeline

### What we are building
A recruitment pipeline for tracking driver candidates before they become active drivers. Customer admins can add prospects, track their status, and convert them to drivers.

**Confirmed rules**:
- Required fields: First Name, Last Name, Phone, Email, Company (all 4 mandatory)
- Conversion: manual — admin fills remaining driver fields; prospect record kept with "Converted" status + link
- Access: `customerAdmin` and `globalAdmin` only (planners cannot see this)

---

### TASK 2.1 — Create `PotentialDriver` entity

**File**: `backend/TruckManagement/Entities/PotentialDriver.cs` *(new)*

```csharp
public class PotentialDriver
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = default!;

    // Required fields (per decision: name + phone + email + company)
    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string PhoneNumber { get; set; } = default!;

    // Optional recruitment data
    public string Status { get; set; } = "New";
    // New | Contacted | Interviewing | OfferMade | Accepted | Rejected | Converted
    public string? Notes { get; set; }
    public string? Source { get; set; }
    // Referral | JobBoard | LinkedIn | WalkIn | Other
    public int? ExperienceYears { get; set; }
    public bool? HasCELicense { get; set; }
    public DateTime? FirstContactDate { get; set; }
    public DateTime? LastContactDate { get; set; }
    public DateTime? ExpectedStartDate { get; set; }

    // Conversion — manual; record kept after conversion
    public Guid? ConvertedToDriverId { get; set; }
    [ForeignKey(nameof(ConvertedToDriverId))]
    public Driver? ConvertedToDriver { get; set; }
    public DateTime? ConvertedAt { get; set; }

    // Audit
    public string? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; } = false;
}
```

---

### TASK 2.2 — Add `DbSet` + model config in `ApplicationDbContext`

**File**: `backend/TruckManagement/Data/ApplicationDbContext.cs` *(edit)*

```csharp
public DbSet<PotentialDriver> PotentialDrivers { get; set; }
```

In `OnModelCreating`:
```csharp
modelBuilder.Entity<PotentialDriver>(e => {
    e.HasKey(x => x.Id);
    e.HasOne(x => x.Company).WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.Restrict);
    e.HasOne(x => x.ConvertedToDriver).WithMany().HasForeignKey(x => x.ConvertedToDriverId).OnDelete(DeleteBehavior.SetNull);
    e.Property(x => x.Status).HasMaxLength(50);
    e.Property(x => x.Email).HasMaxLength(255);
});
```

---

### TASK 2.3 — Run EF Migration

```bash
dotnet ef migrations add AddPotentialDrivers
dotnet ef database update
```

---

### TASK 2.4 — Create DTOs

**File**: `backend/TruckManagement/DTOs/PotentialDriverDto.cs` *(new)*  
**File**: `backend/TruckManagement/DTOs/CreatePotentialDriverRequest.cs` *(new)*  
**File**: `backend/TruckManagement/DTOs/UpdatePotentialDriverRequest.cs` *(new)*

`CreatePotentialDriverRequest` required fields (per decision):
- `CompanyId` — required
- `FirstName` — required
- `LastName` — required
- `Email` — required (email validation)
- `PhoneNumber` — required

All other fields optional.

---

### TASK 2.5 — Create `PotentialDriverEndpoints`

**File**: `backend/TruckManagement/Endpoints/PotentialDriverEndpoints.cs` *(new)*

> ⚠️ **HR Module gate**: register the entire group under `.RequireModule(SystemModule.HR)` — same pattern as `DriverInvoiceEndpoints` uses `SystemModule.Finance`.

```csharp
var group = app.MapGroup("").RequireModule(SystemModule.HR);
```

| Method | Route | Roles | Notes |
|---|---|---|---|
| `GET` | `/api/potential-drivers` | customerAdmin, globalAdmin | customerAdmin auto-filtered to own company. Params: `?status=&search=&page=&pageSize=` |
| `GET` | `/api/potential-drivers/{id}` | customerAdmin, globalAdmin | |
| `POST` | `/api/potential-drivers` | customerAdmin, globalAdmin | |
| `PUT` | `/api/potential-drivers/{id}` | customerAdmin, globalAdmin | |
| `DELETE` | `/api/potential-drivers/{id}` | customerAdmin, globalAdmin | Soft-delete |
| `GET` | `/api/potential-drivers/{id}/prefill` | customerAdmin, globalAdmin | Returns pre-filled driver creation data for the conversion flow |
| `PATCH` | `/api/potential-drivers/{id}/mark-converted` | customerAdmin, globalAdmin | Called after driver is created; sets `ConvertedToDriverId` + status = "Converted" |

**Authorization**: `customerAdmin` can only see/edit prospects for their own `CompanyId`. `globalAdmin` sees all. **Planners have no access** (per decision).

---

### TASK 2.6 — Register endpoints in `Program.cs`

**File**: `backend/TruckManagement/Program.cs` *(edit)*

```csharp
app.MapPotentialDriverEndpoints();
```

---

### TASK 2.7 — Frontend: Types

**File**: `frontend/types/potentialDriver.ts` *(new)*

```typescript
export type PotentialDriverStatus =
  'New' | 'Contacted' | 'Interviewing' | 'OfferMade' | 'Accepted' | 'Rejected' | 'Converted';

export interface PotentialDriver {
  id: string;
  companyId: string;
  companyName?: string;
  firstName: string;
  lastName: string;
  email: string;          // required per decision
  phoneNumber: string;    // required per decision
  status: PotentialDriverStatus;
  notes?: string;
  source?: string;
  experienceYears?: number;
  hasCELicense?: boolean;
  firstContactDate?: string;
  lastContactDate?: string;
  expectedStartDate?: string;
  convertedToDriverId?: string;
  convertedAt?: string;
  createdAt: string;
}
```

---

### TASK 2.8 — Frontend: Hooks

Create these 6 hooks following existing patterns:
- `hooks/usePotentialDrivers.ts` — list with status/search/company filters
- `hooks/usePotentialDriverDetail.ts` — single by ID
- `hooks/useCreatePotentialDriver.ts` — POST
- `hooks/useUpdatePotentialDriver.ts` — PUT
- `hooks/useDeletePotentialDriver.ts` — soft-delete
- `hooks/useConvertPotentialDriver.ts` — GET prefill data + PATCH mark-converted

---

### TASK 2.9 — Frontend: Pages

**Directory**: `frontend/app/[locale]/potential-drivers/`

**List page** (`page.tsx`):
- Header: "Potentiële chauffeurs" + "Nieuwe toevoegen" button
- Filter bar: Status dropdown + name search
- Table columns: Name | Phone | Email | Status (colored chip) | Expected Start | Company (globalAdmin only) | Actions
- Status chips: New=gray / Contacted=blue / Interviewing=orange / OfferMade=purple / Accepted=green / Rejected=red / Converted=teal (grayed row)
- Actions: View | Edit | Convert (hidden for Converted records) | Delete
- **Access**: not shown in sidebar for planners

**Create page** (`create/page.tsx`):
- Required: First Name, Last Name, Email, Phone, Company (pre-filled + locked for customerAdmin)
- Optional: Status (default New), Source, Expected Start Date, Experience Years, CE License, Notes

**Detail page** (`[id]/page.tsx`):
- All fields displayed
- Status chip
- "Bewerken" button
- "Verwijderen" button (with confirm dialog)
- "Converteren naar chauffeur" button — hidden if already Converted
- If converted: "Bekijk chauffeursprofiel →" link to `/drivers/{convertedToDriverId}`

**Edit page** (`edit/[id]/page.tsx`):
- Same form as create, pre-filled

**Convert flow**:
1. Admin clicks "Converteren naar chauffeur"
2. Frontend calls `GET /api/potential-drivers/{id}/prefill`
3. Navigates to `/drivers/create?firstName=...&lastName=...&email=...&phone=...&companyId=...`
4. Driver create page reads URL params and pre-fills the form
5. Admin fills remaining required fields (car, compensation settings, etc.)
6. On save: driver is created, then frontend calls `PATCH /api/potential-drivers/{id}/mark-converted?driverId={newId}`
7. Redirect back to prospect detail — status now shows "Converted" with link to new driver

---

### TASK 2.10 — Frontend: Driver create page — handle prefill params

**File**: `frontend/app/[locale]/drivers/create/page.tsx` *(edit)*

Read URL search params `firstName`, `lastName`, `email`, `phoneNumber`, `companyId`. If present, pre-fill those fields and call `mark-converted` after successful save.

---

### TASK 2.11 — Frontend: Navigation

Add "Potentiële chauffeurs" menu item in sidebar. Gate with **both** role check and module check:

```tsx
{isModuleEnabled('HR') && (user.roles.includes('customerAdmin') || user.roles.includes('globalAdmin')) && (
    <NavItem onClick={() => go('/potential-drivers')}>...</NavItem>
)}
```

---

### TASK 2.12 — Frontend: i18n

Add translation keys to `messages/nl.json` + `messages/en.json`:
- Page titles, status labels, column headers, button labels, form field labels

---

## PHASE 2 — Testing Plan

### TDD Order for Phase 2
Write tests → RED → implement → GREEN → refactor.

---

### Backend Tests — Write These FIRST

#### `TruckManagement.Tests/Services/PotentialDriverServiceTests.cs` *(new)*

```csharp
// ── Soft delete ───────────────────────────────────────────────────────────────
[Fact] SoftDelete_SetsIsDeletedTrue_DoesNotRemoveRow()

[Fact] List_ExcludesSoftDeletedProspects()

// ── Company scoping ───────────────────────────────────────────────────────────
[Fact] List_CustomerAdmin_ReturnsOnlyOwnCompanyProspects()
  // two companies, two prospects each → customerAdmin of company A sees only 2

[Fact] List_GlobalAdmin_ReturnsAllProspects()
  // globalAdmin sees all 4

// ── Status transitions ────────────────────────────────────────────────────────
[Fact] Create_DefaultStatus_IsNew()

[Fact] MarkConverted_SetsStatusAndConvertedDriverId()
  // PATCH mark-converted: Status = "Converted", ConvertedToDriverId = driverId, ConvertedAt set

[Fact] MarkConverted_AlreadyConverted_Returns400()
  // second PATCH on already-converted prospect → error

// ── Prefill ───────────────────────────────────────────────────────────────────
[Fact] Prefill_ReturnsCorrectFields()
  // FirstName, LastName, Email, PhoneNumber, CompanyId all in response
```

#### `TruckManagement.Tests/Endpoints/PotentialDriverEndpointTests.cs` *(new)*

```csharp
// ── HR module gate ────────────────────────────────────────────────────────────
[Fact] GetProspects_HRModuleDisabled_Returns403()

[Fact] PostProspect_HRModuleDisabled_Returns403()

[Fact] GetProspects_HRModuleEnabled_Returns200()

// ── Role gate ─────────────────────────────────────────────────────────────────
[Fact] GetProspects_AsPlanner_Returns403()
  // role = "planner" → 403 regardless of module

[Fact] GetProspects_AsCustomerAdmin_Returns200()

[Fact] GetProspects_AsGlobalAdmin_Returns200()

// ── Required fields validation ────────────────────────────────────────────────
[Fact] PostProspect_MissingFirstName_Returns400()

[Fact] PostProspect_MissingEmail_Returns400()

[Fact] PostProspect_MissingPhoneNumber_Returns400()

[Fact] PostProspect_MissingCompanyId_Returns400()

[Fact] PostProspect_AllRequiredFields_Returns201()
  // response includes id, status="New", createdAt

// ── GET by ID ─────────────────────────────────────────────────────────────────
[Fact] GetProspectById_OwnCompany_Returns200()

[Fact] GetProspectById_OtherCompany_Returns404()
  // customerAdmin cannot see another company's prospect

// ── Soft delete ───────────────────────────────────────────────────────────────
[Fact] DeleteProspect_Returns204_AndExcludesFromList()

// ── Prefill + mark-converted ──────────────────────────────────────────────────
[Fact] GetPrefill_Returns200_WithExpectedFields()

[Fact] PatchMarkConverted_ValidDriverId_SetsConvertedFields()

[Fact] PatchMarkConverted_NonExistentDriverId_Returns400()
```

#### Run command (before writing any implementation)
```bash
dotnet test TruckManagement.Tests --filter "FullyQualifiedName~PotentialDriver"
# Expected: all FAIL (RED)
```

---

### Frontend — Manual UX Verification (Phase 2)

#### Prerequisite
Global admin must have enabled the HR module for the customerAdmin account you will test with (use the Feature Toggles page at `/admins/feature-toggles`).

#### Checklist: Sidebar visibility

| # | Step | Expected result |
|---|---|---|
| 1 | Login as planner | "Potentiële chauffeurs" NOT in sidebar |
| 2 | Login as customerAdmin with HR module OFF | "Potentiële chauffeurs" NOT in sidebar |
| 3 | Enable HR module for this customerAdmin (as globalAdmin) | — |
| 4 | Refresh as customerAdmin | "Potentiële chauffeurs" NOW visible in sidebar |

#### Checklist: Create a prospect

| # | Step | Expected result |
|---|---|---|
| 5 | Click "Potentiële chauffeurs" in sidebar | List page loads, shows empty state or existing list |
| 6 | Click "Nieuwe toevoegen" | Create form opens |
| 7 | Submit without filling any fields | 4 validation errors: First Name, Last Name, Email, Phone required |
| 8 | Fill all 4 required fields + Company, click Save | Network POST 201; redirected to list |
| 9 | New prospect visible in list | Status chip shows "New" (gray) |

#### Checklist: Status lifecycle

| # | Step | Expected result |
|---|---|---|
| 10 | Click prospect row → detail page | All fields visible, "Converteren naar chauffeur" button present |
| 11 | Click "Bewerken" | Edit form pre-filled |
| 12 | Change status to "Contacted", save | Detail page refreshes, chip shows "Contacted" (blue) |
| 13 | Change status to "Accepted" | Chip shows "Accepted" (green) |

#### Checklist: Conversion flow

| # | Step | Expected result |
|---|---|---|
| 14 | On prospect detail, click "Converteren naar chauffeur" | Navigates to `/drivers/create` with first name, last name, email, phone, company pre-filled |
| 15 | Fill remaining required driver fields (car, etc.), click Save | Driver created; `mark-converted` PATCH called (visible in DevTools network tab) |
| 16 | Return to prospect detail | Status chip shows "Converted" (teal); "Bekijk chauffeursprofiel →" link visible |
| 17 | Click "Bekijk chauffeursprofiel" | Navigates to the correct driver's detail page |
| 18 | Attempt to click "Converteren" again | Button NOT present on a Converted prospect |

#### Checklist: Company scoping

| # | Step | Expected result |
|---|---|---|
| 19 | Login as customerAdmin for company B | Cannot see company A's prospects in list |
| 20 | Manually navigate to `/potential-drivers/{id}` of company A's prospect | 404 or empty response |

---

## PHASE 3 — R25 Part A: Non-Driver Employee Entity

### What we are building
A separate `Employee` entity for non-driver staff (planners, admins, accountants, managers). They can be assigned CAO or BriefLoonschaal contracts. No timesheets or payslips yet (contracts only, per decision). Architecture: Option A — keep `Driver` entirely unchanged.

---

### TASK 3.1 — Create `EmployeeRole` enum

**File**: `backend/TruckManagement/Enums/EmployeeRole.cs` *(new)*

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

---

### TASK 3.2 — Create `Employee` entity

**File**: `backend/TruckManagement/Entities/Employee.cs` *(new)*

```csharp
public class Employee
{
    public Guid Id { get; set; }

    // Identity link (same pattern as Driver and ContactPerson)
    public string AspNetUserId { get; set; } = default!;
    [ForeignKey(nameof(AspNetUserId))]
    public ApplicationUser User { get; set; } = default!;

    public Guid? CompanyId { get; set; }
    public Company? Company { get; set; }

    public EmployeeRole Role { get; set; } = EmployeeRole.Other;

    // Optional CRM reference (from BemiddelingZZP.xlsx CRM sheet)
    public string? ExternalClientNumber { get; set; }  // KlantNr
    public string? Language { get; set; }              // nl/bg/en (for multilingual PDFs)

    // Contract (same EmployeeContract entity used for drivers, reused here)
    public Guid? EmployeeContractId { get; set; }
    public EmployeeContract? EmployeeContract { get; set; }

    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
```

---

### TASK 3.3 — Extend `ApplicationUser`

**File**: `backend/TruckManagement/Entities/ApplicationUser.cs` *(edit)*

```csharp
public Employee? Employee { get; set; }
```

---

### TASK 3.4 — Extend `EmployeeContract` — add `EmployeeId` FK

**File**: `backend/TruckManagement/Entities/EmployeeContract.cs` *(edit)*

```csharp
// FK for non-driver employees (in addition to existing DriverId)
public Guid? EmployeeId { get; set; }
[ForeignKey(nameof(EmployeeId))]
public Employee? Employee { get; set; }
```

---

### TASK 3.5 — Run EF Migration

```bash
dotnet ef migrations add AddEmployeeEntity
dotnet ef database update
```

Creates `Employees` table. Adds `EmployeeId` column to `EmployeeContracts`. No existing data touched.

---

### TASK 3.6 — Employee DTOs + Endpoints

**Files** *(new)*:
- `DTOs/EmployeeDto.cs`
- `DTOs/CreateEmployeeRequest.cs`
- `DTOs/UpdateEmployeeRequest.cs`
- `Endpoints/EmployeeEndpoints.cs`

> ⚠️ **HR Module gate**: `var group = app.MapGroup("").RequireModule(SystemModule.HR);`

**Endpoints**:

| Method | Route | Roles | Notes |
|---|---|---|---|
| `GET` | `/api/employees` | customerAdmin, globalAdmin | Filter: role, company, contractType |
| `GET` | `/api/employees/{id}` | customerAdmin, globalAdmin | |
| `POST` | `/api/employees` | customerAdmin, globalAdmin | Creates `ApplicationUser` + `Employee` in one transaction |
| `PUT` | `/api/employees/{id}` | customerAdmin, globalAdmin | |
| `DELETE` | `/api/employees/{id}` | customerAdmin, globalAdmin | Soft-delete |

`CreateEmployeeRequest` required fields: `CompanyId`, `Role`, `Email`, `FirstName`, `LastName`.

---

### TASK 3.7 — Register endpoints in `Program.cs`

```csharp
app.MapEmployeeEndpoints();
```

---

### TASK 3.8 — Frontend: Employee types + hooks

**File**: `frontend/types/employee.ts` *(new)*

Create types for `Employee`, `EmployeeRole`, `CreateEmployeeRequest`, `UpdateEmployeeRequest`.

**Hooks** *(new)*:
- `hooks/useEmployees.ts`
- `hooks/useEmployeeDetail.ts`
- `hooks/useCreateEmployee.ts`
- `hooks/useUpdateEmployee.ts`
- `hooks/useDeleteEmployee.ts`

---

### TASK 3.9 — Frontend: Employee pages

**Directory**: `frontend/app/[locale]/employees/`

**List page**: Role chip | Name | Company | Contract Type | Actions  
**Create page**: Email, First Name, Last Name, Company selector, Role selector, Language (for multilingual PDF)  
**Detail page**: personal info + contract section (type-specific display, same as driver detail)  
**Edit page**: same form pre-filled

---

### TASK 3.10 — Frontend: Navigation

Add "Medewerkers" menu item. Gate with both HR module and role check:

```tsx
{isModuleEnabled('HR') && (
    <NavItem onClick={() => go('/employees')}>...</NavItem>
)}
```

---

## PHASE 3 — Testing Plan

### TDD Order for Phase 3
Write tests → RED → implement → GREEN → refactor.

---

### Backend Tests — Write These FIRST

#### `TruckManagement.Tests/Services/EmployeeEntityTests.cs` *(new)*

```csharp
// ── Creation ──────────────────────────────────────────────────────────────────
[Fact] CreateEmployee_AlsoCreatesApplicationUser()
  // POST /employees → both Employee row and ApplicationUser exist

[Fact] CreateEmployee_WithDuplicateEmail_Returns409()
  // second POST with same email → conflict

[Fact] CreateEmployee_RequiredFieldsMissing_Returns400()
  // CompanyId OR Role OR Email missing → 400

// ── Soft delete ───────────────────────────────────────────────────────────────
[Fact] DeleteEmployee_SetsIsDeletedTrue_OnEmployee()
  // Employee.IsDeleted = true

[Fact] DeleteEmployee_DoesNotDeleteApplicationUser()
  // ApplicationUser row still exists after employee soft-delete

// ── Contract assignment ───────────────────────────────────────────────────────
[Fact] Employee_CanBeAssignedCAOContract()
  // POST /employees/{id}/contract with type=CAO → EmployeeContractId set

[Fact] Employee_CanBeAssignedBriefContract()
  // POST /employees/{id}/contract with type=BriefLoonschaal → MonthlySalary stored

[Fact] Employee_CannotBeAssignedZZPContract()
  // POST /employees/{id}/contract with type=ZZP → 400
  // Reasoning: ZZP is a freelance driver contract, not for office staff

[Fact] Employee_CannotBeAssignedInleenContract()
  // type=Inleen → 400 (Inleen is a secondment contract, not for employees)

// ── Scoping ───────────────────────────────────────────────────────────────────
[Fact] List_CustomerAdmin_ReturnsOnlyOwnCompanyEmployees()

[Fact] List_GlobalAdmin_ReturnsAll()
```

#### `TruckManagement.Tests/Endpoints/EmployeeEndpointTests.cs` *(new)*

```csharp
// ── HR module gate ────────────────────────────────────────────────────────────
[Fact] GetEmployees_HRModuleDisabled_Returns403()

[Fact] PostEmployee_HRModuleEnabled_Returns201()

// ── Role gate ─────────────────────────────────────────────────────────────────
[Fact] GetEmployees_AsDriver_Returns403()

[Fact] GetEmployees_AsCustomerAdmin_Returns200()

[Fact] GetEmployees_AsGlobalAdmin_Returns200()

// ── CRUD ──────────────────────────────────────────────────────────────────────
[Fact] PutEmployee_UpdatesFields()
  // PUT /employees/{id}: Role changed → GET confirms new role

[Fact] DeleteEmployee_Returns204()

[Fact] GetEmployeeById_IncludesContractInfo()
  // response has EmployeeContractId, ContractType if assigned

// ── Filter ────────────────────────────────────────────────────────────────────
[Fact] GetEmployees_FilterByRole_ReturnsOnlyMatchingRole()
  // ?role=Planner → only Planners in result
```

#### Run command
```bash
dotnet test TruckManagement.Tests --filter "FullyQualifiedName~EmployeeEntity|FullyQualifiedName~EmployeeEndpoint"
# Expected: all FAIL (RED)
```

---

### Frontend — Manual UX Verification (Phase 3)

#### Prerequisite
HR module must be enabled for the customerAdmin being tested.

#### Checklist: Create and manage an employee

| # | Step | Expected result |
|---|---|---|
| 1 | Login as customerAdmin with HR ON | "Medewerkers" visible in sidebar |
| 2 | Navigate to `/employees` | List page loads |
| 3 | Click "Nieuwe medewerker" | Create form with: Email, First Name, Last Name, Company (locked), Role selector, Language |
| 4 | Submit without Email | Validation error on Email field |
| 5 | Fill all required fields, Role = "Planner", click Save | Employee created; appears in list with "Planner" role chip |
| 6 | Click employee row → detail page | Personal info shown; Contract section shows "Geen contract" |
| 7 | Click "Contract toevoegen" | Contract form appears; type options are only: CAO, Brief Loonschaal (NOT ZZP or Inleen) |
| 8 | Select "Brief Loonschaal", fill Monthly Salary | Save contract → detail page shows contract type + salary |
| 9 | Click "Bewerken" on employee | Edit form pre-filled with all values |
| 10 | Click "Verwijderen" → confirm | Employee removed from list; ApplicationUser login still works |

#### Checklist: Role-based access

| # | Step | Expected result |
|---|---|---|
| 11 | Login as driver | "Medewerkers" NOT in sidebar |
| 12 | Login as planner | "Medewerkers" NOT in sidebar |
| 13 | Disable HR module for customerAdmin | "Medewerkers" disappears from sidebar on next refresh |

---

## PHASE 4 — R25 Part B: Raam + Bemiddeling Contract Types ✅ COMPLETE

### What we are building
Two new contract types based on the exact templates in `BemiddelingZZP.xlsx`: Raam (framework agreement) and Bemiddeling (mediation agreement). These are used for the ZZP mediation workflow where Boratech acts as intermediary between a transport company and a ZZP driver.

---

### TASK 4.1 — Extend `ContractType` enum

**File**: `backend/TruckManagement/Enums/ContractType.cs` *(edit)*

```csharp
public enum ContractType
{
    CAO,
    ZZP,
    Inleen,
    BriefLoonschaal,
    Raam,        // Framework agreement (BemiddelingZZP.xlsx Raam sheet)
    Bemiddeling  // Mediation agreement (BemiddelingZZP.xlsx Bemiddeling sheet)
}
```

---

### TASK 4.2 — Add Raam + Bemiddeling fields to `EmployeeContract`

**File**: `backend/TruckManagement/Entities/EmployeeContract.cs` *(edit)*

```csharp
// ── Raam-specific (BemiddelingZZP.xlsx Raam sheet) ──────────────────────────
public string? RaamContractNumber { get; set; }  // e.g. "20260201-02"
public DateTime? RaamStartDate { get; set; }
public string? RaamWorkDescription { get; set; }
public string? RaamLocation { get; set; }

// ── Bemiddeling-specific (BemiddelingZZP.xlsx Bemiddeling + Bemiddel_ZZP) ───
public string? BemiddelingContractNumber { get; set; }
public Guid? BemiddelingOpdrachtgeverId { get; set; }  // Transport company
[ForeignKey(nameof(BemiddelingOpdrachtgeverId))]
public Company? BemiddelingOpdrachtgever { get; set; }
public decimal? BemiddelingMediationFeePerWeek { get; set; }  // default €50
public bool? BemiddelingIncludesFacturing { get; set; }
public bool? BemiddelingIncludesPrefinancing { get; set; }
```

---

### TASK 4.3 — Run EF Migration

```bash
dotnet ef migrations add AddRaamAndBemiddelingContractTypes
dotnet ef database update
```

---

### TASK 4.4 — Extend DTOs

Add Raam + Bemiddeling fields to `CreateEmployeeContractRequest`, `UpdateEmployeeContractRequest`, `DriverWithContractDto`.

---

### TASK 4.5 — Raam PDF Builder

**File**: `backend/TruckManagement/Services/DriverContractPdfBuilder.cs` *(edit)*

`BuildRaamContractPdf` — based on `BemiddelingZZP.xlsx` Raam sheet. Parties: Bemiddelaar (Boratech / company) ↔ Opdrachtgever (transport company). Articles: achtergrond en doel, juridische kwalificatie (art. 7:425 BW, no TBA), positie bemiddelaar, totstandkoming opdrachten.

Data bindings:
- `RaamContractNumber` → document header
- `CompanyName` / `CompanyAddress` / `CompanyKvk` / `CompanyBtw` → Bemiddelaar section
- `EmployeeFirstName`/`EmployeeLastName` → contact person
- Opdrachtgever name/address → from linked company
- `RaamStartDate` → ingangsdatum
- `RaamWorkDescription` → scope of work

Include the **Bulgarian-language version** as a second page/section when `Employee.Language == "bg"` (based on `BemiddelingZZP.xlsx` Рамков sheet).

---

### TASK 4.6 — Bemiddeling PDF Builder

**File**: `backend/TruckManagement/Services/DriverContractPdfBuilder.cs` *(edit)*

`BuildBemiddelingContractPdf` — based on `BemiddelingZZP.xlsx` Bemiddeling + Bemiddel_ZZP sheets. Parties: Bemiddelaar (Boratech) ↔ ZZP driver (Opdrachtnemer).

Key clauses from Bemiddel_ZZP sheet:
- Article 2a: Contact/intro service — €50/week mediation fee (`BemiddelingMediationFeePerWeek`)
- Article 2c: Facturatie on behalf of ZZP if `BemiddelingIncludesFacturing = true`
- Article 2e: Pre-financing if `BemiddelingIncludesPrefinancing = true`
- Article 3: Duration — indefinite, cancellable with 14-day notice
- Article 4: ZZP status requirements (KvK, insurance, AVB)

Include Bulgarian version when `Employee.Language == "bg"` (based on Посредник sheet).

---

### TASK 4.7 — Update `ReportCalculationService` for Raam + Bemiddeling

**File**: `Services/Reports/ReportCalculationService.cs` *(edit)*

```csharp
ContractType.Raam        => await BuildZzpReportAsync(rawData, timeframe), // same billing logic as ZZP
ContractType.Bemiddeling => await BuildZzpReportAsync(rawData, timeframe), // + mediation fee deduction
```

For Bemiddeling: subtract `BemiddelingMediationFeePerWeek` from net payout shown.

---

### TASK 4.8 — Frontend: Add Raam + Bemiddeling to types

**File**: `frontend/types/employeeContract.ts` *(edit)*

Update `ContractType` union:
```typescript
export type ContractType = 'CAO' | 'ZZP' | 'Inleen' | 'BriefLoonschaal' | 'Raam' | 'Bemiddeling';
```

Add interfaces:
```typescript
export interface RaamContractFields {
  raamContractNumber?: string;
  raamStartDate?: string;
  raamWorkDescription?: string;
  raamLocation?: string;
}

export interface BemiddelingContractFields {
  bemiddelingContractNumber?: string;
  bemiddelingOpdrachtgeverId?: string;
  bemiddelingMediationFeePerWeek?: number; // default 50
  bemiddelingIncludesFacturing?: boolean;
  bemiddelingIncludesPrefinancing?: boolean;
}
```

---

### TASK 4.9 — Frontend: Contract form — Raam + Bemiddeling sections

**Files**: `contracts/create/page.tsx`, `contracts/edit/[id]/page.tsx` *(edit)*

**Raam section** (shown when type = Raam):
- Contract Number (text)
- Start Date
- Work Description
- Location

**Bemiddeling section** (shown when type = Bemiddeling):
- Contract Number (text)
- Opdrachtgever (company selector — the transport company being mediated for)
- Mediation Fee per week (number, default 50)
- Includes Facturation? (toggle)
- Includes Pre-financing? (toggle)

---

### TASK 4.10 — Frontend: Update hooks

Update payload types in `useCreateEmployeeContract.ts` and `useEmployeeContractUpdate.ts` to include Raam + Bemiddeling fields.

---

## PHASE 4 — Testing Plan

### TDD Order for Phase 4
Write tests → RED → implement → GREEN → refactor.

---

### Backend Tests — Write These FIRST

#### `TruckManagement.Tests/Endpoints/RaamBemiddelingEndpointTests.cs` *(new)*

```csharp
// ── Raam — validation ─────────────────────────────────────────────────────────
[Fact] PostRaamContract_MissingContractNumber_Returns400()

[Fact] PostRaamContract_MissingStartDate_Returns400()

[Fact] PostRaamContract_ValidBody_Returns201()
  // response contains ContractType = "Raam", RaamContractNumber

[Fact] GetContractWithRaamType_ReturnsRaamFields()
  // GET /drivers/{id}/with-contract → raamContractNumber, raamStartDate in response

// ── Bemiddeling — validation ──────────────────────────────────────────────────
[Fact] PostBemiddelingContract_MissingOpdrachtgeverId_Returns400()

[Fact] PostBemiddelingContract_ValidBody_Returns201()
  // response contains ContractType = "Bemiddeling"

[Fact] PostBemiddelingContract_DefaultsMediationFeeTo50_WhenNotSupplied()
  // BemiddelingMediationFeePerWeek not in body → response has 50

[Fact] GetContractWithBemiddelingType_ReturnsBemiddelingFields()
  // bemiddelingContractNumber, bemiddelingOpdrachtgeverId, mediationFee visible

// ── HR module gate ────────────────────────────────────────────────────────────
[Fact] PostRaamContract_HRModuleDisabled_Returns403()

[Fact] PostBemiddelingContract_HRModuleDisabled_Returns403()
```

#### `TruckManagement.Tests/Services/RaamBemiddelingPdfTests.cs` *(new)*

```csharp
// ── Raam PDF ──────────────────────────────────────────────────────────────────
[Fact] BuildRaamContractPdf_ReturnsNonEmptyBytes()
  // PDF byte array length > 0

[Fact] BuildRaamContractPdf_ContainsContractNumber()
  // convert bytes to string, assert contains "20260201-02"

[Fact] BuildRaamContractPdf_ContainsBemiddelaarName()
  // assert contains company name

[Fact] BuildRaamContractPdf_ContainsIngangsdatum()
  // assert contains start date formatted in Dutch

// ── Bemiddeling PDF ───────────────────────────────────────────────────────────
[Fact] BuildBemiddelingContractPdf_ReturnsNonEmptyBytes()

[Fact] BuildBemiddelingContractPdf_ContainsMediationFeeAmount()
  // assert contains "50" (fee per week)

[Fact] BuildBemiddelingContractPdf_WithFacturatie_ContainsFacturatieArticle()
  // IncludesFacturing = true → Article 2c text present

[Fact] BuildBemiddelingContractPdf_WithoutFacturatie_NoFacturatieArticle()
  // IncludesFacturing = false → Article 2c text absent

// ── Language ──────────────────────────────────────────────────────────────────
[Fact] BuildRaamContractPdf_WithBulgarianLanguage_HasLargerByteCount()
  // bg language adds second page → PDF larger than Dutch-only version

[Fact] BuildBemiddelingContractPdf_WithBulgarianLanguage_HasLargerByteCount()
```

#### Run command
```bash
dotnet test TruckManagement.Tests --filter "FullyQualifiedName~RaamBemiddeling"
# Expected: all FAIL (RED)
```

---

### Frontend — Manual UX Verification (Phase 4)

#### Checklist: Raam contract type

| # | Step | Expected result |
|---|---|---|
| 1 | Open contract create for any driver | "Raam" and "Bemiddeling" now appear in type dropdown |
| 2 | Select "Raam" | Raam section appears: Contract Number, Start Date, Work Description, Location |
| 3 | Submit without Contract Number | Validation error on Contract Number |
| 4 | Submit without Start Date | Validation error on Start Date |
| 5 | Fill valid Raam fields, save | Driver detail shows "Raam" contract type chip (new color) |
| 6 | Click "Contract PDF downloaden" | PDF downloads; open it — verify it contains: contract number, company name as Bemiddelaar, start date in Dutch format |
| 7 | Driver with `language = "bg"` | PDF has second section in Bulgarian |

#### Checklist: Bemiddeling contract type

| # | Step | Expected result |
|---|---|---|
| 8 | Select "Bemiddeling" in contract form | Bemiddeling section: Contract Number, Opdrachtgever (company selector), Mediation Fee (default 50), Facturatie toggle, Pre-financing toggle |
| 9 | Opdrachtgever field | Company selector dropdown works, shows transport companies |
| 10 | Submit without Opdrachtgever | Validation error on Opdrachtgever |
| 11 | Facturatie toggle ON + save | PDF contains Article 2c (facturatie clause) |
| 12 | Facturatie toggle OFF + save | PDF does NOT contain Article 2c clause |
| 13 | Pre-financing toggle ON + save | PDF contains Article 2e (pre-financing clause) |
| 14 | Mediation fee changed to 75 + save | PDF shows €75/week fee |

#### Checklist: Report/timesheet — Bemiddeling breakdown

| # | Step | Expected result |
|---|---|---|
| 15 | Open weekly report for Raam/Bemiddeling driver | Same ZZP billing layout (subtotal + BTW) |
| 16 | Bemiddeling driver report | Shows mediation fee deduction line below total |

---

## Full File List

### Backend — New Files (by phase)

**Phase 1 (R24)**
- `Enums/ContractType.cs`
- `Migrations/XXXXXX_AddContractTypesAndTypeSpecificFields.cs`
- `TruckManagement.Tests/Services/ContractTypeCalculationTests.cs` ⬅ write first
- `TruckManagement.Tests/Endpoints/EmployeeContractEndpointTests.cs` ⬅ write first

**Phase 2 (R23)**
- `Entities/PotentialDriver.cs`
- `DTOs/PotentialDriverDto.cs`
- `DTOs/CreatePotentialDriverRequest.cs`
- `DTOs/UpdatePotentialDriverRequest.cs`
- `Endpoints/PotentialDriverEndpoints.cs`
- `Migrations/XXXXXX_AddPotentialDrivers.cs`
- `TruckManagement.Tests/Services/PotentialDriverServiceTests.cs` ⬅ write first
- `TruckManagement.Tests/Endpoints/PotentialDriverEndpointTests.cs` ⬅ write first

**Phase 3 (R25-A)**
- `Entities/Employee.cs`
- `Enums/EmployeeRole.cs`
- `DTOs/EmployeeDto.cs`
- `DTOs/CreateEmployeeRequest.cs`
- `DTOs/UpdateEmployeeRequest.cs`
- `Endpoints/EmployeeEndpoints.cs`
- `Migrations/XXXXXX_AddEmployeeEntity.cs`
- `TruckManagement.Tests/Services/EmployeeEntityTests.cs` ⬅ write first
- `TruckManagement.Tests/Endpoints/EmployeeEndpointTests.cs` ⬅ write first

**Phase 4 (R25-B)**
- `Migrations/XXXXXX_AddRaamAndBemiddelingContractTypes.cs`
- `TruckManagement.Tests/Endpoints/RaamBemiddelingEndpointTests.cs` ⬅ write first
- `TruckManagement.Tests/Services/RaamBemiddelingPdfTests.cs` ⬅ write first

### Backend — Edited Files

- `Entities/EmployeeContract.cs` — extended in Tasks 1.2, 3.4, 4.2
- `Entities/ApplicationUser.cs` — Task 3.3
- `Data/ApplicationDbContext.cs` — Tasks 2.2, 3.2
- `Program.cs` — Tasks 2.6, 3.7
- `DTOs/CreateEmployeeContractRequest.cs` — Tasks 1.4, 4.4
- `DTOs/UpdateEmployeeContractRequest.cs` — Tasks 1.4, 4.4
- `DTOs/DriverWithContractDto.cs` — Tasks 1.4, 4.4
- `DTOs/Reports/DriverTimesheetReport.cs` — Task 1.7
- `Endpoints/EmployeeContractsEndpoints.cs` — Task 1.5
- `Services/Reports/ReportCalculationService.cs` — Tasks 1.6, 4.7
- `Services/DriverContractPdfBuilder.cs` — Tasks 1.8, 4.5, 4.6
- `Services/DriverContractService.cs` — Task 1.9
- `Services/DriverInvoicePdfBuilder.cs` — Task 1.10

### Frontend — New Files

**Phase 1 (R24)**: `types/employeeContract.ts`

**Phase 2 (R23)**: `types/potentialDriver.ts`, 6 hooks, 4 pages

**Phase 3 (R25-A)**: `types/employee.ts`, 5 hooks, 4 pages

**Phase 4 (R25-B)**: (no new files; extends existing)

### Frontend — Edited Files

- `app/[locale]/contracts/create/page.tsx` — Tasks 1.12, 4.9
- `app/[locale]/contracts/edit/[id]/page.tsx` — Tasks 1.12, 4.9
- `app/[locale]/contracts/[id]/page.tsx` — Task 1.15
- `app/[locale]/drivers/page.tsx` — Task 1.14
- `app/[locale]/drivers/[id]/page.tsx` — Task 1.15
- `app/[locale]/drivers/create/page.tsx` — Task 2.10
- Sidebar/nav component — Tasks 2.11, 3.10
- `hooks/useCreateEmployeeContract.ts` — Tasks 1.13, 4.10
- `hooks/useEmployeeContractUpdate.ts` — Tasks 1.13, 4.10
- `hooks/useEmployeeContractDetail.ts` — Task 1.13
- Report display pages — Task 1.16
- Locale message files — Task 2.12

---

## Quick Reference: Confirmed Constraints

| Rule | Source |
|---|---|
| **All R23/R24/R25 backend endpoints gated with `.RequireModule(SystemModule.HR)`** | Critical finding — existing toggle system |
| **All R23/R24/R25 frontend nav items wrapped in `isModuleEnabled('HR')`** | Critical finding — existing toggle system |
| **`DriverInvoiceEndpoints` already exists and uses `.RequireModule(SystemModule.Finance)`** — R24 ZZP invoice extends this, not replaces it | Critical finding |
| ZZP BTW is always 21% | Decision 6 |
| ZZP driver invoices the transport company directly | Decision 5 |
| All existing drivers are CAO | Decision 7 |
| Brief = fixed monthly salary + standard Dutch overtime/vacation | Decision 8 + research |
| Prospect requires: name + phone + email + company | Decision 9 |
| Conversion is manual; prospect record is kept | Decision 10 |
| Planners cannot see potential drivers | Decision 11 |
| Non-driver staff: contracts only (no timesheets) | Decision 3 |
| Architecture: keep Driver, add separate Employee | Decision 1 |
| R25 Phase 1 new types: Raam + Bemiddeling only | Decision 2 |
| Raam/Bemiddeling PDF templates | `docs/spreadsheets/BemiddelingZZP.xlsx` |
| CAO wage table 2026 | `docs/spreadsheets/FunctieSchalenCAO-Vervoer.xlsx` |
