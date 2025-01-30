import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import {ApiResponse} from "@/types/api";
import {Company} from "@/hooks/useCompanies";

type UpdateCompanyInput = {
    id: string;
    name: string;
};

const updateCompany = async ({ id, name }: UpdateCompanyInput): Promise<Company> => {
    const response = await api.put<ApiResponse<Company>>(`/companies/${id}`, { name });
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to update company');
};

export const useUpdateCompany = () => {
    const queryClient = useQueryClient();
    return useMutation<Company, Error, UpdateCompanyInput>({
        mutationFn: updateCompany,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['companyDetails']});
            queryClient.invalidateQueries({queryKey: ['companies']});
        },
    });
};
