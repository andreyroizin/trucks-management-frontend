import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

export type User = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    companyId: string;
    companyName: string;
    roles: string[];
};

export type UserResponse = {
    totalUsers: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
    data: User[];
};

// Fetcher function for users
const fetchUsers = async (pageNumber: number, pageSize: number): Promise<UserResponse> => {
    const response = await api.get<ApiResponse<UserResponse>>(`/users?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    if (response.data.isSuccess) {
        return response.data.data; // Return user data
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch users');
};

// Custom hook to fetch users
export const useUsers = (pageNumber: number, pageSize: number) => {
    return useQuery({
        queryKey: ['users', pageNumber, pageSize],
        queryFn: () => fetchUsers(pageNumber, pageSize)
    });
};
