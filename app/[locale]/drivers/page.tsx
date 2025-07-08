// app/drivers/page.tsx

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDrivers } from '@/hooks/useDrivers';
import DriversTable from '@/components/DriversTable';
import { CircularProgress, Typography, Alert, Box } from '@mui/material';
import {useAuth} from "@/hooks/useAuth";

export default function DriversPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useAuth();
    const { data: drivers, isLoading: isLoadingDrivers, isError: isErrorDrivers } = useDrivers();

    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));

        if (!isAuthenticated && !loading && (!user || !hasAccess)) {
            router.push('/auth/login'); // Redirect to login if not authorized
        }
    }, [user, loading, router, isAuthenticated]);

    if (loading || isLoadingDrivers) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isErrorDrivers) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">Failed to load data. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box p={4}>
            <Typography variant="h4" gutterBottom>
                Drivers
            </Typography>
            <DriversTable drivers={drivers || []} />
        </Box>
    );
}
