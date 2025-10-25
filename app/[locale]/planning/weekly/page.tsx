'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import WeeklyPlanningPreview from '@/components/WeeklyPlanningPreview';

export default function WeeklyPlanningPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    // Access control - only Customer Admin and Employer roles
    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                router.push('/auth/login');
            } else if (
                !user?.roles.includes('globalAdmin') &&
                !user?.roles.includes('customerAdmin') &&
                !user?.roles.includes('employer')
            ) {
                router.push('/403');
            }
        }
    }, [authLoading, isAuthenticated, user, router]);

    if (authLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return <WeeklyPlanningPreview />;
}
