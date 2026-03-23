# Phase 1 Client Requirements – Final

**Document Purpose**: Phase 1 client requirements – technical analysis. R2, R3, R4 moved to next phase.

---

## R6: Client Daily Capacity Overview & Requirements Tracking

### Requirement Summary

When preparing planning lists, there should be an **overview** showing:

- **How many vehicles** each client needs on each day  
- **How many trailers** each client needs on each day  
- **Locations** (pickup/delivery) for each client/day  
- **Rollover tracking**: Continuous updates as planning changes until trucks depart  
- Based on the **planned rides** (not just templates)

**Business Context**: Planning team needs a daily snapshot of client requirements to:

- Allocate vehicles/trailers efficiently  
- See aggregate demand per client per day  
- Track changes as planning evolves  
- Ensure sufficient capacity for each client

### Current State

#### What exists now:

✅ **Long-term capacity planning**: `ClientCapacityTemplate` table

- Stores recurring patterns per client (e.g., "Client X needs 2 trucks every Monday")  
- Fields: MondayTrucks, TuesdayTrucks, ..., SundayTrucks  
- Used to generate weekly rides automatically

✅ **Weekly/Daily ride planning**: `Rides` table

- Stores individual planned rides with:  
  - `PlannedDate` (which day)  
  - `ClientId` (which client)  
  - `TruckId` (which vehicle assigned)  
  - `RouteFromName`, `RouteToName` (origin/destination locations)  
  - `TotalPlannedHours` (8.0 default)  
- Current data: Multiple rides exist per client per day (from template generation)

✅ **Planning UI**: Existing pages

- Long-term planning: Create/edit capacity templates  
- Weekly planning: Preview/assignment grid  
- Daily planning: Driver/truck assignment interface

#### Current gaps per sample data:

- ⚠️ **TruckId is NULL** on most rides (vehicles not yet assigned)  
- ⚠️ **RouteFromName/RouteToName are empty** (locations not populated)  
- ❌ **No trailer tracking** (no TrailerId field on Rides)  
- ❌ **No aggregated overview** showing "Client X needs 2 trucks on Feb 10"

### Gap Analysis

#### Backend Gaps:

1. ❌ No `TrailerId` field on `Rides` table  
2. ❌ No `/api/planning/daily-requirements` endpoint to get aggregated data  
3. ❌ No daily capacity summary DTO showing:  
     
   {  
     
     "date": "2026-02-10",  
     
     "clients": \[  
     
       {  
     
         "clientId": "...",  
     
         "clientName": "Client A",  
     
         "trucksNeeded": 3,  
     
         "trailersNeeded": 2,  
     
         "trucksAssigned": 2,      // How many already assigned  
     
         "trailersAssigned": 1,    // How many already assigned  
     
         "locations": \["Rotterdam", "Amsterdam"\],  
     
         "rides": \[...\]            // List of actual rides  
     
       }  
     
     \]  
     
   }  
     
4. ❌ No logic to count trucks/trailers per client per day from Rides  
5. ❌ No distinction between "needed" (planned) vs "assigned" (actual)  
6. ❌ No aggregation by location per client  
7. ❌ No change tracking / audit log for "rollover" visibility

#### Frontend Gaps:

1. ❌ No calendar view showing requirements per day  
2. ❌ No client-centric view (e.g., "Client X's requirements for this week")  
3. ❌ No drill-down: Click date/client → see detailed rides  
4. ❌ No location summary per client per day  
5. ❌ No export/print capability for daily requirements

### Questions Pending Client Response

**CRITICAL \- Need answers before implementation:**

1. **Trailer Tracking**:  
     
   - Are trailers tracked as separate entities (like trucks in `Cars` table)?  
   - Or just a count per ride ("this ride needs 2 trailers")?  
   - Do trailers have license plates/IDs?  
   - Different trailer types? (flatbed, container, tanker?)  
   - **Recommendation**: Start with count per ride (simpler); later upgrade to separate Trailers entity if needed

   

2. **Locations**:  
     
   - How are locations determined?  
     - Free text entry per ride? (as it is now with RouteFromName/RouteToName)  
     - Dropdown from pre-defined list?  
     - Client has default pickup/delivery locations?  
   - Do you want to see:  
     - All unique locations per client per day? ("Rotterdam, Amsterdam, Utrecht")  
     - Most common location?  
     - Route summary? ("3 rides from Rotterdam, 1 from Amsterdam")

   

3. **"Rollover" Meaning**:  
     
   - You said "continuous change until the truck departs" \- does this mean:  
     - Planning data can change up until the day of the ride?  
     - After truck departs (ride execution starts), no more changes?  
     - Need to show "last updated" timestamp per client/day?  
   - Should we show change history? ("Yesterday client needed 3 trucks, today 4 trucks")

   

4. **View Scope**:  
     
   - What time range should the overview show?  
     - Today only?  
     - Today \+ next 7 days?  
     - Current week?  
     - Custom date range selector?  
   - Should it show past dates (historical view) or only future?

   

5. **Aggregation Level**:  
     
   - Do you want overview **per company** (if multi-company)?  
   - Or always show all clients across all companies?  
   - Filter by company dropdown?

   

6. **Truck Assignment Status**:  
     
   - Should overview show:  
     - "Needed": How many trucks planned (from ride count)  
     - "Assigned": How many trucks actually assigned (TruckId not null)  
     - Gap: Needed \- Assigned?  
   - Color coding: Green (fully assigned) / Red (not assigned)?

   

7. **Multiple Rides Per Client Per Day**:  
     
   - If client has 3 separate rides on same day, should it show:  
     - "3 trucks needed" (assuming 1 truck per ride)?  
     - Or can 1 truck do multiple rides (need to count unique TruckId)?  
   - **Current observation**: Sample data shows 2 rides for same client on Feb 14 with NO TruckId assigned yet

   

8. **Trailer Requirements**:  
     
   - How do you determine trailer count per ride?  
     - Manually entered?  
     - Based on client/route?  
     - Based on cargo type?  
   - Can 1 ride need multiple trailers? (e.g., "this ride needs truck \+ 2 trailers")

   

9. **Access Control**:  
     
   - Who can view this overview?  
     - Global admins only?  
     - Customer admins (see only their clients)?  
     - Drivers (see only their assignments)?

   

10. **Notifications/Alerts**:  
      
    - Should there be alerts for:  
      - Client requirements not yet fulfilled (X days before ride)?  
      - Changes to requirements (client increased from 2 to 4 trucks)?  
    - Who receives alerts?

    

11. **Integration with Existing Planning**:  
      
    - Should clicking on a client/day in overview:  
      - Open weekly planning grid filtered to that day?  
      - Open daily planning for that day?  
      - Show a detailed modal with all rides?

    

12. **Export/Reporting**:  
      
    - Export format: PDF? Excel? CSV?  
    - Daily summary report?  
    - Weekly summary report?

### Proposed Implementation Approach

**Note**: This is a preliminary approach. Will be refined after receiving answers to questions above.

#### Phase 1: Add Trailer Tracking & Locations

##### 1\. Database Schema Changes

**Option A: Simple Trailer Count (Recommended for MVP)**

\-- Add to Rides table

ALTER TABLE Rides ADD COLUMN TrailersNeeded INT DEFAULT 0;

ALTER TABLE Rides ADD COLUMN TrailerId UUID REFERENCES Cars(Id); \-- If trailers are in Cars table

**Option B: Separate Trailers Entity (Future-proof)**

\-- Create Trailers table (if trailers are separate from trucks)

CREATE TABLE Trailers (

    Id UUID PRIMARY KEY,

    LicensePlate TEXT NOT NULL,

    TrailerType VARCHAR(50), \-- 'Flatbed', 'Container', 'Tanker', etc.

    CompanyId UUID NOT NULL REFERENCES Companies(Id),

    Remark TEXT,

    IsDeleted BOOLEAN NOT NULL DEFAULT FALSE

);

\-- Link rides to trailers

ALTER TABLE Rides ADD COLUMN TrailerId UUID REFERENCES Trailers(Id);

\-- Or for multiple trailers per ride:

CREATE TABLE RideTrailerAssignments (

    Id UUID PRIMARY KEY,

    RideId UUID NOT NULL REFERENCES Rides(Id),

    TrailerId UUID NOT NULL REFERENCES Trailers(Id),

    AssignedAt TIMESTAMP WITH TIME ZONE NOT NULL

);

**Populate Locations** (already exists, just need to enforce usage):

- `RouteFromName` (pickup location)  
- `RouteToName` (delivery location)  
- Make these fields more prominent in ride creation/editing

**Rationale**:

- Start simple (trailer count per ride) for pilot  
- Upgrade to full Trailers entity if client needs detailed trailer management  
- Reuse existing location fields

##### 2\. Backend API Endpoints

**New Endpoint: Daily Capacity Overview**

1. `GET /api/planning/daily-requirements` \- Get aggregated client requirements  
     
   - Query params: `startDate`, `endDate`, `companyId?`  
   - Returns:

   

   {

   

     "startDate": "2026-02-10",

   

     "endDate": "2026-02-16",

   

     "days": \[

   

       {

   

         "date": "2026-02-10",

   

         "dayOfWeek": "Monday",

   

         "clients": \[

   

           {

   

             "clientId": "uuid",

   

             "clientName": "Client A",

   

             "totalRides": 3,

   

             "trucksNeeded": 3,

   

             "trucksAssigned": 2,

   

             "trailersNeeded": 2,

   

             "trailersAssigned": 1,

   

             "locations": \[

   

               { "from": "Rotterdam", "to": "Amsterdam", "count": 2 },

   

               { "from": "Utrecht", "to": "Rotterdam", "count": 1 }

   

             \],

   

             "fulfillmentStatus": "partial", // "complete", "partial", "none"

   

             "rides": \[

   

               {

   

                 "rideId": "uuid",

   

                 "plannedStartTime": "08:00",

   

                 "plannedEndTime": "17:00",

   

                 "truckId": "uuid",

   

                 "truckLicensePlate": "AB-123-CD",

   

                 "trailerId": "uuid",

   

                 "trailerLicensePlate": "XY-456-ZW",

   

                 "routeFrom": "Rotterdam",

   

                 "routeTo": "Amsterdam",

   

                 "driverAssigned": true,

   

                 "notes": "..."

   

               }

   

             \]

   

           }

   

         \],

   

         "totals": {

   

           "totalRides": 10,

   

           "totalTrucksNeeded": 10,

   

           "totalTrucksAssigned": 7,

   

           "totalTrailersNeeded": 8,

   

           "totalTrailersAssigned": 5

   

         }

   

       }

   

     \]

   

   }

   

2. `GET /api/planning/client-requirements/{clientId}` \- Get requirements for specific client  
     
   - Query params: `startDate`, `endDate`  
   - Returns detailed requirements for one client across date range

   

3. `GET /api/planning/requirements-summary` \- High-level summary (dashboard metrics)  
     
   - Returns: Total clients, total rides this week, fulfillment percentage, etc.

**Backend Service: `PlanningRequirementsService`**

- Method: `GetDailyRequirements(startDate, endDate, companyId?)`  
    
  - Fetch all rides in date range  
  - Group by date → client  
  - Count trucks needed (total rides or unique trucks if same truck does multiple rides?)  
  - Count trailers needed (sum TrailersNeeded column)  
  - Count assigned (where TruckId/TrailerId not null)  
  - Aggregate locations  
  - Return structured DTO


- Method: `GetClientFulfillmentStatus(clientId, date)`  
    
  - Check if all rides for client on date have trucks/trailers assigned  
  - Return: "complete", "partial", "none"

##### 3\. Frontend Changes

**A. New Page: Daily Requirements Overview**

Location: `/planning/requirements` or `/planning/daily-overview`

**Layout:**

- **Header**:  
    
  - Title: "Daily Capacity Requirements"  
  - Date range selector (default: current week)  
  - Company filter (if multi-company)  
  - Export button (PDF/Excel)  
  - Refresh button


- **Summary Cards** (Top Row):  
    
  - Total Rides This Week  
  - Total Trucks Needed  
  - Fulfillment Rate (% assigned)  
  - Total Trailers Needed


- **Main Content: Calendar/Table View**  
    
  **Option 1: Calendar Grid**  
    
  Mon Feb 10       Tue Feb 11       Wed Feb 12  
    
  ┌──────────┐    ┌──────────┐    ┌──────────┐  
    
  │Client A  │    │Client A  │    │Client B  │  
    
  │🚚 3 / 2  │    │🚚 2 / 2  │    │🚚 4 / 1  │  
    
  │🚛 2 / 1  │    │🚛 1 / 1  │    │🚛 3 / 0  │  
    
  │📍 Rot,   │    │📍 Ams    │    │📍 Utrecht│  
    
  │   Ams    │    │           │    │          │  
    
  └──────────┘    └──────────┘    └──────────┘  
    
  │Client B  │    │Client C  │  
    
  │🚚 2 / 2  │    │🚚 1 / 0  │  
    
  │🚛 1 / 1  │    │🚛 0 / 0  │  
    
  │📍 Utrecht│    │📍 Rot    │  
    
  └──────────┘    └──────────┘  
    
  - 🚚 X / Y \= X trucks needed, Y assigned  
  - 🚛 X / Y \= X trailers needed, Y assigned  
  - 📍 Locations abbreviations  
  - Color coding:  
    - Green border: Fully assigned  
    - Yellow border: Partially assigned  
    - Red border: Nothing assigned


  **Option 2: Data Table** | Date       | Client   | Rides | Trucks (Need/Assigned) | Trailers (Need/Assigned) | Locations        | Status   | |------------|----------|-------|------------------------|--------------------------|------------------|----------| | Feb 10 Mon | Client A | 3     | 3 / 2                  | 2 / 1                    | Rot, Ams         | Partial  | | Feb 10 Mon | Client B | 2     | 2 / 2                  | 1 / 1                    | Utrecht          | Complete | | Feb 11 Tue | Client A | 2     | 2 / 2                  | 1 / 1                    | Ams              | Complete |


  - Expandable rows: Click row → show detailed rides  
  - Sort by: Date, Client, Status  
  - Filter by: Client, Status (Complete/Partial/None)

**B. Client Detail View (Modal/Slide-out)**

When clicking a client card or row:

- Modal showing all rides for that client on that day  
- Table with columns:  
  - Ride \#  
  - Start Time  
  - End Time  
  - Route (From → To)  
  - Truck (assigned or "Not assigned")  
  - Trailer (assigned or "Not assigned")  
  - Driver (assigned or "Not assigned")  
  - Actions: Edit ride, Assign truck, Assign driver  
- Footer: "Go to Weekly Planning" button (opens planning grid for that day)

**C. Integration with Existing Planning**

- Add "Requirements Overview" link to navigation menu under Planning section  
- Add badge notification: "5 rides unassigned" on nav link  
- From overview, clicking "Assign" opens weekly/daily planning pre-filtered

**D. Mobile-Friendly View**

- Stacked cards (one per day)  
- Swipe left/right to navigate days  
- Tap card to expand client details

##### 4\. Real-Time Updates ("Rollover")

**Approach**: Use React Query's `refetchInterval` or WebSocket

- When ride is created/updated/deleted:  
  - Backend emits change event  
  - Frontend refetches daily requirements  
  - UI updates without page reload  
- Show "Last updated: 2 minutes ago" timestamp  
- Optional: Use React Query's `refetchInterval: 30000` (refetch every 30 seconds)

**Alternative (Simpler for Pilot)**:

- No WebSocket  
- Just manual refresh button  
- Auto-refetch when user navigates back to page

##### 5\. Reporting & Export

**Daily Summary Report (PDF/Excel)**

- Header: Date, Company name  
- Table: All clients with requirements for selected day  
- Footer: Totals (trucks needed/assigned, trailers needed/assigned)  
- Generate via backend endpoint: `GET /api/planning/reports/daily?date=2026-02-10&format=pdf`

**Weekly Summary Report**

- 7-day overview  
- Per client breakdown  
- Export to Excel for spreadsheet analysis

### Recommended Pilot Scope

**Must Have:**

- ✅ Add trailer count field to Rides (`TrailersNeeded` int)  
- ✅ Ensure RouteFromName/RouteToName are populated in ride creation  
- ✅ Daily Requirements Overview page (table layout)  
  - Date range selector (default: current week)  
  - Per client, per day: Show trucks needed/assigned, trailers needed/assigned, locations  
  - Color coding: Green (complete) / Yellow (partial) / Red (none)  
