import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- DELETE CUSTOMER ADMIN FUNCTION ---
// Note: This requires fetching the user first to get their contactPersonId
const deleteCustomerAdmin = async (userId: string): Promise<ApiResponse<string>> => {
    // Step 1: Fetch user details to get contactPersonId
    const userResponse = await api.get<ApiResponse<{
        contactPersonInfo: {
            contactPersonId: string;
        } | null;
    }>>(`/users/${userId}`);

    if (!userResponse.data.isSuccess || !userResponse.data.data.contactPersonInfo) {
        throw new Error('Customer admin not found or has no contact person record');
    }

    const contactPersonId = userResponse.data.data.contactPersonInfo.contactPersonId;

    // Step 2: Delete using contactPersonId
    const response = await api.delete<ApiResponse<string>>(`/contactpersons/${contactPersonId}`);

    if (response.data.isSuccess) return response.data;
    throw new Error(response.data.errors?.[0] || 'Failed to delete customer admin');
};

// --- HOOK TO DELETE A CUSTOMER ADMIN ---
export const useDeleteCustomerAdmin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (userId: string) => deleteCustomerAdmin(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customerAdmins'] });
            queryClient.invalidateQueries({ queryKey: ['customerAdminDetail'] });
        },
    });
};

