'use client';

import React, {useState} from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert,
    TablePagination,
    Button
} from '@mui/material';
import { useUnits } from '@/hooks/useUnits';
import {useAuth} from "@/hooks/useAuth";
import Link from "next/link";
import { useTranslations } from 'next-intl';

export default function UnitsPage() {
    const { user } = useAuth();
    const isGlobalAdmin = user?.roles.includes('globalAdmin');
    const t = useTranslations('units.overview');
    // Pagination state
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Fetch units
    const { data: unitsData, isLoading, isError, error } = useUnits(page + 1, pageSize); // API pages start at 1

    // Handle page change
    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    // Handle page size change
    const handleChangePageSize = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPageSize(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (isLoading) {
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
            {isGlobalAdmin && <Link href={`/units/create`} passHref>
                <Button variant="contained" color="primary">
                    {t('createButton')}
                </Button>
            </Link>}
            <TableContainer component={Paper}>
                <Table aria-label="units table">
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('table.headers.id')}</TableCell>
                            <TableCell>{t('table.headers.value')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {unitsData?.units.map((unit) => (
                            <TableRow
                                key={unit.id}
                                hover
                                sx={{ cursor: 'pointer' }}
                                component={Link}
                                href={`/units/${unit.id}`}
                            >
                                <TableCell>{unit.id}</TableCell>
                                <TableCell>{unit.value}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={unitsData?.totalUnits || 0}
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
