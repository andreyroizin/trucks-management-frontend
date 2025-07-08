'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert, Button } from '@mui/material';
import { usePendingClients } from '@/hooks/usePendingClients';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function PendingClientsPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    // Fetch pending clients
    const { data, isLoading, isError, error } = usePendingClients();

    // Access control: Only allow 'globalAdmin'
    useEffect(() => {
        if (!authLoading && (!isAuthenticated || !isGlobalAdmin)) {
            router.push('/auth/login'); // Redirect unauthorized users
        }
    }, [isAuthenticated, authLoading, isGlobalAdmin, router]);

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
                <Alert severity="error">{error?.message || 'Failed to load pending clients.'}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="lg" mx="auto" p={4}>
            <Typography variant="h4" gutterBottom>
                Pending Clients
            </Typography>

            <TableContainer component={Paper}>
                <Table aria-label="pending clients table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>City</TableCell>
                            <TableCell>Company</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data?.map((client) => (
                            <TableRow
                                key={client.id}
                                hover
                                sx={{ cursor: 'pointer' }}
                                component={Link}
                                href={`/clients/${client.id}`}
                            >
                                <TableCell>{client.name}</TableCell>
                                <TableCell>{client.city || 'N/A'}</TableCell>
                                <TableCell>{client.companyName}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
