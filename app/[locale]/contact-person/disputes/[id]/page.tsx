'use client';

import React, {useState} from 'react';
import DisputeEditDialog from '@/components/DisputeEditDialog';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Divider,
    Link,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import {useParams, useRouter} from 'next/navigation';

import {useDisputeById} from '@/hooks/useDisputeById';
import {useAcceptDispute} from '@/hooks/useAcceptDispute';
import {useAddDisputeComment} from '@/hooks/useAddDisputeComment';
import {useSnack} from '@/providers/SnackProvider';
import {useCloseDispute} from '@/hooks/useCloseDispute';
import {useDeleteDispute} from '@/hooks/useDeleteDispute';
import ConfirmModal from '@/components/ConfirmModal';

import DisputeComment from '@/components/DisputeComment';
import SingleDisputeCommentBlock from '@/components/SingleDisputeCommentBlock';
import StatusChip from '@/components/StatusChip';
import DisputeDetailActionBar from "@/components/DisputeDetailActionBar";
import LanguageSelectDesktop from "@/components/LanguageSelectDesktop";

export default function DisputeDetailPage() {
    const {id} = useParams<{ id: string }>();
    const router = useRouter();
    const snack = useSnack();

    /* ── data ─────────────────────────────────────────── */
    const {
        data: dispute,
        isLoading,
        error,
        refetch,
    } = useDisputeById(id);

    /* ── mutation hooks ──────────────────────────────── */
    const {mutateAsync: acceptDispute} = useAcceptDispute(id);
    const {
        mutateAsync: addComment,
        isPending: posting,
    } = useAddDisputeComment(id);
    const {mutateAsync: closeDispute} = useCloseDispute();
    const {mutateAsync: deleteDispute} = useDeleteDispute();

    /* ── local state ─────────────────────────────────── */
    const [apiError, setApiError] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [editDisputeDialogId, setEditDisputeDialogId] = useState<string | null>(null);

    /* ── helpers ─────────────────────────────────────── */
    const isPendingAdmin = dispute?.status === 1; // PendingAdmin

    /* ── action handlers ─────────────────────────────── */
    const handleAccept = async () => {
        try {
            await acceptDispute();
            snack({text: 'Dispute approved', severity: 'success'});
        } catch (e: any) {
            setApiError(e?.response?.data?.errors?.[0] ?? 'Failed to approve.');
            snack({text: 'Failed to approve', severity: 'error'});
        }
    };

    const handleSubmitComment = async (comment: string) => {
        try {
            await addComment(comment);
            snack({text: 'Comment sent', severity: 'success'});
        } catch (e: any) {
            setApiError(e?.response?.data?.errors?.[0] ?? 'Failed to send comment.');
            snack({text: e?.response?.data?.errors?.[0] ?? 'Failed to send comment.', severity: 'error'});
        }
    };

    // Handle closing a dispute
    const handleCloseDispute = async () => {
        try {
            await closeDispute(id);
            snack({text: 'Dispute closed', severity: 'success'});
        } catch (e: any) {
            snack({text: e?.response?.data?.errors?.[0] ?? 'Close failed', severity: 'error'});
        }
    };

    // Handle deleting a dispute
    const handleDeleteDispute = async () => {
        if (!confirmDeleteId) return;

        try {
            await deleteDispute(confirmDeleteId);
            snack({text: 'Dispute deleted', severity: 'success'});
            router.push('/disputes');
        } catch (e: any) {
            snack({text: e?.response?.data?.errors?.[0] ?? 'Delete failed', severity: 'error'});
        }
    };

    /* ── loading / error ─────────────────────────────── */
    if (isLoading)
        return (
            <Box display="flex" justifyContent="center" mt={6}>
                <CircularProgress/>
            </Box>
        );

    if (!dispute || error)
        return (
            <Typography mt={6} textAlign="center" color="error">
                {(error as any)?.message || 'Failed to load dispute'}
            </Typography>
        );

    /* ── render ──────────────────────────────────────── */
    const pr = dispute?.partRide;

    return (
        <Box sx={{ py: 4 }}>
            <Box sx={{mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h3" fontWeight={500}>
                    Workdays Management
                </Typography>
                <LanguageSelectDesktop/>
            </Box>

            <Paper variant="outlined" sx={{p: 3,  mx: 'auto'}}>
                {/* Title bar */}
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
                        {dayjs(pr?.date).format('DD.MM.YYYY')} Dispute
                    </Typography>
                    <DisputeDetailActionBar
                        onCloseDispute={handleCloseDispute}
                        onEdit={() => setEditDisputeDialogId(dispute.id)}
                        onDelete={() => setConfirmDeleteId(dispute.id)}
                    />
                </Box>

                {/* Error */}
                {apiError && (
                    <Alert severity="error" sx={{mb: 2}}>
                        {apiError}
                    </Alert>
                )}

                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                Workday ID
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {pr?.id}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Client</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {pr?.client ? (
                                    <Link href={`/clients/${pr?.client?.id}`}
                                          style={{textDecoration: 'underline'}}>
                                        {pr?.client?.name}
                                    </Link>
                                ) : (
                                    '—'
                                )}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Status</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                <StatusChip
                                    label={
                                        {
                                            0: 'Pending Driver',
                                            1: 'Pending Admin',
                                            2: 'Accepted Driver',
                                            3: 'Accepted Admin',
                                            4: 'Closed',
                                        }[dispute.status]
                                    }
                                    variant={
                                        {
                                            0: 'warning',
                                            1: 'info',
                                            2: 'success',
                                            3: 'success',
                                            4: 'default',
                                        }[dispute.status] as any
                                    }
                                />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                {/* Go to workday */}
                <Button
                    variant="contained"
                    color="primary"
                    sx={{mt: 3, width: '100%', maxWidth: 500}}
                    onClick={() => router.push(`/partrides/${pr?.id}`)}
                >
                    Go To Workday
                </Button>

                <Divider sx={{my: 3}}/>

                {/* Driver & vehicle */}
                <Typography variant="h6" sx={{mt: 4, mb: 1}}>
                    Driver &amp; Vehicle Info
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                Assigned Driver
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                <Link
                                    href={`/drivers/${pr?.driver?.aspNetUserId}`}
                                    style={{textDecoration: 'underline'}}
                                >
                                    {pr?.driver?.firstName} {pr?.driver?.lastName}
                                </Link>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Auto</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {pr?.car ? (
                                    <Link href={`/cars/${pr?.car?.id}`} underline="hover"
                                          style={{textDecoration: 'underline'}}>
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
                <Typography variant="h6" sx={{mb: 2}}>
                    Logged Time &amp; Distance
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                Total Hours
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{pr?.decimalHours} h</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Date</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {dayjs(pr?.date).format('DD.MM.YYYY')}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Start</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {pr?.start}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>End</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {pr?.end}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Rest Time</TableCell>
                            <TableCell sx={{border: 'none'}}>{pr?.rest}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{my: 3}}/>

                {/* Suggested adjustments */}
                <Typography variant="h6" sx={{mb: 2}}>
                    Suggested Adjustments
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                Hours Correction
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {dispute?.correctionHours > 0 ? '+' : ''}
                                {dispute?.correctionHours} h
                            </TableCell>
                        </TableRow>
                        {pr?.newDecimalHours !== pr?.decimalHours &&
                            dispute.status !== 2 &&
                            dispute.status !== 3 && (
                                <TableRow>
                                    <TableCell sx={{pl: 0, border: 'none'}}>
                                        New Total Hours
                                    </TableCell>
                                    <TableCell sx={{border: 'none'}}>
                                        {pr?.newDecimalHours} h
                                    </TableCell>
                                </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Divider sx={{my: 3}}/>

                {/* Comments section */}
                <Typography variant="h6" sx={{mb: 2}}>
                    Comments
                </Typography>

                {dispute?.comments?.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                        No comments yet.
                    </Typography>
                )}

                {/* If PendingAdmin show first comment in special block, then the rest */}
                {isPendingAdmin ? (
                    <>
                        {/* first / newest comment gets the special controls */}
                        {dispute?.comments?.length > 0 && (
                            <SingleDisputeCommentBlock
                                comment={dispute.comments[0]}        /* first comment */
                                posting={posting}
                                onAccept={handleAccept}
                                onSubmit={handleSubmitComment}
                            />
                        )}
                        <Divider sx={{my: 3}}/>

                        {/* show the rest (skip index 0) */}
                        {dispute?.comments?.slice(1).map((c, idx, arr) => (
                            <DisputeComment
                                key={c.id}
                                comment={c}
                                isLast={idx === arr.length - 1}
                            />
                        ))}
                    </>
                ) : (
                    /* not PendingAdmin → render all comments normally */
                    dispute?.comments?.map((c, idx, arr) => (
                        <DisputeComment
                            key={c.id}
                            comment={c}
                            isLast={idx === arr.length - 1}
                        />
                    ))
                )}

                <ConfirmModal
                    open={!!confirmDeleteId}
                    title="Delete Dispute"
                    message="Are you sure you want to delete this dispute? This action cannot be undone."
                    onClose={() => setConfirmDeleteId(null)}
                    onConfirm={handleDeleteDispute}
                />
                {editDisputeDialogId && (
                    <DisputeEditDialog
                        open={!!editDisputeDialogId}
                        disputeId={editDisputeDialogId}
                        onClose={async () => {
                            setEditDisputeDialogId(null);
                            await refetch();
                        }}
                    />
                )}
            </Paper>
        </Box>

    );
}
