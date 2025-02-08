// app/clients/page.tsx

'use client';

import React, {useState, useEffect} from 'react';
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
import {useClients} from '@/hooks/useClients';
import {useAuth} from '@/hooks/useAuth';
import {useRouter} from 'next/navigation';
import Link from 'next/link';

export default function ClientsPage() {
    const router = useRouter();
    const {user, isAuthenticated, loading: authLoading} = useAuth();

    // Pagination state
    const [page, setPage] = useState(0); // MUI's TablePagination starts at 0
    const [pageSize, setPageSize] = useState(10);

    // Fetch clients with pagination
    const {data: clientsData, isLoading, isError, error} = useClients(page + 1, pageSize); // API pages start at 1
    const isCustomerAdmin = user?.roles.includes('customerAdmin');
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    // *** Access Control ***
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'employer'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));

        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login'); // Redirect unauthorized users
        }
    }, [user, isAuthenticated, authLoading, router]);

    // Handle page change
    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    // Handle page size change
    const handleChangePageSize = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPageSize(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (authLoading || isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress/>
            </Box>
        );
    }

    if (isError) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error.message || 'Failed to load clients.'}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="lg" mx="auto" p={4}>
            <Typography variant="h4" gutterBottom>
                Clients
            </Typography>
            {(isCustomerAdmin || isGlobalAdmin) &&
                <Link href="/clients/create" passHref>
                    <Button variant="contained" color="primary">
                        Add Client
                    </Button>
                </Link>
            }
            <TableContainer component={Paper}>
                <Table aria-label="clients table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>TAV</TableCell>
                            <TableCell>Address</TableCell>
                            <TableCell>City</TableCell>
                            <TableCell>Country</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Remark</TableCell>
                            <TableCell>Company</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {clientsData?.data.map(client => (
                            <TableRow
                                key={client.id}
                                hover
                                component={Link}
                                href={`/clients/${client.id}`}
                                sx={{textDecoration: 'none', cursor: 'pointer'}}
                            >
                                <TableCell>{client.name}</TableCell>
                                <TableCell>{client.tav}</TableCell>
                                <TableCell>{client.address}</TableCell>
                                <TableCell>{client.city}</TableCell>
                                <TableCell>{client.country}</TableCell>
                                <TableCell>{client.phoneNumber}</TableCell>
                                <TableCell>{client.email}</TableCell>
                                <TableCell>{client.remark}</TableCell>
                                <TableCell>{client.company.name}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={clientsData?.totalClients || 0}
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
