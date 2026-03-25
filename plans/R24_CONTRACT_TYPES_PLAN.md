# R24 — Multiple Contract Types (CAO, ZZP, Inleen, Brief Loonschaal): Implementation Plan

**Requirement**: Support 4 contract types for drivers with type-specific data fields, payment calculations, and PDF generation.

**Status in requirements doc**: ✅ READY TO IMPLEMENT (line 883 in `plans/requirments/Phase 1 Business Requirements final.md`)

**Estimated complexity**: Large (touches entity, DTOs, 4 services, report calculations, PDF builder, and driver forms)

---

## Spreadsheet References

| File | Relevance |
|---|---|
| `docs/spreadsheets/BemiddelingZZP.xlsx` | **Primary** — Boratech's live ZZP contract system. Admin sheet = master data model. Raam/Bemiddeling/Inleen/Deel/Register sheets = exact PDF templates to replicate. Tariffs: €27.50/hr (standard), €28 (Winkeldistributie), €26 (Depod). Mediation fee: €50/week. |
| `docs/spreadsheets/FunctieSchalenCAO-Vervoer.xlsx` | **Primary** — TLN CAO wage tables 2025 & 2026. Scales A–F, tiers 1–7. Weekly/monthly amounts and hourly rates at 1.0×, 1.3×, 1.5×. Source for CAO payment calculations. |
| `docs/spreadsheets/Paychecked.xlsx` | **Secondary** — Compliance report for sub-contractors. Useful for ZZP compliance output format. |

---

## What Exists Today

| Area | File | Notes |
|---|---|---|
| `EmployeeContract` entity | `backend/Entities/EmployeeContract.cs` | CAO-only fields: `PayScale`, `PayScaleStep`, `HourlyWage100Percent`, `VacationDays`, `Atv`, etc. No `ContractType` field. |
| `CreateEmployeeContractRequest` DTO | `backend/DTOs/CreateEmployeeContractRequest.cs` | CAO-only. No type-specific fields. |
| `ReportCalculationService` | `backend/Services/Reports/ReportCalculationService.cs` | Builds `DriverTimesheetReport`. Calls `VacationCalculator`, `TvTCalculator`, `OvertimeClassifier`. Assumes CAO everywhere. |
| `DriverContractPdfBuilder` | `backend/Services/DriverContractPdfBuilder.cs` | Generates CAO TLN contract PDF using QuestPDF. |
| `DriverInvoicePdfBuilder` | `backend/Services/DriverInvoicePdfBuilder.cs` | Generates driver invoice PDF. CAO-style only. |
| `DriverTimesheetPdfGenerator` | `backend/Services/Reports/DriverTimesheetPdfGenerator.cs` | Generates timesheet PDF. |
| `CaoService` | `backend/Services/CaoService.cs` | CAO data lookup (pay scales, vacation days). |
| Contracts list page | `frontend/app/[locale]/contracts/page.tsx` | Lists contracts; no type column. |
| Contract create page | `frontend/app/[locale]/contracts/create/page.tsx` | Single form; CAO fields only. |
| Contract edit page | `frontend/app/[locale]/contracts/edit/[id]/page.tsx` | CAO fields only. |
| Driver list page | `frontend/app/[locale]/drivers/page.tsx` | No contract type badge. |
| `useCreateEmployeeContract` | `frontend/hooks/useCreateEmployeeContract.ts` | Posts CAO-only payload. |
| `useEmployeeContractUpdate` | `frontend/hooks/useEmployeeContractUpdate.ts` | Updates CAO-only payload. |

---

## Implementation Steps

---

### STEP 1 — Backend: `ContractType` Enum

**File to create**: `backend/TruckManagement/Enums/ContractType.cs`

```csharp
namespace TruckManagement.Enums;

public enum ContractType
{
    CAO,            // Collective Labor Agreement (existing)
    ZZP,            // Zelfstandige Zonder Personeel — freelance/self-employed
    Inleen,         // Secondment — driver borrowed from another company
    BriefLoonschaal // Simple monthly salary scale (not CAO-based)
}
```

