import { ApiResponse } from './api';

/**
 * Contract version status
 */
export type ContractVersionStatus = 'Generated' | 'Superseded';

/**
 * Contract version information (list item)
 */
export type ContractVersion = {
    id: string;
    versionNumber: number;
    status: ContractVersionStatus;
    generatedAt: string;
    generatedByUserName: string;
    fileName: string;
    fileSize: number;
    isLatestVersion: boolean;
};

/**
 * Contract snapshot containing all contract data at generation time
 */
export type ContractSnapshot = {
    scale?: string;
    step?: number;
    dateOfEmployment?: string;
    lastWorkingDay?: string;
    function?: string;
    bsn?: string;
    workweekDuration?: number;
    dateOfBirth?: string;
    hourlyWage100Percent?: number;
    // Add other contract fields as needed based on backend response
    [key: string]: any;
};

/**
 * Full contract version details including snapshot
 */
export type ContractVersionDetail = ContractVersion & {
    driverId: string;
    driverName: string;
    filePath: string;
    notes: string | null;
    contractSnapshot: ContractSnapshot;
};

/**
 * Response type for listing contract versions
 */
export type ContractVersionListResponse = ContractVersion[];

/**
 * Response type for getting a single contract version
 */
export type ContractVersionDetailResponse = ContractVersionDetail;

/**
 * Response type for latest contract version
 */
export type LatestContractVersionResponse = ContractVersion;

/**
 * Response type for contract regeneration
 */
export type RegenerateContractResponse = {
    contractVersionId: string;
    versionNumber: number;
    generatedAt: string;
    pdfDownloadUrl: string;
    message: string;
};

/**
 * Parameters for downloading a contract PDF
 */
export type DownloadContractPdfParams = {
    driverId: string;
    versionId: string;
    fileName?: string; // Optional custom filename for download
};

