'use client';

import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
  Card,
  CardContent,
  Chip,
    Button,
  Grid,
  TextField,
    CircularProgress,
  Alert,
  Paper,
  Stack,
  Divider,
  IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useAuth } from '@/hooks/useAuth';
import { useMyAssignedRides } from '@/hooks/useMyAssignedRides';
import RideExecutionDisputeDialog from '@/components/RideExecutionDisputeDialog';

export default function DriverDisputesPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  
  // Filter states
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  
  // Dialog states
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [selectedRide, setSelectedRide] = useState<any>(null);

  // Data hooks
  const { data: myAssignedRides, isLoading, error } = useMyAssignedRides();

  // Get all rides with disputes or that can be disputed (rejected)
  const disputeableRides = useMemo(() => {
    if (!myAssignedRides) return [];
    
    return myAssignedRides.filter(ride => {
      const status = ride.myExecutionStatus?.status;
      return status === 'Dispute' || status === 'Rejected';
    });
  }, [myAssignedRides]);

  // Apply frontend filtering
  const filteredRides = useMemo(() => {
    return disputeableRides.filter(ride => {
      // Date filtering
      if (startDate || endDate) {
        const rideDate = dayjs(ride.plannedDate);
        if (startDate && rideDate.isBefore(startDate, 'day')) return false;
        if (endDate && rideDate.isAfter(endDate, 'day')) return false;
      }
      
      return true;
    });
  }, [disputeableRides, startDate, endDate]);

  // Separate active disputes from rejections
  const activeDisputes = filteredRides.filter(ride => ride.myExecutionStatus?.status === 'Dispute');
  const rejectedExecutions = filteredRides.filter(ride => ride.myExecutionStatus?.status === 'Rejected');

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const openDisputeDialog = (ride: any) => {
    setSelectedRide(ride);
    setDisputeDialogOpen(true);
  };

  const closeDisputeDialog = () => {
    setDisputeDialogOpen(false);
    setSelectedRide(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Dispute': return 'warning';
      case 'Rejected': return 'error';
      default: return 'default';
    }
    };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Dispute': return t('driver.disputes.status.underDispute');
      case 'Rejected': return t('driver.disputes.status.rejected');
      default: return status;
    }
  };

  if (error) {
        return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            {t('driver.disputes.errors.loadFailed', { message: error.message })}
          </Alert>
            </Box>
      </LocalizationProvider>
        );
  }

    return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.push('/dashboard/driver')} size="large">
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" gutterBottom>
              {t('driver.disputes.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('driver.disputes.subtitle')}
            </Typography>
          </Box>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label={t('driver.disputes.filters.startDate')}
                    value={startDate}
                    onChange={setStartDate}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label={t('driver.disputes.filters.endDate')}
                    value={endDate}
                    onChange={setEndDate}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                <Chip 
                  label={t('driver.disputes.chips.activeDisputes', { count: activeDisputes.length })}
                  color="warning"
                  variant="filled"
                  size="small"
                />
                <Chip 
                  label={t('driver.disputes.chips.canDispute', { count: rejectedExecutions.length })}
                  color="error"
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>

          {/* Clear Filters Button */}
          {(startDate || endDate) && (
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" size="small" onClick={clearFilters}>
                {t('driver.disputes.filters.clearFilters')}
              </Button>
            </Box>
          )}
        </Paper>

        {/* Loading State */}
        {isLoading && (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        )}

        {/* Results */}
        {!isLoading && (
          <>
            {/* Active Disputes Section */}
            {activeDisputes.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'warning.main', fontWeight: 600 }}>
                  {t('driver.disputes.sections.activeDisputes', { count: activeDisputes.length })}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('driver.disputes.sections.descriptionActive')}
                </Typography>
                <Stack spacing={2}>
                  {activeDisputes.map((ride) => (
                    <Card key={ride.rideId} sx={{ border: '1px solid', borderColor: 'warning.main' }}>
                      <CardContent>
                        <Grid container alignItems="center" spacing={2}>
                          <Grid item xs={12} md={8}>
                            <Typography variant="h6" gutterBottom>
                              {ride.tripNumber || `Ride ${ride.rideId.slice(0, 8)}`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {dayjs(ride.plannedDate).format('dddd, MMMM D, YYYY')}
                            </Typography>
                            {ride.routeFromName && ride.routeToName && (
                              <Typography variant="body2" color="text.secondary">
                                📍 {ride.routeFromName} → {ride.routeToName}
                              </Typography>
                            )}
                            {ride.clientName && (
                              <Typography variant="body2" color="text.secondary">
                                🏢 {ride.clientName}
                              </Typography>
                            )}
                          </Grid>
                          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                            <Box sx={{ mb: 2 }}>
                              <Chip 
                                label={getStatusText(ride.myExecutionStatus?.status || '')}
                                color={getStatusColor(ride.myExecutionStatus?.status || '')}
                                size="small"
                              />
                            </Box>
                            <Button
                              variant="outlined"
                              color="warning"
                              size="small"
                              onClick={() => openDisputeDialog(ride)}
                            >
                              {t('driver.disputes.buttons.viewDispute')}
                            </Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Rejected Executions Section */}
            {rejectedExecutions.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'error.main', fontWeight: 600 }}>
                  {t('driver.disputes.sections.rejectedExecutions', { count: rejectedExecutions.length })}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('driver.disputes.sections.descriptionRejected')}
                </Typography>
                <Stack spacing={2}>
                  {rejectedExecutions.map((ride) => (
                    <Card key={ride.rideId} sx={{ border: '1px solid', borderColor: 'error.main' }}>
                      <CardContent>
                        <Grid container alignItems="center" spacing={2}>
                          <Grid item xs={12} md={8}>
                            <Typography variant="h6" gutterBottom>
                              {ride.tripNumber || `Ride ${ride.rideId.slice(0, 8)}`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {dayjs(ride.plannedDate).format('dddd, MMMM D, YYYY')}
                            </Typography>
                            {ride.routeFromName && ride.routeToName && (
                              <Typography variant="body2" color="text.secondary">
                                📍 {ride.routeFromName} → {ride.routeToName}
                              </Typography>
                            )}
                            {ride.clientName && (
                              <Typography variant="body2" color="text.secondary">
                                🏢 {ride.clientName}
                              </Typography>
                            )}
                          </Grid>
                          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                            <Box sx={{ mb: 2 }}>
                              <Chip 
                                label={getStatusText(ride.myExecutionStatus?.status || '')}
                                color={getStatusColor(ride.myExecutionStatus?.status || '')}
                                size="small"
                              />
                            </Box>
                <Button
                    variant="contained"
                              color="warning"
                              size="small"
                              onClick={() => openDisputeDialog(ride)}
                >
                              {t('driver.disputes.buttons.createDispute')}
                </Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
            </Box>
            )}

            {/* Empty State */}
            {filteredRides.length === 0 && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {disputeableRides.length === 0 
                    ? t('driver.disputes.empty.noDisputes')
                    : t('driver.disputes.empty.noResults')
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {disputeableRides.length === 0
                    ? t('driver.disputes.empty.allApproved')
                    : t('driver.disputes.empty.adjustFilters')
                  }
                </Typography>
                {(startDate || endDate) && (
                  <Button variant="outlined" onClick={clearFilters} sx={{ mt: 2 }}>
                    {t('driver.disputes.filters.clearFilters')}
                  </Button>
                )}
              </Paper>
            )}
          </>
        )}

        {/* Dispute Dialog */}
        {selectedRide && (
          <RideExecutionDisputeDialog
            open={disputeDialogOpen}
            onClose={closeDisputeDialog}
            rideId={selectedRide.rideId}
            executionStatus={selectedRide.myExecutionStatus?.status || 'Rejected'}
            rideInfo={{
              plannedDate: selectedRide.plannedDate,
              tripNumber: selectedRide.tripNumber,
              route: selectedRide.routeFromName && selectedRide.routeToName
                ? `${selectedRide.routeFromName} → ${selectedRide.routeToName}`
                : undefined,
            }}
          />
        )}
        </Box>
    </LocalizationProvider>
    );
}