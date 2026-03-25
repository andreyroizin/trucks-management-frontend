# VervoerManager – Entity Details

Extend this file when adding or significantly changing entities. See [CONTRIBUTING_DOCS.md](../CONTRIBUTING_DOCS.md).

---

## Company

- **Table**: `Companies`
- **Key fields**: Id, Name, Kvk, Btw, Address, Postcode, City, IsApproved, IsDeleted
- **Notes**: Employer organization. Must be approved before use. Soft delete via IsDeleted.

---

## Client

- **Table**: `Clients`
- **Key fields**: Id, Name, CompanyId, Tav, Address, Kvk, Btw, IsApproved, IsDeleted
- **Notes**: Customer company. Belongs to one Company. Soft delete.

---

## Driver

- **Table**: `Drivers`
- **Key fields**: Id, AspNetUserId, CompanyId, CarId, IsDeleted, TelegramChatId
- **Notes**: Links to ApplicationUser. Can have one Car. Can be used by multiple companies (DriverUsedByCompany).

---

## Car

- **Table**: `Cars`
- **Key fields**: Id, LicensePlate, CompanyId, VehicleYear, RegistrationDate, LeasingStartDate
- **Notes**: Truck/vehicle. Can be used by multiple companies (CarUsedByCompany). Optional 1:1 with Driver.

---

## Ride

- **Table**: `Rides`
- **Key fields**: Id, CompanyId, ClientId, PlannedDate, TruckId, TotalPlannedHours, ExecutionCompletionStatus
- **Notes**: Planned trip. Has RideDriverAssignment (primary/secondary), RideDriverExecution (actual hours).

---

## PartRide

- **Table**: `PartRides`
- **Key fields**: Id, RideId, ClientId, DriverId, CarId, Date, Start, End, Status
- **Notes**: Status: PendingAdmin, Dispute, Accepted, Rejected. Has PartRideApproval, PartRideDispute.

---

## ContactPerson

- **Table**: `ContactPersons`
- **Key fields**: Id, AspNetUserId, IsDeleted
- **Notes**: Links to ApplicationUser. Linked to Companies/Clients via ContactPersonClientCompany.

---

## EmployeeContract

- **Table**: `EmployeeContracts`
- **Key fields**: Id, DriverId, CompanyId, ContractType, Status, ReleaseVersion, DateOfEmployment, LastWorkingDay, PayScale, PayScaleStep, WorkweekDuration, HourlyWage100Percent, Atv
- **ContractType enum**: `CAO = 0`, `ZZP = 1`, `Inleen = 2`, `BriefLoonschaal = 3`
- **ZZP-specific fields**: ZzpBtwNumber, ZzpKvkNumber, ZzpHourlyRateExclBtw, ZzpBtwPercentage, ZzpMediationFeePerWeek, ZzpContractNumber, ZzpWorkDescription, ZzpLocation
- **Inleen-specific fields**: InleenLendingCompanyId (FK → Company), InleenBorrowingCompanyId (FK → Company), InleenStartDate, InleenEndDate, InleenHourlyRate, InleenWorkDescription, InleenLocation
- **BriefLoonschaal-specific fields**: BriefMonthlySalary, BriefGrade, BriefExpectedMonthlyHours
- **Notes**: One per driver. Status: Pending / Active / Expired. Schema columns for ZZP/Inleen/Brief were added via direct SQL `ALTER TABLE` (no separate EF migration file). `ContractType` is stored as integer in DB; serialized as string on all API responses via `.ToString()`. All DateTime fields are `timestamp with time zone`; code applies `DateTime.SpecifyKind(…, DateTimeKind.Utc)` before saving.
