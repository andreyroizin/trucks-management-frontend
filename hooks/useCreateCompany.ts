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
};

const createCompany = async (newCompany: CreateCompanyInput): Promise<Company> => {
    const response = await api.post('/companies', newCompany);
    if (response.data.isSuccess) {
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
