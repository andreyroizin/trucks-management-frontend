export type DriverStartingBalanceDto = {
    id: string;
    driverId: string;
    driverFirstName: string;
    driverLastName: string;
    year: number;
    vacationHours: number;
    tvtHours: number;
    advHours: number;
    notes?: string;
    setAt: string;
    setByUserName?: string;
};

export type SetStartingBalanceRequest = {
    year: number;
    vacationHours: number;
    tvtHours: number;
    advHours: number;
    notes?: string;
};
