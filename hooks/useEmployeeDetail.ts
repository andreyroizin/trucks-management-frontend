import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { Employee } from '@/types/employee';

const fetchEmployeeDetail = async (id: string): Promise<Employee> => {
    const response = await api.get<ApiResponse<Employee>>(`/employees/${id}`);
    if (response.data.isSuccess) return response.data.data;
    throw new Error(response.data.errors?.[0] || 'Failed to fetch employee');
};

export const useEmployeeDetail = (id: string) => {
    return useQuery<Employee, Error>({
        queryKey: ['employee', id],
        queryFn: () => fetchEmployeeDetail(id),
        enabled: !!id,
    });
};
