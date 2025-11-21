'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Chip, 
  Button,
  CircularProgress,
  TextField,
  Alert
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useMyAssignedRides } from '@/hooks/useMyAssignedRides';
import { MyAssignedRide } from '@/types/myAssignedRides';
import dayjs from 'dayjs';

type StatusFilter = 'all' | 'notSubmitted' | 'pending' | 'approved' | 'rejected' | 'dispute';

export default function MyRidesPage() {
  const router = useRouter();
  const t = useTranslations();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // Date filters
  const [startDate, setStartDate] = useState<string>(
    dayjs().startOf('month').format('YYYY-MM-DD')
  );
  const [endDate, setEndDate] = useState<string>(
    dayjs().endOf('month').format('YYYY-MM-DD')
  );
  
  // Status filter - default to 'all'
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const { data: rides, isLoading, error } = useMyAssignedRides(startDate, endDate);

  // Redirect if not authenticated or not a driver
  React.useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.roles.includes('driver'))) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {t('driver.rides.errors.loadFailed', { message: error.message })}
        </Alert>
      </Box>
    );
  }

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

  const getExecutionStatusText = (ride: MyAssignedRide) => {
    if (!ride.myExecutionStatus.hasSubmitted) {
      return t('driver.rides.status.notSubmitted');
    }
    return ride.myExecutionStatus.status;
  };

  const groupedRides = {
    notSubmitted: rides?.filter(r => !r.myExecutionStatus.hasSubmitted) || [],
    pending: rides?.filter(r => r.myExecutionStatus.hasSubmitted && r.myExecutionStatus.status === 'Pending') || [],
    approved: rides?.filter(r => r.myExecutionStatus.status === 'Approved') || [],
    rejected: rides?.filter(r => r.myExecutionStatus.status === 'Rejected') || [],
    dispute: rides?.filter(r => r.myExecutionStatus.status === 'Dispute') || []
  };

  // Get filtered rides based on status filter
  const getFilteredRides = () => {
    if (statusFilter === 'all') {
      return rides || [];
    }
    return groupedRides[statusFilter] || [];
  };

  const filteredRides = getFilteredRides();

  const renderRideCard = (ride: MyAssignedRide) => (
    <Card key={ride.rideId} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => router.push(`/driver/rides/${ride.rideId}`)}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box flex={1} mr={3}>
            <Typography variant="h6" gutterBottom>
              {ride.tripNumber || t('driver.rides.other.ride', { id: ride.rideId.slice(0, 8) })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {dayjs(ride.plannedDate).format('dddd, MMMM D, YYYY')}
            </Typography>
          </Box>
          <Chip 
            label={getExecutionStatusText(ride)}
            color={getStatusColor(ride.myExecutionStatus.status)}
            size="small"
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">{t('driver.rides.fields.route')}</Typography>
            <Typography variant="body1">
              {ride.routeFromName || t('driver.rides.placeholders.notSpecified')} → {ride.routeToName || t('driver.rides.placeholders.notSpecified')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">{t('driver.rides.fields.client')}</Typography>
            <Typography variant="body1">{ride.clientName || t('driver.rides.placeholders.notSpecified')}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">{t('driver.rides.fields.truck')}</Typography>
            <Typography variant="body1">{ride.truckLicensePlate || t('driver.rides.placeholders.notAssigned')}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">{t('driver.rides.fields.myRole')}</Typography>
            <Typography variant="body1">
              {ride.myRole} {t('driver.rides.other.driverPlanned', { hours: ride.myPlannedHours })}
            </Typography>
          </Grid>
        </Grid>

        {ride.myExecutionStatus.hasSubmitted && ride.myExecutionStatus.decimalHours && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              {t('driver.rides.other.submittedOn', { 
                hours: ride.myExecutionStatus.decimalHours,
                date: dayjs(ride.myExecutionStatus.submittedAt).format('MMM D, HH:mm')
              })}
            </Typography>
          </Box>
        )}

        {ride.otherDrivers.length > 0 && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              {t('driver.rides.other.otherDrivers', { 
                list: ride.otherDrivers.map(d => 
                  `${d.firstName} ${d.lastName} (${d.hasSubmittedExecution ? t('driver.rides.statusText.submitted') : t('driver.rides.statusText.notSubmitted')})`
                ).join(', ')
              })}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        {t('driver.rides.title')}
      </Typography>

      {/* Date Filters */}
      <Box display="flex" gap={2} mb={3}>
        <TextField
          label={t('driver.rides.filters.startDate')}
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label={t('driver.rides.filters.endDate')}
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      {/* Status Filter Chips */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <Chip 
          label={`${t('driver.rides.status.all')}: ${rides?.length || 0}`}
          color="primary"
          variant={statusFilter === 'all' ? 'filled' : 'outlined'}
          onClick={() => setStatusFilter('all')}
          clickable
        />
        <Chip 
          label={`${t('driver.rides.status.notSubmittedLabel')} ${groupedRides.notSubmitted.length}`}
          color="warning"
          variant={statusFilter === 'notSubmitted' ? 'filled' : 'outlined'}
          onClick={() => setStatusFilter('notSubmitted')}
          clickable
        />
        <Chip 
          label={`${t('driver.rides.status.pendingLabel')} ${groupedRides.pending.length}`}
          color="info"
          variant={statusFilter === 'pending' ? 'filled' : 'outlined'}
          onClick={() => setStatusFilter('pending')}
          clickable
        />
        <Chip 
          label={`${t('driver.rides.status.approvedLabel')} ${groupedRides.approved.length}`}
          color="success"
          variant={statusFilter === 'approved' ? 'filled' : 'outlined'}
          onClick={() => setStatusFilter('approved')}
          clickable
        />
        <Chip 
          label={`${t('driver.rides.status.rejectedLabel')} ${groupedRides.rejected.length}`}
          color="error"
          variant={statusFilter === 'rejected' ? 'filled' : 'outlined'}
          onClick={() => setStatusFilter('rejected')}
          clickable
        />
        <Chip 
          label={`${t('driver.rides.status.disputeLabel')} ${groupedRides.dispute.length}`}
          color="secondary"
          variant={statusFilter === 'dispute' ? 'filled' : 'outlined'}
          onClick={() => setStatusFilter('dispute')}
          clickable
        />
      </Box>

      {/* Filtered Rides */}
      {filteredRides.length > 0 ? (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom>
            {statusFilter === 'all' ? t('driver.rides.sections.all') :
             statusFilter === 'notSubmitted' ? t('driver.rides.sections.needsExecution') :
             statusFilter === 'pending' ? t('driver.rides.sections.pendingApproval') :
             statusFilter === 'approved' ? t('driver.rides.sections.approved') :
             statusFilter === 'rejected' ? t('driver.rides.sections.rejectedRevision') :
             statusFilter === 'dispute' ? t('driver.rides.sections.inDispute') : ''} ({filteredRides.length})
          </Typography>
          {filteredRides.map(renderRideCard)}
        </Box>
      ) : (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            {statusFilter === 'all' 
              ? t('driver.rides.empty.noRides')
              : t('driver.rides.empty.noFilteredRides', { status: statusFilter === 'notSubmitted' ? 'unsubmitted' : statusFilter })
            }
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            {statusFilter === 'all' 
              ? t('driver.rides.empty.adjustRange')
              : t('driver.rides.empty.clickAllRides')
            }
          </Typography>
        </Box>
      )}
    </Box>
  );
}

