'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
    const t = useTranslations();
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
    
    // Debug: Log car data when it changes
    useEffect(() => {
        if (car) {
            console.log('🚗 [CAR DETAIL] Car data loaded:', {
                id: car.id,
                licensePlate: car.licensePlate,
                companyId: car.company?.id,
                companyName: car.company?.name,
                currentDriverId: car.driverId,
                currentDriverName: car.driverFirstName && car.driverLastName 
                    ? `${car.driverFirstName} ${car.driverLastName}` 
                    : 'No driver assigned',
            });
        }
    }, [car]);
    
    // Debug: Log company data when it changes
    useEffect(() => {
        if (companyData) {
            console.log('🏢 [COMPANY DATA] Company details loaded:', {
                companyId: companyData.id,
                companyName: companyData.name,
                driversCount: companyData.drivers?.length || 0,
                drivers: companyData.drivers?.map(d => ({
                    id: (d as any).id || d.driverId,
                    name: `${d.user?.firstName} ${d.user?.lastName}`,
                    aspNetUserId: d.aspNetUserId,
                })),
            });
        }
    }, [companyData]);
    
    // Check roles
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'employer', 'customer', 'customerAccountant'];
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
            setDeleteErrorMsg(err.message || t('cars.detail.errors.deleteFailed'));
            setOpenModal(false);
        }
    };

    // Handle Driver Assignment
    const handleAssignDriver = async () => {
        console.log('🚗 [CAR ASSIGNMENT] Starting assignment process...');
        console.log('📋 [CAR ASSIGNMENT] Selected Driver ID:', selectedDriverId);
        console.log('📋 [CAR ASSIGNMENT] Car:', car);
        
        if (!selectedDriverId || !car) {
            console.error('❌ [CAR ASSIGNMENT] Missing selectedDriverId or car');
            return;
        }
        
        setAssignmentError(null);
        
        // Find the selected driver to get their user ID
        console.log('🔍 [CAR ASSIGNMENT] Searching for driver in company data...');
        console.log('📋 [CAR ASSIGNMENT] Company Drivers:', companyData?.drivers);
        
        const selectedDriver = companyData?.drivers?.find(d => {
            const driverId = (d as any).id || d.driverId;
            return driverId === selectedDriverId;
        });
        
        console.log('👤 [CAR ASSIGNMENT] Found Driver:', selectedDriver);
        
        if (!selectedDriver?.aspNetUserId) {
            console.error('❌ [CAR ASSIGNMENT] Driver user ID not found');
            setAssignmentError('Driver user ID not found');
            return;
        }
        
        const payload = {
            userId: selectedDriver.aspNetUserId,
            carId: car.id,
            companyId: car.company.id,
        };
        
        console.log('📤 [CAR ASSIGNMENT] Sending payload to backend:', payload);
        console.log('📤 [CAR ASSIGNMENT] Payload details:', {
            userId: payload.userId,
            userIdType: typeof payload.userId,
            carId: payload.carId,
            carIdType: typeof payload.carId,
            companyId: payload.companyId,
            companyIdType: typeof payload.companyId,
        });
        
        try {
            console.log('⏳ [CAR ASSIGNMENT] Calling assignCar mutation...');
            const result = await assignCar(payload);
            console.log('✅ [CAR ASSIGNMENT] Assignment successful!', result);
            
            // Success - close modal and reset state
            setOpenDriverModal(false);
            setSelectedDriverId(null);
            setAssignmentError(null);
            
        } catch (err: any) {
            console.error('❌ [CAR ASSIGNMENT] Assignment failed:', err);
            console.error('❌ [CAR ASSIGNMENT] Error details:', {
                message: err.message,
                response: err.response,
                data: err.response?.data,
                status: err.response?.status,
            });
            
            // 🔍 Display backend error message if available
            const backendErrors = err.response?.data?.errors;
            if (backendErrors && backendErrors.length > 0) {
                console.error('🚨 [CAR ASSIGNMENT] Backend error messages:', backendErrors);
                setAssignmentError(backendErrors[0]); // Show first error to user
            } else {
                setAssignmentError(err.message || t('cars.detail.errors.assignmentFailed'));
            }
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
                <Alert severity="error">{error?.message || t('cars.detail.errors.loadFailed')}</Alert>
            </Box>
        );
    }

    // Format date helper (dd-mm-yyyy format)
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return t('cars.detail.notAvailable');
        try {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        } catch {
            return t('cars.detail.notAvailable');
        }
    };

    return (
        <Box sx={{py: 4}}>
            {/* Header Section */}
            <Box sx={{mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h3" fontWeight={500}>
                    {t('cars.detail.title')}
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
                                    console.log('🔘 [ASSIGN BUTTON] Clicked - Opening driver modal');
                                    console.log('🔘 [ASSIGN BUTTON] Current car:', car);
                                    console.log('🔘 [ASSIGN BUTTON] Current driver:', {
                                        driverId: car.driverId,
                                        driverName: car.driverFirstName && car.driverLastName 
                                            ? `${car.driverFirstName} ${car.driverLastName}` 
                                            : 'None',
                                    });
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
                                {t('cars.detail.buttons.assignDriver')}
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
                    {t('cars.detail.sections.general')}
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                {t('cars.detail.fields.company')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{car.company?.name || t('cars.detail.notAvailable')}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('cars.detail.fields.assignedDriver')}</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {car.driverFirstName && car.driverLastName 
                                    ? `${car.driverFirstName} ${car.driverLastName}`
                                    : t('cars.detail.notAssigned')
                                }
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('cars.detail.fields.vehicleYear')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{car.vehicleYear || t('cars.detail.notAvailable')}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('cars.detail.fields.registrationDate')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{formatDate(car.registrationDate)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('cars.detail.fields.leasingStartDate')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{formatDate(car.leasingStartDate)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('cars.detail.fields.leasingEndDate')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{formatDate(car.leasingEndDate)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', verticalAlign: 'top'}}>{t('cars.detail.fields.usedByCompanies')}</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {car.usedByCompanies && car.usedByCompanies.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        {car.usedByCompanies.map((company) => (
                                            <Typography key={company.id} variant="body2">
                                                • {company.name}
                                            </Typography>
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        {t('cars.detail.noUsedByCompanies')}
                                    </Typography>
                                )}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* Vehicle Documents */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    {t('cars.detail.sections.documents')}
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
                        {t('cars.detail.noDocuments')}
                    </Typography>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Remark */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 1}}>
                    {t('cars.detail.sections.remark')}
                </Typography>
                <Typography variant="body1">
                    {car.remark || t('cars.detail.noRemark')}
                </Typography>

            </Paper>

            {/* Confirm Deletion Modal */}
            <ConfirmModal
                open={openModal}
                title={t('cars.detail.deleteConfirm.title')}
                message={t('cars.detail.deleteConfirm.message')}
                onClose={() => setOpenModal(false)}
                onConfirm={handleDelete}
            />

            {/* Display error for deletion if needed */}
            {isDeleteError && (
                <Alert severity="error" sx={{mt: 2}}>
                    {deleteError?.message || t('cars.detail.errors.deleteFailed')}
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
                        {t('cars.detail.assignmentModal.title', { licensePlate: car?.licensePlate })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('cars.detail.assignmentModal.subtitle', { companyName: car?.company?.name })}
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
                                {t('cars.detail.assignmentModal.noDrivers')}
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
                                                    label={t('cars.detail.assignmentModal.selected')} 
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
                        {t('common.buttons.cancel')}
                    </Button>
                    <Button
                        onClick={handleAssignDriver}
                        variant="contained"
                        disabled={!selectedDriverId || isAssigning}
                        startIcon={isAssigning ? <CircularProgress size={20} /> : null}
                    >
                        {isAssigning ? t('cars.detail.buttons.assigning') : t('cars.detail.buttons.confirmAssignment')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
