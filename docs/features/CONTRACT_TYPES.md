# Contract Types (R24)

## Purpose

Allow each driver to be classified under one of four Dutch employment contract types: **CAO** (collective agreement), **ZZP** (self-employed freelancer), **Inleen** (secondment/agency), or **Brief Loonschaal** (simplified wage scale). Each type unlocks a set of additional data fields specific to that employment relationship.

## Status

- [x] Implemented

---

## Frontend

- **Routes**: `/[locale]/drivers/create`, `/[locale]/drivers/[id]`, `/[locale]/drivers/edit/[id]`
- **Key pages**: `app/[locale]/drivers/create/page.tsx`, `app/[locale]/drivers/[id]/page.tsx`, `app/[locale]/drivers/edit/[id]/page.tsx`
- **Components**:
  - `components/ContractTypeSection.tsx` – Dropdown selector + conditional fields for ZZP / Inleen / Brief Loonschaal. Used on both create and edit pages.
  - `components/ContractTypeBadge.tsx` – MUI `Chip` showing the contract type label. Used on driver list cards and driver detail page.
  - `components/DriverCard.tsx` – Renders `ContractTypeBadge` on each card in the driver list.
- **Constants**: `constants/contractTypes.ts` – `CONTRACT_TYPE_OPTIONS`, `ContractTypeValue`, `CONTRACT_TYPE_COLORS`
- **Hooks**: `useDriverWithContract` (reads contract type + type-specific fields), `useCreateDriver`, `useUpdateDriver` (write contract type + type-specific fields)
- **i18n**: All labels, descriptions, section titles and field labels are translated. Keys live under `drivers.create.contractType.*` in `messages/en.json`, `messages/nl.json`, `messages/bg.json`. Badge labels re-use the same `options.{type}.label` keys.

### Contract type selector (ContractTypeSection)

A MUI `Select` dropdown lets the user pick one of the four types. Below the dropdown a conditional section appears:

| Contract type | Extra fields shown |
|---|---|
| CAO | *(no extra fields – standard CAO data is captured in the main form)* |
| ZZP | BTW number, KvK number, hourly rate excl. BTW, BTW %, mediation fee/week, contract number, work description, location |
| Inleen | Lending company ID, borrowing company ID, start date, end date, hourly rate, work description, location |
| Brief Loonschaal | Monthly salary, grade/schaal, expected monthly hours |

### Driver list & detail badges

`ContractTypeBadge` displays a coloured MUI `Chip`. Colours per type:

| Type | Chip colour |
|---|---|
| CAO | `primary` |
| ZZP | `secondary` |
| Inleen | `warning` |
| Brief Loonschaal | `info` |

---

## Backend

- **Endpoints** (all existing – extended with contract type fields):
  - `POST /drivers/create-with-contract` – Accepts `ContractType` + type-specific fields in request body. Saves directly to `EmployeeContract`.
  - `GET /drivers/{driverId}/with-contract` – Returns `ContractType` (string) + all type-specific fields in response.
  - `PUT /drivers/{driverId}/with-contract` – Now accepts and persists `ContractType` + type-specific fields. Previously these fields were silently ignored on update.
- **DTOs changed**:
  - `CreateDriverWithContractRequest` – Has `ContractType` (enum, `[JsonConverter(JsonStringEnumConverter)]`), plus all ZZP / Inleen / BriefLoonschaal fields.
  - `UpdateDriverWithContractRequest` – Added `ContractType?` (nullable enum, same converter), plus all type-specific fields.
  - `DriverWithContractDto` – `ContractType` serialized as a string (`"CAO"`, `"ZZP"`, etc.) + all type-specific read fields.
- **Entity**: `EmployeeContract` – contains `ContractType` (enum column), ZZP fields, Inleen fields (including FK refs to `Company` for lending/borrowing), BriefLoonschaal fields.
- **Enum**: `TruckManagement.Enums.ContractType` → `CAO = 0`, `ZZP = 1`, `Inleen = 2`, `BriefLoonschaal = 3`

### Key implementation notes

- The `ContractType` property on all request DTOs carries `[JsonConverter(typeof(JsonStringEnumConverter))]` so the frontend can send string values (`"ZZP"`) instead of integers.
- `DriverWithContractDto.ContractType` is typed as `string` and set via `.ToString()` so the frontend receives `"CAO"` / `"ZZP"` / etc. directly.
- `InleenStartDate` and `InleenEndDate` are stored as `timestamp with time zone`; the endpoint explicitly applies `DateTime.SpecifyKind(…, DateTimeKind.Utc)` before saving to avoid the `Kind=Unspecified` PostgreSQL error.
- The schema for the new columns was applied via direct SQL `ALTER TABLE` (no new EF migration file). The `__EFMigrationsHistory` record was inserted manually to keep EF in sync.

---

## Key types / DTOs

```
ContractTypeValue          = "CAO" | "ZZP" | "Inleen" | "BriefLoonschaal"   (frontend constant)
ContractType               = CAO | ZZP | Inleen | BriefLoonschaal            (backend enum)

CreateDriverWithContractRequest  { ContractType, Zzp*, Inleen*, Brief* fields }
UpdateDriverWithContractRequest  { ContractType?, Zzp*, Inleen*, Brief* fields }
DriverWithContractDto            { ContractType (string), Zzp*, Inleen*, Brief* fields }
DriverWithContract (hook type)   { contractType?: ContractTypeValue, zzp*, inleen*, brief* fields }
```

---

## Flows

1. **Create driver** → user picks contract type from dropdown → conditional fields appear → form submits with all type data → backend saves `ContractType` + type fields to `EmployeeContract`.
2. **Edit driver** → form pre-fills `ContractType` and type-specific fields from `GET /drivers/{id}/with-contract` → user can change type and/or edit fields → `PUT` saves all changes.
3. **Driver list** → each `DriverCard` renders a `ContractTypeBadge` chip with the translated type label.
4. **Driver detail** → header badge shows contract type; dedicated section (ZZP Details / Inleen Details / Brief Loonschaal Details) renders the type-specific fields.

---

## Related

- [DRIVERS.md](DRIVERS.md)
- Requirements: R24 (Multiple Contract Types)
