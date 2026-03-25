export type AnnualStatementDto = {
    id: string;
    driverId: string;
    companyId: string;
    year: number;
    isPartialYear: boolean;
    calculationStartDate: string;
    calculationEndDate: string;
    totalGrossWage: number;
    totalAllowances: number;
    totalHoursWorked: number;
    totalHours100: number;
    totalHours130: number;
    totalHours150: number;
    totalHours200: number;
    vacationDaysEntitled: number;
    vacationDaysTaken: number;
    vacationDaysRemaining: number;
    vacationAllowancePaid: number;
    totalNightAllowanceHours: number;
    totalNightAllowanceAmount: number;
    status: string;
    generatedAt: string;
    sentToEmployeeAt: string | null;
    employeeTerminationDate: string | null;
    daysSinceTermination: number | null;
    isOverdueGeneration: boolean;
    driverFirstName: string;
    driverLastName: string;
    driverBsn: string | null;
};

export type AnnualStatementsResponse = {
    totalCount: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
    data: AnnualStatementDto[];
};

export type PendingDepartureDto = {
    driverId: string;
    firstName: string;
    lastName: string;
    companyName: string;
    companyId?: string;
    terminationDate: string;
    daysSinceTermination: number;
    isOverdue: boolean;
};

export type GenerateRequest = {
    driverId: string;
    year: number;
};

export type BatchGenerationResultDto = {
    totalGenerated: number;
    statementIds: string[];
    errors: string[];
};
