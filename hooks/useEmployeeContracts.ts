import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api'; // or your axios instance
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type EmployeeContract = {
    id: string;
    driver: { id: string; fullName: string; aspNetUserId: string };
    company: { id: string; name: string };
    employeeFirstName: string,
    employeeLastName: string,
    status: 0 | 1; // 0 = pending, 1 = signed
};

export type PaginatedContractsResponse = {
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    data: EmployeeContract[];
};

// --- FETCHER ---
async function fetchEmployeeContracts(
    pageNumber: number,
    pageSize: number,
    driverId: string,
    companyId: string
): Promise<PaginatedContractsResponse> {
    // Example query: /employee-contracts?page=1&pageSize=10&driverId=...&companyId=...
    const params = new URLSearchParams({
        pageNumber: String(pageNumber),
        pageSize: String(pageSize),
    });
    if (driverId) params.append('driverId', driverId);
    if (companyId) params.append('companyId', companyId);

    const res = await api.get<ApiResponse<PaginatedContractsResponse>>(`/employee-contracts?${params.toString()}`);
    if (res.data.isSuccess) {
        return res.data.data;
    }
    throw new Error(res.data.errors?.[0] || 'Failed to fetch employee contracts');
}

// --- HOOK ---
export function useEmployeeContracts(pageNumber: number, pageSize: number, driverId: string, companyId: string) {
    return useQuery({
        queryKey: ['employeeContracts', pageNumber, pageSize, driverId, companyId],
        queryFn: () => fetchEmployeeContracts(pageNumber, pageSize, driverId, companyId),
        placeholderData: () => undefined, // or 'keepPreviousData'
    });
}
