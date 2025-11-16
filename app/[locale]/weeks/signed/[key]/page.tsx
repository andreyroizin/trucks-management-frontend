'use client';

import React from 'react';
import {Box, Button, CircularProgress, Typography,} from '@mui/material';
import {useParams, useRouter} from 'next/navigation';
import {useDriverWeekDetails} from '@/hooks/useDriverWeekDetails';
import WeekSummary from "@/components/WeekSummary";
import { useTranslations } from 'next-intl';
import DescriptionIcon from '@mui/icons-material/Description';

export default function SignWorkWeekPage() {
    const t = useTranslations('weeks.driver.signed');
    const params = useParams<{ key: string }>();
    const router = useRouter();
    const [yearStr, weekStr] = params.key.split('-');
    const year = parseInt(yearStr, 10);
    const weekNumber = parseInt(weekStr, 10);

    const {data, isLoading, error} = useDriverWeekDetails(year, weekNumber);

    // ─── Loading / Error ──────────────────────────────────────────────
    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" mt={6}>
                <CircularProgress/>
            </Box>
        );
    }

    if (!data || error) {
        return (
            <Typography color="error" mt={4} textAlign="center">
                {error instanceof Error ? error.message : t('loadError')}
            </Typography>
        );
    }

    return (
        <Box maxWidth="600px" mx="auto" py={4}>
            <Typography variant="h4" sx={{ fontWeight: 500 }}>
                {t('title', { week: data.weekNumber })}
            </Typography>
            {data.status !== 2 ? (
                <Box mt={4} display="flex" flexDirection="column" alignItems="center" gap={2}>
                    <Typography variant="body1" color="warning.main">
                        {t('notSigned')}
                    </Typography>
                    <Button variant="contained" color="primary" href="/periods/driver/current">
                        {t('goToCurrent')}
                    </Button>
                </Box>
            ) : (
                <>
                    <WeekSummary
                        week={data.weekNumber}
                        year={data.year}
                        executions={data.executions}
                        totalHours={data.totalHours}
                        totalCompensation={data.totalCompensation}
                        adminAllowedAt={data.adminAllowedAt}
                    />
                    
                    {/* Generate Invoice Button */}
                    <Box display="flex" justifyContent="center" mt={4}>
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            startIcon={<DescriptionIcon />}
                            onClick={() => router.push(`/weeks/signed/${year}-${weekNumber}/invoice`)}
                            sx={{ minWidth: 200 }}
                        >
                            {t('generateInvoice')}
                        </Button>
                    </Box>
                </>
            )}
        </Box>
    );
}
