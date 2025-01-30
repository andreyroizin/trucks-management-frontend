// app/clients/[id]/page.tsx

'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Card, CardContent, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function ClientDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { data: client, isLoading, isError, error } = useClientDetails(id as string);

    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'employer', 'customer'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));

        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, authLoading, user, router]);

    if (authLoading || isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isError || !client) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error?.message || 'Failed to load client details.'}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="600px" mx="auto" p={2}>
            <Card>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        {client.name}
                    </Typography>
                    <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                        {client.tav}
                    </Typography>
                    <Typography variant="body1">
                        {client.address}, {client.city}, {client.postcode}, {client.country}
                    </Typography>
                    <Typography variant="body1">Phone: {client.phoneNumber}</Typography>
                    <Typography variant="body1">Email: {client.email}</Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        Remark: {client.remark}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ mt: 2 }}>
                        Company: {client.company.name}
                    </Typography>
                    <Box mt={3}>
                        <Link href={`/clients/edit?id=${client.id}`} passHref>
                            <Button variant="contained" color="primary">
                                Edit Client
                            </Button>
                        </Link>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
