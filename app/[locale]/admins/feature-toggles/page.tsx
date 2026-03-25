'use client';

import React from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import LanguageSelectDesktop from '@/components/LanguageSelectDesktop';
import FeatureToggleManager from '@/components/FeatureToggleManager';

export default function FeatureTogglesPage() {
    const t = useTranslations();
    const { user, loading } = useAuth();

    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" mt={4}>
                <CircularProgress />
            </Box>
        );
    }

    if (!isGlobalAdmin) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{t('moduleToggles.noPermission')}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h3" fontWeight={500}>
                    {t('moduleToggles.title')}
                </Typography>
                <LanguageSelectDesktop />
            </Box>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {t('moduleToggles.subtitle')}
            </Typography>

            <FeatureToggleManager />
        </Box>
    );
}
