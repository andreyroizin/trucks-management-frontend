'use client';

import {Box, Typography} from '@mui/material';
import {useRouter} from 'next/navigation';
import DriverDashboardCardButton from '@/components/DriverDashboardCardButton';
import {useEffect} from 'react';
import {useAuth} from '@/hooks/useAuth';
import AddIcon from "@mui/icons-material/Add";
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

    // const name = user?.firstName ? `Hello, ${user.firstName} ${user.lastName}` : 'Hello';
    const greeting = user?.firstName
        ? t('driver.greetingName', {first: user.firstName, last: user.lastName})
        : t('driver.greeting');

    const name = user?.firstName ? `Hello, ${user.firstName} ${user.lastName}` : 'Hello';

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
                    Keep track of your workdays and add new ones when needed.
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
                    title="Submit Workday"
                    subtitle="Register a new workday quickly and easily"
                    icon={<AddIcon fontSize="medium"/>}
                    highlight
                    onClick={() => router.push('/partrides/create')}
                />
                    <DriverDashboardCardButton
                        title="My Workdays"
                        subtitle="View and manage all your registered workdays"
                        onClick={() => router.push('/periods/driver/current')}
                    />
                    <DriverDashboardCardButton
                        title="Disputes"
                        subtitle="Follow up on records with changes or issues"
                        onClick={() => router.push('/disputes')}
                    />
                    <DriverDashboardCardButton
                        title="Archived Periods"
                        subtitle="See full summaries of your signed periods"
                        onClick={() => router.push('/periods/driver/archived')}
                    />
                </Box>
            </Box>
        </Box>
    );
}