---

### STEP 2 — Backend: Extend `EmployeeContract` Entity

**File to edit**: `backend/TruckManagement/Entities/EmployeeContract.cs`

Add after the existing `Status` field:

```csharp
// ── Contract type ───────────────────────────────────────────────────────────
public ContractType ContractType { get; set; } = ContractType.CAO;

// ── ZZP-specific ────────────────────────────────────────────────────────────
/// BTW (VAT) number of the ZZP driver, e.g. NL123456789B01
public string? ZzpBtwNumber { get; set; }
/// KvK (Chamber of Commerce) number of the ZZP driver
public string? ZzpKvkNumber { get; set; }
/// Agreed hourly rate excluding BTW
public decimal? ZzpHourlyRateExclBtw { get; set; }
/// BTW percentage (typically 21, sometimes 9)
public decimal? ZzpBtwPercentage { get; set; }
/// Bemiddelingsvergoeding per week (from BemiddelingZZP.xlsx: €50/week)
public decimal? ZzpMediationFeePerWeek { get; set; }
/// Contract number (e.g. 20260201-02 from Admin sheet)
public string? ZzpContractNumber { get; set; }

// ── Inleen-specific ─────────────────────────────────────────────────────────
/// Company that lends/supplies the driver (Uitlener)
public Guid? InleenLendingCompanyId { get; set; }
[ForeignKey(nameof(InleenLendingCompanyId))]
public Company? InleenLendingCompany { get; set; }
/// Company that borrows/uses the driver (Inlener / transport company)
public Guid? InleenBorrowingCompanyId { get; set; }
[ForeignKey(nameof(InleenBorrowingCompanyId))]
public Company? InleenBorrowingCompany { get; set; }
public DateTime? InleenStartDate { get; set; }
public DateTime? InleenEndDate { get; set; }
/// Agreed hourly rate for the Inleen period
public decimal? InleenHourlyRate { get; set; }
/// Description of work (e.g. "Vervoer van goederen over de weg")
public string? InleenWorkDescription { get; set; }
/// Location where the work is performed
public string? InleenLocation { get; set; }

// ── Brief Loonschaal-specific ────────────────────────────────────────────────
/// Fixed gross monthly salary
public decimal? BriefMonthlySalary { get; set; }
/// Grade or level label in the brief loonschaal
public string? BriefGrade { get; set; }
/// Expected monthly hours (for deriving hourly equivalent)
public double? BriefExpectedMonthlyHours { get; set; }
```

---

### STEP 3 — Backend: EF Core Migration

Run from backend project root:
```bash
dotnet ef migrations add AddContractTypesAndTypeSpecificFields
dotnet ef database update
```

**What changes**: Adds new nullable columns to `EmployeeContracts` table. Existing rows get `ContractType = 'CAO'` by default. Zero downtime — all new columns are nullable except `ContractType` (has default).

---

### STEP 4 — Backend: Extend DTOs

**File to edit**: `backend/TruckManagement/DTOs/CreateEmployeeContractRequest.cs`

Add after existing fields:

```csharp
// Contract type
public ContractType ContractType { get; set; } = ContractType.CAO;

// ZZP fields
public string? ZzpBtwNumber { get; set; }
public string? ZzpKvkNumber { get; set; }
public decimal? ZzpHourlyRateExclBtw { get; set; }
public decimal? ZzpBtwPercentage { get; set; }
public decimal? ZzpMediationFeePerWeek { get; set; }
public string? ZzpContractNumber { get; set; }

// Inleen fields
public string? InleenLendingCompanyId { get; set; }
public string? InleenBorrowingCompanyId { get; set; }
public DateTime? InleenStartDate { get; set; }
public DateTime? InleenEndDate { get; set; }
public decimal? InleenHourlyRate { get; set; }
public string? InleenWorkDescription { get; set; }
public string? InleenLocation { get; set; }

// Brief Loonschaal fields
public decimal? BriefMonthlySalary { get; set; }
public string? BriefGrade { get; set; }
public double? BriefExpectedMonthlyHours { get; set; }
```

