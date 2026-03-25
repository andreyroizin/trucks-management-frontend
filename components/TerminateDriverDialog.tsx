'use client';

import React, { useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    MenuItem,
    TextField,
    Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useDeleteDriver } from '@/hooks/useDeleteDriver';
import { useGenerateDepartureStatement } from '@/hooks/useGenerateDepartureStatement';

const REASON_KEYS = ['resignation', 'contractExpired', 'performance', 'other'] as const;

type TerminateDriverDialogProps = {
    open: boolean;
    driverId: string;
    driverName: string;
    onClose: () => void;
    onSuccess?: () => void;
};

export default function TerminateDriverDialog({
    open,
    driverId,
    driverName,
    onClose,
    onSuccess,
}: TerminateDriverDialogProps) {
    const t = useTranslations();
    const deleteDriver = useDeleteDriver();
    const generateDeparture = useGenerateDepartureStatement();

    const [reason, setReason] = useState('resignation');
    const [otherReason, setOtherReason] = useState('');
    const [generateJaaropgave, setGenerateJaaropgave] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const isProcessing = deleteDriver.isPending || generateDeparture.isPending;

    const getReasonText = () => {
        if (reason === 'other') return otherReason || 'Other';
        return t(`annualStatements.terminate.reasons.${reason}`);
    };

    const handleConfirm = async () => {
        setError(null);
        try {
            await deleteDriver.mutateAsync({
                driverId,
                reason: getReasonText(),
            });

            if (generateJaaropgave) {
                try {
                    await generateDeparture.mutateAsync(driverId);
                } catch {
                    setError(t('annualStatements.generate.error'));
                }
            }

            setSuccess(true);
            onSuccess?.();
        } catch {
            setError(t('annualStatements.terminate.error'));
        }
    };

    const handleClose = () => {
        setError(null);
        setSuccess(false);
        setReason('resignation');
        setOtherReason('');
        setGenerateJaaropgave(true);
        onClose();
    };

    return (
        <Dialog open={open} onClose={isProcessing ? undefined : handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {t('annualStatements.terminate.title', { name: driverName })}
            </DialogTitle>
            <DialogContent>
                {success ? (
                    <Alert severity="success" sx={{ mt: 1 }}>
                        {t('annualStatements.terminate.success')}
                    </Alert>
                ) : (
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            select
                            label={t('annualStatements.terminate.reason')}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            size="small"
                            fullWidth
                        >
                            {REASON_KEYS.map((key) => (
                                <MenuItem key={key} value={key}>
                                    {t(`annualStatements.terminate.reasons.${key}`)}
                                </MenuItem>
                            ))}
                        </TextField>

                        {reason === 'other' && (
                            <TextField
                                label={t('annualStatements.terminate.otherReason')}
                                value={otherReason}
                                onChange={(e) => setOtherReason(e.target.value)}
                                size="small"
                                fullWidth
                            />
                        )}

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={generateJaaropgave}
                                    onChange={(e) => setGenerateJaaropgave(e.target.checked)}
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body1">
                                        {t('annualStatements.terminate.generateJaaropgave')}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('annualStatements.terminate.generateJaaropgaveHint')}
                                    </Typography>
                                </Box>
                            }
                        />

                        {error && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                                {error}
                            </Alert>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                {success ? (
                    <Button variant="contained" onClick={handleClose}>
                        {t('annualStatements.batch.runInBackground')}
                    </Button>
                ) : (
                    <>
                        <Button onClick={handleClose} color="inherit" disabled={isProcessing}>
                            {t('annualStatements.terminate.cancel')}
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleConfirm}
                            disabled={isProcessing}
                        >
                            {isProcessing
                                ? t('annualStatements.terminate.confirming')
                                : t('annualStatements.terminate.confirm')}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
}
