// hooks/useCreateCompany.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';


export type Company = {
    id: string;
    name: string;
};

type CreateCompanyInput = {
    name: string;
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
