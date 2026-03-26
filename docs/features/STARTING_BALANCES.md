# Starting Balances (R32)

Admin override for driver starting balances — vacation hours, TvT hours, and ADV hours.

## Purpose

When a driver joins mid-year (or transfers from another employer), their accumulated leave/compensation hours from before VervoerManager need to be accounted for. This feature lets admins set per-driver, per-year starting values that are added to the calculator totals.

## How It Works

- Admins open a driver's detail page and click the **Starting Balances** button (balance icon).
- A dialog allows selecting a year and entering values for:
  - **Vacation Hours** (with automatic day conversion at 8h/day)
  - **TvT Hours** (Tijd voor Tijd / time-for-time compensation)
  - **ADV Hours** (Arbeidsduurverkorting / working time reduction)
- An optional **Notes** field records context (e.g. "Carried over from previous employer").
- The backend uses an **upsert** endpoint — creating or updating the balance for the given driver+year combination.
- Once set, these values are automatically included in the VacationCalculator and TvTCalculator outputs for timesheets.

## Backend Integration

- **VacationCalculator**: Adds `StartingBalanceHours` to `HoursRemaining` in `VacationSection`.
- **TvTCalculator**: Adds `StartingBalanceHours` to `SavedTvTHours` in `TvTSection`.
- ADV hours are stored but not yet consumed by a calculator (no ADV calculator exists).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/drivers/{driverId}/starting-balances` | List all (optional `?year=` filter) |
| GET | `/drivers/{driverId}/starting-balances/{year}` | Get single year |
| POST | `/drivers/{driverId}/starting-balances` | Upsert |
| DELETE | `/drivers/{driverId}/starting-balances/{year}` | Delete |

## Frontend Files

- `types/startingBalance.ts` — DTOs
- `hooks/useDriverStartingBalances.ts` — fetch hook
- `hooks/useSetStartingBalance.ts` — upsert mutation
- `hooks/useDeleteStartingBalance.ts` — delete mutation
- `components/StartingBalancesDialog.tsx` — modal UI
- Integration point: `app/[locale]/drivers/[id]/page.tsx`

## Access Control

Only `customerAdmin` and `globalAdmin` roles see the Starting Balances button.
