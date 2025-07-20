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
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Radio,
    Chip,
} from '@mui/material';
import DriveFileRenameOutlineRoundedIcon from '@mui/icons-material/DriveFileRenameOutlineRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useCarDetail } from '@/hooks/useCarDetail';
import { useDeleteCar } from '@/hooks/useDeleteCar';
import { useDownloadCarFile } from '@/hooks/useDownloadCarFile';
import { useCompanyDetails } from '@/hooks/useCompanyDetails';
import { useAssignCarToDriver } from '@/hooks/useAssignCarToDriver';
import ConfirmModal from '@/components/ConfirmModal';
import FileTile from '@/components/FileTile';
import { useAuth } from '@/hooks/useAuth';

export default function VehicleDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { data: car, isLoading, isError, error } = useCarDetail(id as string);
    const downloadFile = useDownloadCarFile();
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
    
    // Driver assignment state
    const [openDriverModal, setOpenDriverModal] = useState(false);
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
    const [assignmentError, setAssignmentError] = useState<string | null>(null);
    
    // Fetch company details to get drivers
    const { data: companyData, isLoading: isCompanyLoading } = useCompanyDetails(car?.company?.id || '');
    
    // Car assignment mutation
    const { mutateAsync: assignCar, isPending: isAssigning, isError: isAssignError, error: assignError } = useAssignCarToDriver();
    
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

    // Handle Driver Assignment
    const handleAssignDriver = async () => {
        if (!selectedDriverId || !car) return;
        
        setAssignmentError(null);
        
        // Find the selected driver to get their user ID
        const selectedDriver = companyData?.drivers?.find(d => {
            const driverId = (d as any).id || d.driverId;
            return driverId === selectedDriverId;
        });
        if (!selectedDriver?.aspNetUserId) {
            setAssignmentError('Driver user ID not found');
            return;
        }
        
        try {
            await assignCar({
                userId: selectedDriver.aspNetUserId,
                carId: car.id,
                companyId: car.company.id,
            });
            
            // Success - close modal and reset state
            setOpenDriverModal(false);
            setSelectedDriverId(null);
            setAssignmentError(null);
            
        } catch (err: any) {
            setAssignmentError(err.message || 'Failed to assign car to driver');
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
                            {/* Assign Driver Button */}
                            <Button
                                onClick={() => {
                                    setSelectedDriverId(null); // Reset selection
                                    setAssignmentError(null); // Reset errors
                                    setOpenDriverModal(true);
                                }}
                                disabled={isPending || isCompanyLoading}
                                variant="contained"
                                startIcon={<PersonAddIcon />}
                                sx={{
                                    borderRadius: 1,
                                }}
                            >
                                Assign Driver
                            </Button>
                            
                            {/* Edit Button */}
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

                            {/* Delete Button */}
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
                            <TableCell sx={{border: 'none'}}>
                                {car.driverFirstName && car.driverLastName 
                                    ? `${car.driverFirstName} ${car.driverLastName}`
                                    : 'Not assigned'
                                }
                            </TableCell>
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
                {car.files?.length ? (
                    <Stack spacing={2}>
                        {car.files.map((file) => (
                            <FileTile
                                key={file.id}
                                file={file}
                                onClick={() => downloadFile(file)}
                            />
                        ))}
                    </Stack>
                ) : (
                    <Typography variant="body1" color="text.secondary">
                        No documents uploaded.
                    </Typography>
                )}

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

            {/* Driver Assignment Modal */}
            <Dialog 
                open={openDriverModal} 
                onClose={() => setOpenDriverModal(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Typography variant="h6" fontWeight={600}>
                        Assign Driver to {car?.licensePlate}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Select a driver from {car?.company?.name}
                    </Typography>
                </DialogTitle>
                
                <DialogContent>
                    {/* Assignment Error */}
                    {assignmentError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {assignmentError}
                        </Alert>
                    )}
                    
                    {isCompanyLoading ? (
                        <Box display="flex" justifyContent="center" py={4}>
                            <CircularProgress />
                        </Box>
                    ) : !companyData?.drivers?.length ? (
                        <Box textAlign="center" py={4}>
                            <Typography color="text.secondary">
                                No drivers available for this company.
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ width: '100%' }}>
                            {companyData.drivers.map((driver) => {
                                const driverId = (driver as any).id || driver.driverId;
                                return (
                                    <ListItem key={driverId} disablePadding>
                                        <ListItemButton 
                                            onClick={() => {
                                                setSelectedDriverId(driverId);
                                            }}
                                            sx={{ borderRadius: 1 }}
                                            disabled={isAssigning}
                                        >
                                            <Radio
                                                checked={selectedDriverId === driverId}
                                                value={driverId}
                                                sx={{ mr: 1 }}
                                            />
                                            <ListItemText 
                                                primary={
                                                    <Typography variant="body1">
                                                        {driver.user?.firstName} {driver.user?.lastName}
                                                    </Typography>
                                                }
                                                secondary={driver.user?.email}
                                            />
                                            {selectedDriverId === driverId && (
                                                <Chip 
                                                    label="Selected" 
                                                    size="small" 
                                                    color="primary" 
                                                    sx={{ ml: 1 }}
                                                />
                                            )}
                                        </ListItemButton>
                                    </ListItem>
                                );
                            })}
                        </List>
                    )}
                </DialogContent>
                
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button 
                        onClick={() => {
                            setOpenDriverModal(false);
                            setSelectedDriverId(null);
                            setAssignmentError(null);
                        }}
                        color="inherit"
                        disabled={isAssigning}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAssignDriver}
                        variant="contained"
                        disabled={!selectedDriverId || isAssigning}
                        startIcon={isAssigning ? <CircularProgress size={20} /> : null}
                    >
                        {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
