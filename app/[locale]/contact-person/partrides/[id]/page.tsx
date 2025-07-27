'use client';

import React, {useState} from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import {useSnack} from '@/providers/SnackProvider';
import {useApprovePartRide} from '@/hooks/useApprovePartRide';
import {useRejectPartRide} from '@/hooks/useRejectPartRide';
import {useDeletePartRide} from '@/hooks/useDeletePartRide';
import {
    Box,
    Button,
    CircularProgress,
    Divider,
    Link,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import {useParams, useRouter} from 'next/navigation';
import {usePartRideDetail} from '@/hooks/usePartRideDetail';
import LanguageSelectDesktop from '@/components/LanguageSelectDesktop';
import FileTile from '@/components/FileTile';
import {PartRideStatusChip} from "@/components/PartRideStatusChip";
import {usePartRideDisputes} from "@/hooks/usePartRideDisputes";
import {useDownloadPartRideFile} from "@/hooks/useDownloadPartRideFile";
import PartRideDetailActionBar from "@/components/PartRideDetailActionBar";
import DisputeCreateDialog from "@/components/DisputeCreateDialog";
import {useTranslations} from 'next-intl';

export default function PartRideDetailPage() {
    const {id} = useParams<{ id: string }>();
    const router = useRouter();
    const t = useTranslations();

    const {data, isLoading, error} = usePartRideDetail(id);
    const {data: disputesData, isLoading: disputesLoading} = usePartRideDisputes(id);
    const downloadFile = useDownloadPartRideFile();
    const showSnack = useSnack();

    const {mutateAsync: approveRide} = useApprovePartRide();
    const {mutateAsync: rejectRide} = useRejectPartRide();
    const {mutateAsync: deleteRide} = useDeletePartRide();

    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
    const [openCreateDispute, setOpenCreateDispute] = useState(false);

    const handleApprove = async () => {
        try {
            await approveRide(id);
            showSnack({text: t('contactPerson.partrideDetail.actions.workdayApproved'), severity: 'success'});
        } catch (e: any) {
            showSnack({text: e?.response?.data?.errors?.[0] ?? t('contactPerson.partrideDetail.actions.approveFailed'), severity: 'error'});
        }
    };

    const handleReject = async () => {
        try {
            await rejectRide(id);
            showSnack({text: t('contactPerson.partrideDetail.actions.workdayRejected'), severity: 'success'});
        } catch (e: any) {
            showSnack({text: e?.response?.data?.errors?.[0] ?? t('contactPerson.partrideDetail.actions.rejectFailed'), severity: 'error'});
        }
    };

    const handleDelete = async () => {
        try {
            await deleteRide(id);
            showSnack({text: t('contactPerson.partrideDetail.actions.workdayDeleted'), severity: 'success'});
            router.push('/partrides');
        } catch (e: any) {
            showSnack({text: e?.response?.data?.errors?.[0] ?? t('contactPerson.partrideDetail.actions.deleteFailed'), severity: 'error'});
        } finally {
            setDeleteConfirmOpen(false);
        }
    };

    const handleEdit = () => {
        router.push(`/partrides/edit?id=${id}`);
    };

    const handleOpenDispute = () => {
        setOpenCreateDispute(true);
    };

    /* ────────── loading / error ────────── */
    if (isLoading || disputesLoading) {
        return (
            <Box display="flex" justifyContent="center" mt={6}>
                <CircularProgress/>
            </Box>
        );
    }

    if (!data || error) {
        return (
            <Typography mt={6} textAlign="center" color="error">
                {(error as any)?.message ?? t('contactPerson.partrideDetail.errors.loadFailed')}
            </Typography>
        );
    }

    const pr = data;

    // Load all disputes for this Part‑Ride
    const latestDispute = disputesData?.disputes?.[0];
    const disputeStatus = latestDispute?.status; // 0‑4 from enum

    return (
        <Box sx={{py: 4}}>
            {/* top bar */}
            <Box sx={{mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h3" fontWeight={500}>
                    {t('contactPerson.workdaysManagement')}
                </Typography>
                <LanguageSelectDesktop/>
            </Box>

            <Paper variant="outlined" sx={{p: 3, mx: 'auto'}}>
                {/* header section */}
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
                        {dayjs(pr?.date).format('DD.MM.YYYY')} {t('contactPerson.partrideDetail.title')}
                    </Typography>
                    <PartRideDetailActionBar
                        onReject={handleReject}
                        onApprove={handleApprove}
                        onEdit={handleEdit}
                        onOpenDispute={handleOpenDispute}
                        onDelete={() => setDeleteConfirmOpen(true)}
                    />
                </Box>

                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                {t('contactPerson.partrideDetail.fields.workdayId')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{pr?.id}</TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('contactPerson.partrideDetail.fields.date')}</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {dayjs(pr?.date).format('DD.MM.YYYY')}
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('contactPerson.partrideDetail.fields.client')}</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {pr?.client ? (
                                    <Link
                                        href={`/clients/${pr?.client?.id}`}
                                        underline="hover"
                                        style={{textDecoration: 'underline'}}
                                    >
                                        {pr?.client?.name}
                                    </Link>
                                ) : (
                                    '—'
                                )}
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('contactPerson.partrideDetail.fields.status')}</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {/* TODO: Replace with real status mapping when available */}
                                {PartRideStatusChip(pr?.status)}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                {/* Example: go-to dispute button if you have a separate dispute page */}
                {latestDispute && (disputeStatus === 0 || disputeStatus === 1) && (
                    <Button
                        variant="contained"
                        color="warning"
                        sx={{mt: 4, width: '100%', maxWidth: 500}}
                        onClick={() => router.push(`/disputes/${latestDispute.id}`)}
                    >
                        {t('contactPerson.partrideDetail.actions.goToDispute')}
                    </Button>
                )}

                <Divider sx={{my: 3}}/>

                {/* Driver & Vehicle */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    {t('contactPerson.partrideDetail.sections.driverVehicleInfo')}
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                {t('contactPerson.partrideDetail.fields.assignedDriver')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {pr?.driver ? (
                                    <Link
                                        href={`/drivers/${pr?.driver?.aspNetUserId}`}
                                        underline="hover"
                                    >
                                        {pr?.driver?.firstName} {pr?.driver?.lastName}
                                    </Link>
                                ) : (
                                    '—'
                                )}
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('contactPerson.partrideDetail.fields.auto')}</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {pr?.car ? (
                                    <Link href={`/cars/${pr?.car?.id}`} underline="hover">
                                        {pr?.car?.licensePlate}
                                    </Link>
                                ) : (
                                    '—'
                                )}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{my: 3}}/>

                {/* Logged time */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    {t('contactPerson.partrideDetail.sections.loggedTimeDistance')}
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                {t('contactPerson.partrideDetail.fields.totalHours')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {pr?.decimalHours} h
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                {t('contactPerson.partrideDetail.fields.correctionHours')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {pr?.correctionTotalHours} h
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('contactPerson.partrideDetail.fields.start')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{pr?.start}</TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('contactPerson.partrideDetail.fields.end')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{pr?.end}</TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('contactPerson.partrideDetail.fields.actualRestTime')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{pr?.rest ?? '—'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('contactPerson.partrideDetail.fields.calculatedRestTime')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{pr?.restCalculated ?? '—'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('contactPerson.partrideDetail.fields.hoursCode')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{pr?.hoursCode?.name ?? '—'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('contactPerson.partrideDetail.fields.hoursOptions')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{pr?.hoursOption?.name ?? '—'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>
                                {t('contactPerson.partrideDetail.fields.kilometersDriven')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{pr?.totalKilometers}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>
                                {t('contactPerson.partrideDetail.fields.extraKilometers')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{pr?.extraKilometers}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                {/* Financial overview */}
                <Divider sx={{my: 3}}/>
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    {t('contactPerson.partrideDetail.sections.financialOverview')}
                </Typography>

                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                {t('contactPerson.partrideDetail.fields.taxFreeCompensation')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                €{pr?.taxFreeCompensation}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                {t('contactPerson.partrideDetail.fields.nightAllowance')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                €{pr?.nightAllowance}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                {t('contactPerson.partrideDetail.fields.kilometerReimbursement')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                €{pr?.kilometerReimbursement}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                {t('contactPerson.partrideDetail.fields.consignmentFee')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                €{pr?.consignmentFee}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                {t('contactPerson.partrideDetail.fields.variousCompensation')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                €{pr?.variousCompensation}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                {/* Files */}
                <Divider sx={{my: 3}}/>
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    {t('contactPerson.partrideDetail.sections.additionalInformation')}
                </Typography>
                {pr?.files?.length ? (
                    <Stack spacing={2}>
                        {pr?.files.map((file) => (
                            <FileTile
                                key={file.id}
                                file={file}
                                onClick={() => downloadFile(file)}
                            />
                        ))}
                    </Stack>
                ) : (
                    <Typography variant="body1" color="">
                        {t('contactPerson.partrideDetail.files.noReceipts')}
                    </Typography>
                )}

                {/* Comment */}
                <Divider sx={{my: 3}}/>
                <Typography variant="h6" fontWeight={500} sx={{mb: 1}}>
                    {t('contactPerson.partrideDetail.sections.recordComment')}
                </Typography>
                <Typography variant="body1">{pr?.remark || t('contactPerson.partrideDetail.comments.noComment')}</Typography>

                <ConfirmModal
                    open={deleteConfirmOpen}
                    title={t('contactPerson.partrideDetail.deleteModal.title')}
                    message={t('contactPerson.partrideDetail.deleteModal.message')}
                    onClose={() => setDeleteConfirmOpen(false)}
                    onConfirm={handleDelete}
                />
                <DisputeCreateDialog
                    open={openCreateDispute}
                    onClose={() => setOpenCreateDispute(false)}
                    partRideId={id}
                />
            </Paper>
        </Box>
    );
}