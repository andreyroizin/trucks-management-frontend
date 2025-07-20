'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Divider,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableRow,
    IconButton,
} from '@mui/material';
import DriveFileRenameOutlineRoundedIcon from '@mui/icons-material/DriveFileRenameOutlineRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useCarDetail } from '@/hooks/useCarDetail';
import { useDeleteCar } from '@/hooks/useDeleteCar';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/hooks/useAuth';

export default function VehicleDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { data: car, isLoading, isError, error } = useCarDetail(id as string);
    const isCustomerAdmin = user?.roles.includes('customerAdmin');
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    // Delete Car Hook
    const {
        mutateAsync: deleteCar,
        isPending,
        isError: isDeleteError,
        error: deleteError,
    } = useDeleteCar();

    // Confirm modal state
    const [openModal, setOpenModal] = useState(false);
    const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

    // Check roles
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'customer', 'customerAccountant'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router, user?.roles]);

    // Handle Delete Confirm
    const handleDelete = async () => {
        setDeleteErrorMsg(null);
        try {
            await deleteCar(id as string);
            setOpenModal(false);
            router.push('/cars'); // Navigate away after successful deletion
        } catch (err: any) {
            setDeleteErrorMsg(err.message || 'Failed to delete vehicle.');
            setOpenModal(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isError || !car) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error?.message || 'Failed to load vehicle details.'}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{py: 4}}>
            {/* Header Section */}
            <Box sx={{mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h3" fontWeight={500}>
                    Vehicle Management
                </Typography>
            </Box>

            <Paper variant="outlined" sx={{p: 3, mx: 'auto'}}>
                {/* Show deletion error if any */}
                {deleteErrorMsg && (
                    <Alert severity="error" sx={{mb: 2}}>
                        {deleteErrorMsg}
                    </Alert>
                )}

                {/* Header section */}
                <Box
                    sx={{
                        mt: 1,
                        mb: 3,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 2,
                    }}
                >
                    <Typography variant="h4" fontWeight={500}>
                        {car.licensePlate}
                    </Typography>
                    {(isCustomerAdmin || isGlobalAdmin) && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {/* Edit / Delete - matching company styling exactly */}
                            <IconButton
                                onClick={() => router.push(`/cars/edit/${car.id}`)}
                                disabled={isPending}
                                sx={{
                                    bgcolor: 'grey.800',
                                    color: 'common.white',
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: 'grey.700' }
                                }}
                            >
                                <DriveFileRenameOutlineRoundedIcon />
                            </IconButton>

                            <IconButton
                                size="large"
                                onClick={() => setOpenModal(true)}
                                disabled={isPending}
                                sx={{
                                    bgcolor: 'grey.800',
                                    color: 'common.white',
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: 'grey.700' },
                                    px: 1,
                                    py: 0,
                                }}
                            >
                                <DeleteOutlineIcon fontSize="medium" />
                            </IconButton>
                        </Box>
                    )}
                </Box>

                {/* General Information */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    General Information
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                Company
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{car.company?.name || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Assigned Driver</TableCell>
                            <TableCell sx={{border: 'none'}}>N/A</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Vehicle Year</TableCell>
                            <TableCell sx={{border: 'none'}}>{car.vehicleYear || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Registration Date</TableCell>
                            <TableCell sx={{border: 'none'}}>{car.registrationDate || 'N/A'}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* Vehicle Documents */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    Vehicle Documents
                </Typography>
                <Box 
                    sx={{ 
                        p: 3, 
                        border: '1px dashed', 
                        borderColor: 'divider', 
                        borderRadius: 1, 
                        textAlign: 'center',
                        color: 'text.secondary'
                    }}
                >
                    <Typography variant="body2">
                        Document management functionality will be available soon.
                    </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Remark */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 1}}>
                    Remark
                </Typography>
                <Typography variant="body1">
                    {car.remark || 'No remark provided'}
                </Typography>

            </Paper>

            {/* Confirm Deletion Modal */}
            <ConfirmModal
                open={openModal}
                title="Delete Vehicle?"
                message="Are you sure you want to delete this vehicle?"
                onClose={() => setOpenModal(false)}
                onConfirm={handleDelete}
            />

            {/* Display error for deletion if needed */}
            {isDeleteError && (
                <Alert severity="error" sx={{mt: 2}}>
                    {deleteError?.message || 'Failed to delete vehicle.'}
                </Alert>
            )}
        </Box>
    );
}
