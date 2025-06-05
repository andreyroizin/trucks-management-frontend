// components/DriverPeriodListContent.tsx
'use client';

import React from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Divider,
    IconButton,
    TablePagination,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

export type Period = {
    year: number;
    periodNr: number;
    status: number;
    fromDate: string;
    toDate: string;
};

type Props = {
    title: string;
    description: string;
    pagination: {
        pageNumber: number;
        pageSize: number;
        totalCount: number;
        onPageChange: (page: number) => void;
        onPageSizeChange: (size: number) => void;
    };
    fetchState: {
        data: Period[];
        isLoading: boolean;
        isError: boolean;
        error?: Error | null;
    };
};

export default function DriverPeriodListContent({ title, description, pagination, fetchState }: Props) {
    const router = useRouter();

    const {
        pageNumber,
        pageSize,
        totalCount,
        onPageChange,
        onPageSizeChange
    } = pagination;

    const {
        data,
        isLoading,
        isError,
        error
    } = fetchState;

    if (isLoading) {
        return (
            <Box minHeight="50vh" display="flex" alignItems="center" justifyContent="center">
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return (
            <Box minHeight="50vh" display="flex" alignItems="center" justifyContent="center">
                <Alert severity="error">{error?.message || 'Failed to load periods'}</Alert>
            </Box>
        );
    }

    const formatTitle = (p: { year: number; periodNr: number }) =>
        `${p.year}-${p.periodNr.toString().padStart(2, '0')} Period`;

    return (
        <Box maxWidth="700px" mx="auto" my={4}>
            <Typography variant="h4" mb={2}>{title}</Typography>
            <Typography color="text.secondary" mb={3}>{description}</Typography>

            {data.map((p, idx) => (
                <React.Fragment key={`${p.year}-${p.periodNr}`}>
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ cursor: 'pointer', py: 1.5 }}
                        onClick={() => router.push(`/periods/driver/${p.year}-${p.periodNr}`)}
                    >
                        <Box>
                            <Typography variant="h5">{formatTitle(p)}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {dayjs(p.fromDate).format('DD.MM.YYYY')} — {dayjs(p.toDate).format('DD.MM.YYYY')}
                            </Typography>
                        </Box>
                        <IconButton edge="end" size="small">
                            <ChevronRightIcon />
                        </IconButton>
                    </Box>
                    {idx !== data.length - 1 && <Divider />}
                </React.Fragment>
            ))}

            <TablePagination
                component="div"
                rowsPerPageOptions={[5, 10, 25]}
                count={totalCount}
                page={pageNumber - 1}
                rowsPerPage={pageSize}
                onPageChange={(_, newPage) => onPageChange(newPage + 1)}
                onRowsPerPageChange={(e) => {
                    onPageSizeChange(parseInt(e.target.value, 10));
                    onPageChange(1);
                }}
                labelRowsPerPage="Rows per page:"
                sx={{ mt: 2 }}
            />
        </Box>
    );
}