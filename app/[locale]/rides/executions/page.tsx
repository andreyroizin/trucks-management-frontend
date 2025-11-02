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
  Divider
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRidesPendingApproval } from '@/hooks/useRideExecutionApproval';
import RideExecutionApprovalCard from '@/components/RideExecutionApprovalCard';
import { useCompanies, Company } from '@/hooks/useCompanies';
import RefreshIcon from '@mui/icons-material/Refresh';
import { RideWithExecutions } from '@/types/rideExecutionApproval';

type ExecutionStatus = 'all' | 'Pending' | 'Approved' | 'Rejected' | 'Dispute';

export default function RideExecutionsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus>('all');
  
  // Fetch companies for filtering (get first 100 companies)
  const { data: companiesResponse } = useCompanies(1, 100);
  const companies = companiesResponse?.data || [];
  
  // Fetch rides with executions (filtered by status on backend)
  const { 
    data: rides, 
    isLoading, 
    error, 
    refetch 
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

  // We need to fetch statistics separately since we're now filtering on backend
  const { data: allRides } = useRidesPendingApproval(selectedCompanyId || undefined, 'all');
  
  // Calculate statistics for all executions (from unfiltered data)
  const executionStats = useMemo(() => {
    if (!allRides) return { all: 0, Pending: 0, Approved: 0, Rejected: 0, Dispute: 0 };
    
    const allExecutions = allRides.flatMap(ride => ride.executions);
    
    return {
      all: allExecutions.length,
      Pending: allExecutions.filter(exec => exec.status === 'Pending').length,
      Approved: allExecutions.filter(exec => exec.status === 'Approved').length,
      Rejected: allExecutions.filter(exec => exec.status === 'Rejected').length,
      Dispute: allExecutions.filter(exec => exec.status === 'Dispute').length,
    };
  }, [allRides]);

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
          Failed to load ride executions: {error.message}
        </Alert>
      </Box>
    );
  }


  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Ride Execution Approvals
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          {user?.roles.includes('globalAdmin') && companies && (
            <Autocomplete
              options={companies}
              getOptionLabel={(option) => option.name}
              value={companies.find(c => c.id === selectedCompanyId) || null}
              onChange={(_, newValue) => setSelectedCompanyId(newValue?.id || '')}
              renderInput={(params) => (
                <TextField {...params} label="Filter by Company" variant="outlined" />
              )}
              sx={{ minWidth: 250 }}
            />
          )}
          
          {/* Status Filter Chips */}
          <Box display="flex" gap={1} ml="auto" flexWrap="wrap">
            <Chip 
              label={`All Executions (${executionStats.all})`}
              color={statusFilter === 'all' ? 'primary' : 'default'}
              variant={statusFilter === 'all' ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter('all')}
              sx={{ cursor: 'pointer' }}
            />
            <Chip 
              label={`Pending (${executionStats.Pending})`}
              color={statusFilter === 'Pending' ? 'warning' : 'default'}
              variant={statusFilter === 'Pending' ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter('Pending')}
              sx={{ cursor: 'pointer' }}
            />
            <Chip 
              label={`Approved (${executionStats.Approved})`}
              color={statusFilter === 'Approved' ? 'success' : 'default'}
              variant={statusFilter === 'Approved' ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter('Approved')}
              sx={{ cursor: 'pointer' }}
            />
            <Chip 
              label={`Rejected (${executionStats.Rejected})`}
              color={statusFilter === 'Rejected' ? 'error' : 'default'}
              variant={statusFilter === 'Rejected' ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter('Rejected')}
              sx={{ cursor: 'pointer' }}
            />
            <Chip 
              label={`Dispute (${executionStats.Dispute})`}
              color={statusFilter === 'Dispute' ? 'secondary' : 'default'}
              variant={statusFilter === 'Dispute' ? 'filled' : 'outlined'}
              onClick={() => setStatusFilter('Dispute')}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Filtered Rides Section */}
      {rides && rides.length > 0 ? (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom>
            {statusFilter === 'all' 
              ? `All Ride Executions (${rides.length} rides)`
              : `${statusFilter} Executions (${rides.length} rides)`
            }
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {statusFilter === 'all' 
              ? 'Showing all rides with driver executions'
              : statusFilter === 'Pending'
                ? 'Rides with executions that need your review and approval'
                : statusFilter === 'Approved'
                  ? 'Rides with approved executions'
                  : statusFilter === 'Rejected'
                    ? 'Rides with rejected executions'
                    : 'Rides with disputed executions'
            }
          </Typography>
          {rides.map((ride) => (
            <RideExecutionApprovalCard key={ride.rideId} ride={ride} />
          ))}
        </Box>
      ) : (
        /* Empty State */
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {statusFilter === 'all' 
              ? 'No ride executions found'
              : `No ${statusFilter.toLowerCase()} executions found`
            }
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedCompanyId 
              ? `No ${statusFilter === 'all' ? 'executions' : statusFilter.toLowerCase() + ' executions'} found for the selected company`
              : `No ${statusFilter === 'all' ? 'executions' : statusFilter.toLowerCase() + ' executions'} found across all companies`
            }
          </Typography>
          {statusFilter !== 'all' && (
            <Button 
              variant="outlined" 
              onClick={() => setStatusFilter('all')} 
              sx={{ mt: 2 }}
            >
              Show All Executions
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
