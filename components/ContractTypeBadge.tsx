'use client';

import React from 'react';
import { Chip } from '@mui/material';
import { useTranslations } from 'next-intl';
import { ContractTypeValue, CONTRACT_TYPE_COLORS } from '@/constants/contractTypes';

interface ContractTypeBadgeProps {
    contractType?: ContractTypeValue | string | null;
    size?: 'small' | 'medium';
}

export default function ContractTypeBadge({ contractType, size = 'small' }: ContractTypeBadgeProps) {
    const t = useTranslations('drivers.create.contractType.options');

    if (!contractType) return null;

    const typeValue = contractType as ContractTypeValue;
    const color = CONTRACT_TYPE_COLORS[typeValue] ?? 'default';

    // Use translated label; fall back to the raw value if the key doesn't exist
    let label: string;
    try {
        label = t(`${typeValue}.label`);
    } catch {
        label = typeValue;
    }

    return <Chip label={label} color={color} size={size} variant="outlined" />;
}
