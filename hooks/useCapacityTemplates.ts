import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
export type CapacityTemplate = {
    id: string;
    companyId: string;
    clientId: string;
    client: {
        id: string;
        name: string;
        address?: string;
        city?: string;
        country?: string;
        email?: string;
        phoneNumber?: string;
    };
    startDate: string;
    endDate: string;
    mondayTrucks: number;
    tuesdayTrucks: number;
    wednesdayTrucks: number;
    thursdayTrucks: number;
    fridayTrucks: number;
    saturdayTrucks: number;
    sundayTrucks: number;
    notes?: string;
    isActive: boolean;
    createdAt: string;
};

export type CreateCapacityTemplateInput = {
    companyId: string;
    clientId: string;
    startDate: string;
    endDate: string;
    mondayTrucks: number;
    tuesdayTrucks: number;
    wednesdayTrucks: number;
    thursdayTrucks: number;
    fridayTrucks: number;
    saturdayTrucks: number;
    sundayTrucks: number;
    notes?: string;
};

export type UpdateCapacityTemplateInput = {
    startDate: string;
    endDate: string;
    mondayTrucks: number;
    tuesdayTrucks: number;
    wednesdayTrucks: number;
    thursdayTrucks: number;
    fridayTrucks: number;
    saturdayTrucks: number;
    sundayTrucks: number;
    notes?: string;
    isActive: boolean;
};

export type CapacityTemplatesResponse = {
    success: boolean;
    data: CapacityTemplate[];
    statusCode: number;
};

// --- API FUNCTIONS ---
const fetchCapacityTemplates = async (companyId?: string): Promise<CapacityTemplate[]> => {
    const params = new URLSearchParams();
    if (companyId) {
        params.append('companyId', companyId);
    }
    
    const response = await api.get<CapacityTemplatesResponse>(`/capacity-templates?${params.toString()}`);
    return response.data.data;
};

const createCapacityTemplate = async (data: CreateCapacityTemplateInput): Promise<CapacityTemplate> => {
    console.log('API: Creating capacity template with payload:', JSON.stringify(data, null, 2));
    console.log('API: Request URL:', '/capacity-templates');
    
    try {
        const response = await api.post<ApiResponse<CapacityTemplate>>('/capacity-templates', data);
        console.log('API: Create response:', response.data);
        return response.data.data;
    } catch (error: any) {
        console.error('API: Create failed with error:', error);
        console.error('API: Request config:', error.config);
        console.error('API: Response status:', error.response?.status);
        console.error('API: Response data:', error.response?.data);
        throw error;
    }
};

const updateCapacityTemplate = async (id: string, data: UpdateCapacityTemplateInput): Promise<CapacityTemplate> => {
    const response = await api.put<ApiResponse<CapacityTemplate>>(`/capacity-templates/${id}`, data);
    return response.data.data;
};

const deleteCapacityTemplate = async (id: string): Promise<void> => {
    await api.delete(`/capacity-templates/${id}`);
};

// --- HOOKS ---
export const useCapacityTemplates = (companyId?: string) => {
    return useQuery({
        queryKey: ['capacityTemplates', companyId],
        queryFn: () => fetchCapacityTemplates(companyId),
        enabled: !!companyId || companyId === undefined, // Allow fetching without companyId for global admins
    });
};

export const useCreateCapacityTemplate = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: createCapacityTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['capacityTemplates'] });
        },
    });
};

export const useUpdateCapacityTemplate = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateCapacityTemplateInput }) =>
            updateCapacityTemplate(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['capacityTemplates'] });
        },
    });
};

export const useDeleteCapacityTemplate = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: deleteCapacityTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['capacityTemplates'] });
        },
    });
};
