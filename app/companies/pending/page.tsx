'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
} from '@mui/material';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePendingCompanies } from '@/hooks/usePendingCompanies';

export default function PendingCompaniesPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    // Fetch pending companies
    const { data: pendingCompanies, isLoading, isError, error } = usePendingCompanies();

    // Restrict access to Global Admins only
    useEffect(() => {
        if (!authLoading && (!isAuthenticated || !user?.roles.includes('globalAdmin'))) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, authLoading, router, user?.roles]);

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
                <Alert severity="error">{error.message || 'Failed to load pending companies.'}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="lg" mx="auto" p={4}>
            <Typography variant="h4" gutterBottom>
                Pending Companies
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Company Name</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pendingCompanies?.map((company) => (
                            <TableRow
                                key={company.id}
                                hover
                                component={Link}
                                href={`/companies/${company.id}`}
                                sx={{ textDecoration: 'none', cursor: 'pointer' }}
                            >
                                <TableCell>{company.name}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
