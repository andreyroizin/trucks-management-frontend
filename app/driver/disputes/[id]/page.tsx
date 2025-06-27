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
    TextField,
} from '@mui/material';
import dayjs from 'dayjs';
import {useParams, useRouter} from 'next/navigation';

import {useDisputeById} from '@/hooks/useDisputeById';
import {DisputeStatus} from '@/utils/disputeStatus';
import DisputeComment from "@/components/DisputeComment"; // ← helper we created earlier

/* ───────────────────────────── Banner helper ────────────────────────── */
const bannerConfig: Record<
    DisputeStatus,
    { severity: 'warning' | 'success' | 'info' | 'error'; text: string }
> = {
    [DisputeStatus.PendingDriver]: {
        severity: 'warning',
        text: 'This trip is not approved by Admin. You can dispute the decision or agree with it.',
    },
    [DisputeStatus.PendingAdmin]: {
        severity: 'info',
        text: 'Your dispute was sent to Admin. Please, check later.',
    },
    [DisputeStatus.AcceptedByDriver]: {
        severity: 'success',
        text: 'This dispute is solved.',
    },
    [DisputeStatus.AcceptedByAdmin]: {
        severity: 'success',
        text: 'This dispute is solved.',
    },
    [DisputeStatus.Closed]: {
        severity: 'info',
        text: 'This dispute was closed by Admin.',
    },
};

// ── DisputeComment component ─────────────────────────────────────


export default function DisputeDetailPage() {
    const {id} = useParams<{ id: string }>();
    const router = useRouter();

    const {data, isLoading, error} = useDisputeById(id);

    const [showDisputeForm, setShowDisputeForm] = useState(false);
    const [explanation, setExplanation] = useState('');

    const handleDisputeSubmit = () => {
        // TODO: send the explanation via API or handle submission
        console.log('Dispute explanation submitted:', explanation);
        // Optionally reset form and hide it
        setExplanation('');
        setShowDisputeForm(false);
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
                Failed to load dispute.
            </Typography>
        );

    /* ── derived info ────────────────────────────────────────────────── */
    const disputeDate = dayjs(data.createdAtUtc).format('DD.MM.YY');
    const banner = bannerConfig[data.status as DisputeStatus];

    return (
        <Box maxWidth="600px" mx="auto" py={4}>
            {/* heading */}
            <Typography variant="h4" fontWeight={500} gutterBottom>
                {disputeDate} Dispute
            </Typography>
            <Typography variant="body1" mb={2}>
                View all comments for this workday correction.
            </Typography>

            {/* banner */}
            <Alert severity={banner.severity} sx={{mb: 3}} icon={<InfoOutlinedIcon fontSize="inherit"/>}>
                {banner.text}
            </Alert>

            {/* quick facts */}
            <Table size="small">
                <TableBody>
                    <TableRow>
                        <TableCell sx={{pl: 0, py: 1, border: 'none'}}>Driver’s Total Hours</TableCell>
                        <TableCell sx={{border: 'none', py: 1}}>{data.partRide.decimalHours} h</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell sx={{pl: 0, border: 'none', py: 1}}>Admin’s Adjustment</TableCell>
                        <TableCell sx={{border: 'none', py: 1}}>
                            {data.correctionHours} h&nbsp;(total hours = {data.partRide.newDecimalHours}&nbsp;h)
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            {/* go-to workday */}
            {(data.status === DisputeStatus.PendingDriver || data.status === DisputeStatus.PendingAdmin) && (
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{mt: 3}}
                    onClick={() => router.push(`/partrides/${data?.partRide.id}`)}
                >
                    Go To This Workday
                </Button>
            )}

            <Divider sx={{my: 2}}/>

            {/* show last comment and actions if PendingDriver */}
            {data.status === DisputeStatus.PendingDriver && (
                <>
                    {/* show last comment */}
                    {data.comments.length > 0 && (
                        <DisputeComment
                            comment={data.comments[data.comments.length - 1]}
                            isLast={true}
                        />
                    )}

                    {/* action buttons */}
                    {!showDisputeForm && (
                        <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
                            <Button
                                variant="contained"
                                color="success"
                                fullWidth
                                sx={{ flex: 1 }}
                                onClick={() => {
                                    /* TODO: accept mutation */
                                }}
                            >
                                Accept Correction
                            </Button>
                            <Button
                                variant="text"
                                color="primary"
                                fullWidth
                                sx={{ flex: 1 }}
                                onClick={() => {
                                    setShowDisputeForm(true);
                                }}
                            >
                                Dispute
                            </Button>
                        </Box>
                    )}

                    {showDisputeForm && (
                        <>
                            <Divider sx={{my: 2}}/>
                            <Box mt={2}>
                                <Typography variant="h5" sx={{mb:2}}>Explain why it’s wrong</Typography>
                                <TextField
                                    label="Explain the issue"
                                    multiline
                                    fullWidth
                                    rows={4}
                                    value={explanation}
                                    onChange={(e) => setExplanation(e.target.value)}
                                    sx={{mb: 2}}
                                />
                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    onClick={handleDisputeSubmit}
                                >
                                    Submit
                                </Button>
                            </Box>
                        </>
                    )}
                    <Divider sx={{my: 2}}/>
                </>
            )}

            {/* comments */}
            <Typography variant="h5" sx={{mb: 2}}>
                Comments
            </Typography>

            {data.comments
                .filter((_, index) =>
                    data.status === DisputeStatus.PendingDriver
                        ? index !== data.comments.length - 1
                        : true
                )
                .map((c, index, arr) => (
                    <DisputeComment
                        key={c.id}
                        comment={c}
                        isLast={index === arr.length - 1}
                    />
                ))}
        </Box>
    );
}
