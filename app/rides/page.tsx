'use client';

import React, {useEffect, useState} from 'react';
import {
    Alert,
    Box, Button,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Typography,
} from '@mui/material';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/hooks/useAuth';
import Link from 'next/link';
import {useRides} from '@/hooks/useRides';

export default function RidesPage() {
    const router = useRouter();
    const {user, isAuthenticated, loading: authLoading} = useAuth();

    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'customer', 'customerAccountant', 'employer'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, authLoading, router, user?.roles]);


    // Local pagination state
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Use the query hook
    const {data: ridesData, isLoading, isError, error} = useRides(page + 1, pageSize);

    // Pagination handlers
    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };
    const handleChangePageSize = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPageSize(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress/>
            </Box>
        );
    }

    if (isError) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error.message || 'Failed to load rides.'}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="lg" mx="auto" p={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4" gutterBottom>
                    Rides
                </Typography>
                <Link href="/rides/create" passHref>
                    <Button variant="contained" color="primary">
                        Create Ride
                    </Button>
                </Link>
            </Box>

            <TableContainer component={Paper}>
                <Table aria-label="rides table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Remark</TableCell>
                            <TableCell>Company</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {ridesData?.data.map((ride) => (
                            <TableRow
                                key={ride.id}
                                hover
                                component={Link}
                                href={`/rides/${ride.id}`}
                                sx={{textDecoration: 'none', cursor: 'pointer'}}
                            >
                                <TableCell>{ride.name}</TableCell>
                                <TableCell>{ride.remark || 'N/A'}</TableCell>
                                <TableCell>{ride.companyName}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={ridesData?.totalRides || 0}
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
