'use client';

import { useParams, useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination, Button,
} from '@mui/material';
import { useRates } from '@/hooks/useRates';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function RatesPage() {
    const { clientId } = useParams();
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const isCustomerAdmin = user?.roles.includes('customerAdmin');
    const isGlobalAdmin = user?.roles.includes('globalAdmin');
    const t = useTranslations('rates.overview');

    // Pagination State
    const [page, setPage] = useState(0); // MUI TablePagination starts at 0
    const [pageSize, setPageSize] = useState(10);

    // Fetch rates with pagination
    const { data: ratesData, isLoading, isError, error } = useRates(clientId as string, page + 1, pageSize); // API uses 1-based index

    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'customerAccountant', 'employer'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router, user?.roles]);

    // Handle page change
    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    // Handle rows per page change
    const handleChangePageSize = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPageSize(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (authLoading || isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error.message || t('loadError')}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="lg" mx="auto" p={4}>
            <Typography variant="h4" gutterBottom>
                {t('title')}
            </Typography>

            {(isCustomerAdmin || isGlobalAdmin) && <Link href={`/rates/create?clientId=${clientId}`} passHref>
                <Button variant="contained" color="primary">
                    {t('createButton')}
                </Button>
            </Link>}

            <TableContainer component={Paper}>
                <Table aria-label="rates table">
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('table.headers.name')}</TableCell>
                            <TableCell>{t('table.headers.value')}</TableCell>
                            <TableCell>{t('table.headers.company')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {ratesData?.rates.map(rate => (
                            <TableRow
                                key={rate.id}
                                hover
                                component={Link}
                                href={`/rates/detail/${rate.id}`}
                                sx={{ textDecoration: 'none', cursor: 'pointer' }}
                            >
                                <TableCell>{rate.name}</TableCell>
                                <TableCell>{rate.value.toFixed(2)}</TableCell>
                                <TableCell>{rate.companyName}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={ratesData?.totalRates || 0}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={pageSize}
                    onRowsPerPageChange={handleChangePageSize}
                    rowsPerPageOptions={[5, 10, 25]}
                    labelRowsPerPage={t('table.rowsPerPage')}
                />
            </TableContainer>
        </Box>
    );
}
