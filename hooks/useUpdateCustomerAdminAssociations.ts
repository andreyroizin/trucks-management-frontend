import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type UpdateAssociationsInput = {
    userId: string;
    companyIds?: string[];
    clientIds?: string[];
};

export type UpdateAssociationsResponse = {
    contactPersonId: string;
    clientsCompanies: Array<{
        companyId: string | null;
        companyName: string | null;
        clientId: string | null;
        clientName: string | null;
    }>;
};

// --- API CALL ---
const updateAssociations = async ({ userId, ...data }: UpdateAssociationsInput): Promise<UpdateAssociationsResponse> => {
    const response = await api.put<ApiResponse<UpdateAssociationsResponse>>(`/users/${userId}/contact-person`, data);
    if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to update associations.');
    }
    return response.data.data;
};

// --- HOOK ---
export const useUpdateCustomerAdminAssociations = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateAssociations,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customerAdmins'] });
            queryClient.invalidateQueries({ queryKey: ['customerAdminDetail'] });
        },
    });
};

