'use client';

import React, { useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    LinearProgress,
    Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useGenerateYearEndBatch } from '@/hooks/useGenerateYearEndBatch';
import { BatchGenerationResultDto } from '@/types/annualStatement';

type BatchProgressModalProps = {
    open: boolean;
    year: number;
    onClose: () => void;
};

export default function BatchProgressModal({ open, year, onClose }: BatchProgressModalProps) {
    const t = useTranslations();
    const generateBatch = useGenerateYearEndBatch();
    const [result, setResult] = useState<BatchGenerationResultDto | null>(null);
    const [started, setStarted] = useState(false);

    const handleGenerate = () => {
        setStarted(true);
        setResult(null);
        generateBatch.mutate(year, {
            onSuccess: (data) => {
                setResult(data);
            },
            onError: () => {
                setStarted(false);
            },
        });
    };

    const handleClose = () => {
        setResult(null);
        setStarted(false);
        onClose();
    };

    const isRunning = generateBatch.isPending;
    const hasResult = result !== null;
    const hasErrors = (result?.errors?.length ?? 0) > 0;

    return (
        <Dialog open={open} onClose={isRunning ? undefined : handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{t('annualStatements.batch.title', { year })}</DialogTitle>
            <DialogContent>
                {!started && !hasResult && (
                    <Box>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            {t('annualStatements.batch.description', { year })}
                        </Typography>
                    </Box>
                )}

                {isRunning && (
                    <Box sx={{ py: 3, textAlign: 'center' }}>
                        <CircularProgress sx={{ mb: 2 }} />
                        <Typography variant="body1">
                            {t('annualStatements.batch.progress')}
                        </Typography>
                        <LinearProgress sx={{ mt: 2 }} />
                    </Box>
                )}

                {hasResult && !hasErrors && (
                    <Alert severity="success" sx={{ mt: 1 }}>
                        {t('annualStatements.batch.success', {
                            count: result!.totalGenerated,
                            year,
                        })}
                    </Alert>
                )}

                {hasResult && hasErrors && (
                    <Box>
                        <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
                            {t('annualStatements.batch.successWithErrors', {
                                count: result!.totalGenerated,
                                errors: result!.errors.length,
                            })}
                        </Alert>
                        {result!.errors.map((err, idx) => (
                            <Typography key={idx} variant="body2" color="error" sx={{ ml: 1 }}>
                                {err}
                            </Typography>
                        ))}
                    </Box>
                )}

                {generateBatch.isError && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                        {t('annualStatements.batch.error')}
                    </Alert>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                {!started && !hasResult && (
                    <>
                        <Button onClick={handleClose} color="inherit">
                            {t('annualStatements.batch.cancel')}
                        </Button>
                        <Button variant="contained" onClick={handleGenerate}>
                            {t('annualStatements.batch.confirm')}
                        </Button>
                    </>
                )}
                {(hasResult || generateBatch.isError) && (
                    <Button variant="contained" onClick={handleClose}>
                        {t('annualStatements.batch.runInBackground')}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}
