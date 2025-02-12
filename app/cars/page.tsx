'use client';

import React, {useState, Suspense, useEffect} from 'react';
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
    TablePagination, Button,
} from '@mui/material';
import {useRouter, useSearchParams} from 'next/navigation';
import { useCars } from '@/hooks/useCars';
import Link from 'next/link';
import {useAuth} from "@/hooks/useAuth";

function CarsList() {
    const { user, isAuthenticated, loading } = useAuth();
    const searchParams = useSearchParams();
    const companyId = searchParams.get('companyId') || "";
    const isGlobalAdmin = user?.roles.includes('globalAdmin');
    const isCustomerAdmin = user?.roles.includes('customerAdmin');
    const router = useRouter();

    // Pagination state
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Fetch cars
    const { data: carsData, isLoading, isError, error } = useCars(companyId, page + 1, pageSize);

    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'customer', 'customerAccountant'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));

        if (!loading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login'); // Redirect to login if not authorized
        }
    }, [isAuthenticated, loading, user, router]);

    // Handle page change
    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    // Handle page size change
    const handleChangePageSize = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPageSize(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (loading || isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error?.message || 'Failed to load cars.'}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="lg" mx="auto" p={4}>
            <Typography variant="h4" gutterBottom>
                Cars
            </Typography>
            {(isGlobalAdmin || isCustomerAdmin) && (
                <Box display="flex" mb={2}>
                    <Link href={`/cars/create?companyId=${companyId}`} passHref>
                        <Button variant="contained" color="primary">
                            Create New Car
                        </Button>
                    </Link>
                </Box>
            )}
            <TableContainer component={Paper}>
                <Table aria-label="cars table">
                    <TableHead>
                        <TableRow>
                            <TableCell>License Plate</TableCell>
                            <TableCell>Remark</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {carsData?.cars.map((car) => (
                            <TableRow key={car.id} hover component={Link} href={`/cars/${car.id}`}
                                      sx={{ textDecoration: 'none', cursor: 'pointer' }}>
                                <TableCell>{car.licensePlate}</TableCell>
                                <TableCell>{car.remark}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={carsData?.totalCars || 0}
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

// Wrap in Suspense for streaming support
export default function CarsPage() {
    return (
        <Suspense fallback={<CircularProgress />}>
            <CarsList />
        </Suspense>
    );
}
