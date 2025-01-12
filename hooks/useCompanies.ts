import { useQuery } from '@tanstack/react-query';
import { ApiResponse, Company } from '@/types/api';
import {api} from "@/utils/api";

// Fetcher function for companies
const fetchCompanies = async (): Promise<Company[]> => {
    const response = await api.get<ApiResponse<Company[]>>('/companies');
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
