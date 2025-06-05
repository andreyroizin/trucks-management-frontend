'use client';

import { Box, Paper, Typography } from '@mui/material';
import { ReactNode } from 'react';

type Props = {
    title: string;
    subtitle: string;
    icon?: ReactNode;
    onClick: () => void;
    highlight?: boolean;
};

export default function DriverDashboardCardButton({
                                                      title,
                                                      subtitle,
                                                      icon,
                                                      onClick,
                                                      highlight = false,
                                                  }: Props) {
    return (
        <Paper
            onClick={onClick}
            sx={{
                p: 3,
                borderRadius: 3,
                backgroundColor: highlight ? '#005ca8' : '#f9f9f9',
                color: highlight ? 'common.white' : '#005ca8',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
                '&:hover': {
                    backgroundColor: highlight ? '#004c90' : '#f0f0f0',
                },
            }}
        >
            {icon && (
                <Box
                    sx={{
                        backgroundColor: highlight ? 'white' : 'transparent',
                        color: highlight ? '#005ca8' : 'inherit',
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </Box>
            )}
            <Box>
                <Typography variant="h6" fontWeight={600}>
                    {title}
                </Typography>
                <Typography fontSize={14}>{subtitle}</Typography>
            </Box>
        </Paper>
    );
}