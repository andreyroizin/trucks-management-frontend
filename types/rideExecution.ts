// Enum for execution status
export enum RideDriverExecutionStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Dispute = 3
}

// Request interface for submitting execution
export interface SubmitExecutionRequest {
  actualStartTime?: string;
  actualEndTime?: string;
  actualRestTime?: string;
  startKilometers?: number;
  endKilometers?: number;
  actualKilometers?: number;
  extraKilometers?: number;
  actualCosts?: number;
  costsDescription?: string;
  turnover?: number;
  remark?: string;
  correctionTotalHours?: number;
  hoursCodeId?: string;
  hoursOptionId?: string;
  charterId?: string;
  variousCompensation?: number;
  
  // NEW: Optional files array for single-step submission
  files?: Array<{
    fileName: string;
    contentType: string;
    fileDataBase64: string;
  }>;
}

// Complete execution data interface
export interface RideDriverExecution {
  id: string;
  rideId: string;
  driverId: string;
  isPrimary: boolean;
  driverFirstName: string;
  driverLastName: string;
  driverFullName: string;

  // Time & Work
  actualStartTime?: string;
  actualEndTime?: string;
  actualRestTime?: string;
  restCalculated?: string;
  startKilometers?: number;
  endKilometers?: number;
  actualKilometers?: number;
  extraKilometers?: number;
  actualCosts?: number;
  costsDescription?: string;
  turnover?: number;
  remark?: string;
  correctionTotalHours: number;

  // Calculated
  decimalHours?: number;
  numberOfHours?: number;
  periodNumber?: number;
  weekNrInPeriod?: number;
  weekNumber?: number;

  // Compensations
  nightAllowance?: number;
  kilometerReimbursement?: number;
  consignmentFee?: number;
  taxFreeCompensation?: number;
  variousCompensation?: number;
  standOver?: number;
  saturdayHours?: number;
  sundayHolidayHours?: number;
  vacationHoursEarned?: number;

  // Status
  status: RideDriverExecutionStatus;
  hoursCodeId?: string;
  hoursCodeName?: string;
  hoursOptionId?: string;
  hoursOptionName?: string;
  charterId?: string;

  // Audit
  submittedAt?: string;
  lastModifiedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

// Multiple executions response
export interface RideExecutions {
  rideId: string;
  executionCompletionStatus: string; // "none", "partial", "complete", "approved"
  executions: RideDriverExecution[];
}
