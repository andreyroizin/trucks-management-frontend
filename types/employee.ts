export type EmployeeRole =
    | 'Planner'
    | 'Admin'
    | 'Manager'
    | 'Accountant'
    | 'HR'
    | 'Other';

export const EMPLOYEE_ROLES: EmployeeRole[] = [
    'Planner',
    'Admin',
    'Manager',
    'Accountant',
    'HR',
    'Other',
];

export interface Employee {
    id: string;
    aspNetUserId: string;
    firstName: string;
    lastName: string;
    email: string;
    companyId?: string;
    companyName?: string;
    role: EmployeeRole;
    externalClientNumber?: string;
    language?: string;
    employeeContractId?: string;
    contractType?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface EmployeeListResponse {
    data: Employee[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

export interface CreateEmployeeInput {
    email: string;
    firstName: string;
    lastName: string;
    role: EmployeeRole;
    companyId?: string;
    externalClientNumber?: string;
    language?: string;
    password?: string;
}

export interface UpdateEmployeeInput {
    firstName?: string;
    lastName?: string;
    role?: EmployeeRole;
    companyId?: string;
    externalClientNumber?: string;
    language?: string;
}
