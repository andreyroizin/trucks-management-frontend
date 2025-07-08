'use client';

import React, {useEffect} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {useUserDetails} from '@/hooks/useUser';
import DriverDetails from '@/components/DriverDetails';
import {Alert, Box, CircularProgress} from '@mui/material';
import {useAuth} from "@/hooks/useAuth";

export default function DriverDetailPage() {
    const router = useRouter();
    const params = useParams();
    const applicationUserId = params?.id as string;
    const {user, isAuthenticated, loading} = useAuth();

    // Fetch driver details using the existing useUserDetails hook
    const { data: driver, isLoading, isError } = useUserDetails(applicationUserId);

    // Access control: Only allow 'globalAdmin' or 'customerAdmin'
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));

        if (!loading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login'); // Redirect to login if not authorized
        }
    }, [isAuthenticated, loading, router, user?.roles]);

    if (isLoading || loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isError || !driver) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">Failed to load driver details. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box p={4}>
            <DriverDetails driver={driver} />
        </Box>
    );
}
