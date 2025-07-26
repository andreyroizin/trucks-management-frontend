// app/drivers/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDrivers } from '@/hooks/useDrivers';
import DriverCard from '@/components/DriverCard';
import { CircularProgress, Typography, Alert, Box, Button, Grid, IconButton, TablePagination } from '@mui/material';
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from '@tanstack/react-query';
import SyncIcon from "@mui/icons-material/Sync";
import { DebouncedSearchInput } from "@/components/DebouncedSearchInput";
import ConfirmModal from '@/components/ConfirmModal';

export default function DriversPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useAuth();
    const { data: drivers, isLoading: isLoadingDrivers, isError: isErrorDrivers } = useDrivers();
    
    const queryClient = useQueryClient();
    
    // Role checks for UI visibility
    const isGlobalAdmin = user?.roles.includes('globalAdmin');
    const isCustomerAdmin = user?.roles.includes('customerAdmin');
    
    // Debounced search state
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    
    // Delete confirmation modal state
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [driverToDelete, setDriverToDelete] = useState<string | null>(null);

    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));

        if (!isAuthenticated && !loading && (!user || !hasAccess)) {
            router.push('/auth/login'); // Redirect to login if not authorized
        }
    }, [user, loading, router, isAuthenticated]);
    
    const handleRefetch = () => {
        queryClient.invalidateQueries({ queryKey: ['drivers'] });
    }

    const handleEdit = (driverId: string) => {
        router.push(`/drivers/edit/${driverId}`);
    };

    const handleDelete = (driverId: string) => {
        setDriverToDelete(driverId);
        setOpenDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (driverToDelete) {
            try {
                // TODO: Implement driver deletion when backend provides the endpoint
                console.log('Delete driver:', driverToDelete);
                queryClient.invalidateQueries({ queryKey: ['drivers'] });
                setOpenDeleteModal(false);
                setDriverToDelete(null);
            } catch (error) {
                console.error('Failed to delete driver:', error);
            }
        }
    };

    if (loading || isLoadingDrivers) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isErrorDrivers) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">Failed to load data. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{py: 4}}>
            <Box sx={{mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h3" fontWeight={500}>
                    Driver Management
                </Typography>
            </Box>

            <Box sx={{mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h4" fontWeight={500}>
                    Drivers Overview
                </Typography>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                    {(isGlobalAdmin || isCustomerAdmin) && (
                        <Button 
                            variant="contained" 
                            onClick={() => router.push('/drivers/create')}
                        >
                            Create Driver
                        </Button>
                    )}
                    <IconButton onClick={handleRefetch}>
                        <SyncIcon sx={{transform: 'rotate(90deg)'}}/>
                    </IconButton>
                </Box>
            </Box>

            <DebouncedSearchInput value={debouncedSearch} onDebouncedChange={setDebouncedSearch} placeholder={"Search drivers"} size={"small"} sx={{ mb: 4, maxWidth: 260 }} />

            <Grid container spacing={2}>
                {(drivers || []).map((driver) => (
                    <Grid item xs={12} sm={6} md={4} key={driver.id}>
                        <DriverCard
                            id={driver.id}
                            firstName={driver.user.firstName}
                            lastName={driver.user.lastName}
                            onDelete={(isGlobalAdmin || isCustomerAdmin) ? handleDelete : undefined}
                            onEdit={(isGlobalAdmin || isCustomerAdmin) ? handleEdit : undefined}
                        />
                    </Grid>
                ))}
            </Grid>

            <TablePagination
                sx={{mt: 4}}
                component="div"
                count={drivers?.length || 0}
                page={page - 1}
                onPageChange={(event, newPage) => setPage(newPage + 1)}
                rowsPerPage={pageSize}
                onRowsPerPageChange={(event) => {
                  setPage(1);
                  setPageSize(parseInt(event.target.value, 10));
                }}
                rowsPerPageOptions={[6, 9, 12, 15]}
            />
            
            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={openDeleteModal}
                title="Delete Driver?"
                message="Are you sure you want to delete this driver? This action cannot be undone."
                onClose={() => {
                    setOpenDeleteModal(false);
                    setDriverToDelete(null);
                }}
                onConfirm={confirmDelete}
            />
        </Box>
    );
}