- ✅ Client detail modal (click client → see all rides for that day)  
- ✅ Summary metrics (total rides, fulfillment %)  
- ✅ Manual refresh button (no auto-refresh for pilot)  
- ✅ Export to Excel (simple CSV)

**Should Have (if time permits):**

- Calendar grid view (visual alternative to table)  
- Real-time auto-refresh (polling every 30s)  
- PDF export with formatting  
- Mobile-friendly responsive design  
- Link to weekly planning from overview

**Won't Have (defer to Phase 2):**

- Separate Trailers entity (full trailer management)  
- WebSocket real-time updates  
- Change history / audit log visualization  
- Capacity vs demand comparison  
- Advanced filtering (by status, fulfillment, etc.)  
- Notifications/alerts for unfulfilled requirements

### Success Criteria

After implementation:

1. ✅ Admin opens "Daily Requirements" page and sees current week's overview  
2. ✅ For each day, sees list of clients with truck/trailer counts (needed vs assigned)  
3. ✅ Sees locations for each client (e.g., "Rotterdam, Amsterdam")  
4. ✅ Color coding shows which clients are fully assigned (green) vs partially (yellow) vs not at all (red)  
5. ✅ Clicking a client opens modal showing detailed list of rides for that day  
6. ✅ Summary cards show total rides, total trucks needed, fulfillment percentage  
7. ✅ Can export daily or weekly summary to Excel  
8. ✅ When ride is added/edited, overview updates after manual refresh  
9. ✅ Ride creation form includes trailer count and location fields (enforced)  
10. ✅ Customer admin sees only their company's clients (if multi-company)

---

**Status**: ⏸️ **AWAITING CLIENT CLARIFICATION**

**Required from Client:**

1. ✅ **Trailer Management**: Simple count per ride, or full trailer entity? (see Question 1\)  
2. ✅ **Locations**: How to determine? Free text, dropdown, client defaults? (see Question 2\)  
3. ✅ **"Rollover" definition**: What does "continuous change until truck departs" mean exactly? (see Question 3\)  
4. ✅ **View scope**: Show today only? Next 7 days? Custom range? (see Question 4\)  
5. ✅ **Trucks needed calculation**: 1 ride \= 1 truck? Or can 1 truck do multiple rides? (see Question 7\)  
6. ✅ Answers to questions 5-12 above

**Next Steps:**

1. Client provides clarifications on trailer tracking approach  
2. Client confirms UI preference (calendar grid vs table)  
3. Finalize database schema (trailer count vs trailer entity)  
4. Begin implementation (backend aggregation endpoint)  
5. Build frontend (overview page with table/calendar)  
6. Integrate with existing planning pages  
7. Deploy and UAT

---

---

## R8: Customer-Centric Schedule View (Manager View)

### Requirement Summary

Managers should be able to see **which vehicles and drivers are scheduled for which customers** on a **customer basis** (customer-centric view).

**Use Case**:

- Manager wants to see: "Show me everything scheduled for Client A this week"  
- Should display: All rides/assignments for that client with vehicles and drivers  
- Grouping: By customer first, then by date/time  
- Purpose: Customer-focused view for account management, billing, and service coordination

### Current State

#### What exists now:

✅ **Scheduling data available**: System stores:

- `Rides` table: PlannedDate, ClientId, TruckId  
- `RideDriverAssignments` table: Links drivers to rides with IsPrimary flag  
- Sample data shows rides scheduled with trucks and drivers (some assigned, some not)

✅ **Existing planning views** (but NOT customer-centric):

- **Weekly Planning**: `/weekly-planning/rides` \- Shows rides grouped by date/week (not by client)  
- **Daily Planning**: `/daily-planning/rides` \- Shows rides for a specific date (not client-focused)  
- **Driver View**: Drivers can see their own assigned rides

✅ **Client detail page**: `/clients/[id]` exists but shows:

- Client company info (name, address, contact, KVK, BTW)  
- No scheduling/assignment information

#### Current gaps:

- ❌ **No customer-centric API endpoint** to fetch "all rides for Client X"  
- ❌ **No customer schedule UI page** showing assignments per customer  
- ❌ **No date range filter** for customer schedule  
- ❌ **No summary** showing: "Client A has 15 rides this week, 12 trucks, 14 drivers"  
- ❌ **Cannot see unassigned rides** for a customer (rides without trucks/drivers)  
- ❌ **No drill-down** from client list to their schedule

### Gap Analysis

#### Backend Gaps:

1. ❌ No `/api/clients/{id}/schedule` endpoint  
2. ❌ No DTO for customer-centric schedule response:  
     
   {  
     
     "clientId": "uuid",  
     
     "clientName": "Client A",  
     
     "dateRange": {  
     
       "start": "2026-02-10",  
     
       "end": "2026-02-16"  
     
     },  
     
     "summary": {  
     
       "totalRides": 15,  
     
       "uniqueTrucks": 3,  
     
       "uniqueDrivers": 4,  
     
       "fullyAssignedRides": 12,  
     
       "partiallyAssignedRides": 2,  
     
       "unassignedRides": 1  
     
     },  
     
     "rides": \[  
     
       {  
     
         "rideId": "uuid",  
     
         "date": "2026-02-10",  
     
         "plannedStartTime": "08:00",  
     
         "plannedEndTime": "17:00",  
     
         "routeFrom": "Rotterdam",  
     
         "routeTo": "Amsterdam",  
     
         "truck": {  
     
           "truckId": "uuid",  
     
           "licensePlate": "AB-123-CD"  
     
         },  
     
         "drivers": \[  
     
           {  
     
             "driverId": "uuid",  
     
             "name": "John Doe",  
     
             "email": "john@example.com",  
     
             "isPrimary": true,  
     
             "plannedHours": 8  
     
           },  
     
           {  
     
             "driverId": "uuid2",  
     
             "name": "Jane Smith",  
     
             "email": "jane@example.com",  
     
             "isPrimary": false,  
     
             "plannedHours": 4  
     
           }  
     
         \],  
     
         "assignmentStatus": "complete" // "complete", "partial", "unassigned"  
     
       }  
     
     \]  
     
   }  
     
3. ❌ No filtering by date range for customer schedule  
4. ❌ No aggregation logic to count unique trucks/drivers per customer  
5. ❌ No assignment status calculation ("complete", "partial", "unassigned")

#### Frontend Gaps:

1. ❌ No **Customer Schedule** page  
2. ❌ No navigation from client list/detail to schedule view  
3. ❌ No date range selector for customer schedule  
4. ❌ No summary cards showing:  
   - Total rides  
   - Unique vehicles  
   - Unique drivers  
   - Assignment completion status  
5. ❌ No table/grid showing rides with vehicles and drivers  
6. ❌ No visual indicators for assignment status (green/yellow/red)  
7. ❌ No drill-down to ride details from customer schedule  
8. ❌ No export capability (Excel/PDF) for customer schedule  
9. ❌ No comparison view (multiple customers side-by-side)

### Questions Pending Client Response

**CRITICAL \- Need answers before implementation:**

1. **Access Control**:  
     
   - Who should see customer schedules?  
     - Global admins: All customers  
     - Customer admins: Only their company's customers  
     - Employers/Managers: ???  
   - Can customer admin (client) see their own schedule?

   

2. **View Scope**:  
     
   - What's the default date range?  
     - Current week?  
     - Today \+ next 7 days?  
     - Current month?  
     - Custom range selector?  
   - Should it show past dates (historical view)?  
   - Maximum date range allowed? (e.g., 1 month? 3 months?)

   

3. **Navigation / Entry Point**:  
     
   - How should managers access this view?  
     - Option A: From Clients list page → "View Schedule" button per client  
     - Option B: New menu item "Customer Schedules" → Select customer dropdown  
     - Option C: Add "Schedule" tab to existing Client Detail page  
     - **Recommendation**: Option C (tab on client detail) \+ Option B (dedicated page)

   

4. **Information Displayed**:  
     
   - Per ride, show:  
     - Date & time ✓  
     - Route (from → to) ✓  
     - Vehicle (license plate) ✓  
     - Drivers (name, primary/secondary) ✓  
     - Planned hours ✓  
     - Anything else? (Trip number? Notes? Status?)

   

5. **Grouping & Sorting**:  
     
   - Group rides by:  
     - Date (default)?  
     - Week?  
     - Vehicle?  
     - Driver?  
   - Sort by:  
     - Date/time (default)?  
     - Assignment status?  
     - Vehicle?

   

6. **Assignment Status**:  
     
   - How to classify:  
     - **Complete**: Truck assigned AND at least 1 driver assigned?  
     - **Partial**: Truck assigned OR driver assigned (but not both)?  
     - **Unassigned**: No truck AND no driver?  
   - Do you want to see "warnings" for incomplete assignments?

   

7. **Summary Metrics**:  
     
   - What summary stats are most valuable?  
     - Total rides ✓  
     - Unique trucks used ✓  
     - Unique drivers used ✓  
     - Total hours (sum of all rides) ?  
     - Fulfillment rate (% complete assignments) ✓  
     - Anything else?

   

8. **Multiple Customers**:  
     
   - Should managers be able to compare multiple customers?  
     - E.g., "Show me schedules for Client A, Client B, and Client C side by side"  
   - Or always one customer at a time?

   

9. **Unassigned Rides**:  
     
   - Should unassigned rides be highlighted/flagged?  
   - Filter option: "Show only unassigned rides"?  
   - Notifications/alerts for unassigned rides approaching date?

   

10. **Actions from Schedule View**:  
      
    - Should managers be able to:  
      - Assign truck/driver directly from this view?  
      - Edit ride details?  
      - Delete ride?  
      - Navigate to weekly planning for that date?  
    - Or is this view read-only?

    

11. **Export/Reporting**:  
      
    - Export format: PDF? Excel? Both?  
    - Use case: Send to customer as confirmation?  
    - Include: Summary \+ detailed table?

    

12. **Real-Time Updates**:  
      
    - If assignments change (truck/driver added/changed), should this view auto-update?  
    - Or manual refresh is OK?

### Proposed Implementation Approach

**Note**: This is a preliminary approach. Will be refined after receiving answers to questions above.

#### Phase 1: Customer Schedule View

##### 1\. Backend API Endpoint

**New Endpoint: Customer Schedule**

1. `GET /api/clients/{clientId}/schedule` \- Get schedule for specific customer  
     
   - Query params: `startDate`, `endDate`, `companyId?` (for authorization)  
   - Authorization:  
     - Global admin: Any client  
     - Customer admin: Only clients in their company  
   - Logic:  
     1. Fetch all Rides where `ClientId = {clientId}` and `PlannedDate BETWEEN startDate AND endDate`  
     2. For each ride, include:  
        - Truck (from `TruckId` → Cars)  
        - Drivers (from `RideDriverAssignments` → Drivers → AspNetUsers for name/email)  
        - Route (RouteFromName, RouteToName)  
        - Times (PlannedStartTime, PlannedEndTime)  
     3. Calculate assignment status per ride:  
        - `complete`: TruckId NOT NULL AND has at least 1 driver assignment  
        - `partial`: TruckId NOT NULL OR has driver assignment (but not both)  
        - `unassigned`: TruckId IS NULL AND no driver assignments  
     4. Aggregate summary:  
        - Total rides count  
        - Unique trucks count (DISTINCT TruckId WHERE NOT NULL)  
        - Unique drivers count (DISTINCT DriverId from assignments)  
        - Count by status (complete, partial, unassigned)  
     5. Return structured DTO (see Gap Analysis section)

   

2. `GET /api/clients/{clientId}/schedule/summary` \- Quick summary without full details  
     
   - Returns just the summary section (totals, counts)  
   - Faster for dashboard cards

**Backend Service: `ClientScheduleService`**

- Method: `GetClientSchedule(clientId, startDate, endDate)`  
    
  - Implements logic above  
  - Returns `ClientScheduleDto`


- Method: `GetAssignmentStatus(ride)`  
    
  - Determines if ride is complete/partial/unassigned  
  - Returns: `"complete"`, `"partial"`, or `"unassigned"`

##### 2\. Database Considerations

**No schema changes needed\!** All required data exists:

- Rides (ClientId, PlannedDate, TruckId, times, routes)  
- RideDriverAssignments (DriverId, PlannedHours, IsPrimary)  
- Cars (LicensePlate)  
- Drivers → AspNetUsers (Name/Email)

**Optional: Add index for performance**

CREATE INDEX IF NOT EXISTS idx\_rides\_client\_date 

ON Rides(ClientId, PlannedDate) 

WHERE PlannedDate IS NOT NULL;

##### 3\. Frontend Changes

**A. New Component: Customer Schedule Page**

Location: `/clients/[id]/schedule` (route under existing client detail)

**OR**: Add as tab to existing `/clients/[id]/page.tsx`

**Layout:**

- **Header**:  
    
  - Client name (breadcrumb: Clients → Client A → Schedule)  
  - Date range selector (default: current week)  
  - Export button (Excel/PDF)  
  - Refresh button


- **Summary Cards** (Top Row):  
    
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  
    
  │ Total Rides │  │   Vehicles  │  │   Drivers   │  │ Fulfillment │  
    
  │     15      │  │      3      │  │      4      │  │     80%     │  
    
  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  
    
- **Filters** (Second Row):  
    
  - Date range picker  
  - Assignment status filter: All / Complete / Partial / Unassigned  
  - Sort by: Date / Vehicle / Driver


- **Main Content: Rides Table**  
    
  **Grouped by Date:**  
    
  Monday, February 10, 2026  
    
  ┌────────────────────────────────────────────────────────────────────────────┐  
    
  │ Time      Route              Vehicle    Driver(s)              Status      │  
    
  ├────────────────────────────────────────────────────────────────────────────┤  
    
  │ 08:00-17:00 Rot → Ams       AB-123-CD  John Doe (P, 8h)      ● Complete   │  
    
  │                                         Jane Smith (S, 4h)                  │  
    
  ├────────────────────────────────────────────────────────────────────────────┤  
    
  │ 09:00-18:00 Utrecht → Den   XY-456-ZW  Mike Brown (P, 8h)    ● Complete   │  
    
  ├────────────────────────────────────────────────────────────────────────────┤  
    
  │ 10:00-19:00 Ams → Rot       —          —                      ● Unassigned │  
    
  └────────────────────────────────────────────────────────────────────────────┘  
    
  Tuesday, February 11, 2026  
    
  ┌────────────────────────────────────────────────────────────────────────────┐  
    
  │ 08:00-17:00 Rot → Eindhoven AB-123-CD  —                      ● Partial    │  
    
  └────────────────────────────────────────────────────────────────────────────┘  
    
  - **Color Coding**:  
      
    - Green dot (●): Complete (truck \+ driver(s))  
    - Yellow dot (●): Partial (truck OR driver, not both)  
    - Red dot (●): Unassigned (no truck, no driver)

    

  - **Driver Display**:  
      
    - Show driver name  
    - (P) \= Primary, (S) \= Secondary  
    - Planned hours in parentheses  
    - If multiple drivers, stack vertically or show comma-separated

    

  - **Click Interaction**:  
      
    - Click row → Opens ride detail modal OR navigates to ride detail page  
    - Quick actions: Assign truck, Assign driver, Edit ride

**B. Integration with Existing Client Detail Page**

Two approaches:

**Option 1: Add "Schedule" Tab**

// In /clients/\[id\]/page.tsx

\<Tabs\>

  \<Tab label="Details" /\>  {/\* Existing content \*/}

  \<Tab label="Schedule" /\>  {/\* New: Customer schedule component \*/}

\</Tabs\>

**Option 2: Add "View Schedule" Button**

// In /clients/\[id\]/page.tsx (top right)

