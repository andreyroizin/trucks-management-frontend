'use client';

import React, {useEffect} from 'react';
import {Alert, Box, CircularProgress, Typography,} from '@mui/material';
import dayjs from 'dayjs';
import {useRouter} from 'next/navigation';

import {useAuth} from '@/hooks/useAuth';
import {useCurrentDriverPeriod} from '@/hooks/useCurrentDriverPeriod';
import RoundedButton from "@/components/RoundedButton";
import PeriodWeekAccordionList from "@/components/PeriodWeekAccordionList";

export default function CurrentPeriod() {
    const router = useRouter();
    const {user, isAuthenticated, loading: authLoading} = useAuth();

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) router.push('/auth/login');
            else if (!user?.roles.includes('driver') && !user?.roles.includes('globalAdmin'))
                router.push('/403');
        }
    }, [authLoading, isAuthenticated, user, router]);

    const {
        data: period,
        isLoading,
        isError,
        error,
    } = useCurrentDriverPeriod();

    if (authLoading || isLoading) {
        return (
            <Box minHeight="50vh" display="flex" justifyContent="center" alignItems="center">
                <CircularProgress/>
            </Box>
        );
    }
    if (isError || !period) {
        return (
            <Box minHeight="50vh" display="flex" justifyContent="center" alignItems="center">
                <Alert severity="error">{error?.message || 'Failed to load workdays'}</Alert>
            </Box>
        );
    }

    const periodTitle = `${period.year}-P-${period.periodNr.toString().padStart(2, '0')}`;
    const from = dayjs(period.fromDate).format('DD.MM.YYYY');
    const to = dayjs(period.toDate).format('DD.MM.YYYY');

    return (
        <Box maxWidth="700px" mx="auto" my={4}>
            <Typography variant="h4" mb={2}>My Workdays</Typography>
            <Typography color="text.secondary" mb={3}>
                Keep track of your submitted workdays and sign periods when ready.
            </Typography>

            <Box display="flex" alignItems="center" mb={1}>
                <Typography variant="h5">{periodTitle}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
                {from} — {to}
            </Typography>

            <PeriodWeekAccordionList weeks={period.weeks} year={period.year} />

            <RoundedButton label="View Older Periods" colorType="gray" sx={{marginTop: 3}}
                           onClick={() => router.push('/periods/driver/archived')}/>
        </Box>
    );
}