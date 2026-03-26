import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';
import { Employee, UpdateEmployeeInput } from '@/types/employee';

interface UpdateEmployeeParams {
    id: string;
    data: UpdateEmployeeInput;
}

const updateEmployee = async ({ id, data }: UpdateEmployeeParams): Promise<Employee> => {
    const response = await api.put<ApiResponse<Employee>>(`/employees/${id}`, data);
    if (response.data.isSuccess) return response.data.data;
    throw new Error(response.data.errors?.[0] || 'Failed to update employee');
};

export const useUpdateEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation<Employee, Error, UpdateEmployeeParams>({
        mutationFn: updateEmployee,
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            queryClient.invalidateQueries({ queryKey: ['employee', id] });
        },
    });
};
