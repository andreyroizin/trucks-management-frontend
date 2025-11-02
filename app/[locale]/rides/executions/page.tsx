'use client';

import React, { useState, useEffect } from 'react';
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

export default function RideExecutionsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  
  // Fetch companies for filtering (get first 100 companies)
  const { data: companiesResponse } = useCompanies(1, 100);
  const companies = companiesResponse?.data || [];
  
  // Fetch rides pending approval
  const { 
    data: rides, 
    isLoading, 
    error, 
    refetch 
  } = useRidesPendingApproval(selectedCompanyId || undefined);

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

  // Filter and group rides
  const pendingRides = rides?.filter(ride => 
    ride.executions.some(exec => exec.status === 'Pending')
  ) || [];

  const completedRides = rides?.filter(ride => 
    ride.executions.every(exec => exec.status !== 'Pending')
  ) || [];

  const totalExecutions = rides?.reduce((sum, ride) => sum + ride.executions.length, 0) || 0;
  const pendingExecutions = rides?.reduce((sum, ride) => 
    sum + ride.executions.filter(exec => exec.status === 'Pending').length, 0
  ) || 0;

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
          
          {/* Summary Stats */}
          <Box display="flex" gap={2} ml="auto">
            <Chip 
              label={`${rides?.length || 0} Rides`} 
              color="primary" 
              variant="outlined" 
            />
            <Chip 
              label={`${pendingExecutions} Pending`} 
              color="warning" 
              variant={pendingExecutions > 0 ? "filled" : "outlined"}
            />
            <Chip 
              label={`${totalExecutions} Total Executions`} 
              color="info" 
              variant="outlined" 
            />
          </Box>
        </Box>
      </Paper>

      {/* Pending Rides Section */}
      {pendingRides.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom color="warning.main">
            Pending Approval ({pendingRides.length} rides)
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Rides with executions that need your review and approval
          </Typography>
          {pendingRides.map((ride) => (
            <RideExecutionApprovalCard key={ride.rideId} ride={ride} />
          ))}
        </Box>
      )}

      {/* Recently Completed Section */}
      {completedRides.length > 0 && (
        <Box mb={4}>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom color="success.main">
            Recently Processed ({completedRides.length} rides)
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Rides with all executions approved or rejected
          </Typography>
          {completedRides.slice(0, 5).map((ride) => (
            <RideExecutionApprovalCard key={ride.rideId} ride={ride} />
          ))}
          {completedRides.length > 5 && (
            <Typography variant="body2" color="text.secondary" textAlign="center" mt={2}>
              +{completedRides.length - 5} more completed rides
            </Typography>
          )}
        </Box>
      )}

      {/* Empty State */}
      {!rides || rides.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No ride executions found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedCompanyId 
              ? 'No executions pending approval for the selected company'
              : 'No executions pending approval across all companies'
            }
          </Typography>
        </Box>
      ) : pendingRides.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="success.main" gutterBottom>
            🎉 All caught up!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No executions pending approval. All driver executions have been processed.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
