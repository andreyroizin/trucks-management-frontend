export enum DisputeStatus {
    PendingDriver = 0,
    PendingAdmin = 1,
    AcceptedByDriver = 2,
    AcceptedByAdmin = 3,
    Closed = 4,
}

export type StatusChipVariant = 'default' | 'info' | 'success' | 'warning' | 'danger';

export const getDisputeStatusInfo = (status: DisputeStatus): { label: string; variant: StatusChipVariant } => {
    switch (status) {
        case DisputeStatus.PendingDriver:
            return { label: 'Dispute', variant: 'warning' };
        case DisputeStatus.PendingAdmin:
            return { label: 'Dispute', variant: 'warning' };
        case DisputeStatus.AcceptedByDriver:
            return { label: 'Approved', variant: 'success' };
        case DisputeStatus.AcceptedByAdmin:
            return { label: 'Approved', variant: 'success' };
        case DisputeStatus.Closed:
            return { label: 'Closed', variant: 'default' };
        default:
            return { label: 'Unknown', variant: 'default' };
    }
};