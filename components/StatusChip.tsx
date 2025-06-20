'use client';

import React from 'react';
import { Chip } from '@mui/material';

export type StatusChipVariant = 'default' | 'info' | 'success' | 'warning' | 'danger';

interface StatusChipProps {
    label: string;
    variant?: StatusChipVariant;
    sx?: object;        // optional extra styling overrides
}

const colorMap: Record<StatusChipVariant, { bg: string; text: string }> = {
    default: { bg: '#F5F5F5', text: '#9E9E9E' },
    info:    { bg: '#E4F6FD', text: '#0588D1' },
    success: { bg: '#EDF7ED', text: '#2e7d32' },
    warning: { bg: '#FFF4E5', text: '#ef6c02' },
    danger:  { bg: '#FEEDEE', text: '#D32F2F' },
};

export default function StatusChip({
                                       label,
                                       variant = 'info',
                                       sx = {},
                                   }: StatusChipProps) {
    const { bg, text } = colorMap[variant];

    return (
        <Chip
            label={label}
            variant="outlined"
            size="small"
            sx={{
                borderRadius: '999px',
                fontWeight: 500,
                border: 'none',
                backgroundColor: bg,
                color: text,
                ...sx,          // allow consumer overrides
            }}
        />
    );
}
