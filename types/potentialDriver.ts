export type PotentialDriverStatus =
    | 'New'
    | 'Contacted'
    | 'Interviewing'
    | 'OfferMade'
    | 'Accepted'
    | 'Rejected'
    | 'Converted';

export interface PotentialDriver {
    id: string;
    companyId: string;
    companyName?: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    status: PotentialDriverStatus;
    notes?: string;
    source?: string;
    experienceYears?: number;
    hasCELicense?: boolean;
    firstContactDate?: string;
    lastContactDate?: string;
    expectedStartDate?: string;
    convertedToDriverId?: string;
    convertedAt?: string;
    createdByUserId?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface PotentialDriverListResponse {
    data: PotentialDriver[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

export interface CreatePotentialDriverInput {
    companyId: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    status?: PotentialDriverStatus;
    notes?: string;
    source?: string;
    experienceYears?: number;
    hasCELicense?: boolean;
    firstContactDate?: string;
    lastContactDate?: string;
    expectedStartDate?: string;
}

export interface UpdatePotentialDriverInput {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    companyId?: string;
    status?: PotentialDriverStatus;
    notes?: string;
    source?: string;
    experienceYears?: number;
    hasCELicense?: boolean;
    firstContactDate?: string;
    lastContactDate?: string;
    expectedStartDate?: string;
}

export interface PotentialDriverPrefill {
    prospectId: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    companyId: string;
    companyName?: string;
}
