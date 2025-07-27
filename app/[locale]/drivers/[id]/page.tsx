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
            setDeleteErrorMsg(err.message || 'Failed to delete driver.');
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
                <Alert severity="error">{error?.message || 'Failed to load driver details.'}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{py: 4}}>
            {/* Header Section */}
            <Box sx={{mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h3" fontWeight={500}>
                    Driver Management
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
                    General Information
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 180}}>
                                Company
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.companyName || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Email</TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.email || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Phone</TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.phoneNumber || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Date of Birth</TableCell>
                            <TableCell sx={{border: 'none'}}>{formatDate(driver.dateOfBirth)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* Employee Information */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    Employee Information
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 180}}>
                                Address
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {driver.address ? `${driver.address}, ${driver.postcode} ${driver.city}, ${driver.country}` : 'N/A'}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>BSN</TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.bsn || 'N/A'}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* Employment Details */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    Employment Details
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 180}}>
                                Function
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.function || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Employment Date</TableCell>
                            <TableCell sx={{border: 'none'}}>{formatDate(driver.dateOfEmployment)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Contract End Date</TableCell>
                            <TableCell sx={{border: 'none'}}>{formatDate(driver.lastWorkingDay)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Probation Period</TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.probationPeriod || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Notice Period</TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.noticePeriod || 'N/A'}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* Work Conditions */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    Work Conditions
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 180}}>
                                Workweek Duration
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {driver.workweekDuration ? `${driver.workweekDuration} hours (${driver.workweekDurationPercentage || 0}%)` : 'N/A'}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Weekly Schedule</TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.weeklySchedule || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Working Hours</TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.workingHours || 'N/A'}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* Compensation */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    Compensation
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 180}}>
                                Pay Scale
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {driver.payScale ? `${driver.payScale} - Step ${driver.payScaleStep || 'N/A'}` : 'N/A'}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Monthly Compensation (Excl. VAT)</TableCell>
                            <TableCell sx={{border: 'none'}}>{formatCurrency(driver.compensationPerMonthExclBtw)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Monthly Compensation (Incl. VAT)</TableCell>
                            <TableCell sx={{border: 'none'}}>{formatCurrency(driver.compensationPerMonthInclBtw)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Hourly Wage (100%)</TableCell>
                            <TableCell sx={{border: 'none'}}>{formatCurrency(driver.hourlyWage100Percent)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Deviating Wage</TableCell>
                            <TableCell sx={{border: 'none'}}>{formatCurrency(driver.deviatingWage)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* Commute and Travel Expenses */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    Commute and Travel Expenses
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 180}}>
                                Commute Kilometers
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.commuteKilometers ? `${driver.commuteKilometers} km` : 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Travel Expenses Rate</TableCell>
                            <TableCell sx={{border: 'none'}}>{formatCurrency(driver.travelExpenses)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Maximum Travel Expenses</TableCell>
                            <TableCell sx={{border: 'none'}}>{formatCurrency(driver.maxTravelExpenses)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* Vacation & Allowances */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    Vacation & Allowances
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 180}}>
                                Vacation Age Threshold
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.vacationAge ? `${driver.vacationAge} years` : 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Vacation Days</TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.vacationDays ? `${driver.vacationDays} days` : 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>ATV (Reduced Working Hours)</TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.atv ? `${driver.atv} hours` : 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Vacation Allowance</TableCell>
                            <TableCell sx={{border: 'none'}}>{formatCurrency(driver.vacationAllowance)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* Car Assignment */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    Car Assignment
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 180}}>
                                Assigned Car
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
                                    'No car assigned'
                                )}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* Contract Status */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    Contract Status
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 180}}>
                                Status
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.contractStatus || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Signed Date</TableCell>
                            <TableCell sx={{border: 'none'}}>{formatDate(driver.signedAt)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Access Code</TableCell>
                            <TableCell sx={{border: 'none'}}>{driver.accessCode || 'N/A'}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* Driver Documents */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    Driver Documents
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
                        No documents uploaded.
                    </Typography>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Remark */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 1}}>
                    Remark
                </Typography>
                <Typography variant="body1">
                    {driver.remark || 'No remark provided'}
                </Typography>

            </Paper>

            {/* Confirm Deletion Modal */}
            <ConfirmModal
                open={openModal}
                title="Terminate Driver?"
                message={`Are you sure you want to terminate ${driver?.firstName} ${driver?.lastName}? This will deactivate their account and contract.`}
                onClose={() => !isDeleting && setOpenModal(false)}
                onConfirm={handleDelete}
            />
        </Box>
    );
}
