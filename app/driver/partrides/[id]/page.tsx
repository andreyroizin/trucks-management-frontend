'use client';

import React, {useEffect} from 'react';
import {Alert, Box, Button, Divider, Stack, Typography,} from '@mui/material';
import {useParams, useRouter} from 'next/navigation';
import {usePartRideDetail} from '@/hooks/usePartRideDetail';
import FileTile from '@/components/FileTile';
import {useAuth} from '@/hooks/useAuth';
import {useDownloadPartRideFile} from '@/hooks/useDownloadPartRideFile';
import {usePartRideDisputes} from '@/hooks/usePartRideDisputes';
import {PartRideStatusChip} from "@/components/PartRideStatusChip";
import PartRideDetailActionsMenuDriver from "@/components/PartRideDetailActionsMenuDriver";
import ConfirmModal from '@/components/ConfirmModal';
import {useDeletePartRide} from "@/hooks/useDeletePartRide";
import {useSnack} from "@/providers/SnackProvider";

const WorkdayDetailPage = () => {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params?.id;
    const {data, isLoading, error} = usePartRideDetail(id);
    const {user, isAuthenticated, loading} = useAuth();
    const downloadFile = useDownloadPartRideFile();
    const {data: disputesData, isLoading: disputesLoading} = usePartRideDisputes(id);
    const {mutateAsync: deleteRide} = useDeletePartRide();
    const showSnack = useSnack();

    const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);

    const handleConfirmDelete = async () => {
        try {
            await deleteRide(id);
            showSnack({text: 'Workday deleted', severity: 'success'});
            router.push('/dashboard/driver');
        } catch (e: any) {
            showSnack({text: e?.response?.data?.errors?.[0] ?? 'Delete failed', severity: 'error'});
        } finally {
            setConfirmDeleteOpen(false);
        }
    };

    // ────────────────────────────────────────────────────────────────────────────
    // Authorisation
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'driver'];
        const hasAccess = user?.roles?.some((r) => allowedRoles.includes(r));

        if (!isAuthenticated && !loading && (!user || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [user, loading, router, isAuthenticated]);
    // ────────────────────────────────────────────────────────────────────────────

    if (isLoading || disputesLoading) return <Typography>Loading...</Typography>;
    if (error || !data) return <Typography>Error loading data</Typography>;

    // Load all disputes for this Part‑Ride
    const latestDispute = disputesData?.disputes?.[0];
    const disputeStatus = latestDispute?.status; // 0‑4 from enum

    const remark = data.remark;

    return (
        <Box sx={{py: 4, maxWidth: 600, mx: 'auto'}}>
            {/* Header */}
            <Box sx={{display: 'flex', justifyContent: 'space-between', mb:1}}>
                <Typography variant="h4" fontWeight={500}>
                    Workday Details
                </Typography>
                <PartRideDetailActionsMenuDriver
                    onEdit={() => router.push(`/partrides/edit?id=${id}`)}
                    onDelete={() => setConfirmDeleteOpen(true)}
                />
            </Box>
            <Typography variant="body1">
                Details for your record on{' '}
                {new Date(data.date).toLocaleDateString('en-GB')}
            </Typography>

            <Divider sx={{my: 2}}/>

            {/* Info section */}
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, mb: 3}}>
                <Box sx={{display: 'flex'}}>
                    <Box sx={{width: '50%'}}>
                        <Typography variant="body1">Record Date</Typography>
                    </Box>
                    <Box sx={{width: '50%'}}>
                        <Typography variant="body1">
                            {new Date(data.date).toLocaleDateString('en-GB')}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{display: 'flex'}}>
                    <Box sx={{width: '50%'}}>
                        <Typography variant="body1">Work Hours</Typography>
                    </Box>
                    <Box sx={{width: '50%'}}>
                        <Typography variant="body1">{data.decimalHours}</Typography>
                    </Box>
                </Box>

                <Box sx={{display: 'flex'}}>
                    <Box sx={{width: '50%'}}>
                        <Typography variant="body1">Rest Time</Typography>
                    </Box>
                    <Box sx={{width: '50%'}}>
                        <Typography variant="body1">{data.rest || 'N/A'}</Typography>
                    </Box>
                </Box>

                <Box sx={{display: 'flex'}}>
                    <Box sx={{width: '50%'}}>
                        <Typography variant="body1">Total Distance</Typography>
                    </Box>
                    <Box sx={{width: '50%'}}>
                        <Typography variant="body1">{`${data.totalKilometers ?? 0} km`}</Typography>
                    </Box>
                </Box>

                <Box sx={{display: 'flex'}}>
                    <Box sx={{width: '50%'}}>
                        <Typography variant="body1">Extra Distance</Typography>
                    </Box>
                    <Box sx={{width: '50%'}}>
                        <Typography variant="body1">{`${data.extraKilometers ?? 0} km`}</Typography>
                    </Box>
                </Box>

                <Box sx={{display: 'flex'}}>
                    <Box sx={{width: '50%'}}>
                        <Typography variant="body1">Earnings</Typography>
                    </Box>
                    <Box sx={{width: '50%'}}>
                        <Typography variant="body1">{`€${data.turnover ?? 0}`}</Typography>
                    </Box>
                </Box>

                <Box sx={{display: 'flex'}}>
                    <Box sx={{width: '50%'}}>
                        <Typography variant="body1">Current Status</Typography>
                    </Box>
                    <Box sx={{width: '50%'}}>
                        {PartRideStatusChip(data?.status)}
                    </Box>
                </Box>
            </Box>

            {/* Alert and action button when dispute exists */}
            {latestDispute && disputeStatus === 0 && (
                <Box mt={3}>
                    <Alert severity="warning" sx={{mb: 2}}>
                        This trip is not approved by Admin, click to see the comment. You can dispute decision or agree
                        with it.
                    </Alert>
                    <Button
                        fullWidth
                        variant="contained"
                        color="warning"
                        onClick={() => router.push(`/disputes/${latestDispute.id}`)}
                    >
                        Go To This Dispute
                    </Button>
                </Box>
            )}

            {latestDispute && disputeStatus === 1 && (
                <Box mt={3}>
                    <Alert severity="info" sx={{mb: 2}}>
                        Your dispute was sent to Admin. Please, check later.
                    </Alert>
                    <Button
                        fullWidth
                        variant="contained"
                        color="info"
                        onClick={() => router.push(`/disputes/${latestDispute.id}`)}
                    >
                        Go To The Dispute
                    </Button>
                </Box>
            )}
            <Divider sx={{my: 2}}/>

            {/* Workday comment */}
            <Box>
                <Typography variant="h5" sx={{fontWeight: 500}}>Workday Comment</Typography>
                <Typography variant="body1" mt={1}>
                    {remark ? remark : 'No comment provided.'}
                </Typography>
            </Box>

            <Divider sx={{my: 2}}/>

            {/* Files */}
            <Box>
                <Typography variant="h5" sx={{fontWeight: 500, marginBottom: 1}}>Receipts & Attachments</Typography>
                <Typography variant="body1" mb={2}>
                    Uploaded receipts and supporting documents.
                </Typography>
                {data.files?.length ? (
                    <Stack spacing={2}>
                        {data.files.map((file) => (
                            <FileTile
                                key={file.id}
                                file={file}
                                onClick={() => downloadFile(file)}
                            />
                        ))}
                    </Stack>
                ) : (
                    <Typography variant="body1">No receipts or attachments provided.</Typography>
                )}
            </Box>
            <Divider sx={{my: 2}}/>

            <ConfirmModal
                open={confirmDeleteOpen}
                title="Confirm Deletion"
                message="Are you sure you want to delete this workday?"
                onClose={() => setConfirmDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
            />
        </Box>
    );
};

export default WorkdayDetailPage;
