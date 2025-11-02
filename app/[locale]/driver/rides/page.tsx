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
          Failed to load your rides: {error.message}
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
      return 'Not Submitted';
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

  const renderRideCard = (ride: MyAssignedRide) => (
    <Card key={ride.rideId} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => router.push(`/driver/rides/${ride.rideId}`)}>
      <CardContent>
        <Box display="flex" justifyContent="between" alignItems="flex-start" mb={2}>
          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              {ride.tripNumber || `Ride ${ride.rideId.slice(0, 8)}`}
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
            <Typography variant="body2" color="text.secondary">Route</Typography>
            <Typography variant="body1">
              {ride.routeFromName || 'Not specified'} → {ride.routeToName || 'Not specified'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Client</Typography>
            <Typography variant="body1">{ride.clientName || 'Not specified'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Truck</Typography>
            <Typography variant="body1">{ride.truckLicensePlate || 'Not assigned'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">My Role</Typography>
            <Typography variant="body1">
              {ride.myRole} Driver ({ride.myPlannedHours}h planned)
            </Typography>
          </Grid>
        </Grid>

        {ride.myExecutionStatus.hasSubmitted && ride.myExecutionStatus.decimalHours && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Submitted: {ride.myExecutionStatus.decimalHours}h on {dayjs(ride.myExecutionStatus.submittedAt).format('MMM D, HH:mm')}
            </Typography>
          </Box>
        )}

        {ride.otherDrivers.length > 0 && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Other drivers: {ride.otherDrivers.map(d => 
                `${d.firstName} ${d.lastName} (${d.hasSubmittedExecution ? 'submitted' : 'not submitted'})`
              ).join(', ')}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        My Rides
      </Typography>

      {/* Date Filters */}
      <Box display="flex" gap={2} mb={3}>
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      {/* Summary */}
      <Box display="flex" gap={2} mb={3}>
        <Chip label={`Not Submitted: ${groupedRides.notSubmitted.length}`} color="warning" />
        <Chip label={`Pending: ${groupedRides.pending.length}`} color="info" />
        <Chip label={`Approved: ${groupedRides.approved.length}`} color="success" />
        <Chip label={`Rejected: ${groupedRides.rejected.length}`} color="error" />
        <Chip label={`Dispute: ${groupedRides.dispute.length}`} color="secondary" />
      </Box>

      {/* Rides Sections */}
      {groupedRides.notSubmitted.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom color="warning.main">
            Needs Execution Submission ({groupedRides.notSubmitted.length})
          </Typography>
          {groupedRides.notSubmitted.map(renderRideCard)}
        </Box>
      )}

      {groupedRides.pending.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom color="info.main">
            Pending Approval ({groupedRides.pending.length})
          </Typography>
          {groupedRides.pending.map(renderRideCard)}
        </Box>
      )}

      {groupedRides.rejected.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom color="error.main">
            Rejected - Needs Revision ({groupedRides.rejected.length})
          </Typography>
          {groupedRides.rejected.map(renderRideCard)}
        </Box>
      )}

      {groupedRides.dispute.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom color="secondary.main">
            In Dispute ({groupedRides.dispute.length})
          </Typography>
          {groupedRides.dispute.map(renderRideCard)}
        </Box>
      )}

      {groupedRides.approved.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom color="success.main">
            Approved ({groupedRides.approved.length})
          </Typography>
          {groupedRides.approved.map(renderRideCard)}
        </Box>
      )}

      {!rides || rides.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No rides found for the selected period
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Try adjusting the date range or contact your administrator
          </Typography>
        </Box>
      )}
    </Box>
  );
}

