'use client';

import React, {useState} from 'react';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import {useParams, useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';

import {useDisputeById} from '@/hooks/useDisputeById';
import {DisputeStatus} from '@/utils/disputeStatus';
import DisputeComment from "@/components/DisputeComment"; // ← helper we created earlier
import {useAddDisputeComment} from '@/hooks/useAddDisputeComment';
import {useAcceptDispute} from '@/hooks/useAcceptDispute';
import SingleDisputeCommentBlock from "@/components/SingleDisputeCommentBlock";

export default function DisputeDetailPage() {
    const {id} = useParams<{ id: string }>();
    const router = useRouter();
    const t = useTranslations('disputes.driver.detail');

    const {data, isLoading, error} = useDisputeById(id);

    const [acceptError, setAcceptError] = useState<string | null>(null);
    const [commentError, setCommentError] = useState<string | null>(null);

    const {mutateAsync: postComment, isPending: posting} = useAddDisputeComment(id);
    const {mutateAsync: acceptDispute} = useAcceptDispute(id);

    /* ── derived info ────────────────────────────────────────────────── */
    const partRideDate = data ? dayjs(data.partRide.date).format('DD.MM.YY') : '';
    const bannerConfig: Record<
        DisputeStatus,
        { severity: 'warning' | 'success' | 'info' | 'error'; text: string }
    > = {
        [DisputeStatus.PendingDriver]: {
            severity: 'warning',
            text: t('banner.pendingDriver'),
        },
        [DisputeStatus.PendingAdmin]: {
            severity: 'info',
            text: t('banner.pendingAdmin'),
        },
        [DisputeStatus.AcceptedByDriver]: {
            severity: 'success',
            text: t('banner.accepted'),
        },
        [DisputeStatus.AcceptedByAdmin]: {
            severity: 'success',
            text: t('banner.accepted'),
        },
        [DisputeStatus.Closed]: {
            severity: 'info',
            text: t('banner.closed'),
        },
    };
    const banner = data ? bannerConfig[data.status as DisputeStatus] : undefined;

    const handleAccept = async () => {
        try {
            await acceptDispute();
            router.push('/disputes/success-accept/' + partRideDate);
        } catch (error) {
            console.error('Failed to accept dispute', error);
            setAcceptError(t('error.accept'));
        }
    };

    const handleDisputeSubmit = async (value: string) => {
        try {
            await postComment(value);
            router.push('/disputes/success-comment/' + partRideDate);
        } catch (e) {
            console.error('Failed to submit comment', e);
            setCommentError(t('error.comment'));
        }
    };

    /* ── loading / error ─────────────────────────────────────────────── */
    if (isLoading)
        return (
            <Box display="flex" justifyContent="center" mt={6}>
                <CircularProgress/>
            </Box>
        );

    if (!data || error)
        return (
            <Typography mt={6} textAlign="center" color="error">
                {t('error.load')}
            </Typography>
        );

    return (
        <Box maxWidth="600px" mx="auto" py={4}>
            {/* heading */}
            <Typography variant="h4" fontWeight={500} gutterBottom>
                {`${partRideDate} ${t('title')}`}
            </Typography>
            <Typography variant="body1" mb={2}>
                {t('subtitle')}
            </Typography>

            {/* banner */}
            <Alert severity={banner?.severity} sx={{mb: 3}} icon={<InfoOutlinedIcon fontSize="inherit"/>}>
                {banner?.text}
            </Alert>

            {/* quick facts */}
            <Table size="small">
                <TableBody>
                    <TableRow>
                        <TableCell sx={{pl: 0, py: 1, border: 'none'}}>{t('hours.driver')}</TableCell>
                        <TableCell sx={{border: 'none', py: 1}}>{data.partRide.decimalHours} h</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{pl: 0, border: 'none', py: 1}}>{t('hours.admin')}</TableCell>
                        <TableCell sx={{border: 'none', py: 1}}>
                            {data.correctionHours} h
                            {['PendingDriver', 'PendingAdmin'].includes(DisputeStatus[data.status]) && (
                                <>&nbsp;(total hours = {data.partRide.newDecimalHours}&nbsp;h)</>
                            )}
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            {/* error alerts */}
            {acceptError && (
                <Alert severity="error" sx={{mb: 2}}>
                    {acceptError}
                </Alert>
            )}

            {commentError && (
                <Alert severity="error" sx={{mb: 2}}>
                    {commentError}
                </Alert>
            )}

            {/* go-to workday */}
            {(data.status === DisputeStatus.PendingDriver || data.status === DisputeStatus.PendingAdmin) && (
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{mt: 3}}
                    onClick={() => router.push(`/partrides/${data?.partRide.id}`)}
                >
                    {t('goToWorkday')}
                </Button>
            )}

            <Divider sx={{my: 2}}/>

            {data.status === DisputeStatus.PendingDriver && data.comments.length > 1 && (
                <>
                    <SingleDisputeCommentBlock
                        comment={data.comments[0]}          // newest comment is now the first
                        onAccept={handleAccept}
                        onSubmit={handleDisputeSubmit}
                        posting={posting}
                    />
                    <Divider sx={{ my: 2 }} />
                </>
            )}

            <Typography variant="h5" sx={{ mb: 2 }}>
                {t('comments')}
            </Typography>

            {data.status === DisputeStatus.PendingDriver && data.comments.length === 1 ? (
                /* only one comment → show block */
                <SingleDisputeCommentBlock
                    comment={data.comments[0]}
                    onAccept={handleAccept}
                    onSubmit={handleDisputeSubmit}
                    posting={posting}
                />
            ) : (
                /* render all comments except the newest (index 0) when PendingDriver */
                data.comments
                    .filter((_, index) =>
                        data.status === DisputeStatus.PendingDriver ? index !== 0 : true
                    )
                    .map((c, index, arr) => (
                        <DisputeComment
                            key={c.id}
                            comment={c}
                            isLast={index === arr.length - 1}
                        />
                    ))
            )}
        </Box>
    );
}
