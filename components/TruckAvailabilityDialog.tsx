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
import { useWeeklyAvailability, useUpdateTruckAvailability } from '@/hooks/useWeeklyAvailability';
import AvailabilityGrid from './AvailabilityGrid';

type Props = {
    open: boolean;
    onClose: () => void;
    weekStartDate: string;
    companyId?: string;
};

export default function TruckAvailabilityDialog({
    open,
    onClose,
    weekStartDate,
    companyId
}: Props) {
    const [pendingChanges, setPendingChanges] = useState<Record<string, Record<string, number>>>({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [clearLocalChanges, setClearLocalChanges] = useState(false);

    const {
        data: availabilityData,
        isLoading: isLoadingAvailability,
        error: availabilityError
    } = useWeeklyAvailability(weekStartDate, companyId);

    const updateTruckAvailabilityMutation = useUpdateTruckAvailability();

    const formatWeekRange = (weekStartDate: string): string => {
        const startDate = new Date(weekStartDate);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        
        return `${startDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        })} - ${endDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        })}`;
    };

    const handleAvailabilityChange = useCallback((truckId: string, date: string, hours: number) => {
        setPendingChanges(prev => ({
            ...prev,
            [truckId]: {
                ...prev[truckId],
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
            // Save changes for each truck that has pending changes
            const savePromises = Object.entries(pendingChanges).map(([truckId, availability]) => {
                return updateTruckAvailabilityMutation.mutateAsync({
                    truckId,
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
            console.error('Failed to save truck availability:', error);
            // Error handling is done by the mutation hook
        }
    };

    const handleCancel = () => {
        if (hasUnsavedChanges) {
            const confirmDiscard = window.confirm(
                'You have unsaved changes. Are you sure you want to discard them?'
            );
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

    const isLoading = isLoadingAvailability || updateTruckAvailabilityMutation.isPending;
    const error = availabilityError || updateTruckAvailabilityMutation.error;

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
                        Set Truck Availability
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                        Week of {formatWeekRange(weekStartDate)}
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
                ) : availabilityData?.trucks ? (
                    <AvailabilityGrid
                        resources={availabilityData.trucks}
                        weekStartDate={weekStartDate}
                        type="truck"
                        onAvailabilityChange={handleAvailabilityChange}
                        isLoading={updateTruckAvailabilityMutation.isPending}
                        clearLocalChanges={clearLocalChanges}
                    />
                ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            No trucks found for this week
                        </Typography>
                    </Box>
                )}

                {hasUnsavedChanges && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        You have unsaved changes. Click "Save All" to apply them.
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button 
                    onClick={handleCancel} 
                    disabled={isLoading}
                    color="secondary"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSaveAll}
                    variant="contained"
                    disabled={isLoading}
                    startIcon={updateTruckAvailabilityMutation.isPending ? <CircularProgress size={20} /> : undefined}
                >
                    {updateTruckAvailabilityMutation.isPending ? 'Saving...' : 'Save All'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
