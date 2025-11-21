import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type CreateCustomerAdminInput = {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    address?: string;
    phoneNumber?: string;
    postcode?: string;
    city?: string;
    country?: string;
    remark?: string;
    roles: string[]; // ["customerAdmin"]
    companyIds?: string[];
    clientIds?: string[];
};

export type CreateCustomerAdminResponse = {
    userId: string;
    email: string;
    roles: string[];
    contactPersonId: string;
};

// --- API CALL ---
const createCustomerAdmin = async (admin: CreateCustomerAdminInput): Promise<CreateCustomerAdminResponse> => {
    try {
        const response = await api.post<ApiResponse<CreateCustomerAdminResponse>>('/register', admin);
        if (response.data.isSuccess) {
            return response.data.data;
        }
        // If backend returns errors in the response (even if status is 200)
        const error: any = new Error(response.data.errors?.[0] || 'Failed to create customer admin');
        error.response = { data: response.data };
        throw error;
    } catch (err: any) {
        // If axios throws an error (4xx, 5xx status codes)
        if (err.response?.data?.errors) {
            const error: any = new Error(err.response.data.errors[0] || 'Failed to create customer admin');
            error.response = err.response;
            throw error;
        }
        throw err;
    }
};

// --- MUTATION HOOK ---
export const useCreateCustomerAdmin = () => {
    const queryClient = useQueryClient();
    return useMutation<CreateCustomerAdminResponse, Error, CreateCustomerAdminInput>({
        mutationFn: createCustomerAdmin,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customerAdmins'] });
        },
    });
};

