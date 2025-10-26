'use client';

import React, { useState } from 'react';
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
    Alert
} from '@mui/material';
import { Person, Schedule } from '@mui/icons-material';
import { Driver } from '@/hooks/useDriversAndTrucks';

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
};

export default function AddDriverDialog({ 
    open, 
    onClose, 
    onAdd, 
    drivers, 
    excludeDriverIds,
    totalRideHours = 8,
    primaryDriverName = "Primary driver",
    currentPrimaryDriverHours = 8,
    isLoading = false 
}: Props) {
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [secondDriverHours, setSecondDriverHours] = useState<number>(4);
    const [primaryDriverHours, setPrimaryDriverHours] = useState<number>(currentPrimaryDriverHours);
    const [secondDriverHoursError, setSecondDriverHoursError] = useState<string>('');
    const [primaryDriverHoursError, setPrimaryDriverHoursError] = useState<string>('');

    // Filter out already assigned drivers
    const availableDrivers = drivers.filter(driver => 
        !excludeDriverIds.includes(driver.id)
    );

    const handleSecondDriverHoursChange = (value: string) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) {
            setSecondDriverHoursError('Please enter a valid number of hours');
        } else if (numValue > 24) {
            setSecondDriverHoursError('Hours cannot exceed 24');
        } else {
            setSecondDriverHoursError('');
        }
        setSecondDriverHours(numValue);
    };

    const handlePrimaryDriverHoursChange = (value: string) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) {
            setPrimaryDriverHoursError('Please enter a valid number of hours');
        } else if (numValue > 24) {
            setPrimaryDriverHoursError('Hours cannot exceed 24');
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
        setSecondDriverHours(4);
        setPrimaryDriverHours(currentPrimaryDriverHours);
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
                Add Second Driver
            </DialogTitle>
            
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Add a second driver to this ride with their own planned hours.
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
                            Ride Information:
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="body2">
                                • Total ride duration: <strong>{totalRideHours}h</strong>
                            </Typography>
                            <Typography variant="body2">
                                • Primary driver: <strong>{primaryDriverName}</strong>
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                Note: Drivers can work together, so individual hours don't need to add up to the total ride duration.
                            </Typography>
                        </Box>
                    </Box>

                    {availableDrivers.length === 0 ? (
                        <Alert severity="info">
                            No additional drivers available. All drivers may already be assigned to this ride.
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
                                            label="Select Driver"
                                            placeholder="Choose a driver..."
                                            variant="outlined"
                                        />
                                    )}
                                    renderOption={(props, driver) => (
                                        <Box component="li" {...props}>
                                            <Box>
                                                <Typography variant="body1">
                                                    {driver.fullName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    ID: {driver.id.slice(0, 8)}...
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                />
                            </Box>

                            {/* Primary Driver Hours */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Schedule fontSize="small" color="primary" />
                                <TextField
                                    fullWidth
                                    label={`${primaryDriverName} Hours`}
                                    type="number"
                                    value={primaryDriverHours || ''}
                                    onChange={(e) => handlePrimaryDriverHoursChange(e.target.value)}
                                    error={!!primaryDriverHoursError}
                                    helperText={primaryDriverHoursError || `Hours for ${primaryDriverName} on this ride`}
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
                                    label="Second Driver Hours"
                                    type="number"
                                    value={secondDriverHours || ''}
                                    onChange={(e) => handleSecondDriverHoursChange(e.target.value)}
                                    error={!!secondDriverHoursError}
                                    helperText={secondDriverHoursError || 'Hours for the second driver on this ride'}
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
                    Cancel
                </Button>
                <Button 
                    onClick={handleAdd}
                    variant="contained"
                    disabled={!canAdd}
                    startIcon={isLoading ? undefined : <Person />}
                >
                    {isLoading ? 'Adding...' : 'Add Driver'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
