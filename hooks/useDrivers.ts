import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import {ApiResponse} from "@/types/api";

export type User = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
};

export type CompanySimple = {
    id: string;
    name: string;
};

export type Driver = {
    id: string;
    companyId: string;
    companyName: string;
    user: User;
    usedByCompanies: CompanySimple[];
};

export type DriversData = {
    totalDrivers: number;
    pageNumber: number;
    pageSize: number;
    drivers: Driver[];
};

const fetchDrivers = async (): Promise<Driver[]> => {
    const response = await api.get<ApiResponse<DriversData>>('/drivers');
    if (response.data.isSuccess) {
        return response.data.data.drivers;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch drivers');
};

export const useDrivers = () => {
    return useQuery<Driver[], Error>({
        queryKey: ['drivers'],
        queryFn: fetchDrivers,
    });
};
