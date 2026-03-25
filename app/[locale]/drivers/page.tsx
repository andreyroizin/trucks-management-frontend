// app/drivers/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useDrivers } from '@/hooks/useDrivers';
import DriverCard from '@/components/DriverCard';
import { CircularProgress, Typography, Alert, Box, Button, Grid, IconButton, TablePagination } from '@mui/material';
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from '@tanstack/react-query';
import SyncIcon from "@mui/icons-material/Sync";
import { DebouncedSearchInput } from "@/components/DebouncedSearchInput";
import TerminateDriverDialog from '@/components/TerminateDriverDialog';
import LanguageSelectDesktop from "@/components/LanguageSelectDesktop";

export default function DriversPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useAuth();
    const t = useTranslations();
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
    
    // Reset to page 1 when search changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);
    
    // Terminate dialog state (enhanced flow with jaaropgave generation)
    const [openTerminateDialog, setOpenTerminateDialog] = useState(false);
    const [driverToTerminate, setDriverToTerminate] = useState<string | null>(null);
    const [driverToTerminateName, setDriverToTerminateName] = useState('');

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
        const driver = drivers?.find(d => d.id === driverId);
        if (driver) {
            setDriverToTerminate(driverId);
            setDriverToTerminateName(`${driver.user.firstName} ${driver.user.lastName}`);
            setOpenTerminateDialog(true);
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

    // Filter drivers based on search term (first name and last name)
    const filteredDrivers = (drivers || []).filter((driver) => {
        if (!debouncedSearch) return true;
        
        const searchLower = debouncedSearch.toLowerCase();
        const firstNameMatch = driver.user.firstName.toLowerCase().includes(searchLower);
        const lastNameMatch = driver.user.lastName.toLowerCase().includes(searchLower);
        const fullNameMatch = `${driver.user.firstName} ${driver.user.lastName}`.toLowerCase().includes(searchLower);
        
        return firstNameMatch || lastNameMatch || fullNameMatch;
    });

    // Paginate filtered drivers
    const paginatedDrivers = filteredDrivers.slice((page - 1) * pageSize, page * pageSize);

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
                {paginatedDrivers.map((driver) => (
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
                count={filteredDrivers.length}
                page={page - 1}
                onPageChange={(event, newPage) => setPage(newPage + 1)}
                rowsPerPage={pageSize}
                onRowsPerPageChange={(event) => {
                  setPage(1);
                  setPageSize(parseInt(event.target.value, 10));
                }}
                rowsPerPageOptions={[6, 9, 12, 15]}
            />
            
            {/* Terminate Driver Dialog (enhanced with jaaropgave generation) */}
            {driverToTerminate && (
                <TerminateDriverDialog
                    open={openTerminateDialog}
                    driverId={driverToTerminate}
                    driverName={driverToTerminateName}
                    onClose={() => {
                        setOpenTerminateDialog(false);
                        setDriverToTerminate(null);
                        setDriverToTerminateName('');
                    }}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['drivers'] });
                    }}
                />
            )}
        </Box>
    );
}
