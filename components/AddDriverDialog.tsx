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
    onAdd: (driverId: string, plannedHours: number) => void;
    drivers: Driver[];
    excludeDriverIds: string[]; // Already assigned drivers to exclude
    isLoading?: boolean;
};

export default function AddDriverDialog({ 
    open, 
    onClose, 
    onAdd, 
    drivers, 
    excludeDriverIds,
    isLoading = false 
}: Props) {
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [plannedHours, setPlannedHours] = useState<number>(8);
    const [hoursError, setHoursError] = useState<string>('');

    // Filter out already assigned drivers
    const availableDrivers = drivers.filter(driver => 
        !excludeDriverIds.includes(driver.id)
    );

    const handleHoursChange = (value: string) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) {
            setHoursError('Please enter a valid number of hours');
        } else if (numValue > 24) {
            setHoursError('Hours cannot exceed 24');
        } else {
            setHoursError('');
        }
        setPlannedHours(numValue);
    };

    const handleAdd = () => {
        if (!selectedDriver) return;
        if (hoursError || plannedHours <= 0) return;
        
        onAdd(selectedDriver.id, plannedHours);
        handleClose();
    };

    const handleClose = () => {
        setSelectedDriver(null);
        setPlannedHours(8);
        setHoursError('');
        onClose();
    };

    const canAdd = selectedDriver && plannedHours > 0 && !hoursError && !isLoading;

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

                            {/* Planned Hours */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Schedule fontSize="small" color="primary" />
                                <TextField
                                    fullWidth
                                    label="Planned Hours"
                                    type="number"
                                    value={plannedHours || ''}
                                    onChange={(e) => handleHoursChange(e.target.value)}
                                    error={!!hoursError}
                                    helperText={hoursError || 'Hours for this driver on this ride'}
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
