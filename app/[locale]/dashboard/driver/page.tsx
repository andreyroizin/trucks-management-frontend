'use client';

import {Box, Typography} from '@mui/material';
import {useRouter} from 'next/navigation';
import DriverDashboardCardButton from '@/components/DriverDashboardCardButton';
import {useEffect} from 'react';
import {useAuth} from '@/hooks/useAuth';
import {useTranslations} from 'next-intl';

export default function DriverHomePage() {
    const router = useRouter();
    const {user, isAuthenticated, loading} = useAuth();
    const t= useTranslations();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                router.push('/auth/login');
            } else if (
                !user?.roles.includes('driver') &&
                !user?.roles.includes('globalAdmin')
            ) {
                router.push('/403');
            }
        }
    }, [loading, isAuthenticated, user, router]);

    const greeting = user?.firstName
        ? t('dashboard.driver.greetingName', {first: user.firstName, last: user.lastName})
        : t('dashboard.driver.greeting');

    return (
        <Box pb={7}>
            <Box
                sx={{
                    backgroundColor: '#0C203B',
                    color: 'white',
                    textAlign: 'center',
                    py: 12,
                    px: 2,
                    mt: -2,
                    width: '100vw',
                    position: 'relative',
                    left: '50%',
                    right: '50%',
                    marginLeft: '-50vw',
                    marginRight: '-50vw',
                }}
            >
                <Typography variant="h3" fontWeight={500}>
                    {greeting}
                </Typography>
                <Typography mt={2} variant="body2">
                    {t('dashboard.driver.description')}
                </Typography>
            </Box>

            <Box mt={3} display="flex" justifyContent="center">
                <Box
                    width="100%"
                    maxWidth={{md: '600px'}}
                    display="flex"
                    flexDirection="column"
                    gap={1.5}
                    px={{xs: 2, md: 0}} // optional: adds side padding on small screens
                > <DriverDashboardCardButton
                    title={t('dashboard.driver.myRides.title')}
                    subtitle={t('dashboard.driver.myRides.subtitle')}
                    highlight
                    onClick={() => router.push('/driver/rides')}
                    />
                    <DriverDashboardCardButton
                        title={t('dashboard.driver.disputes.title')}
                        subtitle={t('dashboard.driver.disputes.subtitle')}
                        onClick={() => router.push('/disputes')}
                    />
                    <DriverDashboardCardButton
                        title={t('dashboard.driver.pending.title')}
                        subtitle={t('dashboard.driver.pending.subtitle')}
                        onClick={() => router.push('/periods/driver/pending')}
                    />
                    <DriverDashboardCardButton
                        title={t('dashboard.driver.archived.title')}
                        subtitle={t('dashboard.driver.archived.subtitle')}
                        onClick={() => router.push('/periods/driver/archived')}
                    />
                </Box>
            </Box>
        </Box>
    );
}