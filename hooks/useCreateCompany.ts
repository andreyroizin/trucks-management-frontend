// hooks/useCreateCompany.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

export type Company = {
    id: string;
    name: string;
    address?: string;
    postcode?: string;
    city?: string;
    country?: string;
    phoneNumber?: string;
    email?: string;
    remark?: string;
    kvk?: string;
    btw?: string;
    isApproved?: boolean;
    drivers?: any[];
};

type CreateCompanyInput = {
    name: string;
    address?: string;
    postcode?: string;
    city?: string;
    country?: string;
    phoneNumber?: string;
    email?: string;
    remark?: string;
    kvk?: string;
    btw?: string;
};

const createCompany = async (newCompany: CreateCompanyInput): Promise<Company> => {
    console.log('📤 [useCreateCompany] Sending company data:', newCompany);
    console.log('📋 [useCreateCompany] KVK being sent:', newCompany.kvk);
    console.log('📋 [useCreateCompany] BTW being sent:', newCompany.btw);
    const response = await api.post('/companies', newCompany);
    console.log('📥 [useCreateCompany] Response:', response.data);
    if (response.data.isSuccess) {
        console.log('✅ [useCreateCompany] Created company:', response.data.data);
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to create company');
};

export const useCreateCompany = () => {
    const queryClient = useQueryClient();
    return useMutation<Company, Error, CreateCompanyInput>({
        mutationFn: createCompany,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['companies']});
        },
    });
};
