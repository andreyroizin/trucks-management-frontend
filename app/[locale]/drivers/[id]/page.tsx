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
} from '@mui/material';
import DriveFileRenameOutlineRoundedIcon from '@mui/icons-material/DriveFileRenameOutlineRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useDriverWithContract } from '@/hooks/useDriverWithContract';
import { useDeleteDriver } from '@/hooks/useDeleteDriver';
import { useDownloadDriverFile } from '@/hooks/useDownloadDriverFile';
import ConfirmModal from '@/components/ConfirmModal';
import FileTile from '@/components/FileTile';
import { useAuth } from '@/hooks/useAuth';

export default function DriverDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const t = useTranslations();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { data: driver, isLoading, isError, error } = useDriverWithContract(id as string);
    const { mutateAsync: deleteDriver, isPending: isDeleting } = useDeleteDriver();
    const downloadFile = useDownloadDriverFile();
    
    const isCustomerAdmin = user?.roles.includes('customerAdmin');
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    // Confirm modal state for delete
    const [openModal, setOpenModal] = useState(false);
    const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);
    
    // Check roles
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'employer', 'customer', 'customerAccountant'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router, user?.roles]);

    // Handle Delete
    const handleDelete = async () => {
        setDeleteErrorMsg(null);
        try {
            await deleteDriver(id as string);
            setOpenModal(false);
            router.push('/drivers');
        } catch (err: any) {
            setDeleteErrorMsg(err.message || t('drivers.detail.errors.deleteFailed'));
            setOpenModal(false);
        }
    };

    // Format date helper
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return 'N/A';
        }
    };

    // Format currency helper
    const formatCurrency = (amount?: number | null) => {
        if (!amount) return 'N/A';
        return `€${amount.toFixed(2)}`;
    };

    if (authLoading || isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isError || !driver) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error?.message || t('drivers.detail.errors.loadFailed')}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{py: 4}}>
            {/* Header Section */}
            <Box sx={{mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h3" fontWeight={500}>
                    {t('drivers.detail.title')}
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
                        {driver.firstName} {driver.lastName}
                    </Typography>
                    {(isCustomerAdmin || isGlobalAdmin) && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {/* Edit Button */}
                            <IconButton
                                onClick={() => router.push(`/drivers/edit/${id}`)}
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
                                disabled={isDeleting}
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
                    {t('drivers.detail.sections.general')}
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 180}}>
                                {t('drivers.detail.fields.company')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.companyName || t('drivers.detail.notAvailable')}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('drivers.detail.fields.email')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.email || t('drivers.detail.notAvailable')}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('drivers.detail.fields.phone')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.phoneNumber || t('drivers.detail.notAvailable')}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('drivers.detail.fields.dateOfBirth')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{formatDate(driver.dateOfBirth)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* Employee Information */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    {t('drivers.detail.sections.employee')}
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 180}}>
                                {t('drivers.detail.fields.address')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {driver.address ? `${driver.address}, ${driver.postcode} ${driver.city}, ${driver.country}` : t('drivers.detail.notAvailable')}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('drivers.detail.fields.bsn')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.bsn || t('drivers.detail.notAvailable')}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('drivers.detail.fields.iban')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{(driver as any).iban || t('drivers.detail.notAvailable')}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* Employment Details */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    {t('drivers.detail.sections.employment')}
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 180}}>
                                {t('drivers.detail.fields.function')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.function || t('drivers.detail.notAvailable')}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('drivers.detail.fields.employmentDate')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{formatDate(driver.dateOfEmployment)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('drivers.detail.fields.contractEndDate')}</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {(driver as any).permanentContract ? 
                                    t('drivers.detail.permanent') : 
                                    formatDate(driver.lastWorkingDay)
                                }
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('drivers.detail.fields.probationPeriod')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.probationPeriod || t('drivers.detail.notAvailable')}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('drivers.detail.fields.noticePeriod')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.noticePeriod || t('drivers.detail.notAvailable')}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* Work Conditions */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    {t('drivers.detail.sections.workConditions')}
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 180}}>
                                {t('drivers.detail.fields.workweekDuration')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {driver.workweekDuration ? `${driver.workweekDuration} hours (${driver.workweekDurationPercentage || 0}%)` : t('drivers.detail.notAvailable')}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('drivers.detail.fields.weeklySchedule')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.weeklySchedule || t('drivers.detail.notAvailable')}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('drivers.detail.fields.workingHours')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.workingHours || t('drivers.detail.notAvailable')}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* Compensation */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    {t('drivers.detail.sections.compensation')}
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 180}}>
                                {t('drivers.detail.fields.payScale')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {driver.payScale ? `${driver.payScale} - Step ${driver.payScaleStep || t('drivers.detail.notAvailable')}` : t('drivers.detail.notAvailable')}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('drivers.detail.fields.hourlyWage100Percent')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{formatCurrency(driver.hourlyWage100Percent)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* Commute and Travel Expenses */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    {t('drivers.detail.sections.commute')}
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 180}}>
                                {t('drivers.detail.fields.commuteKilometers')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.commuteKilometers ? `${driver.commuteKilometers} km` : t('drivers.detail.notAvailable')}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('drivers.detail.fields.kilometersAllowanceAllowed')}</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {(driver as any).kilometersAllowanceAllowed ? t('drivers.detail.yes') : t('drivers.detail.no')}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* Vacation & Allowances */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    {t('drivers.detail.sections.vacation')}
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 180}}>
                                {t('drivers.detail.fields.atv')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.atv ? `${driver.atv} hours` : t('drivers.detail.notAvailable')}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* Car Assignment */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    {t('drivers.detail.sections.carAssignment')}
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 180}}>
                                {t('drivers.detail.fields.assignedCar')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {driver.carLicensePlate ? (
                                    <Box>
                                        <Typography variant="body2">
                                            {driver.carLicensePlate}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {driver.carVehicleYear && `Year: ${driver.carVehicleYear}`}
                                            {driver.carRegistrationDate && ` • Registered: ${formatDate(driver.carRegistrationDate)}`}
                                        </Typography>
                                    </Box>
                                ) : (
                                    t('drivers.detail.fields.noCarAssigned')
                                )}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* Contract Status */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    {t('drivers.detail.sections.contractStatus')}
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 180}}>
                                {t('drivers.detail.fields.status')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.contractStatus || t('drivers.detail.notAvailable')}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('drivers.detail.fields.signedDate')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{formatDate(driver.signedAt)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('drivers.detail.fields.accessCode')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.accessCode || t('drivers.detail.notAvailable')}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* Driver Documents */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    {t('drivers.detail.sections.documents')}
                </Typography>
                {driver.files?.length ? (
                    <Stack spacing={2}>
                        {driver.files.map((file) => (
                            <FileTile
                                key={file.id}
                                file={file}
                                onClick={() => downloadFile(file)}
                            />
                        ))}
                    </Stack>
                ) : (
                    <Typography variant="body1" color="text.secondary">
                        {t('drivers.detail.noDocuments')}
                    </Typography>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Remark */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 1}}>
                    {t('drivers.detail.sections.remark')}
                </Typography>
                <Typography variant="body1">
                    {driver.remark || t('drivers.detail.noRemark')}
                </Typography>

            </Paper>

            {/* Confirm Deletion Modal */}
            <ConfirmModal
                open={openModal}
                title={t('drivers.detail.deleteConfirm.title')}
                message={t('drivers.detail.deleteConfirm.message', { firstName: driver?.firstName, lastName: driver?.lastName })}
                onClose={() => !isDeleting && setOpenModal(false)}
                onConfirm={handleDelete}
            />
        </Box>
    );
}
