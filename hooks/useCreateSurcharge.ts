import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type Company = {
    id: string;
    name: string;
};

export type SurchargeInput = {
    value: number;
    company: Company; // We store the selected company object here
    clientId?: string;        // Will come from URL params
};

export type SurchargeResponse = {
    id: string;
    value: number;
    client: { id: string; name: string };
    company: { id: string; name: string };
};

// --- API CALL ---
const createSurcharge = async (surcharge: SurchargeInput): Promise<ApiResponse<SurchargeResponse>> => {
    const response = await api.post<ApiResponse<SurchargeResponse>>('/surcharges', {
        value: surcharge.value,
        companyId: surcharge.company?.id, // Only send the ID
        clientId: surcharge.clientId,
    });

    if (response.data.isSuccess) return response.data;
    throw new Error(response.data.errors?.[0] || 'Failed to create surcharge');
};

// --- MUTATION HOOK ---
export const useCreateSurcharge = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (surcharge: SurchargeInput) => createSurcharge(surcharge),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['surcharges'] });
        },
    });
};
