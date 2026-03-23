# VervoerManager – Project & Domain Context

**For AI assistants**: Domain concepts, Dutch terms, and business context.

## What is VervoerManager?
Truck/transport management system for Dutch logistics companies. Manages drivers, vehicles, clients, ride planning, invoicing, and driver payroll.

## Core Domain Entities

| Entity | Dutch | Description |
|--------|-------|-------------|
| **Company** | Bedrijf | Employer (e.g. Denis Express). Owns drivers, vehicles |
| **Client** | Klant | Customer company. Receives drivers/rides |
| **Driver** | Chauffeur | Employee who drives. Has contract, compensation |
| **Car** | Vrachtwagen | Truck/vehicle |
| **Ride** | Rit | Planned trip (date, client, truck, driver) |
| **PartRide** | Deelrit | Partial ride. Has approval flow, disputes |
| **Contact Person** | Contactpersoon | Client admin or planner |
| **Charter** | Charters | Long-term vehicle charter |

## Dutch Terms (Glossary)

| Term | Meaning |
|------|---------|
| **CAO** | Collectieve Arbeidsovereenkomst – Collective labor agreement |
| **ZZP** | Zelfstandige Zonder Personeel – Self-employed/freelancer |
| **Inleen** | Secondment (driver lent to another company) |
| **Brief Loonschaal** | Simple wage scale (non-CAO) |
| **VOG** | Verklaring Omtrent Gedrag – Certificate of conduct |
| **APK** | Algemene Periodieke Keuring – Vehicle inspection (MOT) |
| **ADV** | ADV days (compensation hours) |
| **TvT** | Tijd voor Tijd – Time-for-time (overtime) |
| **Verkoop** | Sales rate (what we charge client) |
| **Inkoop** | Purchase rate (what we pay driver/contractor) |
| **Offerte** | Quote/quotation |

## User Roles
- **globalAdmin** – Full access
- **customerAdmin** – Own company only (client-facing admin)
- **employer** – Company management
- **planner** – Ride planning
- **driver** – Driver dashboard, ride execution
- **contactPerson** – Client contact (limited view)

## Key Workflows
1. **Ride planning**: Create rides → Assign trucks/drivers → Execute
2. **PartRide**: Create part ride → Client approves → Driver executes → Dispute flow if needed
3. **Driver invoice**: Weekly hours → Report calculation → PDF invoice
4. **Driver contract**: Create driver → Generate contract PDF → Sign

## Requirements Documents
- `plans/requirments/Phase 1 Client Requirements final.md` – R6, R8, R13, R14, R17, R21
- `plans/requirments/Phase 1 Business Requirements final.md` – R23–R38 (business/HR/finance)
