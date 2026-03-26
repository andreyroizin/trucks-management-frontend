import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { Employee, CreateEmployeeInput } from '@/types/employee';

const createEmployee = async (data: CreateEmployeeInput): Promise<Employee> => {
    const response = await api.post<ApiResponse<Employee>>('/employees', data);
    if (response.data.isSuccess) return response.data.data;
    throw new Error(response.data.errors?.[0] || 'Failed to create employee');
};

export const useCreateEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation<Employee, Error, CreateEmployeeInput>({
        mutationFn: createEmployee,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
    });
};