\<Button onClick={() \=\> router.push(\`/clients/${id}/schedule\`)}\>

  View Schedule

\</Button\>

**Recommendation**: Option 1 (tabs) for better UX \- less navigation

**C. Add Navigation from Clients List**

In `/clients/page.tsx` (clients list):

- Add "Schedule" icon button/link per client row  
- Quick access without going through detail page first

**D. New API Hooks**

Create React Query hooks:

- `useClientSchedule(clientId, startDate, endDate)` \- Fetch full schedule  
- `useClientScheduleSummary(clientId, startDate, endDate)` \- Fetch just summary

##### 4\. Export/Reporting

**Excel Export**

- Generate CSV or Excel file via backend  
- Endpoint: `GET /api/clients/{clientId}/schedule/export?format=excel&startDate=...&endDate=...`  
- Includes: Summary \+ detailed table  
- Download as: `Client_A_Schedule_2026-02-10_to_2026-02-16.xlsx`

**PDF Export**

- Generate formatted PDF via QuestPDF (backend already uses it for contracts/invoices)  
- Endpoint: `GET /api/clients/{clientId}/schedule/export?format=pdf&startDate=...&endDate=...`  
- Includes: Header with client name, summary section, rides table grouped by date  
- Download as: `Client_A_Schedule_2026-02-10_to_2026-02-16.pdf`

### Recommended Pilot Scope

**Must Have:**

- ✅ Backend endpoint: GET /clients/{id}/schedule (with date range filter)  
- ✅ Assignment status calculation (complete/partial/unassigned)  
- ✅ Customer Schedule page with:  
  - Date range selector (default: current week)  
  - Summary cards (total rides, trucks, drivers, fulfillment %)  
  - Rides table grouped by date  
  - Vehicle and driver info per ride  
  - Color-coded status indicators (green/yellow/red)  
- ✅ Add "Schedule" tab to client detail page  
- ✅ Export to Excel (basic CSV)  
- ✅ Authorization (admin access control)

**Should Have (if time permits):**

- Export to PDF (formatted report)  
- Add "View Schedule" link to clients list page  
- Filters (by status: show only unassigned)  
- Ride detail modal (click row to see more)  
- Mobile-friendly responsive design

**Won't Have (defer to Phase 2):**

- Quick assign actions from schedule view (edit inline)  
- Multi-customer comparison view  
- Automated notifications/alerts for unassigned rides  
- Real-time auto-refresh (WebSocket)  
- Historical vs planned view toggle  
- Drill-down to ride executions from schedule

### Success Criteria

After implementation:

1. ✅ Manager opens client detail page and sees "Schedule" tab  
2. ✅ Clicking "Schedule" shows current week's rides for that client  
3. ✅ Summary cards display: Total rides, unique trucks, unique drivers, fulfillment %  
4. ✅ Table lists all rides grouped by date with:  
   - Time range  
   - Route (from → to)  
   - Vehicle (license plate or "Unassigned")  
   - Driver(s) (name, primary/secondary, hours)  
   - Status indicator (green/yellow/red dot)  
5. ✅ Date range selector allows viewing past or future weeks/months  
6. ✅ Unassigned rides are clearly highlighted (red dot \+ "Unassigned" text)  
7. ✅ Manager can export schedule to Excel for sharing/analysis  
8. ✅ Customer admin can see schedule for clients in their company only  
9. ✅ Global admin can see schedule for any client  
10. ✅ System logs all access for audit (who viewed which client schedule, when)

---

**Status**: ⏸️ **AWAITING CLIENT CLARIFICATION**

**Required from Client:**

1. ✅ **Access control**: Who can see customer schedules? (see Question 1\)  
2. ✅ **Default date range**: Current week? Custom? (see Question 2\)  
3. ✅ **Navigation**: How to access? Tab on client detail? Separate page? (see Question 3\)  
4. ✅ **Assignment status definition**: What's "complete"? (see Question 6\)  
5. ✅ **Actions**: View-only or allow assign/edit? (see Question 10\)  
6. ✅ Answers to questions 4-5, 7-9, 11-12 above

**Next Steps:**

1. Client clarifies UI preferences (tab vs page, date range, etc.)  
2. Finalize assignment status logic  
3. Begin implementation (backend endpoint)  
4. Build frontend (schedule page/tab)  
5. Add export functionality  
6. Deploy and UAT

---

---

## R13: Client Hour Discrepancy Detection & Automated Email Notifications

### Requirement Summary

Generate **automated emails** showing the **difference in hours** between:

- **Driver reports** (system-generated from ride executions)  
- **Client reports** (submitted by clients in Excel or PDF format)

Send these discrepancy reports to the client for review and resolution.

**Business Context**:

- Drivers record their hours via ride executions → System generates driver timesheet  
- Clients independently track hours and send their reports (Excel or PDF)  
- Need to compare the two sources and identify mismatches  
- Email clients about discrepancies for correction/billing adjustment

### Current State

#### What exists now:

✅ **Driver reports fully implemented**:

- `DriverTimesheetReport` DTO: Complete hour breakdowns  
- Report calculation service: `ReportCalculationService`  
- PDF generation: `DriverTimesheetPdfGenerator`  
- Endpoints: `/reports/ride-executions`, `/reports/driver/{id}/week/{week}`, `/reports/driver/{id}/period/{period}`  
- Data structure includes:  
  - Daily hours (per date, per service code)  
  - Hour categories: 100%, 130%, 150%, 200% rates  
  - Total hours per week/period  
  - Allowances, kilometers, breaks, corrections

✅ **Email service**:

- `SmtpEmailService` exists with `IEmailService` interface  
- Configured with Gmail SMTP (`smtp.gmail.com`)  
- Can send HTML emails

#### Current gaps:

- ❌ **No client report storage** (no table/entity for uploaded client reports)  
- ❌ **No file upload endpoint** for client reports  
- ❌ **No file parsing logic**:  
  - Excel parser (read various Excel formats)  
  - PDF parser (OCR or structured text extraction)  
- ❌ **No standardization** of client report data (different formats per client)  
- ❌ **No comparison logic** to detect hour discrepancies  
- ❌ **No discrepancy report DTO/template**  
- ❌ **No email template** for discrepancy notifications  
- ❌ **No automated trigger** (when to run comparison? Manual? Scheduled?)

### Gap Analysis

#### Backend Gaps:

1. ❌ No `ClientReportSubmissions` table  
     
   CREATE TABLE ClientReportSubmissions (  
     
       Id UUID PRIMARY KEY,  
     
       ClientId UUID NOT NULL REFERENCES Clients(Id),  
     
       CompanyId UUID NOT NULL REFERENCES Companies(Id),  
     
       ReportPeriod VARCHAR(50), \-- "2026-Week-05", "2026-Period-01"  
     
       SubmittedAt TIMESTAMP WITH TIME ZONE NOT NULL,  
     
       SubmittedByUserId TEXT REFERENCES AspNetUsers(Id),  
     
       FileFormat VARCHAR(10), \-- "Excel", "PDF"  
     
       FileName TEXT NOT NULL,  
     
       FilePath TEXT NOT NULL,  
     
       FileSize BIGINT,  
     
       ParsedData JSONB, \-- Structured data extracted from file  
     
       ParseStatus VARCHAR(20), \-- "Pending", "Parsed", "Failed"  
     
       ParseErrorMessage TEXT,  
     
       TotalHours DECIMAL,  
     
       IsProcessed BOOLEAN DEFAULT FALSE,  
     
       ProcessedAt TIMESTAMP WITH TIME ZONE,  
     
       Notes TEXT  
     
   );  
     
2. ❌ No `HourDiscrepancies` table  
     
   CREATE TABLE HourDiscrepancies (  
     
       Id UUID PRIMARY KEY,  
     
       ClientReportSubmissionId UUID NOT NULL REFERENCES ClientReportSubmissions(Id),  
     
       DriverId UUID NOT NULL REFERENCES Drivers(Id),  
     
       ReportPeriod VARCHAR(50),  
     
       Date DATE NOT NULL,  
     
       DriverHours DECIMAL NOT NULL,  
     
       ClientHours DECIMAL NOT NULL,  
     
       Difference DECIMAL NOT NULL, \-- ClientHours \- DriverHours  
     
       DifferenceType VARCHAR(20), \-- "DriverHigher", "ClientHigher"  
     
       ServiceCode TEXT,  
     
       Notes TEXT,  
     
       EmailSentAt TIMESTAMP WITH TIME ZONE,  
     
       ResolvedAt TIMESTAMP WITH TIME ZONE,  
     
       ResolvedBy TEXT,  
     
       ResolutionNotes TEXT  
     
   );  
     
3. ❌ No file upload endpoint: `POST /api/clients/{id}/reports/upload`  
     
4. ❌ No parser services:  
     
   - `ExcelReportParserService` \- Parse Excel files (use EPPlus or NPOI library)  
   - `PdfReportParserService` \- Parse PDF files (use iTextSharp or Tesseract OCR)

   

5. ❌ No standardization service:  
     
   - `ClientReportStandardizer` \- Convert various formats to common structure

   

6. ❌ No comparison service:  
     
   - `HourDiscrepancyDetector` \- Compare driver vs client hours  
   - Logic: Match by date, driver, client → calculate differences

   

7. ❌ No email generation:  
     
   - `DiscrepancyEmailGenerator` \- Build HTML email with discrepancy table  
   - Template showing: Date, Driver hours, Client hours, Difference

   

8. ❌ No automated job/scheduler:  
     
   - Background service to process uploaded files  
   - Trigger comparison after client report upload  
   - Send emails automatically

#### Frontend Gaps:

1. ❌ No **Client Report Upload** page/dialog  
2. ❌ No file upload UI (drag-and-drop or file picker)  
3. ❌ No client report history view (list of uploaded reports)  
4. ❌ No discrepancy dashboard showing:  
   - Pending comparisons  
   - Detected discrepancies  
   - Resolved discrepancies  
5. ❌ No manual trigger for "Compare & Send Email" action  
6. ❌ No preview of parsed client report data before comparison  
7. ❌ No discrepancy detail view (drill-down per driver/date)  
8. ❌ No resolution workflow (mark discrepancy as resolved, add notes)

### Questions Pending Client Response

**CRITICAL \- Need answers before implementation:**

1. **Client Report Formats**:  
     
   - ✅ **CRITICAL**: Please provide **sample reports** from multiple clients (both Excel and PDF)  
   - What data do client reports contain?  
     - Daily hours per driver?  
     - Total hours per week?  
     - Breakdown by hour type (100%, 130%, etc.)?  
     - Service codes?  
     - Break times?  
   - Are formats standardized across clients or unique per client?  
   - **Action item**: "Need to have a look at both to find the ways to standardize it"

   

2. **Upload Process**:  
     
   - Who uploads client reports?  
     - Customer admin (client uploads their own)?  
     - Your admin uploads on behalf of client?  
     - Automated email import (client emails report)?  
   - When are reports uploaded?  
     - Weekly (after week ends)?  
     - Monthly (after period ends)?  
     - Ad-hoc (whenever client sends)?

   

3. **Comparison Scope**:  
     
   - What time period to compare?  
     - Week-by-week?  
     - Entire period (4 weeks)?  
     - Custom date range?  
   - What data points to compare?  
     - **Total hours only** (simpler)?  
     - **Daily hours** (more granular)?  
     - Hour categories (100%, 130%, etc.)?  
     - Breaks, allowances, kilometers?  
   - **Recommendation**: Start with total hours per driver per week, expand later

   

4. **Discrepancy Threshold**:  
     
   - What difference is considered significant?  
     - Any difference (even 0.1 hour)?  
     - Only if \> 1 hour?  
     - Percentage-based (e.g., \> 5% difference)?  
   - Should minor differences (\< 15 minutes) be ignored?

   

5. **Email Recipients**:  
     
   - Who receives discrepancy emails?  
     - Client contact person (primary recipient)?  
     - Your admin (CC)?  
     - Driver (if discrepancy affects them)?  
   - Email subject line format?  
     - "Hour Discrepancy Detected \- \[Client Name\] \- Week 5, 2026"  
   - Email frequency:  
     - Immediately after comparison?  
     - Daily digest?  
     - Weekly summary?

   

6. **Email Content**:  
     
   - What should the email include?  
     - Summary: "3 discrepancies found, total difference: \-5 hours"  
     - Detailed table: Date | Driver | Your Hours | Our Hours | Difference  
     - Attachments: Driver report PDF? Client report PDF?  
     - Call-to-action: "Please review and confirm"?  
   - Language: Dutch? English? Both?

   

7. **Excel Parsing Challenges**:  
     
   - Do client Excel files have:  
     - Consistent column headers?  
     - Consistent sheet names?  
     - Merged cells?  
     - Multiple sheets?  
   - Are driver names spelled consistently? (e.g., "John Doe" vs "J. Doe" vs "Doe, John")  
   - Are dates in consistent format? (DD-MM-YYYY vs MM/DD/YYYY)

   

8. **PDF Parsing Challenges**:  
     
   - Are PDFs:  
     - Structured/selectable text?  
     - Scanned images (requiring OCR)?  
     - Generated from software (easier to parse)?  
   - Table structure:  
     - Consistent layout?  
     - Headers on every page?  
   - **Note**: PDF parsing is significantly more complex than Excel

   

9. **Data Matching**:  
     
   - How to match client records to driver records?  
     - By driver name (fuzzy matching)?  
     - By driver employee ID/number (if client uses it)?  
     - By date only (if single driver per client)?  
   - What if client report doesn't specify driver? (aggregate hours only)

   

10. **Approval Workflow**:  
      
    - After discrepancy email sent, what's the next step?  
      - Client responds via email (manual follow-up)?  
      - Client logs into system to review/approve? (needs UI)  
      - Your admin manually marks as resolved?  
    - Should resolved discrepancies be stored for audit?

    

11. **Automation Level**:  
      
    - Should comparison be:  
      - **Fully automated**: Upload → Parse → Compare → Email (no human intervention)?  
      - **Semi-automated**: Upload → Parse → Admin reviews → Triggers comparison → Email?  
      - **Manual**: Admin uploads, manually triggers comparison, reviews before sending?  
    - **Recommendation**: Semi-automated for pilot (admin review before email)

    

12. **Error Handling**:  
      
    - What if file parsing fails (corrupt file, unexpected format)?  
      - Email admin about failure?  
      - Show error in UI?  
      - Retry?  
    - What if no matching driver report found for uploaded period?

### Proposed Implementation Approach

**Note**: This is a **high-level** approach. Final design depends heavily on seeing actual client report samples.

#### Phase 1: File Upload & Basic Comparison (MVP)

##### 1\. Database Schema

**ClientReportSubmissions table** (see Gap Analysis)

- Stores uploaded file metadata  
- Stores parsed data as JSONB (flexible for different formats)

**HourDiscrepancies table** (see Gap Analysis)

- Stores detected discrepancies  
- Tracks email sent and resolution status

##### 2\. Backend \- File Upload & Parsing

**New Endpoints:**

1. `POST /api/clients/{clientId}/reports/upload` \- Upload client report  
     
   - Input: Multipart form data (file \+ metadata)  
   - Body:  
       
     {  
       
       "reportPeriod": "2026-Week-05",  
       
       "reportType": "weekly", // or "period"  
       
       "notes": "Client submitted on Feb 10"  
       
     }  
       
   - File: Excel or PDF  
   - Logic:  
     1. Validate file type and size  
     2. Save file to storage (filesystem or S3)  
     3. Create `ClientReportSubmission` record with `ParseStatus = "Pending"`  
     4. Queue file for parsing (background job or immediate if small)  
   - Returns: Submission ID

   

2. `GET /api/clients/{clientId}/reports` \- List uploaded reports  
     
   - Returns: List of submissions with status (Pending, Parsed, Failed)

   

3. `POST /api/clients/{clientId}/reports/{submissionId}/process` \- Trigger comparison  
     
   - Admin action: Parse (if not done) → Compare → Generate email  
   - Returns: Discrepancy summary

   

4. `GET /api/reports/discrepancies` \- Get all discrepancies  
     
   - Query params: `clientId`, `resolved` (true/false), `startDate`, `endDate`  
   - Returns: List of discrepancies with details

   

5. `PUT /api/reports/discrepancies/{id}/resolve` \- Mark discrepancy as resolved  
     
   - Input: `{ resolutionNotes: "Client confirmed our hours are correct" }`

**Backend Services:**

**A. ExcelReportParserService**

public class ExcelReportParserService

{

    public async Task\<ParsedClientReport\> ParseExcelAsync(string filePath, Guid clientId)

    {

        // Use EPPlus or NPOI to read Excel

        // Extract: Date, Driver name, Hours

        // Return structured data

    }

}

- Library: EPPlus (NuGet package) or NPOI  
- Logic:  
  1. Open Excel file  
  2. Identify sheet (e.g., "Timesheet", "Hours")  
  3. Find header row (look for "Date", "Driver", "Hours", etc.)  
  4. Iterate rows, extract data  
  5. Validate and convert to `ParsedClientReport` DTO  
- Challenges:  
  - Handle different column orders  
  - Handle merged cells  
  - Fuzzy match driver names

**B. PdfReportParserService**

public class PdfReportParserService

{

    public async Task\<ParsedClientReport\> ParsePdfAsync(string filePath, Guid clientId)

    {

        // Option 1: Use iTextSharp for text extraction (if PDF has selectable text)

        // Option 2: Use Tesseract OCR (if PDF is scanned image)

        // Extract: Date, Driver name, Hours

        // Return structured data

    }

}

- Library: iTextSharp or Tesseract.NET  
- Logic:  
  1. Extract text from PDF  
  2. Use regex to find patterns (dates, hours)  
  3. Identify table structure  
  4. Parse rows  
  5. Convert to `ParsedClientReport` DTO  
- Challenges:  
  - PDFs are notoriously inconsistent  
  - OCR accuracy issues  
  - **Recommendation**: Encourage clients to send Excel instead; PDF as secondary option

**C. HourDiscrepancyDetector**

public class HourDiscrepancyDetector

{

    public async Task\<List\<HourDiscrepancy\>\> DetectDiscrepancies(

        Guid clientId, 

        string reportPeriod, 

        ParsedClientReport clientReport)

    {

        // 1\. Get driver report for same period

        var driverReport \= await GetDriverReport(clientId, reportPeriod);

        

        // 2\. Match records by date and driver

        var discrepancies \= new List\<HourDiscrepancy\>();

        foreach (var clientEntry in clientReport.Entries)

        {

            var driverEntry \= driverReport.FindEntry(clientEntry.Date, clientEntry.DriverName);

            if (driverEntry \== null)

            {

                // Driver entry not found \- possible issue

                discrepancies.Add(CreateDiscrepancy("DriverEntryMissing", clientEntry));

            }

            else

            {

                var diff \= clientEntry.Hours \- driverEntry.Hours;

                if (Math.Abs(diff) \> 0.25) // Threshold: 15 minutes

                {

                    discrepancies.Add(CreateDiscrepancy("HourMismatch", clientEntry, driverEntry, diff));

                }

            }

        }

        

        return discrepancies;

    }

}

- Logic:  
  1. Fetch driver report from database for same period  
  2. For each date in client report:  
     - Find matching date in driver report  
     - Compare hours (total or detailed)  
     - Calculate difference  
     - If difference \> threshold, create discrepancy record  
  3. Store discrepancies in `HourDiscrepancies` table  
  4. Return discrepancy list

**D. DiscrepancyEmailGenerator**

public class DiscrepancyEmailGenerator

{

    public string GenerateEmail(

        Client client, 

        List\<HourDiscrepancy\> discrepancies, 

        string reportPeriod)

    {

        // Build HTML email with table

        var html \= $@"

            \<h2\>Hour Discrepancy Notification \- {client.Name}\</h2\>

            \<p\>Period: {reportPeriod}\</p\>

            \<p\>We have detected {discrepancies.Count} discrepancies between your reported hours and our driver records.\</p\>

            \<table border='1'\>

                \<tr\>

                    \<th\>Date\</th\>

                    \<th\>Driver\</th\>

                    \<th\>Your Hours\</th\>

                    \<th\>Our Hours\</th\>

                    \<th\>Difference\</th\>

                \</tr\>";

        

        foreach (var d in discrepancies)

        {

            html \+= $@"

                \<tr\>

                    \<td\>{d.Date:dd-MM-yyyy}\</td\>

                    \<td\>{d.DriverName}\</td\>

                    \<td\>{d.ClientHours}\</td\>

                    \<td\>{d.DriverHours}\</td\>

                    \<td style='color:{(d.Difference \> 0 ? "green" : "red")}'\>{d.Difference:+0.00;-0.00}\</td\>

                \</tr\>";

        }

        

        html \+= "\</table\>\<p\>Please review and confirm.\</p\>";

        return html;

    }

}

**E. Background Processing (Optional for MVP)**

- Use Hangfire or Quartz.NET for scheduled jobs  
- Job: Process pending client report submissions  
  - Query `ClientReportSubmissions` WHERE `ParseStatus = 'Pending'`  
  - Parse file  
  - Update status  
  - Trigger comparison if parsing succeeds

##### 3\. Frontend Changes

**A. New Page: Client Report Upload**

Location: `/clients/{id}/reports` or add as tab to client detail

**Layout:**

- **Header**: Client name, "Upload Report" button  
- **Upload Dialog**:  
  - File picker (drag-and-drop area)  
  - Accept: `.xlsx`, `.xls`, `.pdf`  
  - Report period dropdown/picker: "Week 5, 2026" or "Period 1, 2026"  
  - Notes field (optional)  
  - Upload button  
- **Submission History Table**:  
    
  | Date Uploaded | Period      | File Name      | Status  | Actions           |  
    
  |---------------|-------------|----------------|---------|-------------------|  
    
  | Feb 10, 2026  | Week 5      | hours\_w5.xlsx  | Parsed  | View | Process   |  
    
  | Feb 3, 2026   | Week 4      | report.pdf     | Failed  | View Error        |  
    
- **Actions**:  
  - "View": Show parsed data preview  
  - "Process": Trigger comparison & email  
  - "Delete": Remove submission

**B. New Page: Discrepancy Dashboard**

Location: `/reports/discrepancies`

**Layout:**

- **Summary Cards**:  
    
  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  
    
  │ Total           │  │ Pending Review  │  │ Resolved        │  
    
  │ 15 Discrepancies│  │ 12 Discrepancies│  │ 3 Discrepancies │  
    
  └─────────────────┘  └─────────────────┘  └─────────────────┘  
    
- **Filters**:  
  - Client dropdown  
  - Status: All / Pending / Resolved  
  - Date range  
- **Discrepancies Table**:  
    
  | Date       | Client       | Driver    | Their Hours | Our Hours | Diff | Status   | Actions        |  
    
  |------------|--------------|-----------|-------------|-----------|------|----------|----------------|  
    
  | Feb 10     | Client A     | John Doe  | 8.5         | 8.0       | \+0.5 | Pending  | Resolve | View |  
    
  | Feb 11     | Client A     | Jane Doe  | 7.0         | 8.0       | \-1.0 | Pending  | Resolve | View |  
    
- **Actions**:  
  - "Resolve": Mark as resolved, add notes  
  - "View": Show detailed breakdown

**C. Email Preview/Send Confirmation**

Before sending email, show preview:

- Modal with email content (HTML rendered)  
- "Edit" button (optional, if want to customize)  
- "Send" button (triggers email)  
- "Cancel" button

##### 4\. Workflow

**End-to-End Flow:**

1. **Upload**:  
     
   - Admin/client uploads Excel/PDF report for Week 5  
   - System saves file, creates submission record  
   - Status: "Pending"

   

2. **Parse** (Automatic or Manual Trigger):  
     
   - Background job (or manual "Parse" button) processes file  
   - Excel/PDF parser extracts data  
   - Status: "Parsed" or "Failed"  
   - If failed: Show error message

   

3. **Compare** (Manual Trigger for MVP):  
     
   - Admin clicks "Process" button on submission  
   - System fetches driver report for same period  
   - `HourDiscrepancyDetector` compares data  
   - Creates discrepancy records if differences found

   

4. **Review** (Optional for MVP, Recommended):  
     
   - Admin views discrepancies in dashboard  
   - Can edit/adjust before sending email  
   - Or skip review, auto-send

   

5. **Email**:  
     
   - System generates HTML email with discrepancy table  
   - Sends to client contact email  
   - Records `EmailSentAt` timestamp

   

6. **Resolution**:  
     
   - Client responds (external: email reply, call, etc.)  
   - Admin manually marks discrepancies as "Resolved"  
   - Adds resolution notes

### Recommended Pilot Scope

**Must Have:**

- ✅ Excel file upload (`.xlsx`, `.xls`)  
- ✅ Basic Excel parser (single sheet, standard table format)  
- ✅ `ClientReportSubmissions` table (store uploaded files)  
- ✅ `HourDiscrepancies` table (store detected differences)  
- ✅ Comparison logic: **Total hours per driver per week** (simplest)  
- ✅ Email generation with discrepancy table  
- ✅ Manual process trigger (admin clicks "Compare & Send Email")  
- ✅ Discrepancy dashboard (view, resolve)  
- ✅ Authorization (admin access only)

**Should Have (if time permits):**

- Daily hour comparison (not just weekly totals)  
- Parsed data preview before comparison  
- Discrepancy threshold configuration (ignore \< X hours)  
- Email preview before sending  
- Client-specific parser configurations

**Won't Have (defer to Phase 2):**

- PDF parsing / OCR  
- Automated background processing (scheduled jobs)  
- Multi-format support (each client different template)  
- Fuzzy matching for driver names  
- Allowances, kilometers, break time comparison  
- In-app client response/approval workflow  
- Integration with billing system

**CRITICAL PRE-REQUISITE**:

- ✅ **Obtain sample reports** from clients (Excel and PDF)  
- ✅ **Analyze formats** to determine parsing feasibility  
- ✅ **Define standard format** or create mapping configs

### Success Criteria

After implementation:

1. ✅ Admin uploads client Excel report for Week 5, 2026  
2. ✅ System parses file and extracts: Date, Driver, Hours  
3. ✅ Admin clicks "Process" button  
4. ✅ System compares client hours vs driver hours for same week  
5. ✅ System detects discrepancies (differences \> 15 minutes)  
6. ✅ System generates HTML email with discrepancy table  
7. ✅ Admin previews email (optional step)  
8. ✅ Admin clicks "Send" → Email sent to client contact  
9. ✅ Email contains: Summary, detailed table (Date | Driver | Client Hours | Driver Hours | Diff)  
10. ✅ Admin can view all discrepancies in dashboard  
11. ✅ Admin can mark discrepancy as "Resolved" with notes  
12. ✅ System logs all actions for audit trail

---

**Status**: ⏸️ **BLOCKED \- AWAITING CRITICAL INFORMATION**

**CRITICAL \- Cannot proceed without:**

1. ✅ ✅ ✅ **Sample client reports** (Excel and PDF from multiple clients)  
   - Need to see actual formats to design parser  
   - **Action item from discussion**: "Need to have a look at both to find the ways to standardize it"  
2. ✅ **Report format documentation**: What fields/columns are in client reports?  
3. ✅ **Standardization agreement**: Can clients be asked to use a template you provide?

**Required from Client:**

1. ✅ Answers to questions 1-12 above  
2. ✅ **Sample reports** from at least 3 clients (Excel and PDF)  
3. ✅ Confirm comparison scope: Total hours only? Daily? Detailed?  
4. ✅ Confirm email recipients and content preferences  
5. ✅ Confirm automation level: Fully automated vs manual review?

**Next Steps:**

1. **FIRST**: Client provides sample reports  
2. Assistant analyzes samples and designs parser strategy  
3. Finalize comparison logic and thresholds  
4. Begin implementation (backend: upload, parse, compare)  
5. Build frontend (upload UI, dashboard)  
6. Test with real client reports  
7. Iterate on parser accuracy  
8. Deploy and UAT

---

**RECOMMENDATION**: Given the complexity and high risk of this requirement, consider:

- **Phase 1**: Excel only, simple format, total hours comparison  
- **Phase 2**: Daily hours, detailed breakdown  
- **Phase 3**: PDF support, OCR  
- **Future**: Automated parsing, fuzzy matching, advanced features

Start small, validate with 1-2 clients, then expand.

---

---

## R14: Customer Invoice Preparation \- Weekly Cost Visibility (Toll, Tunnel, Fuel)

### Requirement Summary

During the **invoice preparation phase**, the following weekly costs should be **visible on the customer's page**:

- **Toll costs** (highway tolls, road usage fees)  
- **Tunnel costs** (tunnel passage fees)  
- **Fuel costs** (already covered in R4, but needs integration here)

**Purpose**:

- Prepare accurate customer invoices  
- Show cost breakdown per customer per week  
- Pass through costs (tolls, tunnels, fuel) that should be billed to the customer  
- Transparency for customer billing

### Current State

#### What exists now:

✅ **Cost tracking (generic)**:

- `RideDriverExecution.ActualCosts` (decimal) \- generic cost field  
- `RideDriverExecution.CostsDescription` (text) \- free text description  
- Placeholder says "Fuel, tolls, parking, etc." but no structured data

✅ **Driver invoice system**:

- Driver invoice generation (for payroll)  
- Not customer invoicing/billing

✅ **Client detail page**: `/clients/[id]`

- Shows client company info  
- No cost/invoice information displayed

✅ **Ride data structure**:

- Each ride linked to client  
- Rides have dates, drivers, trucks

#### Current gaps:

- ❌ **No structured toll cost tracking** (not stored separately from ActualCosts)  
- ❌ **No tunnel cost tracking** (not stored separately)  
- ❌ **Fuel cost tracking** (covered in R4, but not integrated with invoicing)  
- ❌ **No invoice/billing entity** for customers  
- ❌ **No "customer invoice preparation" page/view**  
- ❌ **No weekly cost aggregation per customer**  
- ❌ **No integration with Tollcost website** (external data source)  
- ❌ **No web scraping infrastructure**  
- ❌ **No cost breakdown display** (toll vs tunnel vs fuel)

### Gap Analysis

#### Backend Gaps:

1. ❌ No separate cost tracking tables:  
     
   \-- Option 1: Separate table for pass-through costs  
     
   CREATE TABLE CustomerBillableCosts (  
     
       Id UUID PRIMARY KEY,  
     
       RideDriverExecutionId UUID REFERENCES RideDriverExecutions(Id),  
     
       RideId UUID REFERENCES Rides(Id),  
     
       ClientId UUID REFERENCES Clients(Id),  
     
       CompanyId UUID NOT NULL REFERENCES Companies(Id),  
     
         
     
       \-- Cost details  
     
       CostType VARCHAR(50) NOT NULL, \-- 'Toll', 'Tunnel', 'Fuel', 'Parking', 'Other'  
     
       CostDate DATE NOT NULL,  
     
       Amount DECIMAL(10,2) NOT NULL,  
     
       Currency VARCHAR(3) DEFAULT 'EUR',  
     
         
     
       \-- Location/Route info  
     
       TollStation TEXT, \-- "A2 Toll Maastricht"  
     
       TunnelName TEXT, \-- "Westerschelde Tunnel"  
     
       Route TEXT, \-- "Rotterdam \- Amsterdam"  
     
         
     
       \-- Source tracking  
     
       Source VARCHAR(50), \-- 'Manual', 'Tollcost', 'FuelReceipt', 'DriverReport'  
     
       ExternalReferenceId TEXT, \-- ID from external system (Tollcost)  
     
         
     
       \-- Documentation  
     
       ReceiptFileId UUID, \-- Link to uploaded receipt  
     
       Notes TEXT,  
     
         
     
       \-- Billing status  
     
       BillingStatus VARCHAR(20) DEFAULT 'Pending', \-- 'Pending', 'Invoiced', 'Paid'  
     
       InvoiceId UUID, \-- Link to customer invoice (if generated)  
     
         
     
       \-- Audit  
     
       CreatedAt TIMESTAMP WITH TIME ZONE NOT NULL,  
     
       CreatedBy TEXT REFERENCES AspNetUsers(Id),  
     
       UpdatedAt TIMESTAMP WITH TIME ZONE,  
     
       IsDeleted BOOLEAN DEFAULT FALSE  
     
   );  
     
   \-- Indexes  
     
   CREATE INDEX idx\_billable\_costs\_client\_date ON CustomerBillableCosts(ClientId, CostDate);  
     
   CREATE INDEX idx\_billable\_costs\_ride ON CustomerBillableCosts(RideId);  
     
   CREATE INDEX idx\_billable\_costs\_status ON CustomerBillableCosts(BillingStatus);  
     
2. ❌ No customer invoice table:  
     
   CREATE TABLE CustomerInvoices (  
     
       Id UUID PRIMARY KEY,  
     
       ClientId UUID NOT NULL REFERENCES Clients(Id),  
     
       CompanyId UUID NOT NULL REFERENCES Companies(Id),  
     
         
     
       \-- Invoice details  
     
       InvoiceNumber TEXT NOT NULL UNIQUE,  
     
       InvoiceDate DATE NOT NULL,  
     
       DueDate DATE,  
     
       PeriodStart DATE NOT NULL,  
     
       PeriodEnd DATE NOT NULL,  
     
         
     
       \-- Amounts  
     
       SubtotalAmount DECIMAL(10,2) NOT NULL,  
     
       TaxAmount DECIMAL(10,2),  
     
       TotalAmount DECIMAL(10,2) NOT NULL,  
     
       Currency VARCHAR(3) DEFAULT 'EUR',  
     
         
     
       \-- Status  
     
       Status VARCHAR(20) DEFAULT 'Draft', \-- 'Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'  
     
       SentAt TIMESTAMP WITH TIME ZONE,  
     
       PaidAt TIMESTAMP WITH TIME ZONE,  
     
         
     
       \-- Files  
     
       PdfFilePath TEXT,  
     
         
     
       \-- Audit  
     
       CreatedAt TIMESTAMP WITH TIME ZONE NOT NULL,  
     
       CreatedBy TEXT REFERENCES AspNetUsers(Id),  
     
       Notes TEXT  
     
   );  
     
3. ❌ No Tollcost integration service:  
     
   - `TollcostScraperService` \- Web scraping to fetch toll data  
   - Requires credentials for Tollcost website  
   - **Discussion note**: "Get credentials for website Tollcost to scrape the data"

   

4. ❌ No aggregation endpoints:  
     
   - `GET /api/clients/{id}/costs/weekly?weekStartDate={date}` \- Get costs per week  
   - `GET /api/clients/{id}/costs/summary?startDate={date}&endDate={date}` \- Get cost breakdown

   

5. ❌ No invoice preparation endpoint:  
     
   - `GET /api/clients/{id}/invoice/preview?startDate={date}&endDate={date}` \- Preview invoice data

#### Frontend Gaps:

1. ❌ No **Customer Invoice Preparation** page  
2. ❌ No weekly cost breakdown display:  
     
   Week 5, 2026 (Feb 3 \- Feb 9\)  
     
   Toll Costs:       €125.50  
     
   Tunnel Costs:     €45.00  
     
   Fuel Costs:       €850.25  
     
   Other Costs:      €23.75  
     
   ─────────────────────────  
     
   Total:           €1,044.50  
     
3. ❌ No cost entry form (manual toll/tunnel cost entry)  
4. ❌ No cost history table (list of all costs per customer)  
5. ❌ No integration with Tollcost data (import/sync button)  
6. ❌ No invoice generation UI  
7. ❌ No cost drill-down (click toll costs → see detailed list)

### Questions Pending Client Response

**CRITICAL \- Need answers before implementation:**

1. **Tollcost Website**:  
     
   - ✅ **What is "Tollcost"?** (URL? Service name? Toll collection provider?)  
   - ✅ **Credentials needed**: Please provide credentials for Tollcost access  
   - What data does Tollcost provide?  
     - Toll costs per vehicle (by license plate)?  
     - Toll costs per route?  
     - Toll costs per date/time?  
     - Transaction IDs?  
   - Is Tollcost an API or website to scrape?  
     - If API: Provide API documentation  
     - If website: Need to test scraping feasibility  
   - How often is Tollcost data updated? (Daily? Real-time?)

   

2. **Cost Calculation Method**:  
     
   - **Discussion note**: "Need to discuss how to calculate it"  
   - What exactly needs to be calculated vs fetched?  
     - **Toll**: Fetched from Tollcost? Or manually entered?  
     - **Tunnel**: Fetched from Tollcost? Or separate provider? Or manual?  
     - **Fuel**: Calculated from fuel transactions (R4)? Or fetched elsewhere?  
   - Are tolls/tunnels per:  
     - Vehicle (truck)?  
     - Route?  
     - Driver?  
     - Ride?

   

3. **Cost Attribution**:  
     
   - How to link toll costs to customers?  
     - By vehicle → vehicle's rides → rides' client?  
     - By date range → filter client's rides?  
     - Automatic attribution or manual assignment?  
   - What if truck does multiple clients' rides in one day?  
     - Split toll cost proportionally?  
     - Assign to specific ride?

   

4. **Tunnel Costs**:  
     
   - Which tunnels are relevant? (Netherlands? Europe?)  
     - Westerschelde Tunnel (NL)  
     - Maas Tunnel (Rotterdam)  
     - Others?  
   - Are tunnel costs:  
     - Tracked in Tollcost?  
     - Separate system?  
     - Manual entry?

   

5. **Fuel Costs** (from R4):  
     
   - Should fuel costs be:  
     - Per customer (based on rides for that customer)?  
     - Per vehicle (assigned to customer using that vehicle)?  
     - Total fuel for all customer's rides?  
   - Calculation: Sum of fuel transactions for rides where `Ride.ClientId = {customer}`?

   

6. **Time Period**:  
     
   - Weekly view required (as stated)?  
   - Also need: Daily? Monthly? Custom date range?  
   - Week definition: Monday-Sunday? ISO week?

   

7. **"Customer's Page" Definition**:  
     
   - Is this:  
     - **Option A**: Existing client detail page (`/clients/{id}`) with new "Costs" tab?  
     - **Option B**: New "Invoice Preparation" page?  
     - **Option C**: Separate "Billing" section in navigation?  
   - **Recommendation**: Option B \- dedicated invoice prep page

   

8. **Invoice Preparation Phase**:  
     
   - When is "invoice preparation phase"?  
     - End of week?  
     - End of month?  
     - Ad-hoc (whenever admin prepares invoice)?  
   - Who prepares invoices?  
     - Global admin?  
     - Customer admin?  
     - Accountant role?

   

9. **Data Entry**:  
     
   - For costs NOT in Tollcost (if any), how are they entered?  
     - Manual entry form?  
     - Upload receipts?  
     - Import from other systems?

   

10. **Invoice Generation**:  
      
    - After costs are visible, what's next?  
      - Generate PDF invoice?  
      - Export to accounting software?  
      - Send email to customer?  
    - Is invoice generation part of R14 or separate requirement?

    

11. **Approval Workflow**:  
      
    - Do costs need approval before invoicing?  
      - Admin reviews costs → approves → generates invoice?  
      - Or automatic (all costs included)?

    

12. **Historical Data**:  
      
    - Import past toll/tunnel costs?  
    - Or start fresh from implementation date?

### Proposed Implementation Approach

**Note**: This is a preliminary approach. Final design depends heavily on Tollcost integration details.

#### Phase 1: Manual Cost Tracking \+ Basic Aggregation

**Assumption**: Tollcost integration takes time, so start with manual entry as baseline.

##### 1\. Database Schema

**CustomerBillableCosts table** (see Gap Analysis)

- Stores all billable costs (toll, tunnel, fuel, other)  
- Flexible structure to accommodate various cost types  
- Links to rides and clients for attribution

**CustomerInvoices table** (optional for Phase 1, recommended for future)

- Stores generated invoices  
- Links costs to invoices via `InvoiceId` foreign key

##### 2\. Backend \- Cost Tracking & Aggregation

**New Endpoints:**

1. `POST /api/costs/billable` \- Add billable cost  
     
   - Input:  
       
     {  
       
       "rideId": "uuid",  
       
       "clientId": "uuid",  
       
       "costType": "Toll",  
       
       "costDate": "2026-02-10",  
       
       "amount": 25.50,  
       
       "tollStation": "A2 Maastricht",  
       
       "notes": "Highway toll"  
       
     }  
       
   - Authorization: Admin only  
   - Returns: Created cost record

   

2. `GET /api/clients/{clientId}/costs/weekly?weekStartDate={date}` \- Get weekly costs  
     
   - Returns:  
       
     {  
       
       "clientId": "uuid",  
       
       "clientName": "Client A",  
       
       "weekStartDate": "2026-02-03",  
       
       "weekEndDate": "2026-02-09",  
       
       "costs": \[  
       
         {  
       
           "costType": "Toll",  
       
           "totalAmount": 125.50,  
       
           "count": 8,  
       
           "details": \[  
       
             {  
       
               "id": "uuid",  
       
               "date": "2026-02-03",  
       
               "amount": 15.50,  
       
               "tollStation": "A2 Maastricht",  
       
               "route": "Rotterdam \- Amsterdam",  
       
               "vehicle": "AB-123-CD"  
       
             },  
       
             ...  
       
           \]  
       
         },  
       
         {  
       
           "costType": "Tunnel",  
       
           "totalAmount": 45.00,  
       
           "count": 3,  
       
           "details": \[...\]  
       
         },  
       
         {  
       
           "costType": "Fuel",  
       
           "totalAmount": 850.25,  
       
           "count": 12,  
       
           "details": \[...\]  
       
         }  
       
       \],  
       
       "summary": {  
       
         "totalToll": 125.50,  
       
         "totalTunnel": 45.00,  
       
         "totalFuel": 850.25,  
       
         "totalOther": 23.75,  
       
         "grandTotal": 1044.50  
       
       }  
       
     }

     
3. `GET /api/clients/{clientId}/costs?startDate={date}&endDate={date}&costType={type}` \- Get costs with filters  
     
   - Query params: Date range, cost type filter  
   - Returns paginated list of costs

   

4. `PUT /api/costs/billable/{id}` \- Update cost  
     
5. `DELETE /api/costs/billable/{id}` \- Delete cost (soft delete)

**Backend Service: `CustomerCostAggregationService`**

public class CustomerCostAggregationService

{

    public async Task\<WeeklyCostSummary\> GetWeeklyCostsAsync(

        Guid clientId, 

        DateTime weekStartDate)

    {

        var weekEndDate \= weekStartDate.AddDays(6);

        

        // Fetch all costs for this client in date range

        var costs \= await \_db.CustomerBillableCosts

            .Where(c \=\> c.ClientId \== clientId)

            .Where(c \=\> c.CostDate \>= weekStartDate && c.CostDate \<= weekEndDate)

            .Where(c \=\> \!c.IsDeleted)

            .ToListAsync();

        

        // Group by cost type and sum

        var summary \= costs.GroupBy(c \=\> c.CostType)

            .Select(g \=\> new CostTypeSummary

            {

                CostType \= g.Key,

                TotalAmount \= g.Sum(c \=\> c.Amount),

                Count \= g.Count(),

                Details \= g.ToList()

            })

            .ToList();

        

        return new WeeklyCostSummary

        {

            ClientId \= clientId,

            WeekStartDate \= weekStartDate,

            Costs \= summary,

            GrandTotal \= costs.Sum(c \=\> c.Amount)

        };

    }

}

##### 3\. Tollcost Integration (Phase 2 \- After Credentials Received)

**Service: `TollcostScraperService`**

public class TollcostScraperService

{

    private readonly string \_username;

    private readonly string \_password;

    private readonly HttpClient \_httpClient;

    

    public async Task\<List\<TollTransaction\>\> FetchTollDataAsync(

        DateTime startDate, 

        DateTime endDate, 

        string? vehicleLicensePlate \= null)

    {

        // 1\. Login to Tollcost website

        await LoginAsync();

        

        // 2\. Navigate to transactions/reports page

        // 3\. Apply filters (date range, vehicle)

        // 4\. Scrape data (using HtmlAgilityPack or Selenium)

        // 5\. Parse HTML table to extract toll transactions

        // 6\. Return structured data

        

        return tollTransactions;

    }

    

    private async Task LoginAsync()

    {

        // POST to login endpoint with credentials

        // Store session cookie or auth token

    }

}

- **Libraries**:  
  - `HtmlAgilityPack` (for parsing HTML) \- simple scraping  
  - `Selenium WebDriver` (for dynamic sites) \- if Tollcost uses JavaScript  
- **Challenges**:  
  - Website structure may change (scraping is fragile)  
  - Need to handle CAPTCHA (if any)  
  - Rate limiting / IP blocking  
  - Legal/ToS compliance  
- **Alternative**: Contact Tollcost for API access (more reliable than scraping)

**Endpoint: Sync Tollcost Data**

POST /api/costs/sync-tollcost

{

  "startDate": "2026-02-01",

  "endDate": "2026-02-28"

}

- Trigger: Admin clicks "Sync Tollcost Data" button  
- Process:  
  1. Call `TollcostScraperService.FetchTollDataAsync()`  
  2. For each transaction:  
     - Match vehicle license plate to ride  
     - Match date/time to ride  
     - Attribute to client based on ride  
     - Create `CustomerBillableCost` record with `Source = 'Tollcost'`  
  3. Return summary: "Imported 47 toll transactions"

##### 4\. Fuel Cost Integration (Link to R4)

**Logic**: Query fuel transactions for customer's rides

public async Task\<decimal\> GetCustomerFuelCostsAsync(

    Guid clientId, 

    DateTime startDate, 

    DateTime endDate)

{

    // From R4: VehicleFuelTransactions table

    // Get all rides for this client in date range

    var clientRides \= await \_db.Rides

        .Where(r \=\> r.ClientId \== clientId)

        .Where(r \=\> r.PlannedDate \>= startDate && r.PlannedDate \<= endDate)

        .Select(r \=\> new { r.Id, r.TruckId })

        .ToListAsync();

    

    var vehicleIds \= clientRides.Select(r \=\> r.TruckId).Distinct().ToList();

    

    // Get fuel transactions for these vehicles in date range

    var fuelCosts \= await \_db.VehicleFuelTransactions

        .Where(ft \=\> vehicleIds.Contains(ft.CarId))

        .Where(ft \=\> ft.TransactionDate \>= startDate && ft.TransactionDate \<= endDate)

        .SumAsync(ft \=\> ft.TotalCost);

    

    return fuelCosts;

}

- **Challenge**: If vehicle serves multiple clients on same day, need to split fuel cost  
- **Solution**: Proportional allocation based on kilometers or hours per client

##### 5\. Frontend Changes

**A. New Page: Customer Invoice Preparation**

Location: `/clients/{id}/invoice-prep` or `/billing/customers/{id}`

**Layout:**

- **Header**:  
    
  - Client name  
  - Week selector (or date range picker)  
  - "Sync Tollcost Data" button (triggers API call)  
  - "Generate Invoice" button (future)


- **Summary Cards** (Top Row):  
    
  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  
    
  │ Toll Costs    │  │ Tunnel Costs  │  │ Fuel Costs    │  │ Total Costs   │  
    
  │   €125.50     │  │    €45.00     │  │   €850.25     │  │  €1,044.50    │  
    
  │   8 trans.    │  │   3 trans.    │  │  12 trans.    │  │  23 items     │  
    
  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘  
    
- **Cost Breakdown Table**:  
    
  | Date     | Type   | Description           | Vehicle   | Route          | Amount  | Actions |  
    
  |----------|--------|-----------------------|-----------|----------------|---------|---------|  
    
  | Feb 3    | Toll   | A2 Maastricht        | AB-123-CD | Rot → Ams      | €15.50  | Edit | Delete |  
    
  | Feb 3    | Fuel   | Shell Station        | AB-123-CD |                | €85.00  | View    |  
    
  | Feb 4    | Tunnel | Westerschelde Tunnel | XY-456-ZW | Goes → Ter     | €15.00  | Edit | Delete |  
    
  | Feb 4    | Toll   | A4 Den Haag          | AB-123-CD | Ams → Den Haag | €12.75  | Edit | Delete |  
    
  ...  
    
- **Filters**:  
    
  - Cost type dropdown: All / Toll / Tunnel / Fuel / Other  
  - Date range  
  - Vehicle filter


- **Actions**:  
    
  - "Add Cost" button → Opens cost entry form  
  - "Export to Excel" button  
  - "Generate Invoice" button (future)

**B. Cost Entry Form/Dialog**

- Cost type dropdown: Toll / Tunnel / Fuel / Other  
- Date picker  
- Amount (€)  
- Vehicle dropdown (optional)  
- Ride dropdown (optional, auto-populate vehicle)  
- Description fields (conditional):  
  - If Toll: Toll station name, route  
  - If Tunnel: Tunnel name, route  
  - If Fuel: Liters, price per liter (link to R4 fuel transaction)  
- Notes (textarea)  
- Upload receipt button  
- Save button

**C. Integration: Add "Costs" or "Billing" Tab to Client Detail Page**

In `/clients/[id]/page.tsx`:

\<Tabs\>

  \<Tab label="Details" /\>

  \<Tab label="Schedule" /\>  // From R8

  \<Tab label="Costs & Billing" /\>  // New

\</Tabs\>

Or add "Prepare Invoice" button on client detail page header.

##### 6\. Tollcost Sync UI

**Button**: "Sync Tollcost Data"

- On click:  
  - Show modal: "Select date range to sync"  
  - Date range picker  
  - "Sync" button  
- Progress:  
  - Loading spinner: "Fetching data from Tollcost..."  
  - Success message: "Imported 47 toll transactions for week 5"  
  - Error message: "Sync failed: \[error details\]"  
- Result:  
  - Refresh cost table to show newly imported costs  
  - Highlight new items (e.g., green badge "New")

### Recommended Pilot Scope

**Must Have:**

- ✅ `CustomerBillableCosts` table (store toll, tunnel, fuel costs)  
- ✅ Manual cost entry form (admin can add toll/tunnel costs)  
- ✅ Weekly cost aggregation API (`GET /costs/weekly`)  
- ✅ Customer Invoice Prep page with:  
  - Summary cards (toll, tunnel, fuel totals)  
  - Cost breakdown table  
  - Week selector  
- ✅ Add cost button (manual entry)  
- ✅ Fuel cost integration (link to R4 fuel transactions)

**Should Have (if credentials received soon):**

- Tollcost sync button & endpoint  
- Tollcost scraper service (basic HTML parsing)  
- Automated cost attribution (match to rides/clients)

**Won't Have (defer to Phase 2):**

- Customer invoice generation (PDF, send email)  
- Approval workflow  
- Multiple currency support  
- Advanced Tollcost features (if API available)  
- Tunnel-specific provider integration (if separate from Tollcost)  
- Cost splitting for shared vehicles (complex allocation)  
- Historical data import

**CRITICAL PRE-REQUISITE**:

- ✅ **Tollcost credentials** (username, password, website URL)  
- ✅ **Tollcost access test** to determine integration approach

### Success Criteria

After implementation:

1. ✅ Admin opens client detail page, clicks "Costs & Billing" tab  
2. ✅ Selects "Week 5, 2026"  
3. ✅ Sees summary: "Toll: €125.50, Tunnel: €45.00, Fuel: €850.25"  
4. ✅ Sees detailed table with all cost transactions  
5. ✅ Admin clicks "Add Cost" → Enters toll cost manually → Saved  
6. ✅ (If Tollcost ready) Admin clicks "Sync Tollcost" → System fetches toll data → Imports transactions  
7. ✅ Fuel costs automatically calculated from R4 fuel transactions  
8. ✅ Can filter costs by type (Toll / Tunnel / Fuel)  
9. ✅ Can export cost list to Excel  
10. ✅ Costs properly attributed to rides and clients  
11. ✅ System logs all cost entries for audit trail

---

**Status**: ⏸️ **AWAITING TOLLCOST CREDENTIALS & CLARIFICATIONS**

**Required from Client:**

1. ✅ ✅ ✅ **Tollcost credentials** (username, password, URL)  
   - **Action item**: "Send credentials to Andrii"  
2. ✅ **Tollcost details**: API or website? What data format?  
3. ✅ **Calculation method**: "Need to discuss how to calculate it"  
   - How to attribute toll costs to clients?  
   - How to handle shared vehicles?  
   - How to split fuel costs?  
4. ✅ **Tunnel tracking**: Same as Tollcost or separate?  
5. ✅ Answers to questions 1-12 above

**Next Steps:**

1. **PRIORITY 1**: Receive Tollcost credentials  
2. **PRIORITY 2**: Test Tollcost access and analyze data structure  
3. **PRIORITY 3**: Discuss cost calculation/attribution rules  
4. Design scraper or API integration  
5. Implement manual cost entry first (baseline)  
6. Implement Tollcost integration  
7. Integrate fuel costs from R4  
8. Build invoice prep page  
9. Test with real client data  
10. Deploy and UAT

---

**RECOMMENDATION**:

- **Phase 1**: Manual cost entry \+ fuel integration → Provides immediate value  
- **Phase 2**: Tollcost integration (after testing feasibility)  
- **Phase 3**: Invoice generation (separate from cost visibility)

Start with manual entry to unblock invoice prep workflow while Tollcost integration is being developed.

---

---

## R17: Compensation Claims for Traffic Fines & Accidents (Driver Invoice Deductions)

### Requirement Summary

**Compensation claims** for the following should be:

- **Traffic fines** (speeding, parking, etc.)  
- **Accidents** (vehicle damage, insurance claims)

Received by drivers → **Recorded in the system** → **Included in driver's invoice details** after registration

**Clarification from discussion**:

- **"We are responsible to record"** \= Admin/company records these claims, NOT the driver  
- These are deductions from driver pay (driver owes company)

**Use Case**:

- Driver gets speeding ticket → Company receives fine notice → Admin records €100 fine in system → Fine appears as deduction on driver's next invoice

### Current State

#### What exists now:

✅ **Driver invoice system**:

- `DriverInvoiceService` generates weekly invoices  
- `DriverInvoicePdfBuilder` creates PDF invoices  
- Invoice structure:  
  - Hours worked × hourly rate \= Hourly compensation  
  - Additional compensation (allowances)  
  - Exceeding container waiting time  
  - **Total amount** (what driver invoices company)

✅ **Invoice sections**:

- FROM: Driver details  
- TO: Company details  
- Line items table  
- Payment terms

#### Current gaps:

- ❌ **No deductions/claims tracking** (fines, accidents not stored)  
- ❌ **No deductions section in invoice** (only positive amounts shown)  
- ❌ **No compensation claims entity/table**  
- ❌ **No UI to record fines/accidents**  
- ❌ **No link between claims and invoices**  
- ❌ **No claim types** (traffic fine vs accident vs other)  
- ❌ **No claim status tracking** (pending, deducted, paid)  
- ❌ **No supporting documents** (fine notice photo, accident report)

### Gap Analysis

#### Backend Gaps:

1. ❌ No `DriverCompensationClaims` table:  
     
   CREATE TABLE DriverCompensationClaims (  
     
       Id UUID PRIMARY KEY,  
     
       DriverId UUID NOT NULL REFERENCES Drivers(Id),  
     
       CompanyId UUID NOT NULL REFERENCES Companies(Id),  
     
         
     
       \-- Claim details  
     
       ClaimType VARCHAR(50) NOT NULL, \-- 'TrafficFine', 'Accident', 'VehicleDamage', 'Other'  
     
       ClaimDate DATE NOT NULL, \-- Date of incident  
     
       Amount DECIMAL(10,2) NOT NULL, \-- Amount to deduct  
     
       Currency VARCHAR(3) DEFAULT 'EUR',  
     
         
     
       \-- Description  
     
       Description TEXT NOT NULL, \-- e.g., "Speeding ticket A2 highway"  
     
       IncidentLocation TEXT, \-- Where it happened  
     
       ViolationType TEXT, \-- For fines: "Speeding", "Parking", "Red light"  
     
       VehicleId UUID REFERENCES Cars(Id), \-- Which vehicle  
     
         
     
       \-- Status  
     
       Status VARCHAR(20) DEFAULT 'Pending', \-- 'Pending', 'Approved', 'Deducted', 'Paid', 'Disputed', 'Waived'  
     
         
     
       \-- Documentation  
     
       FineReferenceNumber TEXT, \-- Official fine number  
     
       SupportingDocumentFileId UUID, \-- Link to uploaded fine notice/report  
     
         
     
       \-- Invoice linkage  
     
       DeductedFromInvoiceId UUID, \-- Link to invoice where deduction applied (future)  
     
       DeductedInWeek INT, \-- Week number where deducted  
     
       DeductedInYear INT, \-- Year where deducted  
     
       DeductedAt TIMESTAMP WITH TIME ZONE,  
     
         
     
       \-- Payment tracking  
     
       PaymentDueDate DATE,  
     
       PaidToAuthority BOOLEAN DEFAULT FALSE, \-- Did company pay the fine to authorities?  
     
       PaidToAuthorityDate DATE,  
     
         
     
       \-- Audit  
     
       RecordedBy TEXT NOT NULL REFERENCES AspNetUsers(Id), \-- Who recorded this  
     
       RecordedAt TIMESTAMP WITH TIME ZONE NOT NULL,  
     
       UpdatedAt TIMESTAMP WITH TIME ZONE,  
     
       Notes TEXT,  
     
         
     
       IsDeleted BOOLEAN DEFAULT FALSE  
     
   );  
     
   \-- Indexes  
     
   CREATE INDEX idx\_claims\_driver ON DriverCompensationClaims(DriverId);  
     
   CREATE INDEX idx\_claims\_status ON DriverCompensationClaims(Status);  
     
   CREATE INDEX idx\_claims\_date ON DriverCompensationClaims(ClaimDate);  
     
2. ❌ Invoice PDF doesn't include deductions section:  
     
   - Current invoice shows only additions (compensation)  
   - Need to add:  
       
     Compensation (additions):  
       
       Hourly compensation:         €1,200.00  
       
       Additional compensation:       €150.00  
       
       Container waiting time:         €45.00  
       
                                    ──────────  
       
     Subtotal:                      €1,395.00  
       
     Deductions:  
       
       Traffic fine (Feb 5):          \-€100.00  
       
       Vehicle damage claim:          \-€250.00  
       
                                    ──────────  
       
     Total deductions:                \-€350.00  
       
     NET AMOUNT:                    €1,045.00

     
3. ❌ No API endpoints for claims:  
     
   - `POST /api/drivers/{id}/claims` \- Record new claim  
   - `GET /api/drivers/{id}/claims` \- Get driver's claims  
   - `PUT /api/claims/{id}` \- Update claim (status, amount)  
   - `DELETE /api/claims/{id}` \- Delete claim (soft delete)  
   - `GET /api/claims` \- Get all claims (admin view, with filters)

   

4. ❌ No claim calculation in invoice service:  
     
   - `DriverInvoiceService` needs to:  
     1. Fetch pending claims for driver  
     2. Calculate total deductions  
     3. Subtract from gross compensation  
     4. Mark claims as "Deducted" after invoice generation

#### Frontend Gaps:

1. ❌ No **Claims Management** page  
2. ❌ No "Record Claim" form for admin  
3. ❌ No claims list view (filter by driver, status, date)  
4. ❌ No claim detail view (show full info \+ documents)  
5. ❌ No integration with driver detail page  
6. ❌ No claim status indicators (pending badge, paid badge, etc.)  
7. ❌ No document upload for fine notices/accident reports  
8. ❌ No claim history per driver  
9. ❌ No deductions preview in invoice prep workflow

### Questions Pending Client Response

**CRITICAL \- Need answers before implementation:**

1. **Claim Types**:  
     
   - What types of claims need tracking?  
     - ✅ Traffic fines (speeding, parking, red light, etc.)  
     - ✅ Accidents (who pays? Driver at fault?)  
     - Vehicle damage (minor damage, scratches)?  
     - Lost/stolen equipment (fuel cards, tools)?  
     - Other?  
   - Should different claim types have different workflows?

   

2. **Who Pays Initially**:  
     
   - Traffic fines:  
     - Company pays authorities first → Deduct from driver later?  
     - Or driver pays directly?  
   - Accidents:  
     - Company pays insurance deductible → Recovers from driver?  
     - Or driver pays directly?

   

3. **Deduction Timing**:  
     
   - When to deduct from driver invoice?  
     - Immediately in next weekly invoice?  
     - Spread over multiple weeks/months (installment)?  
     - Wait for driver approval/dispute?  
   - Maximum deduction per invoice? (e.g., max 20% of gross pay)

   

4. **Approval Workflow**:  
     
   - Does claim need approval before deduction?  
     - Admin records → Auto-deduct?  
     - Admin records → Supervisor approves → Deduct?  
     - Admin records → Driver acknowledges → Deduct?  
   - Can driver dispute a claim?

   

5. **Partial Responsibility**:  
     
   - For accidents, what if driver is only partially at fault?  
     - Record percentage (e.g., "50% driver fault")?  
     - Deduct proportionally?  
   - Or always 100% driver responsibility?

   

6. **Fine Details**:  
     
   - What information to record for traffic fines?  
     - Fine reference number  
     - Violation type (speeding, parking, etc.)  
     - Location  
     - Date/time of incident  
     - Speed (if speeding ticket)  
     - Fine amount  
     - Payment due date  
     - Issuing authority (police, municipality)  
   - Upload requirement: Photo of fine notice (required or optional)?

   

7. **Accident Details**:  
     
   - What information for accidents?  
     - Date/time/location  
     - Other party involved (name, insurance, vehicle)?  
     - Police report number  
     - Insurance claim number  
     - Damage description  
     - Repair cost  
     - Liability determination (driver fault %, other party fault %)  
   - Upload requirement: Police report, photos, insurance docs?

   

8. **Payment Tracking**:  
     
   - Need to track if company paid the fine to authorities?  
     - Record payment date?  
     - Link to accounting system?  
   - Or just track driver's debt to company?

   

9. **Multiple Claims Per Week**:  
     
   - If driver has 3 fines in one week, show separately or combined?  
   - Invoice line items:  
     - "Traffic fines (3 incidents): €300.00" (combined)?  
     - OR list each fine separately?

   

10. **Historical Claims**:  
      
    - Import past claims (before system implementation)?  
    - Or start fresh from go-live date?

    

11. **Notification**:  
      
    - Should driver be notified when claim is recorded?  
      - Email: "A compensation claim has been recorded for you"  
      - SMS/Telegram?  
      - In-app notification?  
    - Or driver sees it when invoice is generated?

    

12. **Waiver/Forgiveness**:  
      
    - Can claims be waived (forgiven)?  
      - E.g., first-time minor violation, company decides not to charge driver  
      - Status: "Waived"?  
    - Who can waive? (Only manager/owner?)

### Proposed Implementation Approach

#### Phase 1: Basic Claim Tracking & Invoice Deductions

##### 1\. Database Schema

**DriverCompensationClaims table** (see Gap Analysis)

- Stores all compensation claims  
- Links to driver, vehicle, invoice  
- Tracks status from pending → deducted

##### 2\. Backend \- Claim Management

**New Endpoints:**

1. `POST /api/drivers/{driverId}/claims` \- Record new claim  
     
   - Input:  
       
     {  
       
       "claimType": "TrafficFine",  
       
       "claimDate": "2026-02-05",  
       
       "amount": 100.00,  
       
       "description": "Speeding ticket A2 highway",  
       
       "violationType": "Speeding",  
       
       "incidentLocation": "A2 near Maastricht",  
       
       "vehicleId": "uuid",  
       
       "fineReferenceNumber": "ABC123456",  
       
       "paymentDueDate": "2026-03-05",  
       
       "notes": "80 km/h in 50 zone"  
       
     }  
       
   - Authorization: Admin only  
   - Returns: Created claim

   

2. `GET /api/drivers/{driverId}/claims` \- Get driver's claims  
     
   - Query params: `status` (Pending, Deducted, etc.), `startDate`, `endDate`  
   - Returns: List of claims with status

   

3. `PUT /api/claims/{claimId}` \- Update claim  
     
   - Can update: amount, status, notes, deduction dates  
   - Authorization: Admin only

   

4. `DELETE /api/claims/{claimId}` \- Soft delete claim  
     
   - Only if not yet deducted  
   - Authorization: Admin only

   

5. `GET /api/claims` \- Get all claims (admin dashboard)  
     
   - Query params: `driverId`, `status`, `claimType`, `startDate`, `endDate`  
   - Pagination support  
   - Returns: List with driver names, amounts, statuses

   

6. `POST /api/claims/{claimId}/upload` \- Upload supporting document  
     
   - Multipart file upload (fine notice PDF/image)  
   - Stores file reference in claim

**Service: ClaimInvoiceIntegrationService**

public class ClaimInvoiceIntegrationService

{

    public async Task\<List\<DriverCompensationClaim\>\> GetPendingClaimsForWeek(

        Guid driverId, 

        int year, 

        int weekNumber)

    {

        // Get all pending/approved claims for this driver

        var claims \= await \_db.DriverCompensationClaims

            .Where(c \=\> c.DriverId \== driverId)

            .Where(c \=\> c.Status \== "Pending" || c.Status \== "Approved")

            .Where(c \=\> \!c.IsDeleted)

            .ToListAsync();

        

        return claims;

    }

    

    public async Task MarkClaimsAsDeducted(

        List\<Guid\> claimIds, 

        int year, 

        int weekNumber)

    {

        var claims \= await \_db.DriverCompensationClaims

            .Where(c \=\> claimIds.Contains(c.Id))

            .ToListAsync();

        

        foreach (var claim in claims)

        {

            claim.Status \= "Deducted";

            claim.DeductedInYear \= year;

            claim.DeductedInWeek \= weekNumber;

            claim.DeductedAt \= DateTime.UtcNow;

        }

        

        await \_db.SaveChangesAsync();

    }

}

##### 3\. Update Invoice Generation

**Modify `DriverInvoiceService.GenerateWeekInvoiceAsync()`:**

// After Step 5 (get exceeding container waiting time):

// Step 5.5: Get pending compensation claims (deductions)

var claimService \= new ClaimInvoiceIntegrationService(\_dbContext);

var pendingClaims \= await claimService.GetPendingClaimsForWeek(driverId, year, weekNumber);

var totalDeductions \= pendingClaims.Sum(c \=\> c.Amount);

// Pass to PDF builder

pdfBytes \= \_pdfBuilder.BuildInvoicePdf(

    driver,

    driver.User,

    company,

    hourlyRate,

    year,

    weekNumber,

    hoursWorked,

    hourlyCompensation,

    additionalCompensation,

    exceedingContainerWaitingTime,

    pendingClaims, // NEW

    totalDeductions // NEW

);

// After successful PDF generation:

// Mark claims as deducted

if (pendingClaims.Any())

{

    await claimService.MarkClaimsAsDeducted(

        pendingClaims.Select(c \=\> c.Id).ToList(), 

        year, 

        weekNumber);

}

**Modify `DriverInvoicePdfBuilder.BuildInvoicePdf()`:**

public byte\[\] BuildInvoicePdf(

    // ... existing params ...

    List\<DriverCompensationClaim\> claims,

    decimal totalDeductions)

{

    // ... existing code ...

    

    // After line items table, add deductions section

    if (claims.Any())

    {

        column.Item().PaddingTop(20).Element(c \=\> ComposeDeductionsSection(c, claims, totalDeductions));

    }

    

    // Update total to show NET amount (compensation \- deductions)

}

private void ComposeDeductionsSection(IContainer container, List\<DriverCompensationClaim\> claims, decimal totalDeductions)

{

    container.Border(1).BorderColor(BorderColor).Padding(15).Column(column \=\>

    {

        column.Item().Text("INHOUDINGEN (Deductions)").FontSize(11).Bold().FontColor(HeaderColor);

        

        // List each claim

        foreach (var claim in claims)

        {

            column.Item().PaddingTop(8).Row(row \=\>

            {

                row.RelativeItem().Text($"{claim.Description} ({claim.ClaimDate:dd-MM-yyyy})").FontSize(10);

                row.ConstantItem(100).AlignRight().Text($"-€{claim.Amount:F2}").FontSize(10).FontColor(Colors.Red.Darken2);

            });

        }

        

        // Total deductions

        column.Item().PaddingTop(10).PaddingBottom(5).BorderTop(1).BorderColor(BorderColor);

        column.Item().PaddingTop(5).Row(row \=\>

        {

            row.RelativeItem().Text("Totale inhoudingen:").FontSize(10).Bold();

            row.ConstantItem(100).AlignRight().Text($"-€{totalDeductions:F2}").FontSize(10).Bold().FontColor(Colors.Red.Darken2);

        });

    });

}

##### 4\. Frontend Changes

**A. New Page: Claims Management**

Location: `/drivers/claims` or `/claims`

**Layout:**

- **Header**:  
    
  - Title: "Compensation Claims"  
  - "Record New Claim" button  
  - Export button


- **Filters**:  
    
  - Driver dropdown (or search)  
  - Claim type dropdown: All / Traffic Fine / Accident / Other  
  - Status dropdown: All / Pending / Approved / Deducted / Paid / Disputed  
  - Date range


- **Claims Table**:  
    
  | Date       | Driver      | Type          | Description           | Amount   | Status   | Actions        |  
    
  |------------|-------------|---------------|-----------------------|----------|----------|----------------|  
    
  | Feb 5      | John Doe    | Traffic Fine  | Speeding A2           | €100.00  | Pending  | View | Edit | Delete |  
    
  | Feb 3      | Jane Smith  | Accident      | Vehicle damage        | €250.00  | Deducted | View           |  
    
  | Jan 28     | Bob Johnson | Traffic Fine  | Parking violation     | €50.00   | Paid     | View           |  
    
- **Status Badges**: Color-coded (Pending \= yellow, Deducted \= blue, Paid \= green, Disputed \= red)

**B. Record Claim Form/Dialog**

- **Step 1: Basic Info**  
    
  - Driver dropdown (required)  
  - Claim type dropdown (required): Traffic Fine / Accident / Vehicle Damage / Other  
  - Claim date (required)  
  - Amount (required, €)  
  - Description (required, textarea)


- **Step 2: Details (conditional based on type)**  
    
  **If Traffic Fine:**  
    
  - Violation type: Speeding / Parking / Red Light / Other  
  - Location  
  - Fine reference number  
  - Payment due date  
  - Speed (if speeding): "80 km/h in 50 zone"


  **If Accident:**


  - Location  
  - Other party details (name, insurance)  
  - Police report number  
  - Insurance claim number  
  - Driver fault percentage (0-100%)  
  - Damage description


- **Step 3: Documentation**  
    
  - Upload fine notice / accident report (PDF or image)  
  - Notes (textarea)


- **Submit button**

**C. Claim Detail View (Modal)**

Show full claim information:

- All details from form  
- Status history (pending → approved → deducted)  
- Deduction info: "Deducted in Week 5, 2026"  
- Download supporting document  
- Edit/Delete buttons (if not deducted)

**D. Integration: Driver Detail Page**

Add "Claims" tab or section to `/drivers/[id]/page`:

\<Tabs\>

  \<Tab label="Details" /\>

  \<Tab label="Claims" /\>  // NEW

  \<Tab label="Contracts" /\>

  \<Tab label="Compensation" /\>

\</Tabs\>

Show driver's claims history, total pending deductions, total paid.

**E. Invoice Preview (Optional Enhancement)**

Before generating invoice, show preview:

Week 5, 2026 \- John Doe

Compensation: €1,395.00

Deductions:

\- Traffic fine (Feb 5): €100.00

\- Vehicle damage: €250.00

Total deductions: €350.00

NET AMOUNT: €1,045.00

\[Generate Invoice\]

### Recommended Pilot Scope

**Must Have:**

- ✅ `DriverCompensationClaims` table  
- ✅ Admin UI to record claims (traffic fines, accidents)  
- ✅ Claims list view (filter by driver, status)  
- ✅ Deductions section in driver invoice PDF  
- ✅ Auto-mark claims as "Deducted" after invoice generation  
- ✅ Status tracking (Pending → Deducted → Paid)

**Should Have (if time permits):**

- Supporting document upload (fine notice, accident report)  
- Claim detail view (modal)  
- Add "Claims" tab to driver detail page  
- Status badges (color coding)

**Won't Have (defer to Phase 2):**

- Dispute workflow (driver can challenge claim)  
- Installment payments (spread deduction over multiple weeks)  
- Max deduction % per invoice  
- Automatic fine detection (scrape government databases)  
- Driver self-service (driver uploads their own fines)  
- Waiver/forgiveness approval workflow  
- Refund/credit note for reversed claims

### Success Criteria

After implementation:

1. ✅ Admin opens "Claims Management" page  
2. ✅ Admin clicks "Record New Claim"  
3. ✅ Selects driver "John Doe", type "Traffic Fine", amount €100, date Feb 5  
4. ✅ Enters description: "Speeding A2 highway", violation type: "Speeding"  
5. ✅ Optionally uploads fine notice PDF  
6. ✅ Saves claim → Status: "Pending"  
7. ✅ Week 5 ends, admin generates invoice for John Doe  
8. ✅ Invoice PDF shows:  
   - Compensation: €1,395.00  
   - Deductions: Traffic fine (Feb 5): \-€100.00  
   - NET AMOUNT: €1,295.00  
9. ✅ Claim status automatically changes to "Deducted" (Week 5, 2026\)  
10. ✅ Admin can view claim history per driver  
11. ✅ System logs all actions for audit trail

---

**Status**: ✅ **READY TO IMPLEMENT** (Clear requirement, no blockers)

**No critical blockers**, but clarifications helpful:

1. Recommended: Confirm max deduction % per invoice  
2. Recommended: Clarify dispute workflow (if any)  
3. Recommended: Define behavior for deductions \> invoice amount

**Next Steps:**

1. Create database schema  
2. Build claims CRUD API  
3. Update invoice service & PDF builder  
4. Build claims management UI  
5. Test with sample claims  
6. Deploy and UAT

---

---

## R21: New Driver Onboarding Workflow with Notifications

### Requirement Summary

**Driver onboarding workflow** with paperwork tracking and notifications:

1. **New driver name entered** → System creates driver profile (basic info)  
2. **Manager notified** → Email/notification to track paperwork completion  
3. **Paperwork tracking** → Manager monitors document collection progress  
4. **Paperwork complete** → Planning team notifies driver they are eligible to start

**Use Case**:

- Admin enters new driver "John Doe" → Manager receives email "New driver added, paperwork pending"  
- Manager uploads: contract, ID, driver's license, COC (Certificate of Conduct), medical cert  
- System tracks checklist completion  
- When all docs uploaded → Manager marks as "Complete" → Driver receives email "You can start, contact planning"

### Current State

#### What exists now:

✅ **Driver creation**: Full driver creation API exists

- Endpoint: `POST /drivers/create-with-contract`  
- Creates: ApplicationUser \+ Driver entity \+ EmployeeContract \+ DriverCompensationSettings  
- Contract status: `EmployeeContractStatus.Pending` (enum value)  
- Process: Admin enters all driver details at once (name, address, contract terms, etc.)

✅ **File uploads**: `DriverFiles` table

- Can upload documents and link to driver  
- Fields: FileName, OriginalFileName, FilePath, ContentType, UploadedAt  
- No document type classification (not tracked what kind of document)

✅ **Notification infrastructure**:

- Email service: `SmtpEmailService` (Gmail SMTP configured)  
- Telegram service: `TelegramNotificationService` (for driver notifications)

✅ **Existing driver creation UI**: `/drivers/create`

- Full form with all details (name, address, contract, compensation)  
- Creates "complete" driver in one step  
- No multi-step onboarding process

#### Current gaps:

- ❌ **No onboarding status tracking** on Driver entity  
  - No status field (e.g., "Pending", "Paperwork In Progress", "Eligible")  
  - Contract has status but it's for contract approval, not general onboarding  
- ❌ **No paperwork checklist**:  
  - No tracking of which documents are required  
  - No tracking of which documents are uploaded  
  - No checklist completion percentage  
- ❌ **No manager notification** when driver created  
- ❌ **No driver notification** when eligible  
- ❌ **No document type classification**:  
  - DriverFiles stores files but doesn't specify: "This is ID", "This is driver's license", etc.  
- ❌ **No onboarding dashboard** for manager to see pending drivers  
- ❌ **No workflow states** (created → documents uploading → review → eligible)

### Gap Analysis

#### Backend Gaps:

1. ❌ No onboarding status on Driver:  
     
   \-- Add to Drivers table  
     
   ALTER TABLE Drivers ADD COLUMN OnboardingStatus VARCHAR(50) DEFAULT 'PendingPaperwork';  
     
   \-- Values: 'PendingPaperwork', 'PaperworkInProgress', 'PendingReview', 'Eligible', 'Active'  
     
   ALTER TABLE Drivers ADD COLUMN EligibleDate TIMESTAMP WITH TIME ZONE;  
     
   ALTER TABLE Drivers ADD COLUMN NotifiedManagerAt TIMESTAMP WITH TIME ZONE;  
     
   ALTER TABLE Drivers ADD COLUMN NotifiedDriverAt TIMESTAMP WITH TIME ZONE;  
     
2. ❌ No paperwork checklist tracking:  
     
   CREATE TABLE DriverOnboardingDocuments (  
     
       Id UUID PRIMARY KEY,  
     
       DriverId UUID NOT NULL REFERENCES Drivers(Id),  
     
         
     
       \-- Document type  
     
       DocumentType VARCHAR(50) NOT NULL,   
     
       \-- 'ID\_Card', 'DriversLicense', 'COC\_Certificate', 'MedicalCertificate',   
     
       \-- 'EmployeeContract', 'BankDetails', 'Photo', 'Other'  
     
         
     
       \-- Status  
     
       Status VARCHAR(20) DEFAULT 'Required', \-- 'Required', 'Uploaded', 'Verified', 'Expired'  
     
       IsRequired BOOLEAN DEFAULT TRUE,  
     
         
     
       \-- File reference  
     
       DriverFileId UUID REFERENCES DriverFiles(Id),  
     
         
     
       \-- Expiry tracking (for licenses, certificates)  
     
       ExpiryDate DATE,  
     
         
     
       \-- Verification  
     
       VerifiedBy TEXT REFERENCES AspNetUsers(Id),  
     
       VerifiedAt TIMESTAMP WITH TIME ZONE,  
     
         
     
       \-- Audit  
     
       UploadedAt TIMESTAMP WITH TIME ZONE,  
     
       Notes TEXT,  
     
         
     
       IsDeleted BOOLEAN DEFAULT FALSE  
     
   );  
     
3. ❌ No notification service methods:  
     
   - `NotifyManagerOnNewDriver(driverId)` \- Email manager when driver created  
   - `NotifyDriverOnEligible(driverId)` \- Email/Telegram driver when eligible

   

4. ❌ No onboarding management endpoints:  
     
   - `GET /api/drivers/{id}/onboarding` \- Get onboarding status \+ checklist  
   - `PUT /api/drivers/{id}/onboarding/mark-eligible` \- Manager marks as eligible  
   - `POST /api/drivers/{id}/onboarding/document` \- Upload \+ classify document

   

5. ❌ No onboarding dashboard endpoint:  
     
   - `GET /api/drivers/onboarding/pending` \- Get all drivers with pending paperwork

#### Frontend Gaps:

1. ❌ No **Onboarding Dashboard** (manager view)  
   - List of drivers with paperwork status  
   - Checklist completion % per driver  
2. ❌ No **Onboarding Checklist** view per driver  
   - Show required documents  
   - Show uploaded documents (✓ or ✗)  
   - Upload button per document type  
3. ❌ No **Document Classification** during upload  
   - When uploading file, specify: "This is the driver's license"  
4. ❌ No **Workflow actions**:  
   - "Mark as Eligible" button (after all docs uploaded)  
   - "Notify Driver" button (send eligibility notification)  
5. ❌ No **Status badges** on driver list  
   - Show: "⏳ Pending Paperwork" vs "✅ Eligible" vs "🟢 Active"

### Questions Pending Client Response

**CRITICAL \- Need answers before implementation:**

1. **Required Paperwork List**:  
     
   - What documents are required for new driver onboarding?  
     - ID card/passport ✓  
     - Driver's license (category C/CE for trucks) ✓  
     - COC (Certificate of Conduct / VOG in Dutch) ✓  
     - Medical certificate (for commercial driving) ✓  
     - Signed employment contract ✓  
     - Bank details (IBAN) ✓  
     - Proof of address?  
     - Insurance documents?  
     - Other?  
   - Are all documents required, or some optional?

   

2. **Document Expiry**:  
     
   - Do some documents expire?  
     - Driver's license: Expires after X years  
     - Medical certificate: Expires after 1-5 years  
     - COC: Valid for 6 months?  
   - Should system track expiry and alert before expiration?

   

3. **Onboarding States**:  
     
   - What are the stages of onboarding?  
     - **Option A**: Simple (Pending → Eligible → Active)  
     - **Option B**: Detailed (Pending → Paperwork In Progress → Pending Review → Eligible → Active)  
   - When does driver become "Active"? (first ride assigned? first ride completed?)

   

4. **Manager Definition**:  
     
   - Who is "the manager" that gets notified?  
     - Specific user (e.g., HR manager)?  
     - User with "Employer" role?  
     - Company admin?  
     - All global admins?  
   - Multiple managers?

   

5. **Notification Timing**:  
     
   - **When driver created**:  
       
     - Notify manager immediately?  
     - Email subject: "New Driver Added \- \[Driver Name\]"  
     - Email content: Name, company, paperwork checklist link?

     

   - **When paperwork complete**:  
       
     - Manager clicks "Mark as Eligible" → Driver receives notification?  
     - Or automatic notification when last document uploaded?  
     - Email subject: "You are eligible to start \- \[Company Name\]"  
     - Email content: "Please contact planning to schedule your first assignment"?

   

6. **Driver Notification Method**:  
     
   - Email only?  
   - Telegram \+ Email?  
   - SMS?  
   - In-app notification (if driver has account at this stage)?

   

7. **Account Creation Timing**:  
     
   - Is driver user account created:  
     - **Immediately** when name entered? (as is now)  
     - **Only after paperwork complete**?  
   - If immediate: Driver can log in before eligible?

   

8. **Access Before Eligible**:  
     
   - If driver logs in before "eligible":  
     - See dashboard but can't do anything?  
     - Message: "Your paperwork is being processed"?  
     - Can't see rides/planning?  
   - Or block login entirely until eligible?

   

9. **Paperwork Upload Process**:  
     
   - Who uploads documents?  
     - Admin/manager uploads on behalf of driver?  
     - Driver uploads their own documents?  
     - Both?  
   - When uploading, does uploader specify document type? (dropdown: "This is ID card")

   

10. **Document Verification**:  
      
    - Does someone need to verify/approve each document?  
      - Manager verifies ID is valid, license is correct category?  
      - Or just "uploaded" \= "approved"?  
    - Status: Required → Uploaded → Verified?

    

11. **Incomplete Onboarding**:  
      
    - Can driver with incomplete paperwork:  
      - Be assigned to rides?  
      - Submit ride executions?  
      - Generate invoices?  
    - Or blocked until "Eligible"?

    

12. **Planning Team Notification**:  
      
    - "Planning will notify the driver" \- is this:  
      - Automated email?  
      - Manual (planning admin sends custom email/call)?  
    - Content: "Contact us to start" or specific assignment details?

### Proposed Implementation Approach

#### Phase 1: Onboarding Status & Paperwork Checklist

##### 1\. Database Schema Changes

**Add to Drivers table:**

ALTER TABLE Drivers ADD COLUMN OnboardingStatus VARCHAR(50) DEFAULT 'PendingPaperwork';

ALTER TABLE Drivers ADD COLUMN EligibleDate TIMESTAMP WITH TIME ZONE;

ALTER TABLE Drivers ADD COLUMN NotifiedManagerAt TIMESTAMP WITH TIME ZONE;

ALTER TABLE Drivers ADD COLUMN NotifiedDriverAt TIMESTAMP WITH TIME ZONE;

ALTER TABLE Drivers ADD COLUMN OnboardingCompletedBy TEXT REFERENCES AspNetUsers(Id);

**New table: DriverOnboardingDocuments** (see Gap Analysis)

- Tracks required vs uploaded documents  
- Links to DriverFiles

**Add to DriverFiles table:**

ALTER TABLE DriverFiles ADD COLUMN DocumentType VARCHAR(50);

\-- 'ID\_Card', 'DriversLicense', 'COC', 'MedicalCert', 'Contract', 'BankDetails', 'Photo', 'Other'

ALTER TABLE DriverFiles ADD COLUMN ExpiryDate DATE;

ALTER TABLE DriverFiles ADD COLUMN IsVerified BOOLEAN DEFAULT FALSE;

ALTER TABLE DriverFiles ADD COLUMN VerifiedBy TEXT REFERENCES AspNetUsers(Id);

ALTER TABLE DriverFiles ADD COLUMN VerifiedAt TIMESTAMP WITH TIME ZONE;

##### 2\. Backend \- Onboarding Management

**Enhanced Driver Creation:**

Modify `POST /drivers/create-with-contract`:

// After driver created:

// 1\. Set initial onboarding status

driver.OnboardingStatus \= "PendingPaperwork";

// 2\. Create onboarding document checklist (required documents)

var requiredDocuments \= new List\<string\> 

{

    "ID\_Card", "DriversLicense", "COC", "MedicalCertificate", 

    "EmployeeContract", "BankDetails"

};

foreach (var docType in requiredDocuments)

{

    db.DriverOnboardingDocuments.Add(new DriverOnboardingDocument

    {

        DriverId \= driver.Id,

        DocumentType \= docType,

        Status \= "Required",

        IsRequired \= true

    });

}

await db.SaveChangesAsync();

// 3\. Send notification to manager

await notificationService.NotifyManagerOnNewDriverAsync(driver.Id, company.Id);

driver.NotifiedManagerAt \= DateTime.UtcNow;

await db.SaveChangesAsync();

**New Endpoints:**

1. `GET /api/drivers/{driverId}/onboarding` \- Get onboarding status  
     
   - Returns:  
       
     {  
       
       "driverId": "uuid",  
       
       "driverName": "John Doe",  
       
       "onboardingStatus": "PendingPaperwork",  
       
       "eligibleDate": null,  
       
       "checklist": \[  
       
         {  
       
           "documentType": "ID\_Card",  
       
           "isRequired": true,  
       
           "status": "Uploaded",  
       
           "fileId": "uuid",  
       
           "fileName": "john\_doe\_id.pdf",  
       
           "uploadedAt": "2026-02-10T10:30:00Z",  
       
           "expiryDate": "2030-05-15"  
       
         },  
       
         {  
       
           "documentType": "DriversLicense",  
       
           "isRequired": true,  
       
           "status": "Required",  
       
           "fileId": null  
       
         },  
       
         ...  
       
       \],  
       
       "completionPercentage": 33,  
       
       "documentsUploaded": 2,  
       
       "documentsRequired": 6  
       
     }

     
2. `POST /api/drivers/{driverId}/onboarding/upload` \- Upload classified document  
     
   - Input: Multipart form  
       
     {  
       
       "documentType": "DriversLicense",  
       
       "expiryDate": "2028-12-31"  
       
     }  
       
   - File: PDF or image  
   - Logic:  
     1. Save file to `DriverFiles` with `DocumentType`  
     2. Update `DriverOnboardingDocuments` status to "Uploaded"  
     3. Check if all required documents uploaded → Auto-update status to "PendingReview"  
   - Returns: Updated checklist

   

3. `PUT /api/drivers/{driverId}/onboarding/mark-eligible` \- Mark driver as eligible  
     
   - Authorization: Admin/Manager only  
   - Logic:  
     1. Verify all required documents uploaded  
     2. Update `Driver.OnboardingStatus = "Eligible"`  
     3. Set `Driver.EligibleDate = DateTime.UtcNow`  
     4. Send notification to driver  
     5. Record `Driver.NotifiedDriverAt`  
   - Returns: Success message

   

2. `GET /api/drivers/onboarding/pending` \- Get drivers with pending paperwork  
     
   - Returns: List of drivers with OnboardingStatus \!= "Active"  
   - For manager dashboard

**Notification Service Extensions:**

public interface IDriverOnboardingNotificationService

{

    Task NotifyManagerOnNewDriverAsync(Guid driverId, Guid companyId);

    Task NotifyDriverOnEligibleAsync(Guid driverId);

}

public class DriverOnboardingNotificationService

{

    public async Task NotifyManagerOnNewDriverAsync(Guid driverId, Guid companyId)

    {

        var driver \= await \_db.Drivers

            .Include(d \=\> d.User)

            .Include(d \=\> d.Company)

            .FirstOrDefaultAsync(d \=\> d.Id \== driverId);

        

        // Get managers (users with 'employer' role in this company)

        var managers \= await GetManagersForCompany(companyId);

        

        foreach (var manager in managers)

        {

            var subject \= $"New Driver Added \- {driver.User.FirstName} {driver.User.LastName}";

            var body \= $@"

                \<h2\>New Driver Added\</h2\>

                \<p\>A new driver has been added to the system and requires paperwork processing.\</p\>

                \<ul\>

                    \<li\>\<strong\>Name:\</strong\> {driver.User.FirstName} {driver.User.LastName}\</li\>

                    \<li\>\<strong\>Email:\</strong\> {driver.User.Email}\</li\>

                    \<li\>\<strong\>Company:\</strong\> {driver.Company.Name}\</li\>

                    \<li\>\<strong\>Status:\</strong\> Pending Paperwork\</li\>

                \</ul\>

                \<p\>\<a href='https://vervoermanager.nl/drivers/{driver.Id}'\>View Driver Profile\</a\>\</p\>

                \<p\>Please track and complete the required paperwork.\</p\>

            ";

            

            await \_emailService.SendEmailAsync(manager.Email, subject, body);

        }

    }

    

    public async Task NotifyDriverOnEligibleAsync(Guid driverId)

    {

        var driver \= await \_db.Drivers

            .Include(d \=\> d.User)

            .Include(d \=\> d.Company)

            .FirstOrDefaultAsync(d \=\> d.Id \== driverId);

        

        var subject \= $"You are eligible to start \- {driver.Company.Name}";

        var body \= $@"

            \<h2\>Welcome to {driver.Company.Name}\!\</h2\>

            \<p\>Dear {driver.User.FirstName},\</p\>

            \<p\>Your paperwork has been completed and verified. You are now eligible to start working.\</p\>

            \<p\>Please contact the planning team to schedule your first assignment.\</p\>

            \<p\>\<strong\>Planning Contact:\</strong\>\</p\>

            \<ul\>

                \<li\>Email: planning@{driver.Company.Email.Split('@').Last()}\</li\>

                \<li\>Phone: {driver.Company.PhoneNumber}\</li\>

            \</ul\>

            \<p\>You can now log in to the application: \<a href='https://vervoermanager.nl'\>https://vervoermanager.nl\</a\>\</p\>

        ";

        

        await \_emailService.SendEmailAsync(driver.User.Email, subject, body);

        

        // Also send Telegram if enabled (optional)

        if (driver.TelegramNotificationsEnabled && driver.TelegramChatId.HasValue)

        {

            var telegramMsg \= $"🎉 You are now eligible to start at {driver.Company.Name}\! Please contact planning to schedule your first assignment.";

            await \_telegramService.SendMessageAsync(driver.TelegramChatId.Value, telegramMsg);

        }

    }

}

##### 3\. Frontend Changes

**A. Enhanced Driver Creation (Option 1: Two-Step)**

**Step 1: Basic Info**

- Name, email, phone, address  
- Company  
- Submit → Creates driver with status "PendingPaperwork"  
- Notification sent to manager

**Step 2: Paperwork Upload** (navigate to driver detail)

- Shows checklist  
- Upload each document

**OR Option 2: Keep existing single-step form** (simpler)

- Same as now (all fields at once)  
- After creation, redirect to onboarding checklist page

**B. New Page: Onboarding Dashboard**

Location: `/drivers/onboarding` or `/onboarding`

**Layout:**

- **Header**:  
    
  - Title: "Driver Onboarding"  
  - Filter: Status dropdown (All / Pending / In Progress / Eligible)


- **Summary Cards**:  
    
  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  
    
  │ Pending         │  │ In Progress     │  │ Eligible        │  
    
  │ 3 Drivers       │  │ 5 Drivers       │  │ 2 Drivers       │  
    
  └─────────────────┘  └─────────────────┘  └─────────────────┘  
    
- **Drivers Table**:  
    
  | Driver       | Company    | Status             | Paperwork | Created    | Actions        |  
    
  |--------------|------------|--------------------|-----------|-|-----------|----------------|  
    
  | John Doe     | Company A  | ⏳ Pending         | 2/6 (33%) | Feb 10     | View | Mark Eligible |  
    
  | Jane Smith   | Company B  | 📄 In Progress     | 5/6 (83%) | Feb 8      | View | Mark Eligible |  
    
  | Bob Johnson  | Company A  | ✅ Eligible        | 6/6 (100%)| Feb 5      | View           |  
    
- **Click row**: Opens onboarding detail view

**C. Driver Onboarding Detail View (Modal or Page)**

Location: `/drivers/{id}/onboarding` or modal

**Layout:**

- **Driver Info** (top):  
    
  - Name, email, company  
  - Status badge: "⏳ Pending Paperwork"


- **Paperwork Checklist**:  
    
  Required Documents:  
    
  ☑ ID Card                    \[Uploaded: john\_id.pdf\] \[View\] \[Delete\]  
    
  ☐ Driver's License           \[Upload File\]  
    
  ☑ COC Certificate            \[Uploaded: coc.pdf\] \[View\] \[Delete\]  
    
  ☐ Medical Certificate        \[Upload File\]  
    
  ☐ Signed Contract            \[Upload File\]  
    
  ☑ Bank Details (IBAN)        \[Uploaded: bank.pdf\] \[View\] \[Delete\]  
    
  Progress: 3/6 (50%)  
    
- **Actions**:  
    
  - "Upload Document" button per item → File picker with type pre-filled  
  - "Mark as Eligible" button (only if all docs uploaded)  
    - Prompts confirmation: "Send notification to driver?"  
    - On confirm: Updates status, sends email/Telegram

**D. Add to Driver Detail Page**

In `/drivers/[id]/page`:

- Add "Onboarding" tab or status section  
- Show current onboarding status  
- Show checklist (if not yet eligible)  
- Show "Eligible since Feb 10, 2026" (if eligible)

**E. Driver List Enhancement**

In `/drivers/page`:

- Add onboarding status badge per driver  
- Filter: "Show only pending onboarding"  
- Quick action: "View Onboarding" link

##### 4\. Document Classification

**During File Upload:**

- Add dropdown: "Document Type"  
- Options: ID Card / Driver's License / COC / Medical Cert / Contract / Bank Details / Photo / Other  
- If "Other": Free text input for custom type  
- Expiry date picker (optional, for licenses/certificates)

**After Upload:**

- File linked to `DriverOnboardingDocuments` record  
- Checklist item marked as "Uploaded"  
- Progress % recalculated

##### 5\. Notifications

**Email Templates:**

**A. Manager Notification (on driver creation):**

Subject: New Driver Added \- John Doe

Dear Manager,

A new driver has been added to the system:

Name: John Doe

Email: john@example.com

Company: Transport Company BV

Status: Pending Paperwork

Please track the completion of required documents:

\- ID Card

\- Driver's License

\- COC Certificate

\- Medical Certificate

\- Employment Contract

\- Bank Details

View Driver Profile: https://vervoermanager.nl/drivers/{driverId}

Track Onboarding: https://vervoermanager.nl/drivers/onboarding

**B. Driver Notification (on eligible):**

Subject: You are eligible to start \- Transport Company BV

Dear John,

Good news\! Your paperwork has been completed and verified.

You are now eligible to start working with Transport Company BV.

Next Steps:

1\. Log in to the driver application: https://vervoermanager.nl

2\. Contact the planning team to schedule your first assignment

3\. Complete any required training (if applicable)

Planning Contact:  
   
Email: planning@transportcompany.nl

Phone: \+31 20 123 4567

Welcome to the team\!

### Recommended Pilot Scope

**Must Have:**

- ✅ Add `OnboardingStatus` field to Drivers  
- ✅ Create `DriverOnboardingDocuments` table (checklist)  
- ✅ Default checklist created when driver added  
- ✅ Classified file upload (specify document type during upload)  
- ✅ Onboarding detail view (checklist with upload buttons)  
- ✅ "Mark as Eligible" action (admin button)  
- ✅ Manager email notification (on driver creation)  
- ✅ Driver email notification (on eligible)  
- ✅ Onboarding dashboard (list pending drivers)

**Should Have (if time permits):**

- Expiry date tracking (for licenses/certs)  
- Document verification workflow (manager approves each doc)  
- Telegram notification for driver (in addition to email)  
- Progress percentage display (X/Y docs uploaded)  
- Status badges on driver list

**Won't Have (defer to Phase 2):**

- Two-step driver creation (basic info → paperwork)  
- Configurable checklist (admin defines required docs)  
- Automated status updates (all docs uploaded → auto-eligible)  
- Expiry renewal workflow (alerts before expiry)  
- Document access restriction (driver can't log in until eligible)  
- In-app notifications (bell icon, notification center)  
- Bulk document upload (multiple files at once)

### Success Criteria

After implementation:

1. ✅ Admin creates new driver "John Doe"  
2. ✅ System creates driver with status "PendingPaperwork"  
3. ✅ Manager receives email: "New Driver Added \- John Doe" with link to profile  
4. ✅ Manager opens driver profile, sees "Onboarding" section  
5. ✅ Manager sees checklist: 6 required documents, 0/6 uploaded  
6. ✅ Manager uploads ID card → Selects "ID Card" from dropdown → Uploads file  
7. ✅ Checklist updates: ID Card ✓ (1/6 \- 17%)  
8. ✅ Manager uploads all remaining docs (license, COC, medical, contract, bank details)  
9. ✅ Checklist shows: 6/6 (100%)  
10. ✅ Manager clicks "Mark as Eligible" → Confirmation dialog  
11. ✅ System sends email \+ Telegram to driver: "You are eligible to start"  
12. ✅ Driver status changes to "Eligible"  
13. ✅ Driver logs in, sees welcome message, can now access planning/rides  
14. ✅ Onboarding dashboard shows driver moved from "Pending" to "Eligible"

---

**Status**: ✅ **READY TO IMPLEMENT** (Clear requirement, no blockers)

**Helpful clarifications (non-blocking):**

1. List of required documents (assuming: ID, license, COC, medical, contract, bank)  
2. Who is "manager"? (Employer role? Specific user?)  
3. Should driver account be restricted until eligible? (or just show status message)

**Next Steps:**

1. Add onboarding status fields to database  
2. Create document checklist table  
3. Build onboarding dashboard  
4. Implement notification service  
5. Update driver creation to trigger manager notification  
6. Build "Mark Eligible" workflow  
7. Test notifications  
8. Deploy and UAT

---

