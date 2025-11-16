'use client';

import {useAuth} from '@/hooks/useAuth';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
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
    Button,
    Chip,
    Alert,
    Link,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';
import {useDriverWithContract} from '@/hooks/useDriverWithContract';
import {useGenerateTelegramLink, useDisableTelegramNotifications} from '@/hooks/useTelegramNotifications';
import {useSnack} from '@/providers/SnackProvider';
import dayjs from 'dayjs';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TelegramIcon from '@mui/icons-material/Telegram';

export default function ProfilePage() {
    const {user, isAuthenticated, loading} = useAuth();
    const router = useRouter();
    const t = useTranslations('profile');
    const showSnack = useSnack();
    
    // Get driver data if user is a driver
    const driverIdFromUser = user?.driverInfo?.driverId;
    const isDriver = user?.roles.includes('driver') && !!driverIdFromUser;
    const {data: driverData, isLoading: isLoadingDriver} = useDriverWithContract(driverIdFromUser || '');
    
    // Use driverData.id if available (more reliable), otherwise fall back to driverInfo.driverId
    const driverId = driverData?.id || driverIdFromUser;
    
    // Telegram notification state
    const [registrationUrl, setRegistrationUrl] = useState<string | null>(null);
    const [linkExpiresAt, setLinkExpiresAt] = useState<string | null>(null);
    
    const {mutateAsync: generateLink, isPending: isGenerating} = useGenerateTelegramLink();
    const {mutateAsync: disableNotifications, isPending: isDisabling} = useDisableTelegramNotifications();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/auth/login'); // Redirect to login if not authenticated
        }
    }, [isAuthenticated, loading, router]);
    
    // Check if driver is registered
    const isTelegramActive = driverData?.telegramNotificationsEnabled === true;
    
    const handleGenerateLink = async () => {
        if (!driverId) return;
        
        try {
            const result = await generateLink(driverId);
            setRegistrationUrl(result.registrationUrl);
            setLinkExpiresAt(result.expiresAt);
            showSnack({text: t('telegram.success.linkGenerated'), severity: 'success'});
        } catch (error: any) {
            showSnack({
                text: error.message || t('telegram.errors.generateFailed'),
                severity: 'error'
            });
        }
    };
    
    const handleDisable = async () => {
        if (!driverId) return;
        
        if (!confirm(t('telegram.actions.disable') + '?')) {
            return;
        }
        
        try {
            await disableNotifications(driverId);
            setRegistrationUrl(null);
            setLinkExpiresAt(null);
            showSnack({text: t('telegram.success.disabled'), severity: 'success'});
        } catch (error: any) {
            showSnack({
                text: error.message || t('telegram.errors.disableFailed'),
                severity: 'error'
            });
        }
    };
    
    // Check if registration link is expired
    const isLinkExpired = linkExpiresAt ? dayjs(linkExpiresAt).isBefore(dayjs()) : false;
    
    // Calculate time until expiration
    const getExpirationTime = () => {
        if (!linkExpiresAt) return null;
        const diff = dayjs(linkExpiresAt).diff(dayjs());
        if (diff <= 0) return null;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    };

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
                    
                    {/* Telegram Notifications Section - Only for Drivers */}
                    {isDriver && (
                        <>
                            <Divider sx={{my: 3}}/>
                            
                            <Box>
                                <Typography variant="h6" sx={{mb: 2, fontWeight: 500}}>
                                    {t('telegram.title')}
                                </Typography>
                                
                                <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                                    {t('telegram.description')}
                                </Typography>
                                
                                <List dense sx={{mb: 2, pl: 2}}>
                                    <ListItem sx={{py: 0.5, px: 0}}>
                                        <ListItemText 
                                            primary={`• ${t('telegram.descriptionPoints.assigned')}`}
                                            primaryTypographyProps={{variant: 'body2', color: 'text.secondary'}}
                                        />
                                    </ListItem>
                                    <ListItem sx={{py: 0.5, px: 0}}>
                                        <ListItemText 
                                            primary={`• ${t('telegram.descriptionPoints.secondDriver')}`}
                                            primaryTypographyProps={{variant: 'body2', color: 'text.secondary'}}
                                        />
                                    </ListItem>
                                    <ListItem sx={{py: 0.5, px: 0}}>
                                        <ListItemText 
                                            primary={`• ${t('telegram.descriptionPoints.rideUpdated')}`}
                                            primaryTypographyProps={{variant: 'body2', color: 'text.secondary'}}
                                        />
                                    </ListItem>
                                    <ListItem sx={{py: 0.5, px: 0}}>
                                        <ListItemText 
                                            primary={`• ${t('telegram.descriptionPoints.rideDeleted')}`}
                                            primaryTypographyProps={{variant: 'body2', color: 'text.secondary'}}
                                        />
                                    </ListItem>
                                </List>
                                
                                <Alert severity="info" sx={{mb: 2}}>
                                    {t('telegram.onlyToday')}
                                </Alert>
                                
                                {isLoadingDriver ? (
                                    <Box display="flex" justifyContent="center" py={2}>
                                        <CircularProgress size={24}/>
                                    </Box>
                                ) : (
                                    <>
                                        {/* Current Status */}
                                        <Box sx={{mb: 2}}>
                                            <Box display="flex" alignItems="center" gap={1} sx={{mb: 1}}>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {t('telegram.title')}:
                                                </Typography>
                                                {isTelegramActive ? (
                                                    <Chip
                                                        icon={<CheckCircleIcon/>}
                                                        label={t('telegram.status.active')}
                                                        color="success"
                                                        size="small"
                                                    />
                                                ) : (
                                                    <Chip
                                                        icon={<CancelIcon/>}
                                                        label={t('telegram.status.inactive')}
                                                        color="default"
                                                        size="small"
                                                    />
                                                )}
                                            </Box>
                                            
                                            {isTelegramActive && driverData?.telegramRegisteredAt && (
                                                <Typography variant="body2" color="text.secondary">
                                                    {t('telegram.registeredAt')}{' '}
                                                    {dayjs(driverData.telegramRegisteredAt).format('DD-MM-YYYY HH:mm')}
                                                </Typography>
                                            )}
                                        </Box>
                                        
                                        {/* Action Buttons */}
                                        {!isTelegramActive && !registrationUrl && (
                                            <Button
                                                variant="contained"
                                                startIcon={<TelegramIcon/>}
                                                onClick={handleGenerateLink}
                                                disabled={isGenerating}
                                                sx={{mb: 2}}
                                            >
                                                {isGenerating ? t('telegram.actions.connecting') : t('telegram.actions.enable')}
                                            </Button>
                                        )}
                                        
                                        {isTelegramActive && (
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                onClick={handleDisable}
                                                disabled={isDisabling}
                                                sx={{mb: 2}}
                                            >
                                                {isDisabling ? t('telegram.actions.disabling') : t('telegram.actions.disable')}
                                            </Button>
                                        )}
                                        
                                        {/* Registration Link */}
                                        {registrationUrl && (
                                            <Box sx={{mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1}}>
                                                <Typography variant="subtitle2" sx={{mb: 1, fontWeight: 500}}>
                                                    {t('telegram.registration.title')}
                                                </Typography>
                                                
                                                {isLinkExpired ? (
                                                    <Alert severity="warning" sx={{mb: 2}}>
                                                        {t('telegram.registration.linkExpired')}
                                                    </Alert>
                                                ) : (
                                                    <>
                                                        <Typography variant="body2" sx={{mb: 1}}>
                                                            <strong>{t('telegram.registration.instructions')}</strong>
                                                        </Typography>
                                                        <List dense sx={{mb: 2, pl: 2}}>
                                                            <ListItem sx={{py: 0.5, px: 0}}>
                                                                <ListItemText 
                                                                    primary={`1. ${t('telegram.registration.step1')}`}
                                                                    primaryTypographyProps={{variant: 'body2'}}
                                                                />
                                                            </ListItem>
                                                            <ListItem sx={{py: 0.5, px: 0}}>
                                                                <ListItemText 
                                                                    primary={`2. ${t('telegram.registration.step2')}`}
                                                                    primaryTypographyProps={{variant: 'body2'}}
                                                                />
                                                            </ListItem>
                                                            <ListItem sx={{py: 0.5, px: 0}}>
                                                                <ListItemText 
                                                                    primary={`3. ${t('telegram.registration.step3')}`}
                                                                    primaryTypographyProps={{variant: 'body2'}}
                                                                />
                                                            </ListItem>
                                                            <ListItem sx={{py: 0.5, px: 0}}>
                                                                <ListItemText 
                                                                    primary={`4. ${t('telegram.registration.step4')}`}
                                                                    primaryTypographyProps={{variant: 'body2'}}
                                                                />
                                                            </ListItem>
                                                            <ListItem sx={{py: 0.5, px: 0}}>
                                                                <ListItemText 
                                                                    primary={`5. ${t('telegram.registration.step5')}`}
                                                                    primaryTypographyProps={{variant: 'body2'}}
                                                                />
                                                            </ListItem>
                                                        </List>
                                                        
                                                        <Typography variant="body2" sx={{mb: 1, fontWeight: 500}}>
                                                            {t('telegram.registration.linkLabel')}
                                                        </Typography>
                                                        
                                                        <Box sx={{mb: 2}}>
                                                            <Link
                                                                href={registrationUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                sx={{
                                                                    wordBreak: 'break-all',
                                                                    color: 'primary.main',
                                                                    textDecoration: 'underline',
                                                                    '&:hover': {
                                                                        textDecoration: 'underline'
                                                                    }
                                                                }}
                                                            >
                                                                {registrationUrl}
                                                            </Link>
                                                        </Box>
                                                        
                                                        {getExpirationTime() && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                {t('telegram.registration.expiresIn')} {getExpirationTime()}
                                                            </Typography>
                                                        )}
                                                        
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            onClick={handleGenerateLink}
                                                            disabled={isGenerating}
                                                            sx={{mt: 2}}
                                                        >
                                                            {t('telegram.actions.generateLink')}
                                                        </Button>
                                                    </>
                                                )}
                                            </Box>
                                        )}
                                    </>
                                )}
                            </Box>
                        </>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}
