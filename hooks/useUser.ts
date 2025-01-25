import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {api} from '@/utils/api';
import {ApiResponse} from '@/types/api';

export type UserDetails = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    companyId: string;
    roles: string[];
    postcode?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    country?: string;
    remark?: string;
    driverInfo?: DriverInfo;
    contactPersonInfo?: ContactPersonInfo;
};

type ContactPersonInfo = {
    contactPersonId: string,
    clientsCompanies: ClientCompany []
}
type ClientCompany = {
    companyId?: string,
    companyName?: string,
    clientId?: string,
    clientName?: string
}

type DriverInfo = {
    driverId: string,
    companyId: string,
    companyName: string
}

export type UpdateUserDriverInput = {
    id: string;
    companyId: string;
};

export type UpdateUserDriverDataResponse = {
    driverId: string,
    companyId: string,
    companyName: string
};

export type UpdateUserContactPersonInput = {
    id: string;
    clientIds?: string[];
    companyIds?: string[];
};

export type UpdateUserContactPersonResponse = {
    contactPersonId: string,
    clientsCompanies: ClientCompany []
};

export const fetchUser = async (id: string): Promise<UserDetails> => {
    const response = await api.get<ApiResponse<UserDetails>>(`/users/${id}`);
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch user details');
};

export const updateUserBasic = async ({
                                          id,
                                          updatedFields,
                                      }: {
    id: string;
    updatedFields: Partial<UserDetails>;
}): Promise<void> => {
    const response = await api.put<ApiResponse<null>>(`/users/${id}/basic`, updatedFields);
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
export const useUpdateUserBasic = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { id: string; updatedFields: Partial<UserDetails> }) => updateUserBasic(data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['userDetails']});
        },
    });
};

// Function to perform the API call to update driver-specific data
const updateUserDriver = async ({
                                    id,
                                    companyId,
                                }: UpdateUserDriverInput): Promise<ApiResponse<UpdateUserDriverDataResponse>> => {
    const response = await api.put<ApiResponse<ApiResponse<UpdateUserDriverDataResponse>>>(`/users/${id}/driver`, {companyId});
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to update driver data');
};

// Hook to use the mutation
export const useUpdateUserDriver = () => {
    const queryClient = useQueryClient();
    return useMutation<ApiResponse<UpdateUserDriverDataResponse>, Error, UpdateUserDriverInput>({
        mutationFn: updateUserDriver,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['userDetails']});
        },
    });
};

const updateUserContactPerson = async ({
                                           id,
                                           clientIds,
                                           companyIds,
                                       }: UpdateUserContactPersonInput): Promise<UpdateUserContactPersonResponse> => {
    const response = await api.put<ApiResponse<UpdateUserContactPersonResponse>>(
        `/users/${id}/contact-person`,
        {clientIds, companyIds },
    );

    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to update contact person data');
};

// Hook to use the mutation
export const useUpdateUserContactPerson = () => {
    const queryClient = useQueryClient();
    return useMutation<UpdateUserContactPersonResponse, Error, UpdateUserContactPersonInput>({
        mutationFn: updateUserContactPerson,
        onSuccess: () => {
            // Invalidate and refetch user details to ensure data consistency
            queryClient.invalidateQueries({ queryKey: ['userDetails'] });
        },
    });
};
