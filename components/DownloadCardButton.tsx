'use client';

import { Box, Paper, Typography, SxProps, Theme } from '@mui/material';
import { ReactNode } from 'react';

type DownloadCardButtonProps = {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    sx?: SxProps<Theme>; // <-- new prop
};

export default function DownloadCardButton({
                                               label,
                                               icon,
                                               onClick,
                                               sx = {},
                                           }: DownloadCardButtonProps) {
    return (
        <Paper
            variant="outlined"
            sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                cursor: 'pointer',
                '&:hover': {
                    backgroundColor: 'action.hover',
                },
                ...sx, // <-- merge custom styles
            }}
            onClick={onClick}
        >
            <Box display="flex" alignItems="center">
                {icon}
            </Box>
            <Typography>{label}</Typography>
        </Paper>
    );
}