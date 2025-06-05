'use client';

import {Box, Typography} from '@mui/material';
import {useRouter} from 'next/navigation';
import DriverDashboardCardButton from '@/components/DriverDashboardCardButton';
import {useEffect} from 'react';
import {useAuth} from '@/hooks/useAuth';
import AddIcon from "@mui/icons-material/Add";

export default function DriverHomePage() {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useAuth();

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

    const name = user?.firstName ? `Hello, ${user.firstName} ${user.lastName}` : 'Hello';

    return (
        <Box>
            <Box
                sx={{
                    backgroundColor: '#0b1e39',
                    color: 'white',
                    textAlign: 'center',
                    py: 6,
                    borderBottomLeftRadius: 16,
                    borderBottomRightRadius: 16,
                }}
            >
                <Typography variant="h3" fontWeight={500}>
                    {name}
                </Typography>
                <Typography mt={2}>
                    Keep track of your workdays and add new ones when needed.
                </Typography>
            </Box>

            <Box mt={4} px={2} display="flex" flexDirection="column" gap={2}>
                <DriverDashboardCardButton
                    title="Submit Workday"
                    subtitle="Register a new workday quickly and easily"
                    icon={<AddIcon fontSize="medium" />}
                    highlight
                    onClick={() => router.push('/partrides/create')}
                />
                <DriverDashboardCardButton
                    title="My Workdays"
                    subtitle="View and manage all your registered workdays"
                    onClick={() => router.push('/workdays')}
                />
                <DriverDashboardCardButton
                    title="Disputes"
                    subtitle="Follow up on records with changes or issues"
                    onClick={() => router.push('/workdays/disputes')}
                />
                <DriverDashboardCardButton
                    title="Archived Periods"
                    subtitle="See full summaries of your signed periods"
                    onClick={() => router.push('/periods/driver/archived')}
                />
            </Box>
        </Box>
    );
}