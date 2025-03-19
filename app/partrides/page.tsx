'use client';

import React, {Suspense, useEffect, useState} from 'react';
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
    Button,
    TextField,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePartRides } from '@/hooks/usePartRides';
// REPLACE OR ADAPT the next lines with your actual hooks for companies, clients, drivers, cars:
import { useCompanies } from '@/hooks/useCompanies';
import { useClients } from '@/hooks/useClients';
import { useDrivers } from '@/hooks/useDrivers';
import { useCars } from '@/hooks/useCars';

function PartRidesWrapperPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, loading: authLoading } = useAuth();

    // Ensure only authenticated users can access
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Local states for filters (prefilled from URL)
    const [companyId, setCompanyId] = useState(searchParams.get('companyId') || '');
    const [clientId, setClientId] = useState(searchParams.get('clientId') || '');
    const [driverId, setDriverId] = useState(searchParams.get('driverId') || '');
    const [carId, setCarId] = useState(searchParams.get('carId') || '');
    const [weekNumber, setWeekNumber] = useState(searchParams.get('weekNumber') || '');
    const [turnoverMin, setTurnoverMin] = useState(searchParams.get('turnoverMin') || '');
    const [turnoverMax, setTurnoverMax] = useState(searchParams.get('turnoverMax') || '');
    const [decimalHoursMin, setDecimalHoursMin] = useState(searchParams.get('decimalHoursMin') || '');
    const [decimalHoursMax, setDecimalHoursMax] = useState(searchParams.get('decimalHoursMax') || '');

    // Hooks for filter data
    const { data: companiesData, isLoading: isLoadingCompanies } = useCompanies();
    const { data: clientsData, isLoading: isLoadingClients } = useClients(1, 1000);
    const { data: driversData, isLoading: isLoadingDrivers } = useDrivers();
    const { data: carsData, isLoading: isLoadingCars } = useCars(companyId, 1, 1000);

    // Pagination
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Query for part rides
    const {
        data: partRidesData,
        isLoading,
        isError,
        error,
    } = usePartRides({
        companyId,
        clientId,
        driverId,
        carId,
        weekNumber,
        turnoverMin,
        turnoverMax,
        decimalHoursMin,
        decimalHoursMax,
        pageNumber: page + 1,
        pageSize,
    });

    // Sync URL with local states
    useEffect(() => {
        const params = new URLSearchParams();
        if (companyId) params.set('companyId', companyId);
        if (clientId) params.set('clientId', clientId);
        if (driverId) params.set('driverId', driverId);
        if (carId) params.set('carId', carId);
        if (weekNumber) params.set('weekNumber', weekNumber);
        if (turnoverMin) params.set('turnoverMin', turnoverMin);
        if (turnoverMax) params.set('turnoverMax', turnoverMax);
        if (decimalHoursMin) params.set('decimalHoursMin', decimalHoursMin);
        if (decimalHoursMax) params.set('decimalHoursMax', decimalHoursMax);

        router.replace(`/partrides?${params.toString()}`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId, clientId, driverId, carId, weekNumber, turnoverMin, turnoverMax, decimalHoursMin, decimalHoursMax]);

    // Pagination handlers
    const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
    const handleChangePageSize = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPageSize(parseInt(e.target.value, 10));
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
                <Alert severity="error">{error?.message || 'Failed to load part rides.'}</Alert>
            </Box>
        );
    }

    // If any of the filter-data hooks are loading
    if (isLoadingCompanies || isLoadingClients || isLoadingDrivers || isLoadingCars) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box maxWidth="lg" mx="auto" p={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4" gutterBottom>
                    Part Rides
                </Typography>
                <Link href="/partrides/create" passHref>
                    <Button variant="contained" color="primary">
                        Create Part ride
                    </Button>
                </Link>
            </Box>

            {/* FILTERS */}
            <Box display="flex" flexWrap="wrap" gap={2} mb={2}>

                {/* Company Filter */}
                <Autocomplete
                    sx={{ width: 250 }}
                    options={companiesData?.data || []}
                    getOptionLabel={(option) => option.name || ''}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    value={companiesData?.data.find((co) => co.id === companyId) || null}
                    onChange={(_, newVal) => {
                        setCompanyId(newVal?.id || '');
                        setPage(0);
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Company"
                            variant="outlined"
                            size="small"
                        />
                    )}
                />

                {/* Client Filter */}
                <Autocomplete
                    sx={{ width: 250 }}
                    options={clientsData?.data || []}
                    getOptionLabel={(option) => option.name || ''}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    value={clientsData?.data.find((cl) => cl.id === clientId) || null}
                    onChange={(_, newVal) => {
                        setClientId(newVal?.id || '');
                        setPage(0);
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Client"
                            variant="outlined"
                            size="small"
                        />
                    )}
                />

                {/* Driver Filter */}
                <Autocomplete
                    sx={{ width: 250 }}
                    options={driversData || []}
                    getOptionLabel={(option) => `${option?.user?.firstName} ${option?.user?.lastName}` || ''}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    value={driversData?.find((dr) => dr.id === driverId) || null}
                    onChange={(_, newVal) => {
                        setDriverId(newVal?.id || '');
                        setPage(0);
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Driver"
                            variant="outlined"
                            size="small"
                        />
                    )}
                />

                {/* Car Filter */}
                <Autocomplete
                    sx={{ width: 250 }}
                    options={carsData?.cars || []}
                    getOptionLabel={(option) => option.licensePlate || ''}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    value={carsData?.cars.find((ca) => ca.id === carId) || null}
                    onChange={(_, newVal) => {
                        setCarId(newVal?.id || '');
                        setPage(0);
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Car"
                            variant="outlined"
                            size="small"
                        />
                    )}
                />

                {/* weekNumber */}
                <TextField
                    label="Week Number"
                    variant="outlined"
                    size="small"
                    value={weekNumber}
                    onChange={(e) => {
                        setWeekNumber(e.target.value);
                        setPage(0);
                    }}
                    sx={{ width: 130 }}
                />

                {/* turnoverMin */}
                <TextField
                    label="Turnover Min"
                    variant="outlined"
                    size="small"
                    value={turnoverMin}
                    onChange={(e) => {
                        setTurnoverMin(e.target.value);
                        setPage(0);
                    }}
                    sx={{ width: 130 }}
                />

                {/* turnoverMax */}
                <TextField
                    label="Turnover Max"
                    variant="outlined"
                    size="small"
                    value={turnoverMax}
                    onChange={(e) => {
                        setTurnoverMax(e.target.value);
                        setPage(0);
                    }}
                    sx={{ width: 130 }}
                />

                {/* decimalHoursMin */}
                <TextField
                    label="Dec.Hrs Min"
                    variant="outlined"
                    size="small"
                    value={decimalHoursMin}
                    onChange={(e) => {
                        setDecimalHoursMin(e.target.value);
                        setPage(0);
                    }}
                    sx={{ width: 130 }}
                />

                {/* decimalHoursMax */}
                <TextField
                    label="Dec.Hrs Max"
                    variant="outlined"
                    size="small"
                    value={decimalHoursMax}
                    onChange={(e) => {
                        setDecimalHoursMax(e.target.value);
                        setPage(0);
                    }}
                    sx={{ width: 130 }}
                />

                {/* Clear Button */}
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                        setCompanyId('');
                        setClientId('');
                        setDriverId('');
                        setCarId('');
                        setWeekNumber('');
                        setTurnoverMin('');
                        setTurnoverMax('');
                        setDecimalHoursMin('');
                        setDecimalHoursMax('');
                        setPage(0);
                    }}
                >
                    Clear
                </Button>
            </Box>

            {/* Table */}
            <TableContainer component={Paper}>
                <Table aria-label="part rides table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Start</TableCell>
                            <TableCell>End</TableCell>
                            <TableCell>Company</TableCell>
                            <TableCell>Client</TableCell>
                            <TableCell>Driver</TableCell>
                            <TableCell>Car</TableCell>
                            <TableCell>Turnover</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {partRidesData?.data.map((ride) => (
                            <TableRow
                                key={ride.id}
                                hover
                                component={Link}
                                href={`/partrides/${ride.id}`}
                                sx={{ textDecoration: 'none', cursor: 'pointer' }}
                            >
                                <TableCell>{ride.date?.substring(0, 10)}</TableCell>
                                <TableCell>{ride.start}</TableCell>
                                <TableCell>{ride.end}</TableCell>
                                <TableCell>{ride.company?.name || 'N/A'}</TableCell>
                                <TableCell>{ride.client?.name || 'N/A'}</TableCell>
                                <TableCell>{ride.driver ? ride.driver.id : 'N/A'}</TableCell>
                                <TableCell>{ride.carId || 'N/A'}</TableCell>
                                <TableCell>{ride.turnover}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={partRidesData?.totalCount || 0}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={pageSize}
                    onRowsPerPageChange={handleChangePageSize}
                    rowsPerPageOptions={[5, 10, 25]}
                    labelRowsPerPage="Rows per page:"
                />
            </TableContainer>
        </Box>
    );
}

export default function PartRidesPage() {
    return (
        <Suspense fallback={<CircularProgress />}>
            <PartRidesWrapperPage/>
        </Suspense>
    );
}

