import { useQuery } from '@tanstack/react-query';
import {api} from "@/utils/api";
import {Role} from "@/types/api";

export const fetchRoles = async (): Promise<Role[]> => {
    const response = await api.get('/roles'); // Adjust to the actual API URL
    const data = response.data;
    if (data.isSuccess) {
        return data.data;
    }
    throw new Error(data.errors?.[0] || 'Failed to fetch roles');
};

export const useRoles = () => {
    return useQuery({
        queryKey: ['roles'],
        queryFn: fetchRoles,
    });
};
