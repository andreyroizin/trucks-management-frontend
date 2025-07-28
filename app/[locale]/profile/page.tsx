'use client';

import {useAuth} from '@/hooks/useAuth';
import {useRouter} from 'next/navigation';
import {useEffect} from 'react';
import {useTranslations} from 'next-intl';
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Grid,
    Divider,
    Avatar,
} from '@mui/material';

export default function ProfilePage() {
    const {user, isAuthenticated, loading} = useAuth();
    const router = useRouter();
    const t = useTranslations('profile');

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/auth/login'); // Redirect to login if not authenticated
        }
    }, [isAuthenticated, loading, router]);

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                    backgroundColor: '#f5f5f5',
                }}
            >
                <CircularProgress/>
            </Box>
        );
    }

    if (!isAuthenticated) {
        return null; // Prevent rendering until authentication state is determined
    }

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: '#f5f5f5',
                padding: 3,
            }}
        >
            <Card sx={{maxWidth: 600, width: '100%', padding: 2}}>
                <CardContent>
                    <Box sx={{textAlign: 'center', mb: 3}}>
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                margin: '0 auto',
                                bgcolor: 'primary.main',
                                fontSize: '2rem',
                            }}
                        >
                            {user?.firstName?.charAt(0)} {user?.lastName?.charAt(0)}
                        </Avatar>
                        <Typography variant="h5" sx={{mt: 1, fontWeight: 'bold'}}>
                            {user?.firstName} {user?.lastName}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            {user?.email}
                        </Typography>
                    </Box>

                    <Divider sx={{mb: 3}}/>

                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>{t('fields.company')}:</strong> {user?.companyId}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>{t('fields.roles')}:</strong>{' '}
                                {user?.roles && user?.roles.length > 0 ? user.roles.join(', ') : t('noRolesAssigned')}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>{t('fields.postcode')}:</strong> {user?.postcode || t('notAvailable')}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>{t('fields.phoneNumber')}:</strong> {user?.phoneNumber || t('notAvailable')}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>{t('fields.address')}:</strong> {user?.address || t('notAvailable')}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>{t('fields.city')}:</strong> {user?.city || t('notAvailable')}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>{t('fields.country')}:</strong> {user?.country || t('notAvailable')}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>{t('fields.remark')}:</strong> {user?.remark || t('notAvailable')}
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
}
