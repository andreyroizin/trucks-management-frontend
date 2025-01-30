import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import {ApiResponse} from "@/types/api";

export type Company = {
    id: string;
    name: string;
};

const fetchCompany = async (id: string): Promise<Company> => {
    const response = await api.get<ApiResponse<Company>>(`/companies/${id}`);
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch company details');
};

export const useCompanyDetails = (id: string) => {
    return useQuery<Company, Error>({
        queryKey: ['companyDetails', id],
        queryFn: () => fetchCompany(id),
    });
};
