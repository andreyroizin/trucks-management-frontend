'use client';

import React from 'react';
import StatusChip from '@/components/StatusChip';
import { PartRideStatus } from '@/utils/partRideStatus';
import { useTranslations } from 'next-intl';

interface PartRideStatusChipProps {
    status: PartRideStatus;
}

export const PartRideStatusChip: React.FC<PartRideStatusChipProps> = ({ status }) => {
    const t = useTranslations('partrides.components.status');
    
    const map: Record<PartRideStatus, { label: string; variant: 'info' | 'warning' | 'success' | 'danger' }> = {
        [PartRideStatus.PendingAdmin]: { label: t('pendingAdmin'), variant: 'info' },
        [PartRideStatus.Dispute]:      { label: t('dispute'),       variant: 'warning' },
        [PartRideStatus.Accepted]:     { label: t('accepted'),      variant: 'success' },
        [PartRideStatus.Rejected]:     { label: t('rejected'),      variant: 'danger' },
    };

    const conf = map[status] ?? map[PartRideStatus.PendingAdmin];

    return (
        <StatusChip
            label={conf.label}
            variant={conf.variant}
        />
    );
};
