// Types for driver's assigned rides
export interface MyAssignedRide {
  rideId: string;
  plannedDate: string;
  plannedStartTime?: string;
  plannedEndTime?: string;
  routeFromName?: string;
  routeToName?: string;
  tripNumber?: string;
  clientName?: string;
  truckLicensePlate?: string;
  myRole: "Primary" | "Second";
  myPlannedHours: number;
  executionCompletionStatus: "none" | "partial" | "complete" | "approved";
  myExecutionStatus: {
    hasSubmitted: boolean;
    status: "NotSubmitted" | "Pending" | "Approved" | "Rejected" | "Dispute";
    decimalHours?: number;
    submittedAt?: string;
  };
  otherDrivers: Array<{
    driverId: string;
    firstName?: string;
    lastName?: string;
    isPrimary: boolean;
    hasSubmittedExecution: boolean;
  }>;
}

// Types for file attachments
export interface ExecutionFile {
  id: string;
  rideDriverExecutionId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface UploadFileRequest {
  fileName: string;
  contentType: string;
  fileDataBase64: string;
}

