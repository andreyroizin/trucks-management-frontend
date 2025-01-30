import {keepPreviousData, useQuery} from '@tanstack/react-query';
import { ApiResponse } from '@/types/api';
import { api } from '@/utils/api';
import { Company } from '@/hooks/useCompanies';

// *** Type Definitions ***
export type Client = {
    id: string;
    name: string;
    tav: string;
    address: string;
    postcode: string;
    city: string;
    country: string;
    phoneNumber: string;
    email: string;
    remark: string;
    company: Company;
};

export type ClientsData = {
    totalClients: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
    data: Client[];
};

// *** Fetcher Function ***
const fetchClients = async (page: number, pageSize: number): Promise<ClientsData> => {
    const response = await api.get<ApiResponse<ClientsData>>('/clients', {
        params: {
            pageNumber: page,
            pageSize: pageSize,
        },
    });
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch clients');
};

// *** Custom Hook ***
export const useClients = (page: number, pageSize: number) => {
    return useQuery<ClientsData, Error>({
        queryKey: ['clients', page, pageSize],
        queryFn: () => fetchClients(page, pageSize),
        placeholderData: keepPreviousData,
    });
};
