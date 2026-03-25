import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// ── Types ───────────────────────────────────
export type AdminModuleDto = {
    module: 'Base' | 'Planning' | 'Finance' | 'HR';
    isEnabled: boolean;
    enabledAt: string | null;
    disabledAt: string | null;
};

export type MyModulesResponse = {
    enabledModules: string[];
};

// ── Fetchers ────────────────────────────────
const fetchMyModules = async (): Promise<string[]> => {
    const response = await api.get<ApiResponse<MyModulesResponse>>('/my-modules');
    if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to fetch modules');
    }
    return response.data.data.enabledModules;
};

const fetchAdminModules = async (adminUserId: string): Promise<AdminModuleDto[]> => {
    const response = await api.get<ApiResponse<AdminModuleDto[]>>(`/admins/${adminUserId}/modules`);
    if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to fetch admin modules');
    }
    return response.data.data;
};

const toggleAdminModule = async ({ adminUserId, module, isEnabled }: {
    adminUserId: string;
    module: string;
    isEnabled: boolean;
}): Promise<AdminModuleDto[]> => {
    const response = await api.put<ApiResponse<AdminModuleDto[]>>(
        `/admins/${adminUserId}/modules/${module}`,
        { isEnabled },
    );
    if (!response.data.isSuccess) {
        throw new Error(response.data.errors?.[0] || 'Failed to update module');
    }
    return response.data.data;
};

// ── Hooks ───────────────────────────────────

/** Fetch current user's enabled modules (call after login). */
export const useMyModules = (enabled = true) => {
    return useQuery({
        queryKey: ['myModules'],
        queryFn: fetchMyModules,
        enabled,
        staleTime: 5 * 60 * 1000,
    });
};

/** Fetch all modules for a specific customerAdmin (globalAdmin only). */
export const useAdminModules = (adminUserId: string | undefined) => {
    return useQuery({
        queryKey: ['adminModules', adminUserId],
        queryFn: () => fetchAdminModules(adminUserId!),
        enabled: !!adminUserId,
    });
};

/** Toggle a module on/off for a customerAdmin (globalAdmin only). */
export const useToggleAdminModule = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: toggleAdminModule,
        onSuccess: (data, variables) => {
            queryClient.setQueryData(['adminModules', variables.adminUserId], data);
        },
    });
};
