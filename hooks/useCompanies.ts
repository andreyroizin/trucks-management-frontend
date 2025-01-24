import { useQuery } from '@tanstack/react-query';
import { ApiResponse } from '@/types/api';
import {api} from "@/utils/api";

export type CompaniesResponse = {
    totalCompanies: number,
    totalPages: number,
    pageNumber: number,
    pageSize: number,
    data: Company[]
}

export type Company = {
    id: string;
    name: string;
};

// Fetcher function for companies
const fetchCompanies = async (): Promise<CompaniesResponse> => {
    const response = await api.get<ApiResponse<CompaniesResponse>>('/companies');
    if (response.data.isSuccess) {
        return response.data.data; // Return the list of companies
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch companies');
};

// Custom hook to fetch companies
export const useCompanies = () => {
    return useQuery({
        queryKey: ['companies'],
        queryFn: fetchCompanies
    });
};
