'use client';

import React, { useEffect, useState } from 'react';
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

import { useAuth } from '@/hooks/useAuth';
import { useArchivedDriverPeriods } from '@/hooks/useArchivedDriverPeriods';

export default function ArchivedPeriodsPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    /* ---------- guard: only driver / globalAdmin ---------- */
    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) router.push('/auth/login');
            else if (
                !user?.roles.includes('driver') &&
                !user?.roles.includes('globalAdmin')
            ) {
                router.push('/403');
            }
        }
    }, [authLoading, isAuthenticated, user, router]);
    /* ------------------------------------------------------ */

    /* pagination state */
    const [pageNumber, setPageNumber] = useState(1); // 1-based (API convention)
    const [pageSize, setPageSize] = useState(10);

    const {
        data,
        isLoading,
        isError,
        error,
    } = useArchivedDriverPeriods(pageNumber, pageSize);

    /* loading / error UI */
    if (authLoading || isLoading) {
        return (
            <Box minHeight="50vh" display="flex" alignItems="center" justifyContent="center">
                <CircularProgress />
            </Box>
        );
    }
    if (isError || !data) {
        return (
            <Box minHeight="50vh" display="flex" alignItems="center" justifyContent="center">
                <Alert severity="error">{error?.message || 'Failed to load periods'}</Alert>
            </Box>
        );
    }

    /* helpers */
    const formatTitle = (p: { year: number; periodNr: number }) =>
        `${p.year}-${p.periodNr.toString().padStart(2, '0')} Period`;

    return (
        <Box maxWidth="700px" mx="auto" p={{ xs: 2, md: 4 }}>
            <Typography variant="h4" mb={2}>
                Archived Periods
            </Typography>
            <Typography color="text.secondary" mb={3}>
                Browse your signed and completed work periods.
            </Typography>

            {/* ---- list ---- */}
            {data.data.map((p, idx) => (
                <React.Fragment key={`${p.year}-${p.periodNr}`}>
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ cursor: 'pointer', py: 1.5 }}
                        onClick={() =>
                            router.push(`/workdays/period/${p.year}-${p.periodNr}`) // ⬅️ adjust route
                        }
                    >
                        <Box>
                            <Typography variant="h5">{formatTitle(p)}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {dayjs(p.fromDate).format('DD.MM.YYYY')} —{' '}
                                {dayjs(p.toDate).format('DD.MM.YYYY')}
                            </Typography>
                        </Box>
                        <IconButton edge="end" size="small">
                            <ChevronRightIcon />
                        </IconButton>
                    </Box>

                    {/* divider between items but not after last */}
                    {idx !== data.data.length - 1 && <Divider />}
                </React.Fragment>
            ))}

            {/* ---- pagination ---- */}
            <TablePagination
                component="div"
                rowsPerPageOptions={[5, 10, 25]}
                count={data.totalCount}
                page={pageNumber - 1}                     // MUI is 0-based
                rowsPerPage={pageSize}
                onPageChange={(_, newPage) => setPageNumber(newPage + 1)}
                onRowsPerPageChange={(e) => {
                    setPageSize(parseInt(e.target.value, 10));
                    setPageNumber(1);
                }}
                labelRowsPerPage="Rows per page:"
                sx={{ mt: 2 }}
            />
        </Box>
    );
}