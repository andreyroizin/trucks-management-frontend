'use client';

import React, {useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {Alert, Box, Button, CircularProgress, Grid, IconButton, TablePagination, Typography} from '@mui/material';
import {useRouter, useSearchParams} from 'next/navigation';
import CarCard from '@/components/CarCard';
import LanguageSelectDesktop from "@/components/LanguageSelectDesktop";
import SyncIcon from "@mui/icons-material/Sync";
import {useCars} from '@/hooks/useCars';
import {DebouncedSearchInput} from "@/components/DebouncedSearchInput";
import {useAuth} from '@/hooks/useAuth';
import {useDeleteCar} from '@/hooks/useDeleteCar';
import ConfirmModal from '@/components/ConfirmModal';

export default function CarsOverviewPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const companyId = searchParams.get('companyId') || "";
    const {user} = useAuth();
    
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
    const [carToDelete, setCarToDelete] = useState<string | null>(null);

    const {
      data: carsData,
      isLoading,
      isError
    } = useCars(companyId ? [companyId] : [], page, pageSize, debouncedSearch);

    const queryClient = useQueryClient();
    const { mutateAsync: deleteCar } = useDeleteCar();

    const handleRefetch = () => {
        queryClient.invalidateQueries({ queryKey: ['cars'] });
    }

    const [selectedCarId, setSelectedCarId] = useState<string | null>(null);

    const handleMenuClose = () => {
        setSelectedCarId(null);
    };

    const handleEdit = (id?: string) => {
        const carId = id || selectedCarId;
        if (carId) {
            router.push(`/cars/edit/${carId}`);
        }
        handleMenuClose();
    };

    const handleDelete = (id: string) => {
        setCarToDelete(id);
        setOpenDeleteModal(true);
        handleMenuClose();
    };

    const confirmDelete = async () => {
        if (carToDelete) {
            try {
                await deleteCar(carToDelete);
                queryClient.invalidateQueries({ queryKey: ['cars'] });
                setOpenDeleteModal(false);
                setCarToDelete(null);
            } catch (error) {
                console.error('Failed to delete car:', error);
                setOpenDeleteModal(false);
                setCarToDelete(null);
            }
        }
    };

    // Loading & error states
    if (isLoading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
    if (isError)   return <Alert severity="error" sx={{mt:4}}>Failed to load vehicles</Alert>;

    return (
        <Box sx={{py: 4}}>
            <Box sx={{mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h3" fontWeight={500}>
                    Vehicle Management
                </Typography>
                <LanguageSelectDesktop/>
            </Box>

            <Box sx={{mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h4" fontWeight={500}>
                    Vehicles Overview
                </Typography>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                    {(isGlobalAdmin || isCustomerAdmin) && (
                        <Button 
                            variant="contained" 
                            onClick={() => router.push(`/cars/create${companyId ? `?companyId=${companyId}` : ''}`)}
                        >
                            Create Vehicle
                        </Button>
                    )}
                    <IconButton onClick={handleRefetch}>
                        <SyncIcon sx={{transform: 'rotate(90deg)'}}/>
                    </IconButton>
                </Box>
            </Box>

            <DebouncedSearchInput value={debouncedSearch} onDebouncedChange={setDebouncedSearch} placeholder={"License Plate"} size={"small"} sx={{ mb: 4, maxWidth: 260 }} />

            <Grid container spacing={2}>
                {(carsData?.cars || []).map((car) => (
                    <Grid item xs={12} sm={6} md={4} key={car.id}>
                        <CarCard
                            id={car.id}
                            licensePlate={car.licensePlate}
                            vehicleYear={car.vehicleYear}
                            registrationDate={car.registrationDate}
                            driverFirstName={car.driverFirstName}
                            driverLastName={car.driverLastName}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                        />
                    </Grid>
                ))}
            </Grid>

            <TablePagination
                sx={{mt: 4}}
                component="div"
                count={carsData?.totalCars || 0}
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
                title="Delete Vehicle?"
                message="Are you sure you want to delete this vehicle? This action cannot be undone."
                onClose={() => {
                    setOpenDeleteModal(false);
                    setCarToDelete(null);
                }}
                onConfirm={confirmDelete}
            />
        </Box>
    );
}
