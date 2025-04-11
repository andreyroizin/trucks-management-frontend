'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    CircularProgress,
    Typography,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    TablePagination,
    Autocomplete,
    TextField,
} from '@mui/material';

import { useAuth } from '@/hooks/useAuth';
import { useEmployeeContracts } from '@/hooks/useEmployeeContracts';
import { useDrivers } from '@/hooks/useDrivers';
import { useCompanies } from '@/hooks/useCompanies';

export default function ContractsPage() {
    const router = useRouter();
    const { isAuthenticated, loading: authLoading } = useAuth();

    // Restrict access
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Pagination + filters
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [driverId, setDriverId] = useState('');
    const [companyId, setCompanyId] = useState('');

    // Fetch data for drivers + companies
    const { data: driversData, isLoading: loadingDrivers } = useDrivers();
    const { data: companiesData, isLoading: loadingCompanies } = useCompanies();

    // Main query
    const { data, isLoading, isError, error } = useEmployeeContracts(
        pageNumber,
        pageSize,
        driverId,
        companyId
    );

    if (authLoading || isLoading || loadingDrivers || loadingCompanies) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }
    if (isError || !data) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <Alert severity="error">{error?.message || 'Failed to load contracts.'}</Alert>
            </Box>
        );
    }

    // Helpers to find selected driver/company if we have an array
    const selectedDriver = driversData?.find((dr) => dr.id === driverId) || null;
    const selectedCompany = companiesData?.data.find((co) => co.id === companyId) || null;

    return (
        <Box p={2}>
            {/* HEADER */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">Employee Contracts</Typography>
                <Button variant="contained" onClick={() => router.push('/contracts/create')}>
                    Create Contract
                </Button>
            </Box>

            {/* FILTERS */}
            <Box display="flex" gap={2} mb={2}>
                {/* Driver Filter */}
                <Autocomplete
                    sx={{ minWidth: 240 }}
                    options={driversData || []}
                    getOptionLabel={(option) => option.user.firstName + " " + option.user.lastName || ''}
                    value={selectedDriver}
                    onChange={(_, newValue) => {
                        setDriverId(newValue?.id || '');
                        setPageNumber(1); // reset pagination
                    }}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                        <TextField {...params} label="Driver" variant="outlined" size="small" />
                    )}
                />

                {/* Company Filter */}
                <Autocomplete
                    sx={{ minWidth: 240 }}
                    options={companiesData?.data || []}
                    getOptionLabel={(option) => option.name || ''}
                    value={selectedCompany}
                    onChange={(_, newValue) => {
                        setCompanyId(newValue?.id || '');
                        setPageNumber(1);
                    }}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                        <TextField {...params} label="Company" variant="outlined" size="small" />
                    )}
                />
            </Box>

            {/* TABLE */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Contract ID</TableCell>
                            <TableCell>Driver Name</TableCell>
                            <TableCell>Company Name</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.data.map((contract) => (
                            <TableRow
                                hover
                                key={contract.id}
                                onClick={() => router.push(`/contracts/${contract.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <TableCell>{contract.id}</TableCell>
                                <TableCell>{contract.driver.fullName}</TableCell>
                                <TableCell>{contract.company.name}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={data.totalCount || 0}
                    page={pageNumber}
                    onPageChange={(_, newPage) => setPageNumber(newPage)}
                    rowsPerPage={pageSize}
                    onRowsPerPageChange={(event) => {
                        setPageSize(parseInt(event.target.value, 10));
                        setPageNumber(0);
                    }}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    labelRowsPerPage="Rows per page:"
                />
            </TableContainer>
        </Box>
    );
}
