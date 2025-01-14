'use client';

import {useAuth} from '@/hooks/useAuth';
import {useRouter} from 'next/navigation';
import {useEffect} from 'react';
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
                                <strong>Company:</strong> {user?.companyId}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Roles:</strong>{' '}
                                {user?.roles.length > 0 ? user.roles.join(', ') : 'No roles assigned'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Postcode:</strong> {user?.postcode || 'N/A'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Phone Number:</strong> {user?.phoneNumber || 'N/A'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Address:</strong> {user?.address || 'N/A'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>City:</strong> {user?.city || 'N/A'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Country:</strong> {user?.country || 'N/A'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Remark:</strong> {user?.remark || 'N/A'}
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
}
