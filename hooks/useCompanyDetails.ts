import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import {ApiResponse} from "@/types/api";

export type Company = {
    id: string;
    name: string;
    address?: string;
    postcode?: string;
    city?: string;
    country?: string;
    phoneNumber?: string;
    email?: string;
    remark?: string;
    kvk?: string;
    btw?: string;
    isApproved: boolean;
    drivers?: {
        driverId: string;
        aspNetUserId: string | null;
        user: {
            firstName: string;
            lastName: string;
            phone?: string;
            email?: string;
        } | null;
    }[];
};

const fetchCompany = async (id: string): Promise<Company> => {
    const response = await api.get<ApiResponse<Company>>(`/companies/${id}`);
    console.log('🔍 [useCompanyDetails] Raw response:', response.data);
    if (response.data.isSuccess) {
        console.log('✅ [useCompanyDetails] Company data:', response.data.data);
        console.log('📋 [useCompanyDetails] KVK:', response.data.data.kvk);
        console.log('📋 [useCompanyDetails] BTW:', response.data.data.btw);
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
