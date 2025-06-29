'use client';

import React from 'react';
import {Box, Button, Dialog, DialogActions, DialogContent, Typography,} from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import {useRouter} from 'next/navigation';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

type Props = {
    open: boolean;
    onClose: () => void;
    disputeId: string;
    dateLabel: string; // e.g. “26.02.25”
};

export default function SuccessDisputeDialog({
                                          open,
                                          onClose,
                                          disputeId,
                                          dateLabel,
                                      }: Props) {
    const router = useRouter();

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth sx={{
            '& .MuiPaper-root': {
                borderRadius: 4,
            },
        }}>
            <DialogContent sx={{ textAlign: 'center', pt: 7}}>
                <Box
                    sx={{
                        color: 'white',
                        mx: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                    }}
                >
                    <CheckCircleRoundedIcon
                        fontSize="large"
                        sx={{
                            fontSize: 120,
                            color: 'success.main',
                        }}
                    />
                </Box>

                <Typography variant="h4" fontWeight={500} mb={2}>
                    Your comment sent
                </Typography>

                <Typography variant="body1" mb={2}>
                    Your comment for {dateLabel} has been successfully sent to the driver.
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    You will get a notification when the driver agrees with your
                    correction or not.
                </Typography>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 7 }}>
                <Button
                    variant="contained"
                    fullWidth
                    onClick={() => router.push(`/disputes/${disputeId}`)}
                >
                    Go To Dispute
                </Button>
            </DialogActions>
        </Dialog>
    );
}
