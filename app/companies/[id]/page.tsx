// app/companies/[id]/page.tsx

'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCompanyDetails } from '@/hooks/useCompanyDetails';
import { useAuth } from '@/hooks/useAuth';
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Card,
    CardContent,
} from '@mui/material';
import Link from 'next/link';

export default function CompanyDetailPage() {
    const router = useRouter();
    const params = useParams();
    const companyId = params?.id as string;
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    // Fetch company details
    const { data: company, isLoading, isError, error } = useCompanyDetails(companyId);

    // Access control: Only allow 'globalAdmin' or 'customerAdmin'
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));

        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login'); // Redirect to login if not authorized
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
                <Alert severity="error">{error.message || 'Failed to load company details.'}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="600px" mx="auto" p={2}>
            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h5">Company Details</Typography>
                        <Link href={`/companies/edit?id=${company?.id}`} passHref>
                            <Button variant="contained" color="primary">
                                Edit Company
                            </Button>
                        </Link>
                    </Box>
                    <Typography variant="subtitle1" color="textSecondary">
                        Name:
                    </Typography>
                    <Typography variant="body1">{company?.name}</Typography>
                </CardContent>
            </Card>
        </Box>
    );
}
