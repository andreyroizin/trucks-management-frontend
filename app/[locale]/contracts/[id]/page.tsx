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
import { downloadBase64Pdf } from '@/utils/downloadBlob';

import {useAuth} from '@/hooks/useAuth';
import {useEmployeeContractDetail} from '@/hooks/useEmployeeContractDetail';
import {useDeleteEmployeeContract} from "@/hooks/useDeleteEmployeeContract";
import ConfirmModal from '@/components/ConfirmModal';
import {useDownloadContract} from "@/hooks/useDownloadContract";
import {useTranslations} from 'next-intl';

export default function ContractDetailPage() {
    const router = useRouter();
    const {id} = useParams(); // /contracts/[id]
    const {isAuthenticated, loading: authLoading} = useAuth();
    const t = useTranslations();

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
    const { mutateAsync: downloadContract, isPending: downloading } =
        useDownloadContract();

    const contractSigned = contract?.status === 1;

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
            setDeleteError(err.message || t('contracts.detail.errors.deleteFailed'));
        }
    };

    const handleContractDownload = async () => {
        try {
            if (!contract?.accessCode) {
                throw new Error(t('contracts.detail.errors.missingAccessCode'));
            }
            const res = await downloadContract({
                id: contract.id,
                access: contract.accessCode,
            });

            downloadBase64Pdf(res.contentBase64, contract?.employeeFirstName + '-' +  contract?.employeeLastName + '-' + res.fileName);
        } catch (err: any) {
            alert(err.message || t('contracts.detail.errors.downloadFailed'));
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
                <Alert severity="error">{error?.message || t('contracts.detail.errors.loadFailed')}</Alert>
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
                <Typography variant="h5">{t('contracts.detail.title')}</Typography>
                <Box display="flex" gap={2}>
                    {contractSigned && (
                        <Button
                            variant="outlined"
                            disabled={downloading}
                            onClick={handleContractDownload}
                        >
                            {downloading ? t('contracts.detail.actions.downloading') : t('contracts.detail.actions.downloadContract')}
                        </Button>
                    )}
                    <Link href={`/contracts/edit/${contract.id}`} passHref>
                        <Button variant="contained" color="primary">
                            {t('contracts.detail.actions.edit')}
                        </Button>
                    </Link>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => setDeleteDialogOpen(true)}
                        disabled={isPending}
                    >
                        {isPending ? t('contracts.detail.actions.deleting') : t('contracts.detail.actions.delete')}
                    </Button>
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableBody>
                        {/* Driver (clickable) */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.driver')}</strong></TableCell>
                            <TableCell>
                                {contract.driver ? (
                                    <Link href={`/drivers/${contract.driver.aspNetUserId}`}>
                                        {contract.driver.fullName}
                                    </Link>
                                ) : t('contracts.detail.notAvailable')}
                            </TableCell>
                        </TableRow>

                        {/* Company (clickable) */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.company')}</strong></TableCell>
                            <TableCell>
                                {contract.company ? (
                                    <Link href={`/companies/${contract.company.id}`}>
                                        {contract.company.name}
                                    </Link>
                                ) : t('contracts.detail.notAvailable')}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.contractStatus')}</strong></TableCell>
                            <TableCell>{contractSigned ? t('contracts.detail.status.signed') : t('contracts.detail.status.pending')}</TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.contractSignedOn')}</strong></TableCell>
                            <TableCell>
                                {contract.signedAt
                                    ? dayjs(contract.signedAt).format('DD-MM-YYYY HH:mm')
                                    : t('contracts.detail.notAvailable')}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.contractAccessCode')}</strong></TableCell>
                            <TableCell>{contract.accessCode || t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>
                        {/* releaseVersion */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.releaseVersion')}</strong></TableCell>
                            <TableCell>{contract.releaseVersion ?? t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* nightHoursAllowed */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.nightHoursAllowed')}</strong></TableCell>
                            <TableCell>{contract.nightHoursAllowed ? t('contracts.detail.booleans.yes') : t('contracts.detail.booleans.no')}</TableCell>
                        </TableRow>

                        {/* kilometersAllowanceAllowed */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.kilometersAllowance')}</strong></TableCell>
                            <TableCell>{contract.kilometersAllowanceAllowed ? t('contracts.detail.booleans.yes') : t('contracts.detail.booleans.no')}</TableCell>
                        </TableRow>

                        {/* commuteKilometers */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.commuteKilometers')}</strong></TableCell>
                            <TableCell>{contract.commuteKilometers ?? t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* employeeFirstName / LastName */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.employeeName')}</strong></TableCell>
                            <TableCell>{contract.employeeFirstName} {contract.employeeLastName}</TableCell>
                        </TableRow>

                        {/* employeeAddress */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.employeeAddress')}</strong></TableCell>
                            <TableCell>{contract.employeeAddress || t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* employeePostcode */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.employeePostcode')}</strong></TableCell>
                            <TableCell>{contract.employeePostcode || t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* employeeCity */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.employeeCity')}</strong></TableCell>
                            <TableCell>{contract.employeeCity || t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* dateOfBirth */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.dateOfBirth')}</strong></TableCell>
                            <TableCell>
                                {contract.dateOfBirth
                                    ? dayjs(contract.dateOfBirth).format('DD-MM-YYYY')
                                    : t('contracts.detail.notAvailable')}
                            </TableCell>
                        </TableRow>

                        {/* bsn */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.bsn')}</strong></TableCell>
                            <TableCell>{contract.bsn || t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* dateOfEmployment */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.dateOfEmployment')}</strong></TableCell>
                            <TableCell>
                                {contract.dateOfEmployment
                                    ? dayjs(contract.dateOfEmployment).format('DD-MM-YYYY')
                                    : t('contracts.detail.notAvailable')}
                            </TableCell>
                        </TableRow>

                        {/* lastWorkingDay */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.lastWorkingDay')}</strong></TableCell>
                            <TableCell>
                                {contract.lastWorkingDay
                                    ? dayjs(contract.lastWorkingDay).format('DD-MM-YYYY')
                                    : t('contracts.detail.notAvailable')}
                            </TableCell>
                        </TableRow>

                        {/* function */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.function')}</strong></TableCell>
                            <TableCell>{contract.function || t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* probationPeriod */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.probationPeriod')}</strong></TableCell>
                            <TableCell>{contract.probationPeriod || t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* workweekDuration */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.workweekDuration')}</strong></TableCell>
                            <TableCell>{contract.workweekDuration ?? t('contracts.detail.notAvailable')} {contract.workweekDuration ? t('contracts.detail.hours') : ''}</TableCell>
                        </TableRow>

                        {/* weeklySchedule */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.weeklySchedule')}</strong></TableCell>
                            <TableCell>{contract.weeklySchedule || t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* workingHours */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.workingHours')}</strong></TableCell>
                            <TableCell>{contract.workingHours || t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* noticePeriod */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.noticePeriod')}</strong></TableCell>
                            <TableCell>{contract.noticePeriod || t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* payScale */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.payScale')}</strong></TableCell>
                            <TableCell>{contract.payScale || t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* payScaleStep */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.payScaleStep')}</strong></TableCell>
                            <TableCell>{contract.payScaleStep ?? t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* hourlyWage100Percent */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.hourlyWage100Percent')}</strong></TableCell>
                            <TableCell>{contract.hourlyWage100Percent ?? t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* deviatingWage */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.deviatingWage')}</strong></TableCell>
                            <TableCell>{contract.deviatingWage ?? t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* travelExpenses */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.travelExpenses')}</strong></TableCell>
                            <TableCell>{contract.travelExpenses ?? t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* maxTravelExpenses */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.maxTravelExpenses')}</strong></TableCell>
                            <TableCell>{contract.maxTravelExpenses ?? t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* vacationAge */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.vacationAge')}</strong></TableCell>
                            <TableCell>{contract.vacationAge ?? t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* vacationDays */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.vacationDays')}</strong></TableCell>
                            <TableCell>{contract.vacationDays ?? t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* atv */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.atv')}</strong></TableCell>
                            <TableCell>{contract.atv ?? t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* vacationAllowance */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.vacationAllowance')}</strong></TableCell>
                            <TableCell>{contract.vacationAllowance ?? t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* compensationPerMonthExclBtw */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.compensationPerMonthExclBtw')}</strong></TableCell>
                            <TableCell>{contract.compensationPerMonthExclBtw ?? t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* compensationPerMonthInclBtw */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.compensationPerMonthInclBtw')}</strong></TableCell>
                            <TableCell>{contract.compensationPerMonthInclBtw ?? t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* companyName */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.companyName')}</strong></TableCell>
                            <TableCell>{contract.companyName || t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* employerName */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.employerName')}</strong></TableCell>
                            <TableCell>{contract.employerName || t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* companyAddress */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.companyAddress')}</strong></TableCell>
                            <TableCell>{contract.companyAddress || t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* companyPostcode */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.companyPostcode')}</strong></TableCell>
                            <TableCell>{contract.companyPostcode || t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* companyCity */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.companyCity')}</strong></TableCell>
                            <TableCell>{contract.companyCity || t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* companyPhoneNumber */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.companyPhoneNumber')}</strong></TableCell>
                            <TableCell>{contract.companyPhoneNumber || t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>

                        {/* companyBtw */}
                        <TableRow>
                            <TableCell><strong>{t('contracts.detail.fields.companyBtw')}</strong></TableCell>
                            <TableCell>{contract.companyBtw || t('contracts.detail.notAvailable')}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            <ConfirmModal
                open={deleteDialogOpen}
                title={t('contracts.detail.deleteModal.title')}
                message={t('contracts.detail.deleteModal.message')}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
            />
        </Box>
    );
}
