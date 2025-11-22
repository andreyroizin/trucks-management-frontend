import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ApiResponse } from '@/types/api';
import {api} from "@/utils/api";

export type CompaniesResponse = {
    totalCompanies: number,
    totalPages: number,
    pageNumber: number,
    pageSize: number,
    data: Company[]
}

export type Driver = {
    driverId: string;
    aspNetUserId: string | null;
    user: {
        firstName: string;
        lastName: string;
        phone?: string;
        email?: string;
    } | null;
}

export type Company = {
    id: string;
    name: string;
    address: string | null;
    postcode: string | null;
    city: string | null;
    country: string | null;
    phoneNumber: string | null;
    email: string | null;
    remark: string | null;
    kvk: string | null;
    btw: string | null;
    isApproved: boolean;
    drivers: Driver[];
};

// Fetcher function for companies
const fetchCompanies = async (page: number, pageSize: number, search?: string): Promise<CompaniesResponse> => {
    const params = {
        pageNumber: page,
        pageSize: pageSize,
        search: search || undefined,
    };
    
    const response = await api.get<ApiResponse<CompaniesResponse>>('/companies', { params });
    
    if (response.data.isSuccess) {
        return response.data.data; // Return the paginated companies response
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch companies');
};

// Custom hook to fetch companies
export const useCompanies = (page: number, pageSize: number, search?: string) => {
    return useQuery<CompaniesResponse, Error>({
        queryKey: ['companies', page, pageSize, search],
        queryFn: () => fetchCompanies(page, pageSize, search),
        placeholderData: keepPreviousData,
    });
};
