// app/drivers/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useDrivers } from '@/hooks/useDrivers';
import { useDeleteDriver } from '@/hooks/useDeleteDriver';
import DriverCard from '@/components/DriverCard';
import { CircularProgress, Typography, Alert, Box, Button, Grid, IconButton, TablePagination } from '@mui/material';
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from '@tanstack/react-query';
import SyncIcon from "@mui/icons-material/Sync";
import { DebouncedSearchInput } from "@/components/DebouncedSearchInput";
import ConfirmModal from '@/components/ConfirmModal';
import LanguageSelectDesktop from "@/components/LanguageSelectDesktop";

export default function DriversPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useAuth();
    const t = useTranslations();
    const { data: drivers, isLoading: isLoadingDrivers, isError: isErrorDrivers } = useDrivers();
    const { mutateAsync: deleteDriver, isPending: isDeleting } = useDeleteDriver();
    
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
                await deleteDriver(driverToDelete);
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
                <Alert severity="error">{t('drivers.overview.errors.loadFailed')}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{py: 4}}>
            <Box sx={{mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h3" fontWeight={500}>
                    {t('drivers.title')}
                </Typography>
                <LanguageSelectDesktop/>
            </Box>

            <Box sx={{mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h4" fontWeight={500}>
                    {t('drivers.overview.title')}
                </Typography>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                    {(isGlobalAdmin || isCustomerAdmin) && (
                        <Button 
                            variant="contained" 
                            onClick={() => router.push('/drivers/create')}
                        >
                            {t('drivers.overview.buttons.create')}
                        </Button>
                    )}
                    <IconButton onClick={handleRefetch}>
                        <SyncIcon sx={{transform: 'rotate(90deg)'}}/>
                    </IconButton>
                </Box>
            </Box>

            <DebouncedSearchInput value={debouncedSearch} onDebouncedChange={setDebouncedSearch} placeholder={t('drivers.overview.search.placeholder')} size={"small"} sx={{ mb: 4, maxWidth: 260 }} />

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
                title={t('drivers.detail.deleteConfirm.title')}
                message={t('drivers.detail.deleteConfirm.message')}
                onClose={() => {
                    if (!isDeleting) {
                        setOpenDeleteModal(false);
                        setDriverToDelete(null);
                    }
                }}
                onConfirm={confirmDelete}
            />
        </Box>
    );
}
