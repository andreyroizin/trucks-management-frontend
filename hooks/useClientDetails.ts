import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import {ApiResponse} from "@/types/api";

type Company = {
    id: string;
    name: string;
};

type Client = {
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



// --- FETCH FUNCTION ---
const fetchClient = async (id: string): Promise<Client> => {
    const response = await api.get<ApiResponse<Client>>(`/clients/${id}`);
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch client details');
};

// --- CUSTOM HOOK ---
export const useClientDetails = (id: string) => {
    return useQuery<Client, Error>({
        queryKey: ['clientDetails', id],
        queryFn: () => fetchClient(id),
    });
};
