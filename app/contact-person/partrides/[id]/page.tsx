'use client';

import React from 'react';
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

export default function PartRideDetailPage() {
    const {id} = useParams<{ id: string }>();
    const router = useRouter();

    const {data, isLoading, error} = usePartRideDetail(id);
    const {data: disputesData, isLoading: disputesLoading} = usePartRideDisputes(id);
    const downloadFile = useDownloadPartRideFile();
    const showSnack = useSnack();

    const {mutateAsync: approveRide} = useApprovePartRide();
    const {mutateAsync: rejectRide} = useRejectPartRide();
    const {mutateAsync: deleteRide} = useDeletePartRide();

    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

    const handleApprove = async () => {
        try {
            await approveRide(id);
            showSnack({text: 'Workday approved', severity: 'success'});
        } catch (e: any) {
            showSnack({text: e?.response?.data?.errors?.[0] ?? 'Approve failed', severity: 'error'});
        }
    };

    const handleReject = async () => {
        try {
            await rejectRide(id);
            showSnack({text: 'Workday rejected', severity: 'success'});
        } catch (e: any) {
            showSnack({text: e?.response?.data?.errors?.[0] ?? 'Reject failed', severity: 'error'});
        }
    };

    const handleDelete = async () => {
        try {
            await deleteRide(id);
            showSnack({text: 'Workday deleted', severity: 'success'});
            router.push('/partrides');
        } catch (e: any) {
            showSnack({text: e?.response?.data?.errors?.[0] ?? 'Delete failed', severity: 'error'});
        } finally {
            setDeleteConfirmOpen(false);
        }
    };

    const handleEdit = () => {
        router.push(`/partrides/edit?id=${id}`);
    };

    const handleOpenDispute = () => {
        router.push(`/partrides/dispute?id=${id}`);
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
                {(error as any)?.message ?? 'Failed to load workday'}
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
                    Workdays Management
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
                        {dayjs(pr.date).format('DD.MM.YYYY')} Workday Details
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
                                Workday&nbsp;ID
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{pr.id}</TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Date</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {dayjs(pr.date).format('DD.MM.YYYY')}
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Client</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {pr.client ? (
                                    <Link
                                        href={`/clients/${pr.client.id}`}
                                        underline="hover"
                                        style={{textDecoration: 'underline'}}
                                    >
                                        {pr.client.name}
                                    </Link>
                                ) : (
                                    '—'
                                )}
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Status</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {/* TODO: Replace with real status mapping when available */}
                                {PartRideStatusChip(pr.status)}
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
                        Go To This Dispute
                    </Button>
                )}

                <Divider sx={{my: 3}}/>

                {/* Driver & Vehicle */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    Driver &amp; Vehicle Info
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                Assigned Driver
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {pr.driver ? (
                                    <Link
                                        href={`/drivers/${pr.driver.aspNetUserId}`}
                                        underline="hover"
                                    >
                                        {pr.driver.firstName} {pr.driver.lastName}
                                    </Link>
                                ) : (
                                    '—'
                                )}
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Auto</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {pr.car ? (
                                    <Link href={`/cars/${pr.car.id}`} underline="hover">
                                        {pr.car.licensePlate}
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
                    Logged Time &amp; Distance
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                Total Hours
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {pr.decimalHours} h
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                Correction Hours
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {pr.correctionTotalHours} h
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Start</TableCell>
                            <TableCell sx={{border: 'none'}}>{pr.start}</TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>End</TableCell>
                            <TableCell sx={{border: 'none'}}>{pr.end}</TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Rest Time</TableCell>
                            <TableCell sx={{border: 'none'}}>{pr.rest ?? '—'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Hours Code</TableCell>
                            <TableCell sx={{border: 'none'}}>{pr?.hoursCode?.name ?? '—'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Hours Options</TableCell>
                            <TableCell sx={{border: 'none'}}>{pr?.hoursOption?.name ?? '—'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>
                                Kilometers Driven
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{pr.kilometers}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>
                                Extra Kilometers
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{pr.kilometers}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                {/* Financial overview */}
                <Divider sx={{my: 3}}/>
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    Financial Overview
                </Typography>

                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                Tax free compensation
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                €{pr?.taxFreeCompensation}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                Night allowance
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                €{pr?.nightAllowance}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                Kilometer reimbursement
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                €{pr?.kilometerReimbursement}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                Consignment fee
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                €{pr?.consignmentFee}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                Various compensation
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
                    Additional Information
                </Typography>
                {pr.files?.length ? (
                    <Stack spacing={2}>
                        {pr.files.map((file) => (
                            <FileTile
                                key={file.id}
                                file={file}
                                onClick={() => downloadFile(file)}
                            />
                        ))}
                    </Stack>
                ) : (
                    <Typography variant="body1" color="">
                        No receipts uploaded.
                    </Typography>
                )}

                {/* Comment */}
                <Divider sx={{my: 3}}/>
                <Typography variant="h6" fontWeight={500} sx={{mb: 1}}>
                    Record Comment
                </Typography>
                <Typography variant="body1">{pr.remark || "No comment posted."}</Typography>

                <ConfirmModal
                    open={deleteConfirmOpen}
                    title="Delete Workday"
                    message="Are you sure you want to delete this workday? This action cannot be undone."
                    onClose={() => setDeleteConfirmOpen(false)}
                    onConfirm={handleDelete}
                />
            </Paper>
        </Box>
    );
}