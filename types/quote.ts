export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';

export type QuoteLineItemDto = {
    id: string;
    description: string;
    quantity: number;
    unitLabel?: string;
    unitPriceExclVat: number;
    totalExclVat: number;
    sortOrder: number;
};

export type QuoteDto = {
    id: string;
    quoteNumber: string;
    companyId: string;
    companyName: string;
    clientId?: string;
    clientName: string;
    clientEmail?: string;
    clientAddress?: string;
    clientPostcode?: string;
    clientCity?: string;
    clientCountry?: string;
    clientKvk?: string;
    clientBtw?: string;
    subject: string;
    notes?: string;
    status: QuoteStatus;
    vatPercentage: number;
    totalExclVat: number;
    totalVat: number;
    totalInclVat: number;
    validUntilDate: string;
    createdAt: string;
    updatedAt?: string;
    sentAt?: string;
    acceptedAt?: string;
    rejectedAt?: string;
    lineItems: QuoteLineItemDto[];
};

export type QuoteSummaryDto = {
    id: string;
    quoteNumber: string;
    companyName: string;
    clientName: string;
    subject: string;
    status: QuoteStatus;
    totalInclVat: number;
    validUntilDate: string;
    createdAt: string;
};

export type QuotesListResponse = {
    totalQuotes: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
    data: QuoteSummaryDto[];
};

export type CreateQuoteLineItem = {
    description: string;
    quantity: number;
    unitLabel?: string;
    unitPriceExclVat: number;
    sortOrder: number;
};

export type CreateQuoteRequest = {
    companyId: string;
    clientId?: string;
    clientName: string;
    clientEmail?: string;
    clientAddress?: string;
    clientPostcode?: string;
    clientCity?: string;
    clientCountry?: string;
    clientKvk?: string;
    clientBtw?: string;
    subject: string;
    notes?: string;
    vatPercentage: number;
    validUntilDate: string;
    lineItems: CreateQuoteLineItem[];
};
