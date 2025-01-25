import { useQuery } from '@tanstack/react-query';
import {ApiResponse} from '@/types/api';
import {api} from "@/utils/api";
import {Company} from "@/hooks/useCompanies";

export type ClientsResponse = {
    totalCompanies: number,
    totalPages: number,
    pageNumber: number,
    pageSize: number,
    data: Client[]
}

export type Client = {
    id: string
    name: string,
    tav: string,
    address: string,
    postcode: string,
    city: string,
    country: string,
    phoneNumber: string,
    email: string,
    remark: string,
    company: Company[]
}

// Fetcher function for clients
const fetchClients = async (): Promise<ClientsResponse> => {
    const response = await api.get<ApiResponse<ClientsResponse>>('/clients');
    if (response.data.isSuccess) {
        return response.data.data; // Return the list of companies
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch companies');
};

// Custom hook to fetch clients
export const useClients = () => {
    return useQuery({
        queryKey: ['clients'],
        queryFn: fetchClients
    });
};
