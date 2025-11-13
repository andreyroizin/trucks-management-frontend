'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Autocomplete,
    TextField,
    Box,
    Typography,
    Alert,
    Chip,
} from '@mui/material';
import { Person, Schedule } from '@mui/icons-material';
import { Driver } from '@/hooks/useDriversAndTrucks';
import { AvailabilityStatus } from './RideAssignmentCard';
import { useTranslations } from 'next-intl';

type Props = {
    open: boolean;
    onClose: () => void;
    onAdd: (driverId: string, secondDriverHours: number, primaryDriverHours: number) => void;
    drivers: Driver[];
    excludeDriverIds: string[]; // Already assigned drivers to exclude
    totalRideHours?: number; // Total ride hours for context
    primaryDriverName?: string; // Name of primary driver for context
    currentPrimaryDriverHours?: number; // Current hours for primary driver
    isLoading?: boolean;
    driverAvailabilityStatus?: Record<string, AvailabilityStatus>;
};

export default function AddDriverDialog({ 
    open, 
    onClose, 
    onAdd, 
    drivers, 
    excludeDriverIds,
    totalRideHours = 8,
    primaryDriverName,
    currentPrimaryDriverHours = 8,
    isLoading = false,
    driverAvailabilityStatus,
}: Props) {
    const t = useTranslations('planning.weekly.assignment.addDriverDialog');
    const resolvedPrimaryDriverName = primaryDriverName || t('primaryFallback');
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [secondDriverHours, setSecondDriverHours] = useState<number>(totalRideHours);
    const [primaryDriverHours, setPrimaryDriverHours] = useState<number>(totalRideHours);
    const [secondDriverHoursError, setSecondDriverHoursError] = useState<string>('');
    const [primaryDriverHoursError, setPrimaryDriverHoursError] = useState<string>('');

    // Update default values when dialog opens with different totalRideHours
    useEffect(() => {
        if (open) {
            setSecondDriverHours(totalRideHours);
            setPrimaryDriverHours(totalRideHours);
        }
    }, [open, totalRideHours]);

    // Filter out already assigned drivers
    const availableDrivers = drivers.filter(driver => 
        !excludeDriverIds.includes(driver.id)
    );

    const handleSecondDriverHoursChange = (value: string) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) {
            setSecondDriverHoursError(t('errors.invalidHours'));
        } else if (numValue > 24) {
            setSecondDriverHoursError(t('errors.maxHours'));
        } else {
            setSecondDriverHoursError('');
        }
        setSecondDriverHours(numValue);
    };

    const handlePrimaryDriverHoursChange = (value: string) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) {
            setPrimaryDriverHoursError(t('errors.invalidHours'));
        } else if (numValue > 24) {
            setPrimaryDriverHoursError(t('errors.maxHours'));
        } else {
            setPrimaryDriverHoursError('');
        }
        setPrimaryDriverHours(numValue);
    };

    const handleAdd = () => {
        if (!selectedDriver) return;
        if (secondDriverHoursError || primaryDriverHoursError || secondDriverHours <= 0 || primaryDriverHours <= 0) return;
        
        onAdd(selectedDriver.id, secondDriverHours, primaryDriverHours);
        handleClose();
    };

    const handleClose = () => {
        setSelectedDriver(null);
        setSecondDriverHours(totalRideHours);
        setPrimaryDriverHours(totalRideHours);
        setSecondDriverHoursError('');
        setPrimaryDriverHoursError('');
        onClose();
    };

    const canAdd = selectedDriver && secondDriverHours > 0 && primaryDriverHours > 0 && !secondDriverHoursError && !primaryDriverHoursError && !isLoading;

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person />
                {t('title')}
            </DialogTitle>
            
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        {t('description')}
                    </Typography>

                    {/* Hours Info */}
                    <Box sx={{ 
                        p: 2, 
                        backgroundColor: 'grey.50', 
                        borderRadius: 1, 
                        border: '1px solid',
                        borderColor: 'grey.200'
                    }}>
                        <Typography variant="subtitle2" gutterBottom>
                            {t('rideInfo.title')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="body2">
                                {t.rich('rideInfo.totalDuration', {
                                    hours: totalRideHours,
                                    strong: (chunks) => <strong>{chunks}</strong>,
                                })}
                            </Typography>
                            <Typography variant="body2">
                                {t.rich('rideInfo.primaryDriver', {
                                    name: resolvedPrimaryDriverName,
                                    strong: (chunks) => <strong>{chunks}</strong>,
                                })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                {t('rideInfo.note')}
                            </Typography>
                        </Box>
                    </Box>

                    {availableDrivers.length === 0 ? (
                        <Alert severity="info">
                            {t('noDrivers')}
                        </Alert>
                    ) : (
                        <>
                            {/* Driver Selection */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Person fontSize="small" color="primary" />
                                <Autocomplete
                                    fullWidth
                                    options={availableDrivers}
                                    getOptionLabel={(driver) => driver.fullName}
                                    value={selectedDriver}
                                    onChange={(_, newValue) => setSelectedDriver(newValue)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                        label={t('fields.driver.label')}
                                        placeholder={t('fields.driver.placeholder')}
                                            variant="outlined"
                                        />
                                    )}
                                    renderOption={(props, driver) => {
                                        const status = driverAvailabilityStatus?.[driver.id];
                                        return (
                                            <Box
                                                component="li"
                                                {...props}
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: status?.message ? 'flex-start' : 'center',
                                                    gap: 1,
                                                }}
                                            >
                                                <Box>
                                                    <Typography variant="body1">
                                                        {driver.fullName}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        ID: {driver.id.slice(0, 8)}...
                                                    </Typography>
                                                    {status?.message && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {status.message}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                {status && (
                                                    <Chip
                                                        size="small"
                                                        label={status.label}
                                                        color={status.level === 'available' ? 'success' : 'warning'}
                                                        variant={status.level === 'available' ? 'outlined' : 'filled'}
                                                    />
                                                )}
                                            </Box>
                                        );
                                    }}
                                />
                            </Box>

                            {/* Primary Driver Hours */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Schedule fontSize="small" color="primary" />
                                <TextField
                                    fullWidth
                                    label={t('fields.primaryHours.label', { name: resolvedPrimaryDriverName })}
                                    type="number"
                                    value={primaryDriverHours || ''}
                                    onChange={(e) => handlePrimaryDriverHoursChange(e.target.value)}
                                    error={!!primaryDriverHoursError}
                                    helperText={primaryDriverHoursError || t('fields.primaryHours.helper', { name: resolvedPrimaryDriverName })}
                                    inputProps={{ 
                                        min: 0.5, 
                                        max: 24, 
                                        step: 0.5 
                                    }}
                                    variant="outlined"
                                />
                            </Box>

                            {/* Second Driver Hours */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Schedule fontSize="small" color="secondary" />
                                <TextField
                                    fullWidth
                                    label={t('fields.secondHours.label')}
                                    type="number"
                                    value={secondDriverHours || ''}
                                    onChange={(e) => handleSecondDriverHoursChange(e.target.value)}
                                    error={!!secondDriverHoursError}
                                    helperText={secondDriverHoursError || t('fields.secondHours.helper')}
                                    inputProps={{ 
                                        min: 0.5, 
                                        max: 24, 
                                        step: 0.5 
                                    }}
                                    variant="outlined"
                                />
                            </Box>
                        </>
                    )}
                </Box>
            </DialogContent>
            
            <DialogActions>
                <Button onClick={handleClose}>
                    {t('buttons.cancel')}
                </Button>
                <Button 
                    onClick={handleAdd}
                    variant="contained"
                    disabled={!canAdd}
                    startIcon={isLoading ? undefined : <Person />}
                >
                    {isLoading ? t('buttons.loading') : t('buttons.confirm')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
