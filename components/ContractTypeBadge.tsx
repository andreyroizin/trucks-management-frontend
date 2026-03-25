'use client';

import React from 'react';
import { Chip } from '@mui/material';
import { ContractTypeValue, CONTRACT_TYPE_COLORS, CONTRACT_TYPE_OPTIONS } from '@/constants/contractTypes';

interface ContractTypeBadgeProps {
    contractType?: ContractTypeValue | string | null;
    size?: 'small' | 'medium';
}

export default function ContractTypeBadge({ contractType, size = 'small' }: ContractTypeBadgeProps) {
    if (!contractType) return null;

    const typeValue = contractType as ContractTypeValue;
    const option = CONTRACT_TYPE_OPTIONS.find((o) => o.value === typeValue);
    const label = option?.label ?? typeValue;
    const color = CONTRACT_TYPE_COLORS[typeValue] ?? 'default';

    return <Chip label={label} color={color} size={size} variant="outlined" />;
}
