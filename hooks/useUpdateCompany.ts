import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import {ApiResponse} from "@/types/api";

// --- TYPES ---
type EditCompany = {
    id: string;
    name: string;
    address?: string;
    postcode?: string;
    city?: string;
    country?: string;
    phoneNumber?: string;
    email?: string;
    remark?: string;
};

type EditCompanyResponse = {
    id: string;
    name: string;
    address?: string;
    postcode?: string;
    city?: string;
    country?: string;
    phoneNumber?: string;
    email?: string;
    remark?: string;
    isApproved?: boolean;
    drivers?: any[];
};

// --- FETCH FUNCTION ---
const editCompany = async (companyData: EditCompany): Promise<EditCompanyResponse> => {
    // Remove ID from payload since it's in the URL and companies DTO doesn't accept it
    const { id, ...payloadData } = companyData;
    
    const response = await api.put<ApiResponse<EditCompanyResponse>>(
        `/companies/${companyData.id}`,
        payloadData
    );
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to edit company');
};

// --- CUSTOM HOOK ---
export const useUpdateCompany = () => {
    const queryClient = useQueryClient();
    return useMutation<EditCompanyResponse, Error, EditCompany>({
        mutationFn: editCompany,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            queryClient.invalidateQueries({ queryKey: ['companyDetails'] });
        },
    });
};
