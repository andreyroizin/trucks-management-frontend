import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { ApiResponse } from '@/types/api';

// --- TYPES ---
type User = { id: string; email: string; firstName: string; lastName: string };
type AssociatedEntity = { id: string; name: string };

type ContactPerson = {
    contactPersonId: string;
    user: User;
    associatedCompanies: AssociatedEntity[];
    associatedClients: AssociatedEntity[];
};

type ContactPersonsData = {
    totalCount: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
    data: ContactPerson[];
};

// --- FETCH FUNCTION ---
const fetchContactPersons = async (
    page: number,
    pageSize: number,
    companyId?: string,
    clientId?: string
): Promise<ContactPersonsData> => {
    const response = await api.get<ApiResponse<ContactPersonsData>>('/contactpersons', {
        params: {
            pageNumber: page,
            pageSize,
            companyId,
            clientId,
        },
    });
    if (response.data.isSuccess) {
        return response.data.data;
    }
    throw new Error(response.data.errors?.[0] || 'Failed to fetch contact persons');
};

// --- CUSTOM HOOK ---
export const useContactPersons = (
    page: number,
    pageSize: number,
    companyId?: string,
    clientId?: string
) => {
    return useQuery<ContactPersonsData, Error>({
        queryKey: ['contactPersons', page, pageSize, companyId, clientId],
        queryFn: () => fetchContactPersons(page, pageSize, companyId, clientId),
        placeholderData: {
            totalCount: 0,
            totalPages: 1,
            pageNumber: page,
            pageSize,
            data: [],
        },
    });
};
