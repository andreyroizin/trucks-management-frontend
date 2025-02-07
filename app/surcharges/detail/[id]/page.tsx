'use client';

import { useParams, useRouter } from 'next/navigation';
import { Box, Card, CardContent, Typography, CircularProgress, Alert, Button } from '@mui/material';
import Link from 'next/link';
import { useSurchargeDetails } from '@/hooks/useSurchargeDetails';
import {useAuth} from "@/hooks/useAuth";
import {useEffect} from "react";

export default function SurchargeDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const isCustomerAdmin = user?.roles.includes('customerAdmin');
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    // Fetch surcharge details
    const { data: surcharge, isLoading, isError, error } = useSurchargeDetails(id as string);

    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'customerAccountant', 'employer', 'customer'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, authLoading, router, user?.roles]);

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isError || !surcharge) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error?.message || 'Failed to load surcharge details.'}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="600px" mx="auto" p={2}>
            <Card>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        Surcharge Details
                    </Typography>

                    {(isCustomerAdmin || isGlobalAdmin) && (
                        <Box display="flex" justifyContent="flex-end" mb={2}>
                            <Link href={`/surcharges/edit/${surcharge.id}`} passHref>
                                <Button variant="contained" color="primary">Edit</Button>
                            </Link>
                        </Box>
                    )}
                    <Typography variant="body1">
                        <strong>Value:</strong> {surcharge.value.toFixed(2)}
                    </Typography>

                    {/* Client Information */}
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        <strong>Client:</strong>{' '}
                        <Link href={`/clients/${surcharge.client.id}`} passHref>
                            <Button variant="text" size="small">
                                {surcharge.client.name}
                            </Button>
                        </Link>
                    </Typography>

                    {/* Company Information */}
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        <strong>Company:</strong>{' '}
                        <Link href={`/companies/${surcharge.company.id}`} passHref>
                            <Button variant="text" size="small">
                                {surcharge.company.name}
                            </Button>
                        </Link>
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}
