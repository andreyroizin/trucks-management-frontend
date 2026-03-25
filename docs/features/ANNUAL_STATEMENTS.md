# Annual Statements (Jaaropgave) Feature

## Purpose

Generate, manage, and download annual statements (jaaropgave) for employees. Supports two workflows: year-end batch generation for active employees, and mid-year departure statements for terminated employees (with 28-day legal deadline tracking).

## Status

- [x] Implemented (R34 + R35)

## Frontend

- **Routes**: `/[locale]/annual-statements`
- **Key pages**: `app/[locale]/annual-statements/page.tsx`
- **Components**: `components/BatchProgressModal.tsx`, `components/TerminateDriverDialog.tsx`
- **Hooks**: `useAnnualStatements`, `usePendingDepartures`, `useOverdueStatements`, `useGenerateAnnualStatement`, `useGenerateDepartureStatement`, `useGenerateYearEndBatch`, `useDownloadAnnualStatement`
- **Types**: `types/annualStatement.ts`

## Backend

- **Endpoints**: `GET /annual-statements`, `GET /annual-statements/pending-departures`, `GET /annual-statements/overdue`, `POST /annual-statements/generate`, `POST /annual-statements/generate-for-departure/{driverId}`, `POST /annual-statements/generate-year-end-batch/{year}`, `GET /annual-statements/{id}/download`
- **Key services**: `AnnualStatementService`, `AnnualStatementPdfGenerator`, `ReportCalculationService`, `VacationCalculator`
- **Key entities**: `AnnualStatement`

## Key types / DTOs

- `AnnualStatementDto`, `PendingDepartureDto`, `GenerateRequest`, `BatchGenerationResultDto`, `AnnualStatementsResponse`
- `JaaropgaveStatus` enum: `NotGenerated (0)`, `Generated (1)`, `Sent (2)`

## Flows

1. **Year-end batch**: Admin selects year → clicks "Generate for All" → Backend calculates aggregated data for each active employee → Generates PDF → Returns batch result with success/error counts
2. **Individual generation**: Admin selects driver and year → clicks Generate → Backend builds statement → PDF downloadable
3. **Departure flow**: Employee is terminated (via Drivers page TerminateDriverDialog) → Optionally generates jaaropgave immediately → Pending departures appear in "Departing Employees" tab → Overdue warning if >28 days since termination
4. **Download**: Click download icon on any generated statement → Backend streams PDF blob → Saved via file-saver

## UI Layout

Two-tab interface:
- **Active Employees**: Year selector, "Generate All" button, table with employee name, hours, gross wage, vacation days, status, generated date, download action. Paginated.
- **Departing Employees**: Table with employee name, company, termination date, days since termination, overdue status, generate action button.

## Navigation

Added to `SideNavigation.tsx` after "Reports", using `DescriptionRounded` icon.

## i18n

Keys added under `annualStatements` namespace in `en.json`, `nl.json`, `bg.json`.
