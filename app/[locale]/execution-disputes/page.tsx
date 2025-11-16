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
  Autocomplete,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslations } from 'next-intl';

import { useAuth } from '@/hooks/useAuth';
import { useRidesPendingApproval } from '@/hooks/useRideExecutionApproval';
import { useDriversAndTrucks } from '@/hooks/useDriversAndTrucks';
import RideExecutionApprovalCard from '@/components/RideExecutionApprovalCard';

export default function DisputesPage() {
  const t = useTranslations();
  const { user } = useAuth();
  
  // Filter states - always show disputes only
  const statusFilter = 'Dispute'; // Fixed to Dispute only
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  // Data hooks
  const { drivers, isLoadingDrivers } = useDriversAndTrucks();
  const { data: allRidesFromAPI, isLoading, error } = useRidesPendingApproval(
    selectedCompanyId,
    statusFilter // Always 'Dispute'
  );

  // Get all data for statistics (always fetch 'all' status for accurate counts)
  const { data: allFilteredRides } = useRidesPendingApproval(
    selectedCompanyId,
    'all'
  );

  // Frontend filtering for date and driver
  const filteredRides = useMemo(() => {
    if (!allRidesFromAPI) return [];
    
    return allRidesFromAPI.filter(ride => {
      // Date filtering
      if (startDate || endDate) {
        const rideDate = dayjs(ride.plannedDate);
        if (startDate && rideDate.isBefore(startDate, 'day')) return false;
        if (endDate && rideDate.isAfter(endDate, 'day')) return false;
      }
      
      // Driver filtering
      if (selectedDriverIds.length > 0) {
        const rideDriverIds = ride.executions.map(exec => exec.driverId);
        const hasSelectedDriver = selectedDriverIds.some(driverId => 
          rideDriverIds.includes(driverId)
        );
        if (!hasSelectedDriver) return false;
      }
      
      return true;
    });
  }, [allRidesFromAPI, startDate, endDate, selectedDriverIds]);

  // Calculate statistics from all filtered rides (for accurate counts)
  const executionStats = useMemo(() => {
    if (!allFilteredRides) return { all: 0, Pending: 0, Approved: 0, Rejected: 0, Dispute: 0 };
    
    const allExecutions = allFilteredRides.flatMap(ride => 
      ride.executions.filter(exec => {
        // Apply same frontend filters for statistics
        if (startDate || endDate) {
          const rideDate = dayjs(ride.plannedDate);
          if (startDate && rideDate.isBefore(startDate, 'day')) return false;
          if (endDate && rideDate.isAfter(endDate, 'day')) return false;
        }
        
        if (selectedDriverIds.length > 0) {
          if (!selectedDriverIds.includes(exec.driverId)) return false;
        }
        
        return true;
      })
    );
    
    return {
      all: allExecutions.length,
      Pending: allExecutions.filter(exec => exec.status === 'Pending').length,
      Approved: allExecutions.filter(exec => exec.status === 'Approved').length,
      Rejected: allExecutions.filter(exec => exec.status === 'Rejected').length,
      Dispute: allExecutions.filter(exec => exec.status === 'Dispute').length,
    };
  }, [allFilteredRides, startDate, endDate, selectedDriverIds]);

  // Since we're only fetching disputes, all filtered rides have disputes
  const ridesWithDisputes = filteredRides;

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedDriverIds([]);
    setSelectedCompanyId('');
  };

  const getFilterDescription = () => {
    const parts = [];
    if (startDate || endDate) {
      if (startDate && endDate) {
        parts.push(`${dayjs(startDate).format('MMM D')} - ${dayjs(endDate).format('MMM D, YYYY')}`);
      } else if (startDate) {
        parts.push(`From ${dayjs(startDate).format('MMM D, YYYY')}`);
      } else if (endDate) {
        parts.push(`Until ${dayjs(endDate).format('MMM D, YYYY')}`);
      }
    }
    if (selectedDriverIds.length > 0) {
      const driverNames = selectedDriverIds.map(id => {
        const driver = drivers.find(d => d.id === id);
        return driver ? `${driver.firstName} ${driver.lastName}` : 'Unknown';
      }).join(', ');
      parts.push(`Drivers: ${driverNames}`);
    }
    return parts.length > 0 ? parts.join(' • ') : '';
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load disputes: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          🚨 Execution Disputes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage driver execution disputes and resolutions
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          {/* Left side - Date and Driver filters */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="Start Date"
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
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="End Date"
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
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  multiple
                  options={drivers}
                  getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                  value={drivers.filter(driver => selectedDriverIds.includes(driver.id))}
                  onChange={(_, newValue) => setSelectedDriverIds(newValue.map(driver => driver.id))}
                  loading={isLoadingDrivers}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Drivers"
                      variant="outlined"
                      size="small"
                      placeholder={isLoadingDrivers ? "Loading drivers..." : "Select drivers"}
                    />
                  )}
                  noOptionsText={isLoadingDrivers ? "Loading drivers..." : "No drivers found"}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Right side - Disputes info */}
          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" justifyContent="flex-end">
              <Chip 
                label={`Active Disputes: ${executionStats.Dispute}`}
                color="warning"
                variant="filled"
                sx={{ 
                  fontWeight: 600,
                  backgroundColor: 'warning.main',
                  color: 'warning.contrastText',
                }}
                size="medium"
              />
            </Box>
          </Grid>
        </Grid>

        {/* Clear Filters Button */}
        {(startDate || endDate || selectedDriverIds.length > 0 || selectedCompanyId) && (
          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" size="small" onClick={clearFilters}>
              Clear Filters
            </Button>
          </Box>
        )}
      </Paper>

      {/* Filter Description */}
      {getFilterDescription() && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Filtered: {getFilterDescription()}
          </Typography>
        </Box>
      )}

      {/* Loading State */}
      {isLoading && (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Results */}
      {!isLoading && (
        <>
          {/* Results Header */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">
              {ridesWithDisputes.length} Rides with Active Disputes
            </Typography>
          </Box>

          {/* Rides List */}
          {ridesWithDisputes.length > 0 ? (
            <Stack spacing={3}>
              {ridesWithDisputes.map((ride) => (
                <RideExecutionApprovalCard key={ride.rideId} ride={ride} />
              ))}
            </Stack>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                🚨 No Active Disputes Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                There are currently no execution disputes that need your attention.
                {(startDate || endDate || selectedDriverIds.length > 0) && 
                  ' Try adjusting your filters to see more results.'
                }
              </Typography>
            </Paper>
          )}
        </>
      )}
    </Box>
    </LocalizationProvider>
  );
}
