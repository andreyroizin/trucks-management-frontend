'use client';

import React, {useEffect} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {Box, Card, CardContent, Typography, CircularProgress, Alert, Button} from '@mui/material';
import Link from 'next/link';
import {useAuth} from '@/hooks/useAuth';
import {useClientDetails} from '@/hooks/useClientDetails';
import ContactPersonsSection from "@/components/ContactPersons";

export default function ClientDetailPage() {
    const {id} = useParams();
    const router = useRouter();
    const {user, isAuthenticated, loading: authLoading} = useAuth();
    const {data: client, isLoading, isError, error} = useClientDetails(id as string);
    const isCustomerAdmin = user?.roles.includes('customerAdmin');
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'employer', 'customer'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
        if (!authLoading && (!isAuthenticated || !hasAccess)) router.push('/auth/login');
    }, [authLoading, isAuthenticated, router, user?.roles]);

    if (authLoading || isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress/>
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
                    {/* Title + Edit Button (top-right) */}
                    {(isCustomerAdmin || isGlobalAdmin) && <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h5">{client.name}</Typography>
                        <Link href={`/clients/edit?id=${client.id}`} passHref>
                            <Button variant="contained" color="primary">
                                Edit
                            </Button>
                        </Link>
                    </Box>}

                    <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                        {client.tav}
                    </Typography>
                    <Typography variant="body1">
                        {client.address}, {client.city}, {client.postcode}, {client.country}
                    </Typography>
                    <Typography variant="body1">Phone: {client.phoneNumber}</Typography>
                    <Typography variant="body1">Email: {client.email}</Typography>
                    <Typography variant="body1" sx={{mt: 1}}>
                        Remark: {client.remark}
                    </Typography>

                    {/* Link to the Company */}
                    <Box mt={2}>
                        Company:{` ${client.company.name} `}
                        <Link href={`/companies/${client.company.id}`} passHref>
                            <Button variant="outlined" size="small">
                                Go to Company
                            </Button>
                        </Link>
                    </Box>
                </CardContent>
            </Card>
            <ContactPersonsSection clientId={client.id} />
        </Box>
    );
}
