'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Paper } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from 'next-intl';

export default function LongTermPlanningPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const t = useTranslations('planning.longTerm');

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
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                Long-Term Planning
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Define recurring delivery patterns and capacity templates for clients
            </Typography>

            <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Client Capacity Templates
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Create standing schedules for clients with predictable delivery patterns.
                    Define how many trucks are needed per weekday within specific date ranges.
                </Typography>
                
                <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        📋 Coming soon: Template management interface
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
}
