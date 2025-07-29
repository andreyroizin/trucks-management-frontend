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
import {useTranslations} from 'next-intl';

export default function DisputeDetailPage() {
    const {id} = useParams<{ id: string }>();
    const router = useRouter();
    const snack = useSnack();
    const t = useTranslations();

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
            snack({text: t('contactPerson.disputeDetail.actions.disputeApproved'), severity: 'success'});
        } catch (e: any) {
            setApiError(e?.response?.data?.errors?.[0] ?? t('contactPerson.disputeDetail.actions.approveFailed'));
            snack({text: t('contactPerson.disputeDetail.actions.approveFailed'), severity: 'error'});
        }
    };

    const handleSubmitComment = async (comment: string) => {
        try {
            await addComment(comment);
            snack({text: t('contactPerson.disputeDetail.actions.commentSent'), severity: 'success'});
        } catch (e: any) {
            setApiError(e?.response?.data?.errors?.[0] ?? t('contactPerson.disputeDetail.actions.commentFailed'));
            snack({text: e?.response?.data?.errors?.[0] ?? t('contactPerson.disputeDetail.actions.commentFailed'), severity: 'error'});
        }
    };

    // Handle closing a dispute
    const handleCloseDispute = async () => {
        try {
            await closeDispute(id);
            snack({text: t('contactPerson.disputeDetail.actions.disputeClosed'), severity: 'success'});
        } catch (e: any) {
            snack({text: e?.response?.data?.errors?.[0] ?? t('contactPerson.disputeDetail.actions.closeFailed'), severity: 'error'});
        }
    };

    // Handle deleting a dispute
    const handleDeleteDispute = async () => {
        if (!confirmDeleteId) return;

        try {
            await deleteDispute(confirmDeleteId);
            snack({text: t('contactPerson.disputeDetail.actions.disputeDeleted'), severity: 'success'});
            router.push('/disputes');
        } catch (e: any) {
            snack({text: e?.response?.data?.errors?.[0] ?? t('contactPerson.disputeDetail.actions.deleteFailed'), severity: 'error'});
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
                {(error as any)?.message || t('contactPerson.disputeDetail.errors.loadFailed')}
            </Typography>
        );

    /* ── render ──────────────────────────────────────── */
    const pr = dispute?.partRide;

    return (
        <Box sx={{ py: 4 }}>
            <Box sx={{mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h3" fontWeight={500}>
                    {t('contactPerson.workdaysManagement')}
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
                        {dayjs(pr?.date).format('DD.MM.YYYY')} {t('contactPerson.disputeDetail.title')}
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
                                {t('contactPerson.disputeDetail.fields.workdayId')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {pr?.id}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('contactPerson.disputeDetail.fields.client')}</TableCell>
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
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('contactPerson.disputeDetail.fields.status')}</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                <StatusChip
                                    label={
                                        {
                                            0: t('contactPerson.disputes.table.statusLabels.pendingDriver'),
                                            1: t('contactPerson.disputes.table.statusLabels.pendingAdmin'),
                                            2: t('contactPerson.disputes.table.statusLabels.acceptedByDriver'),
                                            3: t('contactPerson.disputes.table.statusLabels.acceptedByAdmin'),
                                            4: t('contactPerson.disputes.table.statusLabels.closed'),
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
                    {t('contactPerson.disputeDetail.actions.goToWorkday')}
                </Button>

                <Divider sx={{my: 3}}/>

                {/* Driver & vehicle */}
                <Typography variant="h6" sx={{mt: 4, mb: 1}}>
                    {t('contactPerson.disputeDetail.sections.driverVehicleInfo')}
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                {t('contactPerson.disputeDetail.fields.assignedDriver')}
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
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('contactPerson.disputeDetail.fields.auto')}</TableCell>
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
                    {t('contactPerson.disputeDetail.sections.loggedTimeDistance')}
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                {t('contactPerson.disputeDetail.fields.totalHours')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{pr?.decimalHours} h</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('contactPerson.disputeDetail.fields.date')}</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {dayjs(pr?.date).format('DD.MM.YYYY')}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('contactPerson.disputeDetail.fields.start')}</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {pr?.start}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('contactPerson.disputeDetail.fields.end')}</TableCell>
                            <TableCell sx={{border: 'none'}}>
                                {pr?.end}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('contactPerson.disputeDetail.fields.restTime')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{pr?.rest}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{my: 3}}/>

                {/* Suggested adjustments */}
                <Typography variant="h6" sx={{mb: 2}}>
                    {t('contactPerson.disputeDetail.sections.suggestedAdjustments')}
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                {t('contactPerson.disputeDetail.fields.hoursCorrection')}
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
                                        {t('contactPerson.disputeDetail.fields.newTotalHours')}
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
                    {t('contactPerson.disputeDetail.sections.comments')}
                </Typography>

                {dispute?.comments?.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                        {t('contactPerson.disputeDetail.comments.noComments')}
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
                    title={t('contactPerson.disputeDetail.deleteModal.title')}
                    message={t('contactPerson.disputeDetail.deleteModal.message')}
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
