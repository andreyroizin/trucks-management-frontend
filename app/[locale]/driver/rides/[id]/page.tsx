'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Chip, 
  Button,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useMyExecution } from '@/hooks/useRideExecution';
import { useMyAssignedRides } from '@/hooks/useMyAssignedRides';
import RideDriverExecutionForm from '@/components/RideDriverExecutionForm';
import dayjs from 'dayjs';

export default function RideDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const t = useTranslations();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const { data: execution, isLoading: executionLoading, error: executionError, refetch } = useMyExecution(id);
  const { data: rides } = useMyAssignedRides();

  // Find the ride details from the assigned rides list
  const ride = rides?.find(r => r.rideId === id);

  // Redirect if not authenticated or not a driver
  React.useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.roles.includes('driver'))) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || executionLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (executionError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {t('driver.rideDetail.errors.loadFailed', { message: executionError.message })}
        </Alert>
      </Box>
    );
  }

  if (!ride) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          {t('driver.rideDetail.errors.rideNotFound')}
        </Alert>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => router.push('/driver/rides')}
          sx={{ mt: 2 }}
        >
          {t('driver.rideDetail.backButton')}
        </Button>
      </Box>
    );
  }

  const handleExecutionSuccess = () => {
    refetch();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NotSubmitted': return 'warning';
      case 'Pending': return 'info';
      case 'Approved': return 'success';
      case 'Rejected': return 'error';
      case 'Dispute': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => router.push('/driver/rides')}
          sx={{ mr: 2 }}
        >
          {t('driver.rideDetail.backButton')}
        </Button>
        <Typography variant="h4">
          {ride.tripNumber || t('driver.rides.other.ride', { id: ride.rideId.slice(0, 8) })}
        </Typography>
      </Box>

      {/* Ride Information Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="between" alignItems="flex-start" mb={2}>
            <Typography variant="h6" gutterBottom>
              {t('driver.rideDetail.title')}
            </Typography>
            <Chip 
              label={ride.myExecutionStatus.hasSubmitted ? ride.myExecutionStatus.status : t('driver.rideDetail.status.notSubmitted')}
              color={getStatusColor(ride.myExecutionStatus.status)}
            />
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">{t('driver.rideDetail.fields.date')}</Typography>
              <Typography variant="body1">
                {dayjs(ride.plannedDate).format('dddd, MMMM D, YYYY')}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">{t('driver.rideDetail.fields.plannedTime')}</Typography>
              <Typography variant="body1">
                {ride.plannedStartTime || t('driver.rideDetail.placeholders.notSpecified')} - {ride.plannedEndTime || t('driver.rideDetail.placeholders.notSpecified')}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">{t('driver.rideDetail.fields.route')}</Typography>
              <Typography variant="body1">
                {ride.routeFromName || t('driver.rideDetail.placeholders.notSpecified')} → {ride.routeToName || t('driver.rideDetail.placeholders.notSpecified')}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">{t('driver.rideDetail.fields.client')}</Typography>
              <Typography variant="body1">{ride.clientName || t('driver.rideDetail.placeholders.notSpecified')}</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">{t('driver.rideDetail.fields.truck')}</Typography>
              <Typography variant="body1">{ride.truckLicensePlate || t('driver.rides.placeholders.notAssigned')}</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">{t('driver.rideDetail.fields.myRole')}</Typography>
              <Typography variant="body1">
                {ride.myRole} {t('driver.rides.other.driverPlanned', { hours: ride.myPlannedHours })}
              </Typography>
            </Grid>

            {ride.otherDrivers.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">{t('driver.rideDetail.fields.otherDrivers')}</Typography>
                <Box display="flex" gap={1} mt={1}>
                  {ride.otherDrivers.map((driver, index) => (
                    <Chip 
                      key={index}
                      label={`${driver.firstName} ${driver.lastName} (${driver.isPrimary ? t('driver.rideDetail.fields.primaryDriver') : t('driver.rideDetail.fields.secondDriver')})`}
                      variant="outlined"
                      color={driver.hasSubmittedExecution ? 'success' : 'default'}
                      size="small"
                    />
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>

          {ride.myExecutionStatus.hasSubmitted && (
            <Box mt={3}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Execution Status: Submitted {ride.myExecutionStatus.decimalHours}h on{' '}
                {dayjs(ride.myExecutionStatus.submittedAt).format('MMM D, YYYY HH:mm')}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Execution Form */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {execution ? 'My Execution Details' : 'Submit Execution'}
          </Typography>
          
          {ride.myExecutionStatus.status === 'Rejected' && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Your execution was rejected. Please review and resubmit with corrections.
            </Alert>
          )}

          {ride.myExecutionStatus.status === 'Approved' && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Your execution has been approved. You can view the details below but cannot make changes.
            </Alert>
          )}

          <RideDriverExecutionForm 
            rideId={id}
            execution={execution}
            onSuccess={handleExecutionSuccess}
          />
        </CardContent>
      </Card>
    </Box>
  );
}

