'use client';

import React, {useState, useEffect, Suspense} from 'react';
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
    TextField,
    Button,
} from '@mui/material';
import {useSearchParams, useRouter} from 'next/navigation';
import {useCharters} from '@/hooks/useCharters';
import Link from 'next/link';
import {useAuth} from "@/hooks/useAuth";
import {useCompanies} from "@/hooks/useCompanies";
import {useClients} from "@/hooks/useClients";
import Autocomplete from "@mui/material/Autocomplete";

function ChartersInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const {user, isAuthenticated, loading: authLoading} = useAuth();
    const isCustomerAdmin = user?.roles.includes('customerAdmin');
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    // Extract existing search params
    const [companyId, setCompanyId] = useState(searchParams.get('companyId') || '');
    const [clientId, setClientId] = useState(searchParams.get('clientId') || '');

    // Pagination
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Query
    const {data: chartersData, isLoading, isError, error} = useCharters(companyId, clientId, page + 1, pageSize);
    const {data: companiesData, isLoading: isLoadingCompanies} = useCompanies();
    const {data: clientsData, isLoading: isLoadingClients} = useClients(1, 1000);

    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'customer', 'customerAccountant'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));

        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login'); // Redirect to login if not authorized
        }
    }, [isAuthenticated, authLoading, user, router]);

    // Handle URL & Filter changes
    useEffect(() => {
        const params = new URLSearchParams();
        if (companyId) params.set('companyId', companyId);
        if (clientId) params.set('clientId', clientId);
        router.replace(`/charters?${params.toString()}`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId, clientId]);

    // Pagination Handlers
    const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
    const handleChangePageSize = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPageSize(parseInt(e.target.value, 10));
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
                <Alert severity="error">{error.message || 'Failed to load charters.'}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="lg" mx="auto" p={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4" gutterBottom>
                    Charters
                </Typography>

                {(isCustomerAdmin || isGlobalAdmin) &&
                    <Link href="/charters/create" passHref>
                        <Button variant="contained" color="primary">
                            Create Charter
                        </Button>
                    </Link>
                }
            </Box>

            {/* FILTERS */}
            <Box display="flex" gap={2} mb={2}>
                {(isLoadingCompanies || isLoadingClients) ? (
                    <CircularProgress/>
                ) : (
                    <>
                        {/* Company Filter */}
                        <Autocomplete
                            sx={{minWidth: '300px', maxWidth: '500px'}}
                            options={companiesData?.data || []}
                            getOptionLabel={(option) => option.name || ''}
                            value={companiesData?.data.find((c) => c.id === companyId) || null}
                            onChange={(_, newValue) => {
                                setCompanyId(newValue?.id || '');
                                setPage(0);
                            }}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Select a Company"
                                    variant="outlined"
                                    fullWidth
                                />
                            )}
                        />

                        {/* Client Filter */}
                        <Autocomplete
                            sx={{minWidth: '300px', maxWidth: '500px'}}
                            options={clientsData?.data || []}
                            getOptionLabel={(option) => option.name || ''}
                            value={clientsData?.data.find((cl) => cl.id === clientId) || null}
                            onChange={(_, newValue) => {
                                setClientId(newValue?.id || '');
                                setPage(0);
                            }}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Select a Client"
                                    variant="outlined"
                                    fullWidth
                                />
                            )}
                        />
                    </>
                )}
                {/* Clear Button */}
                <Button
                    variant="outlined"
                    onClick={() => {
                        // Clear filters
                        setCompanyId('');
                        setClientId('');
                        setPage(0);
                    }}
                >
                    Clear
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table aria-label="charters table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Remark</TableCell>
                            <TableCell>Client</TableCell>
                            <TableCell>Company</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {chartersData?.data.map((charter) => (
                            <TableRow
                                key={charter.id}
                                hover
                                component={Link}
                                href={`/charters/${charter.id}`}
                                sx={{textDecoration: 'none', cursor: 'pointer'}}
                            >
                                <TableCell>{charter.name}</TableCell>
                                <TableCell>{charter.remark}</TableCell>
                                <TableCell>{charter.clientId}</TableCell>
                                <TableCell>{charter.companyId}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={chartersData?.totalCharters || 0}
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

export default function ChartersPage() {
    return (
        <Suspense fallback={<CircularProgress />}>
            <ChartersInner />
        </Suspense>
    );
}