'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    MenuItem,
    TextField,
    Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useDriverStartingBalances } from '@/hooks/useDriverStartingBalances';
import { useSetStartingBalance } from '@/hooks/useSetStartingBalance';
import { useDeleteStartingBalance } from '@/hooks/useDeleteStartingBalance';
import ConfirmModal from '@/components/ConfirmModal';
import dayjs from 'dayjs';

interface StartingBalancesDialogProps {
    open: boolean;
    onClose: () => void;
    driverId: string;
    driverName: string;
}

export default function StartingBalancesDialog({
    open,
    onClose,
    driverId,
    driverName,
}: StartingBalancesDialogProps) {
    const t = useTranslations();
    const currentYear = new Date().getFullYear();

    const yearOptions = useMemo(() => {
        const years = [];
        for (let y = currentYear + 1; y >= currentYear - 5; y--) {
            years.push(y);
        }
        return years;
    }, [currentYear]);

    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [vacationHours, setVacationHours] = useState('0');
    const [tvtHours, setTvtHours] = useState('0');
    const [advHours, setAdvHours] = useState('0');
    const [notes, setNotes] = useState('');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const { data: balances, isLoading } = useDriverStartingBalances(driverId);
    const setBalance = useSetStartingBalance();
    const deleteBalance = useDeleteStartingBalance();

    const existingBalance = useMemo(
        () => balances?.find((b) => b.year === selectedYear),
        [balances, selectedYear]
    );

    useEffect(() => {
        if (existingBalance) {
            setVacationHours(String(existingBalance.vacationHours));
            setTvtHours(String(existingBalance.tvtHours));
            setAdvHours(String(existingBalance.advHours));
            setNotes(existingBalance.notes ?? '');
        } else {
            setVacationHours('0');
            setTvtHours('0');
            setAdvHours('0');
            setNotes('');
        }
        setSuccessMessage(null);
    }, [existingBalance, selectedYear]);

    const handleSave = async () => {
        try {
            await setBalance.mutateAsync({
                driverId,
                request: {
                    year: selectedYear,
                    vacationHours: Number(vacationHours) || 0,
                    tvtHours: Number(tvtHours) || 0,
                    advHours: Number(advHours) || 0,
                    notes: notes || undefined,
                },
            });
            setSuccessMessage(t('startingBalances.success.saved'));
        } catch {
            alert(t('startingBalances.errors.saveFailed'));
        }
    };

    const handleDelete = async () => {
        try {
            await deleteBalance.mutateAsync({ driverId, year: selectedYear });
            setDeleteConfirmOpen(false);
            setSuccessMessage(t('startingBalances.success.deleted'));
        } catch {
            alert(t('startingBalances.errors.deleteFailed'));
        }
    };

    const vacationDays = ((Number(vacationHours) || 0) / 8).toFixed(1);

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {t('startingBalances.title')} — {driverName}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {t('startingBalances.subtitle')}
                    </Typography>

                    {/* Year Selector */}
                    <TextField
                        select
                        fullWidth
                        size="small"
                        label={t('startingBalances.year')}
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        sx={{ mb: 3 }}
                    >
                        {yearOptions.map((y) => (
                            <MenuItem key={y} value={y}>{y}</MenuItem>
                        ))}
                    </TextField>

                    {isLoading ? (
                        <Box display="flex" justifyContent="center" py={3}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : (
                        <>
                            {/* Existing Balance Info */}
                            {existingBalance && (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    {t('startingBalances.setOn', {
                                        date: dayjs(existingBalance.setAt).format('DD-MM-YYYY HH:mm'),
                                        user: existingBalance.setByUserName ?? 'Admin',
                                    })}
                                </Alert>
                            )}

                            {successMessage && (
                                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
                                    {successMessage}
                                </Alert>
                            )}

                            {/* Balance Fields */}
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        label={t('startingBalances.vacationHours')}
                                        value={vacationHours}
                                        onChange={(e) => setVacationHours(e.target.value)}
                                        inputProps={{ step: 0.5 }}
                                        InputLabelProps={{ shrink: true }}
                                        helperText={t('startingBalances.vacationDays', { days: vacationDays })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        label={t('startingBalances.tvtHours')}
                                        value={tvtHours}
                                        onChange={(e) => setTvtHours(e.target.value)}
                                        inputProps={{ step: 0.5 }}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        label={t('startingBalances.advHours')}
                                        value={advHours}
                                        onChange={(e) => setAdvHours(e.target.value)}
                                        inputProps={{ step: 0.5 }}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        multiline
                                        rows={2}
                                        label={t('startingBalances.notes')}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder={t('startingBalances.notesPlaceholder')}
                                    />
                                </Grid>
                            </Grid>
                        </>
                    )}
                </DialogContent>
                <Divider />
                <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                    <Box>
                        {existingBalance && (
                            <Button
                                color="error"
                                onClick={() => setDeleteConfirmOpen(true)}
                                disabled={deleteBalance.isPending}
                            >
                                {t('startingBalances.delete')}
                            </Button>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button onClick={onClose}>{t('startingBalances.cancel')}</Button>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={setBalance.isPending}
                        >
                            {setBalance.isPending ? t('startingBalances.saving') : t('startingBalances.save')}
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>

            <ConfirmModal
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleDelete}
                title={t('startingBalances.deleteConfirm.title')}
                message={t('startingBalances.deleteConfirm.message', { year: selectedYear })}
            />
        </>
    );
}
