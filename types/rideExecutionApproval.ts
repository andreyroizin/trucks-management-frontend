// Types for ride execution approval system

export interface RideExecution {
  executionId: string;
  driverId: string;
  driverFirstName: string;
  driverLastName: string;
  isPrimary: boolean;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Dispute';
  decimalHours: number;
  submittedAt: string;
  totalCompensation: number;
  actualStartTime?: string;
  actualEndTime?: string;
  actualRestTime?: string;
  actualKilometers?: number;
  extraKilometers?: number;
  actualCosts?: number;
  costsDescription?: string;
  remark?: string;
}

export interface RideWithExecutions {
  rideId: string;
  plannedDate: string;
  plannedStartTime: string;
  plannedEndTime: string;
  routeFromName: string;
  routeToName: string;
  tripNumber: string;
  clientName: string;
  companyName: string;
  truckLicensePlate: string;
  executionCompletionStatus: 'none' | 'partial' | 'complete' | 'approved';
  executions: RideExecution[];
}

export interface ExecutionComment {
  id: string;
  rideDriverExecutionId: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  comment: string;
  createdAt: string;
}

// API Response types
export interface RideExecutionApprovalResponse {
  success: boolean;
  data: RideWithExecutions[];
  errors?: string[];
  message?: string;
}

export interface ExecutionCommentsResponse {
  success: boolean;
  data: ExecutionComment[];
  errors?: string[];
  message?: string;
}
