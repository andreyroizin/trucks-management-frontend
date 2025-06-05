'use client';

import React, {useEffect} from 'react';
import {Alert, Box, Chip, CircularProgress, Typography,} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import dayjs from 'dayjs';
import {useRouter} from 'next/navigation';

import {useAuth} from '@/hooks/useAuth';
import {useCurrentDriverPeriod} from '@/hooks/useCurrentDriverPeriod';
import RoundedButton from "@/components/RoundedButton";
import PeriodWeekAccordionList from "@/components/PeriodWeekAccordionList";

/* ---------- mapping helpers ---------- */
const periodStatus = (s: number) =>
    s === 0 ? 'Ready to sign'
        : s === 1 ? 'In Progress'
            : s === 2 ? 'Signed'
                : s === 3 ? 'Invalidated'
                    : 'Unknown';

const periodColor = (s: number) =>
    s === 0 ? 'success'
        : s === 1 ? 'info'
            : s === 2 ? 'success'
                : s === 3 ? 'error'
                    : 'warning';

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
        <Box maxWidth="700px" mx="auto" p={{xs: 2, md: 4}}>
            <Typography variant="h4" mb={2}>My Workdays</Typography>
            <Typography color="text.secondary" mb={3}>
                Keep track of your submitted workdays and sign periods when ready.
            </Typography>

            <Box display="flex" alignItems="center" mb={1}>
                <Typography variant="h5">{periodTitle}</Typography>
                <Chip
                    sx={{ml: 2}}
                    size="small"
                    label={periodStatus(period.status)}
                    color={periodColor(period.status)}
                />
            </Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
                {from} — {to}
            </Typography>

            {period.status === 0 && (
                <>
                    <Typography variant="body2" mb={0}>
                        All records in this period are approved. Please review and sign to confirm.
                    </Typography>
                    <RoundedButton
                        label="Sign This Period"
                        colorType="green"
                        icon={<CheckIcon/>}
                        sx={{mb: 2}}
                        onClick={() => {
                            router.push('/workdays/sign')
                        }}
                    />
                </>
            )}

            {period.status === 1 && (
                <Typography variant="body2" mb={3}>
                    This period is still in progress. You’ll be able to sign it once all records are approved.
                </Typography>
            )}

            {period.status === 2 && (
                <Typography variant="body2" mb={3}>
                    This period has already been signed. You can view the details below.
                </Typography>
            )}
            {period.status === 3 && (
                <>
                    <Typography variant="body2" mb={0}>
                        This period was changed after being signed. Please review and re-sign if necessary.
                    </Typography>
                    <RoundedButton
                        label="Sign This Period"
                        colorType="green"
                        icon={<CheckIcon/>}
                        sx={{mb: 2}}
                        onClick={() => {
                            router.push('/workdays/sign')
                        }}
                    />
                </>
            )}

            <PeriodWeekAccordionList weeks={period.weeks} />

            <RoundedButton label="View Pending Periods" colorType="gray"
                           onClick={() => router.push('/periods/driver/pending')}/>

            <RoundedButton label="View Older Periods" colorType="gray"
                           onClick={() => router.push('/periods/driver/archived')}/>
        </Box>
    );
}