import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type UpdateCustomerAdminInput = {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    phoneNumber?: string;
    postcode?: string;
    city?: string;
    country?: string;
    remark?: string;
    roles?: string[];
};

// --- API CALL ---
const updateCustomerAdmin = async ({ id, ...adminData }: UpdateCustomerAdminInput) => {
    const response = await api.put<ApiResponse<null>>(`/users/${id}/basic`, adminData);
    if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to update customer admin.');
    }
};

// --- HOOK ---
export const useUpdateCustomerAdmin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateCustomerAdmin,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customerAdmins'] });
            queryClient.invalidateQueries({ queryKey: ['customerAdminDetail'] });
        },
    });
};

