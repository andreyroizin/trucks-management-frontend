import {keepPreviousData, useQuery} from '@tanstack/react-query';
import {ApiResponse} from '@/types/api';
import {api} from '@/utils/api';
import {Company} from '@/hooks/useCompanies';

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
    kvk: string;
    btw: string;
    company: Company;
    lastWorkday: string;
    lastDriver: {
        driverId: string,
        aspNetUserId: string,
        user: string,
        firstName: string,
        lastName: string
    }
};

export type ClientsData = {
    totalClients: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
    data: Client[];
};

// *** Fetcher Function ***
const fetchClients = async (page: number, pageSize: number, search?: string): Promise<ClientsData> => {
    const response = await api.get<ApiResponse<ClientsData>>('/clients', {
        params: {
            pageNumber: page,
            pageSize: pageSize,
            search: search || undefined,
        },
    });
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch clients');
};

// *** Custom Hook ***
export const useClients = (page: number, pageSize: number, search?: string) => {
    return useQuery<ClientsData, Error>({
        queryKey: ['clients', page, pageSize, search],
        queryFn: () => fetchClients(page, pageSize, search),
        placeholderData: keepPreviousData,
    });
};
