'use client';

import React, {useEffect, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Typography,
} from '@mui/material';
import Link from 'next/link';
import dayjs from 'dayjs';

import {useAuth} from '@/hooks/useAuth';
import {useEmployeeContractDetail} from '@/hooks/useEmployeeContractDetail';
import {useDeleteEmployeeContract} from "@/hooks/useDeleteEmployeeContract";
import ConfirmModal from '@/components/ConfirmModal';

export default function ContractDetailPage() {
    const router = useRouter();
    const {id} = useParams(); // /contracts/[id]
    const {isAuthenticated, loading: authLoading} = useAuth();

    // 1) Restrict access
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // 2) Fetch contract detail
    const {
        data: contract,
        isLoading,
        isError,
        error,
    } = useEmployeeContractDetail(id as string);

    // 3) Deletion
    const {mutateAsync: deleteContract, isPending} = useDeleteEmployeeContract();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const handleDeleteConfirm = async () => {
        setDeleteError(null);
        try {
            await deleteContract(id as string);
            setDeleteDialogOpen(false);
            router.push('/contracts'); // Return to listing
        } catch (err: any) {
            setDeleteError(err.message || 'Failed to delete contract');
        }
    };

    // If loading
    if (authLoading || isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress/>
            </Box>
        );
    }

    if (isError || !contract) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <Alert severity="error">{error?.message || 'Failed to load contract.'}</Alert>
            </Box>
        );
    }

    return (
        <Box p={2} maxWidth="800px" mx="auto">
            {/* Error from delete action, if any */}
            {deleteError && (
                <Alert severity="error" sx={{mb: 2}}>
                    {deleteError}
                </Alert>
            )}

            {/* Header + actions */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">Contract Detail</Typography>
                <Box display="flex" gap={2}>
                    <Link href={`/contracts/edit/${contract.id}`} passHref>
                        <Button variant="contained" color="primary">
                            Edit
                        </Button>
                    </Link>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => setDeleteDialogOpen(true)}
                        disabled={isPending}
                    >
                        {isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableBody>
                        {/* Driver (clickable) */}
                        <TableRow>
                            <TableCell><strong>Driver</strong></TableCell>
                            <TableCell>
                                {contract.driver ? (
                                    <Link href={`/drivers/${contract.driver.aspNetUserId}`}>
                                        {contract.driver.fullName}
                                    </Link>
                                ) : 'N/A'}
                            </TableCell>
                        </TableRow>

                        {/* Company (clickable) */}
                        <TableRow>
                            <TableCell><strong>Company</strong></TableCell>
                            <TableCell>
                                {contract.company ? (
                                    <Link href={`/companies/${contract.company.id}`}>
                                        {contract.company.name}
                                    </Link>
                                ) : 'N/A'}
                            </TableCell>
                        </TableRow>

                        {/* releaseVersion */}
                        <TableRow>
                            <TableCell><strong>Release Version</strong></TableCell>
                            <TableCell>{contract.releaseVersion ?? 'N/A'}</TableCell>
                        </TableRow>

                        {/* nightHoursAllowed */}
                        <TableRow>
                            <TableCell><strong>Night Hours Allowed</strong></TableCell>
                            <TableCell>{contract.nightHoursAllowed ? 'Yes' : 'No'}</TableCell>
                        </TableRow>

                        {/* kilometersAllowanceAllowed */}
                        <TableRow>
                            <TableCell><strong>Kilometers Allowance</strong></TableCell>
                            <TableCell>{contract.kilometersAllowanceAllowed ? 'Yes' : 'No'}</TableCell>
                        </TableRow>

                        {/* commuteKilometers */}
                        <TableRow>
                            <TableCell><strong>Commute Kilometers</strong></TableCell>
                            <TableCell>{contract.commuteKilometers ?? 'N/A'}</TableCell>
                        </TableRow>

                        {/* employeeFirstName / LastName */}
                        <TableRow>
                            <TableCell><strong>Employee Name</strong></TableCell>
                            <TableCell>{contract.employeeFirstName} {contract.employeeLastName}</TableCell>
                        </TableRow>

                        {/* employeeAddress */}
                        <TableRow>
                            <TableCell><strong>Employee Address</strong></TableCell>
                            <TableCell>{contract.employeeAddress || 'N/A'}</TableCell>
                        </TableRow>

                        {/* employeePostcode */}
                        <TableRow>
                            <TableCell><strong>Employee Postcode</strong></TableCell>
                            <TableCell>{contract.employeePostcode || 'N/A'}</TableCell>
                        </TableRow>

                        {/* employeeCity */}
                        <TableRow>
                            <TableCell><strong>Employee City</strong></TableCell>
                            <TableCell>{contract.employeeCity || 'N/A'}</TableCell>
                        </TableRow>

                        {/* dateOfBirth */}
                        <TableRow>
                            <TableCell><strong>Date of Birth</strong></TableCell>
                            <TableCell>
                                {contract.dateOfBirth
                                    ? dayjs(contract.dateOfBirth).format('DD-MM-YYYY')
                                    : 'N/A'}
                            </TableCell>
                        </TableRow>

                        {/* bsn */}
                        <TableRow>
                            <TableCell><strong>BSN</strong></TableCell>
                            <TableCell>{contract.bsn || 'N/A'}</TableCell>
                        </TableRow>

                        {/* dateOfEmployment */}
                        <TableRow>
                            <TableCell><strong>Date of Employment</strong></TableCell>
                            <TableCell>
                                {contract.dateOfEmployment
                                    ? dayjs(contract.dateOfEmployment).format('DD-MM-YYYY')
                                    : 'N/A'}
                            </TableCell>
                        </TableRow>

                        {/* lastWorkingDay */}
                        <TableRow>
                            <TableCell><strong>Last Working Day</strong></TableCell>
                            <TableCell>
                                {contract.lastWorkingDay
                                    ? dayjs(contract.lastWorkingDay).format('DD-MM-YYYY')
                                    : 'N/A'}
                            </TableCell>
                        </TableRow>

                        {/* function */}
                        <TableRow>
                            <TableCell><strong>Function</strong></TableCell>
                            <TableCell>{contract.function || 'N/A'}</TableCell>
                        </TableRow>

                        {/* probationPeriod */}
                        <TableRow>
                            <TableCell><strong>Probation Period</strong></TableCell>
                            <TableCell>{contract.probationPeriod || 'N/A'}</TableCell>
                        </TableRow>

                        {/* workweekDuration */}
                        <TableRow>
                            <TableCell><strong>Workweek Duration</strong></TableCell>
                            <TableCell>{contract.workweekDuration ?? 'N/A'} hrs</TableCell>
                        </TableRow>

                        {/* weeklySchedule */}
                        <TableRow>
                            <TableCell><strong>Weekly Schedule</strong></TableCell>
                            <TableCell>{contract.weeklySchedule || 'N/A'}</TableCell>
                        </TableRow>

                        {/* workingHours */}
                        <TableRow>
                            <TableCell><strong>Working Hours</strong></TableCell>
                            <TableCell>{contract.workingHours || 'N/A'}</TableCell>
                        </TableRow>

                        {/* noticePeriod */}
                        <TableRow>
                            <TableCell><strong>Notice Period</strong></TableCell>
                            <TableCell>{contract.noticePeriod || 'N/A'}</TableCell>
                        </TableRow>

                        {/* compensationPerMonthExclBtw */}
                        <TableRow>
                            <TableCell><strong>Compensation/Month (excl. BTW)</strong></TableCell>
                            <TableCell>{contract.compensationPerMonthExclBtw ?? 'N/A'}</TableCell>
                        </TableRow>

                        {/* compensationPerMonthInclBtw */}
                        <TableRow>
                            <TableCell><strong>Compensation/Month (incl. BTW)</strong></TableCell>
                            <TableCell>{contract.compensationPerMonthInclBtw ?? 'N/A'}</TableCell>
                        </TableRow>

                        {/* payScale / payScaleStep */}
                        <TableRow>
                            <TableCell><strong>Pay Scale</strong></TableCell>
                            <TableCell>
                                {contract.payScale || 'N/A'} - Step {contract.payScaleStep ?? 'N/A'}
                            </TableCell>
                        </TableRow>

                        {/* hourlyWage100Percent */}
                        <TableRow>
                            <TableCell><strong>Hourly Wage (100%)</strong></TableCell>
                            <TableCell>{contract.hourlyWage100Percent ?? 'N/A'}</TableCell>
                        </TableRow>

                        {/* deviatingWage */}
                        <TableRow>
                            <TableCell><strong>Deviating Wage</strong></TableCell>
                            <TableCell>{contract.deviatingWage ?? 'N/A'}</TableCell>
                        </TableRow>

                        {/* travelExpenses */}
                        <TableRow>
                            <TableCell><strong>Travel Expenses</strong></TableCell>
                            <TableCell>{contract.travelExpenses ?? 'N/A'}</TableCell>
                        </TableRow>

                        {/* maxTravelExpenses */}
                        <TableRow>
                            <TableCell><strong>Max Travel Expenses</strong></TableCell>
                            <TableCell>{contract.maxTravelExpenses ?? 'N/A'}</TableCell>
                        </TableRow>

                        {/* vacationAge */}
                        <TableRow>
                            <TableCell><strong>Vacation Age</strong></TableCell>
                            <TableCell>{contract.vacationAge ?? 'N/A'}</TableCell>
                        </TableRow>

                        {/* vacationDays */}
                        <TableRow>
                            <TableCell><strong>Vacation Days</strong></TableCell>
                            <TableCell>{contract.vacationDays ?? 'N/A'}</TableCell>
                        </TableRow>

                        {/* atv */}
                        <TableRow>
                            <TableCell><strong>ATV</strong></TableCell>
                            <TableCell>{contract.atv ?? 'N/A'}</TableCell>
                        </TableRow>

                        {/* vacationAllowance */}
                        <TableRow>
                            <TableCell><strong>Vacation Allowance (%)</strong></TableCell>
                            <TableCell>{contract.vacationAllowance ?? 'N/A'}</TableCell>
                        </TableRow>

                        {/* companyName / employerName */}
                        <TableRow>
                            <TableCell><strong>Company Name</strong></TableCell>
                            <TableCell>{contract.companyName || 'N/A'}</TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell><strong>Employer Name</strong></TableCell>
                            <TableCell>{contract.employerName || 'N/A'}</TableCell>
                        </TableRow>

                        {/* companyAddress */}
                        <TableRow>
                            <TableCell><strong>Company Address</strong></TableCell>
                            <TableCell>{contract.companyAddress || 'N/A'}</TableCell>
                        </TableRow>

                        {/* companyPostcode */}
                        <TableRow>
                            <TableCell><strong>Company Postcode</strong></TableCell>
                            <TableCell>{contract.companyPostcode || 'N/A'}</TableCell>
                        </TableRow>

                        {/* companyCity */}
                        <TableRow>
                            <TableCell><strong>Company City</strong></TableCell>
                            <TableCell>{contract.companyCity || 'N/A'}</TableCell>
                        </TableRow>

                        {/* companyPhoneNumber */}
                        <TableRow>
                            <TableCell><strong>Company Phone</strong></TableCell>
                            <TableCell>{contract.companyPhoneNumber || 'N/A'}</TableCell>
                        </TableRow>

                        {/* companyBtw */}
                        <TableRow>
                            <TableCell><strong>Company BTW</strong></TableCell>
                            <TableCell>{contract.companyBtw || 'N/A'}</TableCell>
                        </TableRow>

                        {/* companyKvk */}
                        <TableRow>
                            <TableCell><strong>Company KVK</strong></TableCell>
                            <TableCell>{contract.companyKvk || 'N/A'}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Delete confirmation dialog */}
            <ConfirmModal
                open={deleteDialogOpen}
                title="Delete Contract?"
                message="Are you sure you want to delete this employee contract?"
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                />
        </Box>
    );
}
