import React from 'react';
import StatusChip from '@/components/StatusChip';
import { PartRideStatus } from '@/utils/partRideStatus';

export const PartRideStatusChip = (status: PartRideStatus) => {
    const map: Record<PartRideStatus, { label: string; variant: 'info' | 'warning' | 'success' | 'danger' }> = {
        [PartRideStatus.PendingAdmin]: { label: 'Pending Admin', variant: 'info' },
        [PartRideStatus.Dispute]:      { label: 'Dispute',       variant: 'warning' },
        [PartRideStatus.Accepted]:     { label: 'Accepted',      variant: 'success' },
        [PartRideStatus.Rejected]:     { label: 'Rejected',      variant: 'danger' },
    };

    const conf = map[status] ?? map[PartRideStatus.PendingAdmin];

    return (
        <StatusChip
            label={conf.label}
            variant={conf.variant}
        />
    );
};