**File to edit**: `backend/TruckManagement/DTOs/UpdateEmployeeContractRequest.cs`

Add the same fields as `CreateEmployeeContractRequest` above (all nullable since it's a partial update).

**File to edit**: `backend/TruckManagement/DTOs/DriverWithContractDto.cs`

Add `ContractType` and all type-specific fields so the frontend can render them.

---

### STEP 5 — Backend: Extend `EmployeeContractsEndpoints.cs`

**File to edit**: `backend/TruckManagement/Endpoints/EmployeeContractsEndpoints.cs`

In the `POST` (create) and `PUT` (update) handlers, map the new fields from request → entity:

```csharp
entity.ContractType = request.ContractType;

// ZZP
entity.ZzpBtwNumber = request.ZzpBtwNumber;
entity.ZzpKvkNumber = request.ZzpKvkNumber;
entity.ZzpHourlyRateExclBtw = request.ZzpHourlyRateExclBtw;
entity.ZzpBtwPercentage = request.ZzpBtwPercentage ?? 21;
entity.ZzpMediationFeePerWeek = request.ZzpMediationFeePerWeek;
entity.ZzpContractNumber = request.ZzpContractNumber;

// Inleen
if (Guid.TryParse(request.InleenLendingCompanyId, out var lendingId))
    entity.InleenLendingCompanyId = lendingId;
if (Guid.TryParse(request.InleenBorrowingCompanyId, out var borrowingId))
    entity.InleenBorrowingCompanyId = borrowingId;
entity.InleenStartDate = request.InleenStartDate;
entity.InleenEndDate = request.InleenEndDate;
entity.InleenHourlyRate = request.InleenHourlyRate;
entity.InleenWorkDescription = request.InleenWorkDescription;
entity.InleenLocation = request.InleenLocation;

// Brief
entity.BriefMonthlySalary = request.BriefMonthlySalary;
entity.BriefGrade = request.BriefGrade;
entity.BriefExpectedMonthlyHours = request.BriefExpectedMonthlyHours;
```

---

### STEP 6 — Backend: Extend `ReportCalculationService`

**File to edit**: `backend/TruckManagement/Services/Reports/ReportCalculationService.cs`

The current `BuildReportAsync` method computes everything for CAO. Add branching at the start:

```csharp
public async Task<DriverTimesheetReport> BuildReportAsync(ReportTimeframe timeframe)
{
    var rawData = await GatherRawDataAsync(timeframe);
    var contractType = rawData.Contract?.ContractType ?? ContractType.CAO;

    return contractType switch
    {
        ContractType.CAO            => await BuildCaoReportAsync(rawData, timeframe),
        ContractType.ZZP            => await BuildZzpReportAsync(rawData, timeframe),
        ContractType.Inleen         => await BuildInleenReportAsync(rawData, timeframe),
        ContractType.BriefLoonschaal => await BuildBriefReportAsync(rawData, timeframe),
        _ => throw new NotSupportedException($"Contract type {contractType} not supported")
    };
}
```

**Rename existing logic** to `BuildCaoReportAsync` (no behavioral change).

**Add `BuildZzpReportAsync`**:

Logic from `BemiddelingZZP.xlsx` Register sheet (week register tab: hours × rate = total):
- Get all worked hours for the week
- `SubtotalExclBtw = totalHours × contract.ZzpHourlyRateExclBtw`
- `BtwAmount = SubtotalExclBtw × (contract.ZzpBtwPercentage / 100)`
- `TotalInclBtw = SubtotalExclBtw + BtwAmount`
- **No** vacation accrual, **no** TvT, **no** ADV
- Optionally deduct `ZzpMediationFeePerWeek` from the net payout shown

```csharp
private async Task<DriverTimesheetReport> BuildZzpReportAsync(RawReportData rawData, ReportTimeframe timeframe)
{
    var contract = rawData.Contract!;
    var hours = await GetTotalHoursAsync(rawData, timeframe);
    var rate = contract.ZzpHourlyRateExclBtw ?? 0m;
    var btwPct = contract.ZzpBtwPercentage ?? 21m;
    var subtotal = hours * rate;
    var btwAmount = subtotal * (btwPct / 100m);

    return new DriverTimesheetReport
    {
        // ... header fields same as CAO ...
        ContractType = ContractType.ZZP,
        ZzpSubtotalExclBtw = subtotal,
        ZzpBtwPercentage = btwPct,
        ZzpBtwAmount = btwAmount,
        ZzpTotalInclBtw = subtotal + btwAmount,
        ZzpMediationFee = contract.ZzpMediationFeePerWeek,
        // No vacation, no TvT
    };
}
```

**Add `BuildInleenReportAsync`**:

Logic from `BemiddelingZZP.xlsx` Inleen sheet (hours × inleen rate; no vacation, simpler overtime):
- `Total = totalHours × contract.InleenHourlyRate`
- For overtime: apply same 1.25× after 40h rule (confirm with client)

**Add `BuildBriefReportAsync`**:

- Derive hourly from `BriefMonthlySalary / BriefExpectedMonthlyHours`
- `Total = totalHours × derivedHourlyRate`
- Overtime: same as CAO rules (apply `OvertimeClassifier`)

**File to edit**: `backend/TruckManagement/DTOs/Reports/DriverTimesheetReport.cs`

Add new fields:
```csharp
public ContractType ContractType { get; set; } = ContractType.CAO;

// ZZP-specific output fields
public decimal? ZzpSubtotalExclBtw { get; set; }
public decimal? ZzpBtwPercentage { get; set; }
public decimal? ZzpBtwAmount { get; set; }
public decimal? ZzpTotalInclBtw { get; set; }
public decimal? ZzpMediationFee { get; set; }

// Inleen-specific output fields
public string? InleenBorrowingCompanyName { get; set; }
public decimal? InleenHourlyRate { get; set; }

// Brief-specific output fields
public decimal? BriefDerivedHourlyRate { get; set; }
```

---

### STEP 7 — Backend: Extend PDF Builders

#### 7A. `DriverContractPdfBuilder` — New Contract Type PDFs

**File to edit**: `backend/TruckManagement/Services/DriverContractPdfBuilder.cs`

Current method: `BuildContractPdf(EmployeeContract contract, CAOPayScale payScale, CAOVacationDays vacationDays, ApplicationUser? createdByUser)`

**Add dispatch method**:
```csharp
public byte[] BuildContractPdfForType(
    EmployeeContract contract,
    CAOPayScale? payScale,
    CAOVacationDays? vacationDays,
    ApplicationUser? createdByUser)
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

**Add `BuildZzpContractPdf`** — based on `BemiddelingZZP.xlsx` sheets:

The ZZP PDF set mirrors the spreadsheet. For Phase 1, generate ONE combined document that includes the key sections:
- **Section 1**: Raamovereenkomst (framework) — Bemiddelaar ↔ Opdrachtgever
- **Section 2**: Bemiddelingsovereenkomst — Bemiddelaar ↔ ZZP driver
- **Section 3**: Deelovereenkomst — concrete assignment (work description, location, start/end, tariff)

Data sources from `EmployeeContract`:
- Bemiddelaar = `CompanyName` / `CompanyAddress` / `CompanyKvk` / `CompanyBtw`
- ZZP driver = `EmployeeFirstName` / `EmployeeLastName` / `ZzpKvkNumber` / `ZzpBtwNumber`
- Rate = `ZzpHourlyRateExclBtw`
- Contract number = `ZzpContractNumber`
- Work description = `InleenWorkDescription` (reuse field or add `ZzpWorkDescription`)
- Location = `InleenLocation`
- Period = `DateOfEmployment` → `LastWorkingDay`

**Add `BuildInleenContractPdf`** — based on `BemiddelingZZP.xlsx` Inleen sheet:

The Inleenovereenkomst between `InleenLendingCompany` (Uitlener) and `InleenBorrowingCompany` (Inlener). Key clauses from the spreadsheet:
- Salaris & vergoedingen per CAO Bedrijfsgoederenvervoer
- Werktijden per wet en CAO
- Pensioenregeling
- Rate: `InleenHourlyRate`
- Period: `InleenStartDate` → `InleenEndDate`

**Add `BuildBriefContractPdf`**:

Standard employment contract template, similar to CAO but references `BriefMonthlySalary` and `BriefGrade` instead of `PayScale`/`PayScaleStep`.

#### 7B. `DriverContractService` — Update the Call Site

**File to edit**: `backend/TruckManagement/Services/DriverContractService.cs`

Update the call from `BuildContractPdf(...)` to `BuildContractPdfForType(...)`.

#### 7C. `DriverInvoicePdfBuilder` — ZZP Invoice Format

**File to edit**: `backend/TruckManagement/Services/DriverInvoicePdfBuilder.cs`

For ZZP drivers, the invoice format follows `BemiddelingZZP.xlsx` Factuur sheet:
- Header: Boratech (or the managing company) details
- Recipient: client company (borrowing company)
- Line items: work description, hours, hourly rate, subtotal excl. BTW
- BTW row: 21% × subtotal
- Total incl. BTW
- Payment instructions (IBAN, due date)
- Reference: contract number / week number

Add branching inside `BuildInvoicePdf`:
```csharp
if (report.ContractType == ContractType.ZZP)
    return BuildZzpInvoicePdf(report, contract);
// else: existing payslip format
```

---

### STEP 8 — Frontend: Types

**File to create/edit**: `frontend/types/employeeContract.ts` (or wherever contract types live)

Add:
```typescript
export type ContractType = 'CAO' | 'ZZP' | 'Inleen' | 'BriefLoonschaal';

export interface ZzpContractFields {
  zzpBtwNumber?: string;
  zzpKvkNumber?: string;
  zzpHourlyRateExclBtw?: number;
  zzpBtwPercentage?: number;       // default 21
  zzpMediationFeePerWeek?: number; // default 50
  zzpContractNumber?: string;
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
  briefExpectedMonthlyHours?: number;
}

export interface EmployeeContract {
  // ... existing fields ...
  contractType: ContractType;
  // Type-specific (all optional; only populated for the matching type)
  zzp?: ZzpContractFields;
  inleen?: InleenContractFields;
  brief?: BriefContractFields;
}
```

---

### STEP 9 — Frontend: Contract Create/Edit Form

**Files to edit**:
- `frontend/app/[locale]/contracts/create/page.tsx`
- `frontend/app/[locale]/contracts/edit/[id]/page.tsx`

Both pages share a form. Add:

**Contract Type selector** (placed early in the form, before type-specific sections):
```tsx
<FormControl fullWidth>
  <InputLabel>Contract type</InputLabel>
  <Select value={contractType} onChange={(e) => setContractType(e.target.value)}>
    <MenuItem value="CAO">CAO (Collectieve Arbeidsovereenkomst)</MenuItem>
    <MenuItem value="ZZP">ZZP (Zelfstandige)</MenuItem>
    <MenuItem value="Inleen">Inleen (Uitleenovereenkomst)</MenuItem>
    <MenuItem value="BriefLoonschaal">Brief Loonschaal</MenuItem>
  </Select>
</FormControl>
```

**Conditional field sections** (using MUI `Collapse` or conditional rendering):

**CAO section** (shown when `contractType === 'CAO'`):
- Existing fields: Pay Scale (A/B/C/D/E/F), Pay Scale Step (1–7), Hourly Wage 100%, Vacation Days, ATV, etc.
- Reference: `FunctieSchalenCAO-Vervoer.xlsx` for valid scale/step combinations and default hourly rates (auto-lookup optional: when user picks Scale D Step 3 for 2026 → suggest €17.99/hr)

**ZZP section** (shown when `contractType === 'ZZP'`):
- BTW Number (`text`, required for ZZP, validation: NL format)
- KvK Number (`text`, required for ZZP)
- Hourly Rate excl. BTW (`number`, required)
- BTW % (`number`, default 21, options: 21 or 9)
- Mediation Fee/week (`number`, default 50, from spreadsheet)
- Contract Number (`text`, e.g. 20260201-02)
- Work Description (`text`, e.g. "Vervoer van goederen over de weg")
- Location (`text`, e.g. "s-Gravenhage")

**Inleen section** (shown when `contractType === 'Inleen'`):
- Lending Company (`Select` from companies list — Uitlener)
- Borrowing Company (`Select` from companies list — Inlener / transport company)
- Inleen Start Date (`DatePicker`)
- Inleen End Date (`DatePicker`)
- Hourly Rate (`number`)
- Work Description (`text`)
- Location (`text`)

**Brief Loonschaal section** (shown when `contractType === 'BriefLoonschaal'`):
- Monthly Salary (`number`)
- Grade/Level (`text`, e.g. "Schaal 5")
- Expected Monthly Hours (`number`, default 173.33 for full-time)

**Validation** (using `yup`):
- ZZP: `zzpBtwNumber` and `zzpKvkNumber` required when type is ZZP
- Inleen: `inleenLendingCompanyId`, `inleenBorrowingCompanyId`, `inleenStartDate`, `inleenHourlyRate` required
- Brief: `briefMonthlySalary` required

---

### STEP 10 — Frontend: Hooks Update

**File to edit**: `frontend/hooks/useCreateEmployeeContract.ts`

Update the request payload type to include `contractType` and all type-specific fields.

**File to edit**: `frontend/hooks/useEmployeeContractUpdate.ts`

Same — include new fields in the PUT payload.

**File to edit**: `frontend/hooks/useEmployeeContractDetail.ts`

Ensure the returned contract includes `contractType` and type-specific fields for display.

---

### STEP 11 — Frontend: Driver List — Contract Type Badge

**File to edit**: `frontend/app/[locale]/drivers/page.tsx`

Add a "Contract" column to the driver table showing a colored MUI `Chip`:

| Type | Chip color | Label |
|---|---|---|
| CAO | Blue | CAO |
| ZZP | Orange | ZZP |
| Inleen | Purple | Inleen |
| BriefLoonschaal | Teal | Brief |

The contract type is available via the driver's linked `EmployeeContract`. If the driver list endpoint doesn't already return the contract type, either:
- Extend `DriverDto` to include `contractType`, or
- Fetch it from the driver's contract (already loaded in `DriverWithContractDto`)

---

### STEP 12 — Frontend: Driver Detail / Contract Detail Page

**File to edit**: `frontend/app/[locale]/drivers/[id]/page.tsx`

In the contract section of the driver detail, show type-specific info:

- **CAO**: Pay Scale, Step, Hourly Wage, Vacation Days, ATV
- **ZZP**: BTW Number, KvK Number, Hourly Rate excl. BTW, BTW %, weekly mediation fee
- **Inleen**: Lending company, Borrowing company, Period, Hourly Rate, Location
- **Brief**: Monthly Salary, Grade, Derived Hourly Rate

**File to edit**: `frontend/app/[locale]/contracts/[id]/page.tsx`

Same approach — render the appropriate section based on `contractType`.

---

### STEP 13 — Frontend: Report/Timesheet Display

**File to edit**: Reports-related pages (check `frontend/app/[locale]/reports/` or equivalent).

The `DriverTimesheetReport` DTO now includes `contractType` and ZZP-specific fields. The timesheet display should:
- For **ZZP**: show `SubtotalExclBtw`, `BTW amount`, `Total incl. BTW`, optional mediation fee deduction
- For **Inleen**: show hours × inleen rate total; borrowing company name
- For **CAO/Brief**: existing display

---

### STEP 14 — Backend: CAO Wage Table Seeding (Optional but Recommended)

**Context**: `FunctieSchalenCAO-Vervoer.xlsx` contains precise hourly rates for all scale/step combinations for 2025 and 2026.

**Options**:
1. **Static lookup in `CaoService.cs`** (already exists): Hard-code 2026 table as a dictionary. When creating/editing a CAO contract, the backend (or frontend) can auto-suggest `HourlyWage100Percent` based on `PayScale` + `PayScaleStep`.
2. **Database table**: Create `CaoWageScales` table and seed it from the spreadsheet data.

**Recommended for Phase 1**: Option 1 (static dictionary in `CaoService`) — already partially in place. Add 2026 values.

**2026 Sample data** (from `FunctieSchalenCAO-Vervoer.xlsx` FSchalen2026 sheet):

| Scale | Step | Hourly 1.0× | Hourly 1.3× | Hourly 1.5× | Monthly |
|---|---|---|---|---|---|
| A | 1 | €14.71 | €19.12 | €22.07 | €2,559.54 |
| A | 2 | €14.80 | €19.24 | €22.20 | €2,573.49 |
| B | 1 | €14.98 | €19.47 | €22.47 | €2,604.97 |
| C | 1 | €15.63 | €20.32 | €23.45 | €2,717.80 |
| D | 1 | €16.64 | €21.63 | €24.96 | €2,893.55 |
| D | 3 | €17.99 | €23.39 | €26.99 | €3,129.65 |
| E | 1 | €17.45 | €22.69 | €26.18 | €3,034.77 |
| F | 1 | €18.24 | €23.71 | €27.36 | €3,171.82 |
| ... | ... | ... | ... | ... | ... |

Full table is in the spreadsheet Sheet 0 (`FSchalen2026`) — all A-F × 6-7 tiers.

---

## Execution Order

1. ✅ STEP 1 — Create `ContractType` enum
2. ✅ STEP 2 — Extend `EmployeeContract` entity
3. ✅ STEP 3 — Run EF migration
4. ✅ STEP 4 — Extend DTOs (Create, Update, DriverWithContract)
5. ✅ STEP 5 — Extend endpoints (map new fields)
6. ✅ STEP 6 — Extend `ReportCalculationService` (branching + ZZP/Inleen/Brief logic)
7. ✅ STEP 7A — Extend `DriverContractPdfBuilder` (dispatch + new PDF builders)
8. ✅ STEP 7B — Update `DriverContractService` call site
9. ✅ STEP 7C — Extend `DriverInvoicePdfBuilder` (ZZP invoice format)
10. ✅ STEP 8 — Add frontend types
11. ✅ STEP 9 — Update contract create/edit form (contract type selector + conditional fields)
12. ✅ STEP 10 — Update hooks
13. ✅ STEP 11 — Driver list: contract type badge
14. ✅ STEP 12 — Driver/contract detail: type-specific display
15. ✅ STEP 13 — Timesheet/report display update
16. ✅ STEP 14 — CAO wage table update in `CaoService` (optional)

---

## Files Changed Summary

### Backend (new files)
- `Enums/ContractType.cs`
- `Migrations/XXXXXX_AddContractTypesAndTypeSpecificFields.cs` (generated)

### Backend (edited files)
- `Entities/EmployeeContract.cs` — add `ContractType` + 14 new fields
- `DTOs/CreateEmployeeContractRequest.cs` — add new fields
- `DTOs/UpdateEmployeeContractRequest.cs` — add new fields
- `DTOs/DriverWithContractDto.cs` — add `contractType` + type-specific fields
- `DTOs/Reports/DriverTimesheetReport.cs` — add `contractType` + ZZP/Inleen output fields
- `Endpoints/EmployeeContractsEndpoints.cs` — map new fields in create/update
- `Services/Reports/ReportCalculationService.cs` — add contract type branching + 3 new calculation methods
- `Services/DriverContractPdfBuilder.cs` — add dispatch + 3 new PDF builders (ZZP, Inleen, Brief)
- `Services/DriverContractService.cs` — update call to use `BuildContractPdfForType`
- `Services/DriverInvoicePdfBuilder.cs` — add ZZP invoice format
- `Services/CaoService.cs` — add 2026 wage table values (optional)

### Frontend (new files)
- `types/employeeContract.ts` — `ContractType` type + field interfaces

### Frontend (edited files)
- `app/[locale]/contracts/create/page.tsx` — add type selector + conditional field sections
- `app/[locale]/contracts/edit/[id]/page.tsx` — same
- `app/[locale]/contracts/[id]/page.tsx` — type-specific display
- `app/[locale]/drivers/page.tsx` — contract type badge column
- `app/[locale]/drivers/[id]/page.tsx` — type-specific contract display
- Report/timesheet display pages — ZZP/Inleen output fields
- `hooks/useCreateEmployeeContract.ts` — updated payload type
- `hooks/useEmployeeContractUpdate.ts` — updated payload type
- `hooks/useEmployeeContractDetail.ts` — updated returned type

---

## Key Business Rules (from Spreadsheets)

### ZZP (from `BemiddelingZZP.xlsx`)
- **3-layer contract structure**: Raamovereenkomst → Bemiddelingsovereenkomst → Deelovereenkomst
- **ZZP invoices directly** to the transport company (not via Boratech's payroll)
- **Mediation fee**: €50/week (from Bemiddel_ZZP sheet Article 2)
- **BTW**: 21% standard; ZZP driver responsible for own tax/social premiums
- **No vacation accrual**, no TvT, no overtime supplements in the same sense as CAO
- **Contract number format**: `YYYYMMDD-NN` (e.g. `20260201-02`)
- **Payment term**: 14 days after invoice date
- **Inleen variant**: When Boratech acts as Uitlener to another transport company (Inlener), the Inleenovereenkomst applies with CAO wage obligations

### CAO (from `FunctieSchalenCAO-Vervoer.xlsx`)
- TLN CAO Beroepsgoederenvervoer
- Scales A–F, tiers 1–7
- **2026 wages = 2025 wages × 1.04** (+4%)
- Overtime multipliers: 1.3× after 40h/week, 1.5× for weekends/nights
- Vacation days per CAO, ATV, vacation allowance apply

### Inleen (from `BemiddelingZZP.xlsx` Inleen sheet)
- Uitlener (lender) is responsible for applying correct CAO wages
- Salaris, werktijden, verlof, pensioen per CAO Bedrijfsgoederenvervoer
- Hourly rate agreed between lending and borrowing company
- Duration defined in Inleen contract

### Brief Loonschaal
- Fixed monthly salary (not CAO scale-based)
- Simpler: `salary / expected_hours` = effective hourly rate
- Standard overtime rules apply (1.25× after 40h — confirm with client)

---

## Notes & Decisions

- **Backward compatibility**: All existing CAO contracts get `ContractType = 'CAO'` via migration default. No data loss.
- **Phase 1 scope**: Report calculation branching + form fields are must-haves. PDF generation for ZZP and Inleen is a "should have" — if PDF builder complexity delays delivery, ship the data model and form first, PDF in Phase 1.5.
- **ZZP PDF structure**: Generate a single combined document (Raam + Bemiddeling + Deel in one PDF) for simplicity. The full 3-document set from the spreadsheet can be individual PDF exports in a later phase.
- **CAO wage auto-suggest**: Not blocking. The admin can enter the hourly wage manually; auto-suggest from the lookup table is a UX improvement.
- **Inleen companies**: Both `InleenLendingCompanyId` and `InleenBorrowingCompanyId` reference the existing `Companies` table — no new entity needed.
- **Brief Loonschaal**: Minimal info from client; implement the data model and basic monthly salary calculation. Clarify with client whether overtime rules differ from CAO.
