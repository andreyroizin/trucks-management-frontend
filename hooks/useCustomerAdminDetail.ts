import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type CustomerAdminDetail = {
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
        clientsCompanies: Array<{
            companyId: string | null;
            companyName: string | null;
            clientId: string | null;
            clientName: string | null;
        }>;
    } | null;
};

// --- API CALL ---
const fetchCustomerAdminDetail = async (id: string): Promise<CustomerAdminDetail> => {
    const response = await api.get<ApiResponse<CustomerAdminDetail>>(`/users/${id}`);

    if (response.data.isSuccess) return response.data.data;
    throw new Error(response.data.errors?.[0] || 'Failed to fetch customer admin details');
};

// --- HOOK ---
export const useCustomerAdminDetail = (id: string) => {
    return useQuery({
        queryKey: ['customerAdminDetail', id],
        queryFn: () => fetchCustomerAdminDetail(id),
        enabled: !!id,
    });
};

