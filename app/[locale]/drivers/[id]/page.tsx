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
    Button,
    Chip,
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    TableHead,
    TableContainer,
    Collapse,
} from '@mui/material';
import DriveFileRenameOutlineRoundedIcon from '@mui/icons-material/DriveFileRenameOutlineRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoIcon from '@mui/icons-material/Info';
import { useDriverWithContract } from '@/hooks/useDriverWithContract';
import { useDeleteDriver } from '@/hooks/useDeleteDriver';
import { useDownloadDriverFile } from '@/hooks/useDownloadDriverFile';
import { useDriverLatestContract, useDriverContractVersions } from '@/hooks/useDriverContracts';
import { useDownloadContractPdf } from '@/hooks/useDownloadContractPdf';
import { useRegenerateContract } from '@/hooks/useRegenerateContract';
import ConfirmModal from '@/components/ConfirmModal';
import FileTile from '@/components/FileTile';
import ContractVersionDetailsModal from '@/components/ContractVersionDetailsModal';
import { useAuth } from '@/hooks/useAuth';
import { useSnack } from '@/providers/SnackProvider';
import dayjs from 'dayjs';

export default function DriverDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const t = useTranslations();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { data: driver, isLoading, isError, error } = useDriverWithContract(id as string);
    const { mutateAsync: deleteDriver, isPending: isDeleting } = useDeleteDriver();
    const downloadFile = useDownloadDriverFile();
    
    // Contract hooks
    const { data: latestContract, isLoading: isLoadingContract, refetch: refetchContract } = useDriverLatestContract(id as string);
    const { data: contractVersions, isLoading: isLoadingVersions } = useDriverContractVersions(id as string, false);
    const { mutateAsync: downloadContractPdf, isPending: isDownloading } = useDownloadContractPdf();
    const { mutateAsync: regenerateContract, isPending: isRegenerating } = useRegenerateContract();
    const showSnack = useSnack();
    
    const isCustomerAdmin = user?.roles.includes('customerAdmin');
    const isGlobalAdmin = user?.roles.includes('globalAdmin');
    const isAdmin = isCustomerAdmin || isGlobalAdmin;

    // Confirm modal state for delete
    const [openModal, setOpenModal] = useState(false);
    const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);
    
    // Contract state
    const [regenerateConfirmOpen, setRegenerateConfirmOpen] = useState(false);
    const [historyExpanded, setHistoryExpanded] = useState(false);
    const [versionDetailsOpen, setVersionDetailsOpen] = useState(false);
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
    
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
        if (!dateString) return t('drivers.detail.notAvailable');
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return t('drivers.detail.notAvailable');
        }
    };

    // Format currency helper
    const formatCurrency = (amount?: number | null) => {
        if (!amount) return t('drivers.detail.notAvailable');
        return `€${amount.toFixed(2)}`;
    };

    // Format file size helper
    const formatFileSize = (bytes?: number | null) => {
        if (!bytes) return t('drivers.detail.notAvailable');
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    // Handle contract download
    const handleDownloadContract = async (versionId?: string) => {
        if (!id) return;
        const targetVersionId = versionId || latestContract?.id;
        if (!targetVersionId) {
            showSnack({ text: t('drivers.detail.contracts.noContract'), severity: 'error' });
            return;
        }

        try {
            const driverName = `${driver?.firstName || ''}_${driver?.lastName || ''}`.trim() || 'driver';
            const versionNumber = versionId 
                ? contractVersions?.find(v => v.id === versionId)?.versionNumber || '1'
                : latestContract?.versionNumber || '1';
            const fileName = `contract_v${versionNumber}_${driverName}.pdf`;

            await downloadContractPdf({
                driverId: id as string,
                versionId: targetVersionId,
                fileName,
            });
            
            showSnack({ 
                text: t('drivers.detail.contracts.downloadSuccess'), 
                severity: 'success' 
            });
        } catch (error: any) {
            console.error('Download error:', error);
            const errorMessage = error?.message || t('drivers.detail.contracts.downloadError');
            
            // Check if error suggests file is missing (404) and offer regenerate option
            const isFileNotFound = errorMessage.toLowerCase().includes('not found') || 
                                  errorMessage.toLowerCase().includes('file not found');
            
            showSnack({ 
                text: errorMessage, 
                severity: 'error' 
            });
            
            // If file is missing and user is admin, they can regenerate
            if (isFileNotFound && isAdmin) {
                // Optionally show a separate message suggesting regeneration
                setTimeout(() => {
                    showSnack({
                        text: t('drivers.detail.contracts.fileMissingSuggestRegenerate'),
                        severity: 'info',
                    });
                }, 2000);
            }
        }
    };

    // Handle contract regeneration
    const handleRegenerateContract = async () => {
        if (!id) return;
        
        try {
            setRegenerateConfirmOpen(false);
            const response = await regenerateContract(id as string);
            
            showSnack({ 
                text: t('drivers.detail.contracts.regenerateSuccess', { version: response.versionNumber }), 
                severity: 'success' 
            });
            
            // Refresh contract data
            await refetchContract();
        } catch (error: any) {
            console.error('Regenerate error:', error);
            
            // Extract error message and check for specific error types
            const errorMessage = error?.message || t('drivers.detail.contracts.regenerateError');
            const isUnauthorized = errorMessage.toLowerCase().includes('permission') || 
                                  errorMessage.toLowerCase().includes('unauthorized') ||
                                  errorMessage.toLowerCase().includes('403');
            const isServerError = errorMessage.toLowerCase().includes('server error') || 
                                errorMessage.toLowerCase().includes('500') ||
                                errorMessage.toLowerCase().includes('internal server');
            
            let displayMessage = errorMessage;
            
            if (isUnauthorized) {
                displayMessage = t('drivers.detail.contracts.regenerateUnauthorized');
            } else if (isServerError) {
                displayMessage = t('drivers.detail.contracts.regenerateServerError');
            }
            
            showSnack({ 
                text: displayMessage, 
                severity: 'error' 
            });
        }
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

                {/* Contract Section */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    {t('drivers.detail.contracts.title')}
                </Typography>
                
                {isLoadingContract ? (
                    <Box display="flex" justifyContent="center" py={2}>
                        <CircularProgress size={24} />
                    </Box>
                ) : latestContract ? (
                    <Box>
                        <Table size="small" sx={{mb: 2}}>
                            <TableBody>
                                <TableRow>
                                    <TableCell sx={{pl: 0, border: 'none', width: 180}}>
                                        {t('drivers.detail.contracts.version')}
                                    </TableCell>
                                    <TableCell sx={{border: 'none'}}>
                                        <Chip 
                                            label={`v${latestContract.versionNumber}`} 
                                            size="small" 
                                            color={latestContract.isLatestVersion ? 'primary' : 'default'}
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{pl: 0, border: 'none'}}>
                                        {t('drivers.detail.contracts.status')}
                                    </TableCell>
                                    <TableCell sx={{border: 'none'}}>
                                        <Chip 
                                            label={latestContract.status === 'Generated' 
                                                ? t('drivers.detail.contracts.statusGenerated')
                                                : t('drivers.detail.contracts.statusSuperseded')} 
                                            size="small" 
                                            color={latestContract.status === 'Generated' ? 'success' : 'default'}
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{pl: 0, border: 'none'}}>
                                        {t('drivers.detail.contracts.generatedAt')}
                                    </TableCell>
                                    <TableCell sx={{border: 'none'}}>
                                        {latestContract.generatedAt 
                                            ? dayjs(latestContract.generatedAt).format('DD MMM YYYY, HH:mm')
                                            : t('drivers.detail.notAvailable')}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{pl: 0, border: 'none'}}>
                                        {t('drivers.detail.contracts.generatedBy')}
                                    </TableCell>
                                    <TableCell sx={{border: 'none'}}>
                                        {latestContract.generatedByUserName || t('drivers.detail.notAvailable')}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{pl: 0, border: 'none'}}>
                                        {t('drivers.detail.contracts.fileSize')}
                                    </TableCell>
                                    <TableCell sx={{border: 'none'}}>
                                        {formatFileSize(latestContract.fileSize)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                        
                        <Stack direction="row" spacing={2} sx={{mt: 2}}>
                            <Button
                                variant="contained"
                                startIcon={<PictureAsPdfIcon />}
                                onClick={() => handleDownloadContract()}
                                disabled={isDownloading}
                            >
                                {isDownloading ? (
                                    <>
                                        <CircularProgress size={16} sx={{mr: 1}} />
                                        {t('drivers.detail.contracts.loadingContract')}
                                    </>
                                ) : (
                                    t('drivers.detail.contracts.download')
                                )}
                            </Button>
                            
                            {isAdmin && (
                                <Button
                                    variant="outlined"
                                    startIcon={<RefreshIcon />}
                                    onClick={() => setRegenerateConfirmOpen(true)}
                                    disabled={isRegenerating}
                                >
                                    {t('drivers.detail.contracts.regenerate')}
                                </Button>
                            )}
                        </Stack>
                    </Box>
                ) : (
                    <Box>
                        <Alert severity="info" sx={{mb: 2}}>
                            <Typography variant="body2" sx={{mb: 1}}>
                                {t('drivers.detail.contracts.noContractMessage')}
                            </Typography>
                            {isAdmin && (
                                <Typography variant="body2" color="text.secondary">
                                    {t('drivers.detail.contracts.noContractAdminHint')}
                                </Typography>
                            )}
                        </Alert>
                        {isAdmin && (
                            <Button
                                variant="contained"
                                startIcon={<RefreshIcon />}
                                onClick={() => setRegenerateConfirmOpen(true)}
                                disabled={isRegenerating}
                                sx={{mt: 1}}
                            >
                                {isRegenerating ? (
                                    <>
                                        <CircularProgress size={16} sx={{mr: 1}} />
                                        {t('drivers.detail.contracts.loadingContract')}
                                    </>
                                ) : (
                                    t('drivers.detail.contracts.generateContract')
                                )}
                            </Button>
                        )}
                    </Box>
                )}

                {/* Contract History */}
                {latestContract && contractVersions && contractVersions.length > 1 && (
                    <Box sx={{mt: 3}}>
                        <Button
                            onClick={() => setHistoryExpanded(!historyExpanded)}
                            endIcon={historyExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            sx={{mb: 1}}
                        >
                            {t('drivers.detail.contracts.history')}
                        </Button>
                        
                        <Collapse in={historyExpanded}>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>{t('drivers.detail.contracts.version')}</TableCell>
                                            <TableCell>{t('drivers.detail.contracts.generatedAt')}</TableCell>
                                            <TableCell>{t('drivers.detail.contracts.status')}</TableCell>
                                            <TableCell>{t('drivers.detail.contracts.generatedBy')}</TableCell>
                                            <TableCell>{t('drivers.detail.contracts.fileSize')}</TableCell>
                                            <TableCell align="right">{t('drivers.detail.contracts.actions')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {contractVersions.map((version) => (
                                            <TableRow 
                                                key={version.id}
                                                sx={{
                                                    bgcolor: version.isLatestVersion ? 'action.selected' : 'transparent',
                                                    '&:hover': { bgcolor: 'action.hover' }
                                                }}
                                            >
                                                <TableCell>
                                                    <Chip 
                                                        label={`v${version.versionNumber}`} 
                                                        size="small"
                                                        color={version.isLatestVersion ? 'primary' : 'default'}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {version.generatedAt 
                                                        ? dayjs(version.generatedAt).format('DD MMM YYYY, HH:mm')
                                                        : t('drivers.detail.notAvailable')}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        label={version.status === 'Generated' 
                                                            ? t('drivers.detail.contracts.statusGenerated')
                                                            : t('drivers.detail.contracts.statusSuperseded')} 
                                                        size="small" 
                                                        color={version.status === 'Generated' ? 'success' : 'default'}
                                                    />
                                                </TableCell>
                                                <TableCell>{version.generatedByUserName || t('drivers.detail.notAvailable')}</TableCell>
                                                <TableCell>{formatFileSize(version.fileSize)}</TableCell>
                                                <TableCell align="right">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDownloadContract(version.id)}
                                                        disabled={isDownloading}
                                                    >
                                                        <DownloadIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setSelectedVersionId(version.id);
                                                            setVersionDetailsOpen(true);
                                                        }}
                                                    >
                                                        <InfoIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Collapse>
                    </Box>
                )}

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

            {/* Regenerate Contract Confirmation Dialog */}
            <Dialog 
                open={regenerateConfirmOpen} 
                onClose={() => !isRegenerating && setRegenerateConfirmOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{t('drivers.detail.contracts.regenerateConfirm')}</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        {t('drivers.detail.contracts.regenerateMessage')}
                    </Typography>
                    {latestContract && (
                        <Box sx={{mt: 2}}>
                            <Typography variant="body2" color="text.secondary">
                                {t('drivers.detail.contracts.currentVersion')}: {latestContract.versionNumber}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {t('drivers.detail.contracts.newVersion')}: {latestContract.versionNumber + 1}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setRegenerateConfirmOpen(false)} 
                        disabled={isRegenerating}
                    >
                        {t('common.buttons.cancel')}
                    </Button>
                    <Button 
                        onClick={handleRegenerateContract} 
                        variant="contained" 
                        color="primary"
                        disabled={isRegenerating}
                    >
                        {isRegenerating ? (
                            <>
                                <CircularProgress size={16} sx={{mr: 1}} />
                                {t('drivers.detail.contracts.loadingContract')}
                            </>
                        ) : (
                            t('drivers.detail.contracts.regenerate')
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Contract Version Details Modal */}
            {id && driver && (
                <ContractVersionDetailsModal
                    open={versionDetailsOpen}
                    onClose={() => {
                        setVersionDetailsOpen(false);
                        setSelectedVersionId(null);
                    }}
                    versionId={selectedVersionId}
                    driverId={id as string}
                    driverName={`${driver.firstName}_${driver.lastName}`}
                />
            )}
        </Box>
    );
}
