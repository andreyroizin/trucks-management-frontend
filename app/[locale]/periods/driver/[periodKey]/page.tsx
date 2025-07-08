'use client';

import React, {useEffect} from 'react';
import {Alert, Box, CircularProgress, Paper, Typography,} from '@mui/material';
import {useParams, useRouter} from 'next/navigation';

import {useAuth} from '@/hooks/useAuth';
import {useDriverPeriodDetail} from '@/hooks/useDriverPeriodDetail';
import PeriodWeekAccordionList from "@/components/PeriodWeekAccordionList";
import dayjs from "dayjs";

export default function DriverPeriodDetailPage() {
    const router = useRouter();
    const {periodKey} = useParams();                 // URL: …/periods/driver/[periodKey]
    const periodId = periodKey as string;

    /* ---------- access guard (drivers & globalAdmins only) ---------- */
    const {user, isAuthenticated, loading: authLoading} = useAuth();
    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) router.push('/auth/login');
            else if (
                !user?.roles.includes('driver') &&
                !user?.roles.includes('globalAdmin')
            ) router.push('/403');
        }
    }, [authLoading, isAuthenticated, user, router]);
    /* ---------------------------------------------------------------- */

    const {
        data,
        isLoading,
        isError,
        error,
    } = useDriverPeriodDetail(periodId);

    /* ---------- loading / error states ------------------------------ */
    if (authLoading || isLoading) {
        return (
            <Box minHeight="50vh" display="flex" justifyContent="center" alignItems="center">
                <CircularProgress/>
            </Box>
        );
    }
    if (isError || !data) {
        return (
            <Box minHeight="50vh" display="flex" justifyContent="center" alignItems="center">
                <Alert severity="error">
                    {error instanceof Error ? error.message : 'Failed to load period.'}
                </Alert>
            </Box>
        );
    }
    /* ---------------------------------------------------------------- */

    /* ---------- helpers --------------------------------------------- */
    const period = `${data.year}-${data.periodNr.toString().padStart(2, '0')}`;
    const periodLabel = `${period} Period`;
    const from = dayjs(data.fromDate).format('DD.MM.YYYY');
    const to = dayjs(data.toDate).format('DD.MM.YYYY');

    /* ---------------------------------------------------------------- */

    return (
        <Box maxWidth="700px" mx="auto" my={4}>
            <Typography variant="h4" gutterBottom>
                {periodLabel}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
                {from} — {to}
            </Typography>

            <Typography color="text.secondary" mb={3}>
                Here’s a breakdown of your work and earnings for this period.
            </Typography>

            {/* KPI cards */}
            <Box
                display="flex"
                flexDirection={{xs: 'column', sm: 'row'}}
                gap={2}
                mb={2}
            >
                <Box flex={1}>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography color="text.secondary" gutterBottom>
                            Forecasted
                        </Typography>
                        <Typography variant="h5" fontWeight={500}>
                            €{data.totalEarnings.toFixed(2)}
                        </Typography>
                    </Paper>
                </Box>

                <Box flex={1}>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                        }}
                    >
                        <Typography color="text.secondary" gutterBottom>
                            Total Hours Worked
                        </Typography>
                        <Typography variant="h5" fontWeight={500}>
                            {data.totalDecimalHours}
                        </Typography>
                    </Paper>
                </Box>
            </Box>

            {/*/!* Download link (optional – shown for *signed* periods only) *!/*/}
            {/*{data.status === 2 && (*/}
            {/*    <DownloadCardButton*/}
            {/*        label={`${period} Expanded file with salary`}*/}
            {/*        icon={<Download color="primary" />}*/}
            {/*        sx={{ mb: 3, mx: 'auto' }} // <-- margin-top & horizontal center*/}
            {/*        onClick={() => {*/}
            {/*            // download logic here*/}
            {/*        }}*/}
            {/*    />*/}
            {/*)}*/}

            <PeriodWeekAccordionList weeks={data.weeks} year={data.year} />
        </Box>
    );
}
