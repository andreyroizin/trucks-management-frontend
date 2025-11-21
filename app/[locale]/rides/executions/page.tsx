'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  Autocomplete,
  Paper,
  Chip,
  Button,
  Divider,
  Grid,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRidesPendingApproval } from '@/hooks/useRideExecutionApproval';
import RideExecutionApprovalCard from '@/components/RideExecutionApprovalCard';
import { useCompanies, Company } from '@/hooks/useCompanies';
import { useDriversAndTrucks } from '@/hooks/useDriversAndTrucks';
import { RideWithExecutions } from '@/types/rideExecutionApproval';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useTranslations } from 'next-intl';
import LanguageSelectDesktop from '@/components/LanguageSelectDesktop';

type ExecutionStatus = 'all' | 'Pending' | 'Approved' | 'Rejected' | 'Dispute';

export default function RideExecutionsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const t = useTranslations('planning.executionApprovals');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus>('all');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);
  
  // Fetch companies for filtering (get first 100 companies)
  const { data: companiesResponse } = useCompanies(1, 100);
  const companies = companiesResponse?.data || [];
  
  // Fetch drivers for filtering
  const { drivers, isLoadingDrivers } = useDriversAndTrucks();
  
  // Fetch rides with executions (only status filtering on backend)
  const { 
    data: allRidesFromAPI, 
    isLoading, 
    error 
  } = useRidesPendingApproval(selectedCompanyId || undefined, statusFilter);

  // Redirect if not authenticated or not authorized
  useEffect(() => {
    const allowedRoles = ['globalAdmin', 'customerAdmin', 'employer'];
    const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
    
    if (!authLoading && (!isAuthenticated || !hasAccess)) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, authLoading, router, user?.roles]);

  // Auto-select company for non-global admins
  useEffect(() => {
    if (user && companies && !user.roles.includes('globalAdmin')) {
      const userCompany = companies.find(c => c.id === user.companyId);
      if (userCompany) {
        setSelectedCompanyId(userCompany.id);
      }
    }
  }, [user, companies]);

  // Get all rides for statistics (status='all')
  const { data: allRidesForStats } = useRidesPendingApproval(selectedCompanyId || undefined, 'all');

  // Apply date and driver filtering to all rides for accurate statistics
  const allFilteredRides = useMemo(() => {
    if (!allRidesForStats) return [];

    return allRidesForStats.filter(ride => {
      // Date filtering
      if (startDate || endDate) {
        const rideDate = dayjs(ride.plannedDate);
        if (startDate && rideDate.isBefore(startDate, 'day')) return false;
        if (endDate && rideDate.isAfter(endDate, 'day')) return false;
      }

      // Driver filtering
      if (selectedDriverIds.length > 0) {
        const hasSelectedDriver = ride.executions.some(execution => 
          selectedDriverIds.includes(execution.driverId)
        );
        if (!hasSelectedDriver) return false;
      }

      return true;
    });
  }, [allRidesForStats, startDate, endDate, selectedDriverIds]);

  // Frontend filtering for currently displayed rides (based on status filter)
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
        const hasSelectedDriver = ride.executions.some(execution => 
          selectedDriverIds.includes(execution.driverId)
        );
        if (!hasSelectedDriver) return false;
      }

      return true;
    });
  }, [allRidesFromAPI, startDate, endDate, selectedDriverIds]);
  
  // Calculate statistics from filtered rides (reflects current date/driver filters)
  const executionStats = useMemo(() => {
    if (!allFilteredRides) return { all: 0, Pending: 0, Approved: 0, Rejected: 0, Dispute: 0 };
    
    const allExecutions = allFilteredRides.flatMap(ride => ride.executions);
    
    return {
      all: allExecutions.length,
      Pending: allExecutions.filter(exec => exec.status === 'Pending').length,
      Approved: allExecutions.filter(exec => exec.status === 'Approved').length,
      Rejected: allExecutions.filter(exec => exec.status === 'Rejected').length,
      Dispute: allExecutions.filter(exec => exec.status === 'Dispute').length,
    };
  }, [allFilteredRides]);

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
          {t('alerts.loadFailed', { message: error.message })}
        </Alert>
      </Box>
    );
  }


  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          {t('title')}
        </Typography>
        <LanguageSelectDesktop />
      </Box>

      {/* Filters */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            {/* Left Side - Filter Controls */}
            <Grid item xs={12} md={8}>
              <Grid container spacing={2} alignItems="center">
                {/* Company Filter */}
                {user?.roles.includes('globalAdmin') && companies && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Autocomplete
                      options={companies}
                      getOptionLabel={(option) => option.name}
                      value={companies.find(c => c.id === selectedCompanyId) || null}
                      onChange={(_, newValue) => setSelectedCompanyId(newValue?.id || '')}
                      renderInput={(params) => (
                        <TextField {...params} label={t('filters.company')} variant="outlined" size="small" />
                      )}
                    />
                  </Grid>
                )}
                
                {/* Date Range Filters */}
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label={t('filters.startDate')}
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    slotProps={{ 
                      textField: { 
                        size: 'small',
                        variant: 'outlined',
                        fullWidth: true
                      } 
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label={t('filters.endDate')}
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    minDate={startDate || undefined}
                    slotProps={{ 
                      textField: { 
                        size: 'small',
                        variant: 'outlined',
                        fullWidth: true
                      } 
                    }}
                  />
                </Grid>
                
                {/* Driver Filter */}
                <Grid item xs={12} sm={6} md={3}>
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
                        label={t('filters.drivers')} 
                        variant="outlined" 
                        size="small"
                        placeholder={isLoadingDrivers ? t('filters.loadingDrivers') : t('filters.driversPlaceholder')}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={`${option.firstName} ${option.lastName}`}
                          size="small"
                          {...getTagProps({ index })}
                          key={option.id}
                        />
                      ))
                    }
                    noOptionsText={isLoadingDrivers ? t('filters.loadingDrivers') : t('filters.noDrivers')}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            {/* Right Side - Status Filter Chips */}
            <Grid item xs={12} md={4}>
              <Box display="flex" gap={1} flexWrap="wrap" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                <Chip 
                  label={`${t('status.all')} (${executionStats.all})`}
                  color="primary"
                  variant={statusFilter === 'all' ? 'filled' : 'outlined'}
                  onClick={() => setStatusFilter('all')}
                  sx={{ 
                    cursor: 'pointer',
                    fontWeight: statusFilter === 'all' ? 600 : 400,
                    '&:hover': {
                      backgroundColor: statusFilter === 'all' ? 'primary.dark' : 'primary.50'
                    }
                  }}
                  size="small"
                />
                <Chip 
                  label={`${t('status.pending')} (${executionStats.Pending})`}
                  color="warning"
                  variant={statusFilter === 'Pending' ? 'filled' : 'outlined'}
                  onClick={() => setStatusFilter('Pending')}
                  sx={{ 
                    cursor: 'pointer',
                    fontWeight: statusFilter === 'Pending' ? 600 : 400,
                    backgroundColor: statusFilter === 'Pending' ? 'warning.main' : 'transparent',
                    color: statusFilter === 'Pending' ? 'warning.contrastText' : 'warning.main',
                    borderColor: 'warning.main',
                    '&:hover': {
                      backgroundColor: statusFilter === 'Pending' ? 'warning.dark' : 'warning.50'
                    }
                  }}
                  size="small"
                />
                <Chip 
                  label={`${t('status.approved')} (${executionStats.Approved})`}
                  color="success"
                  variant={statusFilter === 'Approved' ? 'filled' : 'outlined'}
                  onClick={() => setStatusFilter('Approved')}
                  sx={{ 
                    cursor: 'pointer',
                    fontWeight: statusFilter === 'Approved' ? 600 : 400,
                    backgroundColor: statusFilter === 'Approved' ? 'success.main' : 'transparent',
                    color: statusFilter === 'Approved' ? 'success.contrastText' : 'success.main',
                    borderColor: 'success.main',
                    '&:hover': {
                      backgroundColor: statusFilter === 'Approved' ? 'success.dark' : 'success.50'
                    }
                  }}
                  size="small"
                />
                <Chip 
                  label={`${t('status.rejected')} (${executionStats.Rejected})`}
                  color="error"
                  variant={statusFilter === 'Rejected' ? 'filled' : 'outlined'}
                  onClick={() => setStatusFilter('Rejected')}
                  sx={{ 
                    cursor: 'pointer',
                    fontWeight: statusFilter === 'Rejected' ? 600 : 400,
                    backgroundColor: statusFilter === 'Rejected' ? 'error.main' : 'transparent',
                    color: statusFilter === 'Rejected' ? 'error.contrastText' : 'error.main',
                    borderColor: 'error.main',
                    '&:hover': {
                      backgroundColor: statusFilter === 'Rejected' ? 'error.dark' : 'error.50'
                    }
                  }}
                  size="small"
                />
                <Chip 
                  label={`${t('status.dispute')} (${executionStats.Dispute})`}
                  color="secondary"
                  variant={statusFilter === 'Dispute' ? 'filled' : 'outlined'}
                  onClick={() => setStatusFilter('Dispute')}
                  sx={{ 
                    cursor: 'pointer',
                    fontWeight: statusFilter === 'Dispute' ? 600 : 400,
                    backgroundColor: statusFilter === 'Dispute' ? 'secondary.main' : 'transparent',
                    color: statusFilter === 'Dispute' ? 'secondary.contrastText' : 'secondary.main',
                    borderColor: 'secondary.main',
                    '&:hover': {
                      backgroundColor: statusFilter === 'Dispute' ? 'secondary.dark' : 'secondary.50'
                    }
                  }}
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>
          
          {/* Clear Filters Button */}
          {(startDate || endDate || selectedDriverIds.length > 0 || selectedCompanyId) && (
            <Box mt={2} display="flex" justifyContent="flex-end">
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                  setSelectedDriverIds([]);
                  if (user?.roles.includes('globalAdmin')) {
                    setSelectedCompanyId('');
                  }
                }}
              >
                {t('filters.clearFilters')}
              </Button>
            </Box>
          )}
        </Paper>
      </LocalizationProvider>

      {/* Filtered Rides Section */}
      {filteredRides && filteredRides.length > 0 ? (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom>
            {statusFilter === 'all'
              ? t('sections.title.all', { count: filteredRides.length })
              : t('sections.title.filtered', { status: statusFilter, count: filteredRides.length })
            }
            {(startDate || endDate || selectedDriverIds.length > 0) && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                {t('sections.filtered')}
              </Typography>
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {statusFilter === 'all'
              ? t('sections.subtitle.all')
              : statusFilter === 'Pending'
                ? t('sections.subtitle.pending')
                : statusFilter === 'Approved'
                  ? t('sections.subtitle.approved')
                  : statusFilter === 'Rejected'
                    ? t('sections.subtitle.rejected')
                    : t('sections.subtitle.dispute')
            }
            {(startDate || endDate) && (
              <Typography component="span" variant="body2" color="text.secondary">
                {' • '}
                {startDate && endDate
                  ? t('sections.dateRange.both', { 
                      startDate: startDate.format('MMM D'),
                      endDate: endDate.format('MMM D, YYYY')
                    })
                  : startDate
                    ? t('sections.dateRange.from', { startDate: startDate.format('MMM D, YYYY') })
                    : t('sections.dateRange.until', { endDate: endDate?.format('MMM D, YYYY') })
                }
              </Typography>
            )}
            {selectedDriverIds.length > 0 && (
              <Typography component="span" variant="body2" color="text.secondary">
                {' • '}
                {selectedDriverIds.length === 1
                  ? t('sections.driverSelection.single', { 
                      name: `${drivers.find(d => d.id === selectedDriverIds[0])?.firstName} ${drivers.find(d => d.id === selectedDriverIds[0])?.lastName}`
                    })
                  : t('sections.driverSelection.multiple', { count: selectedDriverIds.length })
                }
              </Typography>
            )}
          </Typography>
          {filteredRides.map((ride) => (
            <RideExecutionApprovalCard key={ride.rideId} ride={ride} />
          ))}
        </Box>
      ) : (
        /* Empty State */
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {statusFilter === 'all' 
              ? t('empty.title.all')
              : t('empty.title.status', { status: statusFilter.toLowerCase() })
            }
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {!allRidesFromAPI || allRidesFromAPI.length === 0
              ? selectedCompanyId 
                ? t('empty.description.noData', { 
                    executions: statusFilter === 'all' 
                      ? t('empty.executionTypes.all')
                      : t(`empty.executionTypes.${statusFilter.toLowerCase()}`)
                  })
                : t('empty.description.noDataAll', { 
                    executions: statusFilter === 'all' 
                      ? t('empty.executionTypes.all')
                      : t(`empty.executionTypes.${statusFilter.toLowerCase()}`)
                  })
              : t('empty.description.filtered')
            }
          </Typography>
          {(startDate || endDate || selectedDriverIds.length > 0) && (
            <Button 
              variant="outlined" 
              onClick={() => {
                setStartDate(null);
                setEndDate(null);
                setSelectedDriverIds([]);
              }}
              sx={{ mt: 2 }}
            >
              {t('empty.actions.clearDateDriver')}
            </Button>
          )}
          {statusFilter !== 'all' && (
            <Button 
              variant="outlined" 
              onClick={() => setStatusFilter('all')} 
              sx={{ mt: 2, ml: 1 }}
            >
              {t('empty.actions.showAll')}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
