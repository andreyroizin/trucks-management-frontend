import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type CustomerAdmin = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    phoneNumber: string;
    postcode: string;
    city: string;
    country: string;
    remark: string;
    roles: string[];
    contactPersonInfo: {
        contactPersonId: string;
        associatedCompanies: Array<{
            id: string;
            name: string;
        }>;
        associatedClients: Array<{
            id: string;
            name: string;
        }>;
    } | null;
};

export type CustomerAdminsResponse = {
    totalCount: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
    data: CustomerAdmin[];
};

// --- API CALL ---
const fetchCustomerAdmins = async (page: number, pageSize: number, search?: string): Promise<CustomerAdminsResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.set('pageNumber', page.toString());
    queryParams.set('pageSize', pageSize.toString());
    if (search) {
        queryParams.set('search', search);
    }

    const response = await api.get<ApiResponse<CustomerAdminsResponse>>(`/customeradmins?${queryParams.toString()}`);
    if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to fetch customer admins');
    }
    return response.data.data;
};

// --- HOOK ---
export const useCustomerAdmins = (page: number, pageSize: number, search?: string) => {
    return useQuery({
        queryKey: ['customerAdmins', page, pageSize, search],
        queryFn: () => fetchCustomerAdmins(page, pageSize, search),
        placeholderData: keepPreviousData,
    });
};

