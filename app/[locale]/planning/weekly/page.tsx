'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import WeeklyPlanningPreview from '@/components/WeeklyPlanningPreview';
import { useTranslations } from 'next-intl';
import LanguageSelectDesktop from '@/components/LanguageSelectDesktop';

export default function WeeklyPlanningPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const t = useTranslations('planning.weekly');

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

    return (
        <Box sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        {t('title')}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        {t('subtitle')}
                    </Typography>
                </Box>
                <LanguageSelectDesktop />
            </Box>
            <WeeklyPlanningPreview />
        </Box>
    );
}
