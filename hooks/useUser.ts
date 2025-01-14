import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

export type UserDetailRole = {
    roleName: string;
    roleId: string;
};

export type UserDetails = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    companyId: string;
    roles: string[] | UserDetailRole[];
    postcode?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    country?: string;
    remark?: string;
};

export const fetchUser = async (id: string): Promise<UserDetails> => {
    const response = await api.get<ApiResponse<UserDetails>>(`/users/${id}`);
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch user details');
};

export const updateUser = async ({
                                     id,
                                     updatedFields,
                                 }: {
    id: string;
    updatedFields: Partial<UserDetails>;
}): Promise<void> => {
    const response = await api.put<ApiResponse<null>>(`/users/${id}`, updatedFields);
    if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to update user');
    }
};

// Fetch user details hook
export const useUserDetails = (id: string) => {
    return useQuery({
        queryKey: ['userDetails', id],
        queryFn: () => fetchUser(id),
    });
};

// Update user mutation hook
export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { id: string; updatedFields: Partial<UserDetails> }) => updateUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userDetails'] });
        },
    });
};
