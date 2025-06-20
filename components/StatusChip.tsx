'use client';

import React from 'react';
import { Chip } from '@mui/material';

export type StatusChipVariant = 'info' | 'success' | 'warning' | 'danger';

interface StatusChipProps {
    label: string;
    variant?: StatusChipVariant;
    sx?: object;        // optional extra styling overrides
}

const colorMap: Record<StatusChipVariant, { bg: string; text: string }> = {
    info:    { bg: '#e3f2fd', text: '#1976d2' },
    success: { bg: '#e8f5e9', text: '#2e7d32' },
    warning: { bg: '#fff8e1', text: '#f9a825' },
    danger:  { bg: '#ffebee', text: '#c62828' },
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
