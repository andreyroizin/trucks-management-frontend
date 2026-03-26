import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { EmployeeListResponse } from '@/types/employee';

const fetchEmployees = async (
    pageNumber: number,
    pageSize: number,
    role?: string,
    search?: string,
): Promise<EmployeeListResponse> => {
    const params: Record<string, any> = { pageNumber, pageSize };
    if (role) params.role = role;
    if (search) params.search = search;

    const response = await api.get<ApiResponse<EmployeeListResponse>>('/employees', { params });
    if (response.data.isSuccess) return response.data.data;
    throw new Error(response.data.errors?.[0] || 'Failed to fetch employees');
};

export const useEmployees = (
    pageNumber = 1,
    pageSize = 50,
    role?: string,
    search?: string,
) => {
    return useQuery<EmployeeListResponse, Error>({
        queryKey: ['employees', pageNumber, pageSize, role, search],
        queryFn: () => fetchEmployees(pageNumber, pageSize, role, search),
        placeholderData: keepPreviousData,
    });
};
