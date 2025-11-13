'use client';

import React, { useState, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    CircularProgress,
    Alert,
    IconButton
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useWeeklyAvailability, useUpdateDriverAvailability } from '@/hooks/useWeeklyAvailability';
import AvailabilityGrid from './AvailabilityGrid';
import { useTranslations, useLocale } from 'next-intl';

type Props = {
    open: boolean;
    onClose: () => void;
    weekStartDate: string;
    companyId?: string;
};

export default function DriverAvailabilityDialog({
    open,
    onClose,
    weekStartDate,
    companyId
}: Props) {
    const t = useTranslations('planning.weekly.assignment.driverAvailability');
    const locale = useLocale();
    const [pendingChanges, setPendingChanges] = useState<Record<string, Record<string, number>>>({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [clearLocalChanges, setClearLocalChanges] = useState(false);

    const {
        data: availabilityData,
        isLoading: isLoadingAvailability,
        error: availabilityError
    } = useWeeklyAvailability(weekStartDate, companyId);

    const updateDriverAvailabilityMutation = useUpdateDriverAvailability();

    const formatWeekRange = (start: string): string => {
        const startDate = new Date(start);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);

        const format = (date: Date, options: Intl.DateTimeFormatOptions) =>
            new Intl.DateTimeFormat(locale, options).format(date);

        return t('weekRange', {
            start: format(startDate, { month: 'short', day: 'numeric' }),
            end: format(endDate, { month: 'short', day: 'numeric', year: 'numeric' }),
        });
    };

    const handleAvailabilityChange = useCallback((driverId: string, date: string, hours: number) => {
        setPendingChanges(prev => ({
            ...prev,
            [driverId]: {
                ...prev[driverId],
                [date]: hours
            }
        }));
        setHasUnsavedChanges(true);
    }, []);

    const handleSaveAll = async () => {
        if (Object.keys(pendingChanges).length === 0) {
            onClose();
            return;
        }

        try {
            // Save changes for each driver that has pending changes
            const savePromises = Object.entries(pendingChanges).map(([driverId, availability]) => {
                return updateDriverAvailabilityMutation.mutateAsync({
                    driverId,
                    availability
                });
            });

            await Promise.all(savePromises);

            // Clear pending changes and trigger local changes clear
            setPendingChanges({});
            setHasUnsavedChanges(false);
            setClearLocalChanges(true);
            
            // Reset clear trigger after a brief delay
            setTimeout(() => setClearLocalChanges(false), 100);
            
            onClose();
        } catch (error) {
            console.error('Failed to save driver availability:', error);
            // Error handling is done by the mutation hook
        }
    };

    const handleCancel = () => {
        if (hasUnsavedChanges) {
            const confirmDiscard = window.confirm(t('confirmDiscard'));
            if (!confirmDiscard) return;
        }

        setPendingChanges({});
        setHasUnsavedChanges(false);
        setClearLocalChanges(false);
        onClose();
    };

    const handleClose = () => {
        handleCancel();
    };

    const isLoading = isLoadingAvailability || updateDriverAvailabilityMutation.isPending;
    const error = availabilityError || updateDriverAvailabilityMutation.error;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { minHeight: '70vh' }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h6">
                        {t('title')}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                        {t('subtitle', { range: formatWeekRange(weekStartDate) })}
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} disabled={isLoading}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 2 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error.message}
                    </Alert>
                )}

                {isLoadingAvailability ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                        <CircularProgress />
                    </Box>
                ) : availabilityData?.drivers ? (
                    <AvailabilityGrid
                        resources={availabilityData.drivers}
                        weekStartDate={weekStartDate}
                        type="driver"
                        onAvailabilityChange={handleAvailabilityChange}
                        isLoading={updateDriverAvailabilityMutation.isPending}
                        clearLocalChanges={clearLocalChanges}
                    />
                ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            {t('noResources')}
                        </Typography>
                    </Box>
                )}

                {hasUnsavedChanges && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        {t('unsavedChanges')}
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button 
                    onClick={handleCancel} 
                    disabled={isLoading}
                    color="secondary"
                >
                    {t('buttons.cancel')}
                </Button>
                <Button
                    onClick={handleSaveAll}
                    variant="contained"
                    disabled={isLoading}
                    startIcon={updateDriverAvailabilityMutation.isPending ? <CircularProgress size={20} /> : undefined}
                >
                    {updateDriverAvailabilityMutation.isPending ? t('buttons.saving') : t('buttons.save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
