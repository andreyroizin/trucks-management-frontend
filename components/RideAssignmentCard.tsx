'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Autocomplete,
    TextField,
    Button,
    IconButton,
    Divider
} from '@mui/material';
import {
    Person,
    LocalShipping,
    Schedule,
    Assignment,
    PersonAdd,
    Delete,
    Edit,
    LocationOn,
    Notes,
    AccessTime
} from '@mui/icons-material';
import { WeeklyRide } from '@/hooks/useWeeklyRides';
import { Driver, Truck } from '@/hooks/useDriversAndTrucks';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { useUpdateTripNumber } from '@/hooks/useTripNumber';
import RideDetailsDialog from './RideDetailsDialog';

type Props = {
    ride: WeeklyRide;
    clientName: string;
    drivers: Driver[];
    trucks: Truck[];
    onDriverAssign?: (rideId: string, driverId: string | null) => void;
    onTruckAssign?: (rideId: string, truckId: string | null) => void;
    onHoursChange?: (rideId: string, hours: number) => void;
    onDriverHoursChange?: (rideId: string, driverId: string, hours: number) => void; // New: individual driver hours
    onSecondDriverAssign?: (rideId: string, driverId: string | null) => void; // New: change second driver
    onAddSecondDriver?: (rideId: string) => void;
    onRemoveSecondDriver?: (rideId: string, driverId: string) => void;
    secondDrivers?: { id: string; fullName: string; plannedHours: number }[]; // Additional drivers for this ride
    isAssigning?: boolean;
};

export default function RideAssignmentCard({
    ride,
    clientName,
    drivers,
    trucks,
    onDriverAssign,
    onTruckAssign,
    onHoursChange,
    onDriverHoursChange,
    onSecondDriverAssign,
    onAddSecondDriver,
    onRemoveSecondDriver,
    secondDrivers = [],
    isAssigning = false
}: Props) {
    const [driverValue, setDriverValue] = useState<Driver | null>(
        ride.assignedDriver ? drivers.find(d => d.id === ride.assignedDriver!.id) || null : null
    );
    const [truckValue, setTruckValue] = useState<Truck | null>(
        ride.assignedTruck ? trucks.find(t => t.id === ride.assignedTruck!.id) || null : null
    );
    const [hoursValue, setHoursValue] = useState<number>(ride.plannedHours);
    
    // Local display values for input fields (to handle empty states during editing)
    const [primaryDriverHoursDisplay, setPrimaryDriverHoursDisplay] = useState<string>('');
    const [secondDriverHoursDisplay, setSecondDriverHoursDisplay] = useState<string>('');
    const [plannedHoursDisplay, setPlannedHoursDisplay] = useState<string>('');
    
    // Ride details dialog state
    const [detailsDialogOpen, setDetailsDialogOpen] = useState<boolean>(false);
    
    // Trip number editing state
    const [tripNumberEditing, setTripNumberEditing] = useState(false);
    const [tripNumberValue, setTripNumberValue] = useState(ride.tripNumber || '');
    
    // Trip number mutation
    const updateTripNumberMutation = useUpdateTripNumber();

    // Sync local state with ride data (important for handling cancellations)
    useEffect(() => {
        const newDriverValue = ride.assignedDriver ? drivers.find(d => d.id === ride.assignedDriver!.id) || null : null;
        setDriverValue(newDriverValue);
    }, [ride.assignedDriver, drivers]);

    useEffect(() => {
        const newTruckValue = ride.assignedTruck ? trucks.find(t => t.id === ride.assignedTruck!.id) || null : null;
        setTruckValue(newTruckValue);
    }, [ride.assignedTruck, trucks]);

    useEffect(() => {
        setHoursValue(ride.plannedHours);
        setPlannedHoursDisplay(ride.plannedHours.toString());
    }, [ride.plannedHours]);

    useEffect(() => {
        if (ride.assignedDriver) {
            setPrimaryDriverHoursDisplay(ride.assignedDriver.plannedHours.toString());
        }
    }, [ride.assignedDriver?.plannedHours]);

    useEffect(() => {
        if (ride.secondDriver) {
            setSecondDriverHoursDisplay(ride.secondDriver.plannedHours.toString());
        } else {
            setSecondDriverHoursDisplay('');
        }
    }, [ride.secondDriver?.plannedHours]);

    // Sync trip number value with ride data
    useEffect(() => {
        setTripNumberValue(ride.tripNumber || '');
    }, [ride.tripNumber]);

    const isUnassigned = !ride.assignedDriver || !ride.assignedTruck;
    const isPartiallyAssigned = (ride.assignedDriver && !ride.assignedTruck) || (!ride.assignedDriver && ride.assignedTruck);

    const handleDriverChange = (newDriver: Driver | null) => {
        setDriverValue(newDriver);
        if (onDriverAssign) {
            onDriverAssign(ride.id, newDriver?.id || null);
        }
    };

    const handleTruckChange = (newTruck: Truck | null) => {
        setTruckValue(newTruck);
        if (onTruckAssign) {
            onTruckAssign(ride.id, newTruck?.id || null);
        }
    };

    // Debounced hours change handler (1 second delay)
    const debouncedHoursChange = useDebouncedCallback((newHours: number) => {
        if (onHoursChange) {
            onHoursChange(ride.id, newHours);
        }
    }, 1000);

    // Debounced driver hours change handler (1 second delay)
    const debouncedDriverHoursChange = useDebouncedCallback((rideId: string, driverId: string, hours: number) => {
        if (onDriverHoursChange) {
            onDriverHoursChange(rideId, driverId, hours);
        }
    }, 1000);

    const handleHoursChange = (newHours: number) => {
        setHoursValue(newHours);
        debouncedHoursChange(newHours);
    };

    const handleDriverHoursChange = (driverId: string, hours: number) => {
        debouncedDriverHoursChange(ride.id, driverId, hours);
    };

    // Trip number handlers
    const handleTripNumberEdit = () => {
        setTripNumberEditing(true);
    };

    const handleTripNumberSave = async () => {
        try {
            const trimmedValue = tripNumberValue.trim();
            const finalValue = trimmedValue === '' ? null : trimmedValue;
            
            await updateTripNumberMutation.mutateAsync({
                rideId: ride.id,
                tripNumber: finalValue
            });
            
            setTripNumberEditing(false);
        } catch (error) {
            console.error('Failed to update trip number:', error);
            // Revert to original value on error
            setTripNumberValue(ride.tripNumber || '');
            setTripNumberEditing(false);
        }
    };

    const handleTripNumberCancel = () => {
        setTripNumberValue(ride.tripNumber || '');
        setTripNumberEditing(false);
    };

    const handleTripNumberKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            handleTripNumberSave();
        } else if (event.key === 'Escape') {
            handleTripNumberCancel();
        }
    };

    // Helper function to format time for display (HH:mm:ss to HH:mm)
    const formatTimeForDisplay = (time: string | null) => {
        if (!time) return null;
        // Convert HH:mm:ss to HH:mm for display
        return time.substring(0, 5);
    };

    // Check if ride has additional details
    const hasAdditionalDetails = () => {
        return !!(ride.routeFromName || ride.routeToName || ride.notes || ride.plannedStartTime || ride.plannedEndTime);
    };

    const getStatusColor = () => {
        if (!ride.assignedDriver && !ride.assignedTruck) return 'error';
        if (isPartiallyAssigned) return 'warning';
        return 'success';
    };

    const getStatusText = () => {
        if (!ride.assignedDriver && !ride.assignedTruck) return 'Unassigned';
        if (isPartiallyAssigned) return 'Partial';
        return 'Assigned';
    };

    return (
        <Card 
            sx={{ 
                mb: 1,
                border: '1px solid',
                borderColor: 'divider',
                opacity: isAssigning ? 0.7 : 1
            }}
        >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                {/* Header with Trip Number and Status */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexGrow: 1 }}>
                        {/* Trip Number - Primary Display */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {tripNumberEditing ? (
                                <TextField
                                    size="small"
                                    value={tripNumberValue}
                                    onChange={(e) => setTripNumberValue(e.target.value)}
                                    onKeyDown={handleTripNumberKeyPress}
                                    onBlur={handleTripNumberSave}
                                    placeholder="Enter trip number"
                                    autoFocus
                                    sx={{ 
                                        '& .MuiInputBase-root': { 
                                            fontSize: '1.1rem',
                                            fontWeight: 'bold'
                                        }
                                    }}
                                />
                            ) : (
                                <Typography 
                                    variant="h6" 
                                    fontWeight="bold"
                                    onClick={handleTripNumberEdit}
                                    sx={{ 
                                        cursor: 'pointer',
                                        color: ride.tripNumber ? 'text.primary' : 'text.secondary',
                                        fontStyle: ride.tripNumber ? 'normal' : 'italic',
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                            borderRadius: 1,
                                            px: 1,
                                            mx: -1
                                        }
                                    }}
                                >
                                    {ride.tripNumber || 'Click to add trip number'}
                                </Typography>
                            )}
                        </Box>
                        
                        {/* Client Name and Status */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                                label={getStatusText()} 
                                size="small" 
                                color={getStatusColor()}
                                variant="outlined"
                            />
                            <Typography variant="body2" color="text.secondary">
                                {clientName}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Primary Driver Assignment */}
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Person fontSize="small" color="primary" />
                        <Autocomplete
                            size="small"
                            options={drivers}
                            getOptionLabel={(driver) => driver.fullName}
                            value={driverValue}
                            onChange={(_, newValue) => handleDriverChange(newValue)}
                            disabled={isAssigning}
                            sx={{ flexGrow: 1 }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Primary Driver"
                                    placeholder="Select primary driver..."
                                    variant="outlined"
                                />
                            )}
                            renderOption={(props, driver) => (
                                <Box component="li" {...props}>
                                    <Typography variant="body2">{driver.fullName}</Typography>
                                </Box>
                            )}
                        />
                    </Box>
                    {ride.assignedDriver && ride.secondDriver && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Schedule fontSize="small" color="primary" />
                            <TextField
                                size="small"
                                label="Primary Driver Hours"
                                type="number"
                                value={primaryDriverHoursDisplay}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setPrimaryDriverHoursDisplay(value);
                                    
                                    // Allow empty string for clearing - don't trigger API call
                                    if (value === '') return;
                                    
                                    const numValue = parseFloat(value);
                                    if (!isNaN(numValue) && numValue >= 0) {
                                        handleDriverHoursChange(ride.assignedDriver!.id, numValue);
                                    }
                                }}
                                onBlur={(e) => {
                                    // If field is empty on blur, set to 0
                                    if (e.target.value === '') {
                                        setPrimaryDriverHoursDisplay('0');
                                        handleDriverHoursChange(ride.assignedDriver!.id, 0);
                                    }
                                }}
                                disabled={isAssigning}
                                inputProps={{ min: 0, max: 24, step: 0.5 }}
                                sx={{ flexGrow: 1 }}
                                variant="outlined"
                            />
                        </Box>
                    )}
                </Box>

                {/* Second Driver Assignment */}
                {ride.secondDriver && (
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Person fontSize="small" color="secondary" />
                            <Autocomplete
                                size="small"
                                options={drivers}
                                getOptionLabel={(driver) => driver.fullName}
                                value={drivers.find(d => d.id === ride.secondDriver!.id) || null}
                                onChange={(_, newValue) => {
                                    if (onSecondDriverAssign) {
                                        onSecondDriverAssign(ride.id, newValue?.id || null);
                                    }
                                }}
                                disabled={isAssigning}
                                sx={{ flexGrow: 1 }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Second Driver"
                                        placeholder="Select second driver..."
                                        variant="outlined"
                                    />
                                )}
                                renderOption={(props, driver) => (
                                    <Box component="li" {...props}>
                                        <Typography variant="body2">{driver.fullName}</Typography>
                                    </Box>
                                )}
                            />
                            <IconButton
                                size="small"
                                onClick={() => onRemoveSecondDriver?.(ride.id, ride.secondDriver!.id)}
                                disabled={isAssigning}
                                sx={{ color: 'error.main' }}
                            >
                                <Delete fontSize="small" />
                            </IconButton>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Schedule fontSize="small" color="secondary" />
                            <TextField
                                size="small"
                                label="Second Driver Hours"
                                type="number"
                                value={secondDriverHoursDisplay}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setSecondDriverHoursDisplay(value);
                                    
                                    // Allow empty string for clearing - don't trigger API call
                                    if (value === '') return;
                                    
                                    const numValue = parseFloat(value);
                                    if (!isNaN(numValue) && numValue >= 0) {
                                        handleDriverHoursChange(ride.secondDriver!.id, numValue);
                                    }
                                }}
                                onBlur={(e) => {
                                    // If field is empty on blur, set to 0
                                    if (e.target.value === '') {
                                        setSecondDriverHoursDisplay('0');
                                        handleDriverHoursChange(ride.secondDriver!.id, 0);
                                    }
                                }}
                                disabled={isAssigning}
                                inputProps={{ min: 0, max: 24, step: 0.5 }}
                                sx={{ flexGrow: 1 }}
                                variant="outlined"
                            />
                        </Box>
                    </Box>
                )}

                {/* Truck Assignment Dropdown */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <LocalShipping fontSize="small" color="primary" />
                    <Autocomplete
                        size="small"
                        options={trucks}
                        getOptionLabel={(truck) => truck.licensePlate}
                        value={truckValue}
                        onChange={(_, newValue) => handleTruckChange(newValue)}
                        disabled={isAssigning}
                        sx={{ flexGrow: 1 }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Truck"
                                placeholder="Select truck..."
                                variant="outlined"
                            />
                        )}
                        renderOption={(props, truck) => (
                            <Box component="li" {...props}>
                                <Typography variant="body2">{truck.licensePlate}</Typography>
                            </Box>
                        )}
                    />
                </Box>

                {/* Planned Hours Input */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Schedule fontSize="small" color="primary" />
                    <TextField
                        size="small"
                        label="Planned Hours"
                        type="number"
                        value={plannedHoursDisplay}
                        onChange={(e) => {
                            const value = e.target.value;
                            setPlannedHoursDisplay(value);
                            
                            // Allow empty string for clearing - don't trigger API call
                            if (value === '') return;
                            
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue) && numValue >= 0) {
                                setHoursValue(numValue);
                                handleHoursChange(numValue);
                            }
                        }}
                        onBlur={(e) => {
                            // If field is empty on blur, ensure it's set to 0 and trigger API call
                            if (e.target.value === '') {
                                setPlannedHoursDisplay('0');
                                setHoursValue(0);
                                debouncedHoursChange(0);
                            }
                        }}
                        disabled={isAssigning}
                        inputProps={{ min: 0, max: 24, step: 0.5 }}
                        sx={{ flexGrow: 1 }}
                        variant="outlined"
                    />
                </Box>


                {/* Add Second Driver Button */}
                {ride.assignedDriver && !ride.secondDriver && onAddSecondDriver && (
                    <Box sx={{ mt: 2 }}>
                        <Button
                            size="small"
                            startIcon={<PersonAdd />}
                            onClick={() => onAddSecondDriver(ride.id)}
                            disabled={isAssigning}
                            variant="outlined"
                            sx={{ 
                                borderStyle: 'dashed',
                                color: 'text.secondary',
                                borderColor: 'grey.400',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    color: 'primary.main'
                                }
                            }}
                        >
                            Add Driver
                        </Button>
                    </Box>
                )}

                {/* Additional Details Section */}
                <Box sx={{ mt: 2 }}>
                    {hasAdditionalDetails() ? (
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Additional Details
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={() => setDetailsDialogOpen(true)}
                                    disabled={isAssigning}
                                >
                                    <Edit fontSize="small" />
                                </IconButton>
                            </Box>
                            
                            {/* Route Information */}
                            {(ride.routeFromName || ride.routeToName) && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <LocationOn fontSize="small" color="action" />
                                    <Typography variant="body2" color="text.secondary">
                                        {ride.routeFromName || 'Unknown'} → {ride.routeToName || 'Unknown'}
                                    </Typography>
                                </Box>
                            )}
                            
                            {/* Time Information */}
                            {(ride.plannedStartTime || ride.plannedEndTime) && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <AccessTime fontSize="small" color="action" />
                                    <Typography variant="body2" color="text.secondary">
                                        {formatTimeForDisplay(ride.plannedStartTime) || '--:--'} - {formatTimeForDisplay(ride.plannedEndTime) || '--:--'}
                                    </Typography>
                                </Box>
                            )}
                            
                            {/* Notes */}
                            {ride.notes && (
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                                    <Notes fontSize="small" color="action" sx={{ mt: 0.25 }} />
                                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                                        {ride.notes}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    ) : (
                        <Button
                            size="small"
                            startIcon={<Edit />}
                            onClick={() => setDetailsDialogOpen(true)}
                            disabled={isAssigning}
                            variant="outlined"
                            sx={{ 
                                borderStyle: 'dashed',
                                color: 'text.secondary',
                                borderColor: 'grey.400',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    color: 'primary.main'
                                }
                            }}
                        >
                            Add Additional Details
                        </Button>
                    )}
                </Box>
            </CardContent>

            {/* Ride Details Dialog */}
            <RideDetailsDialog
                open={detailsDialogOpen}
                onClose={() => setDetailsDialogOpen(false)}
                ride={ride}
                clientName={clientName}
            />
        </Card>
    );
}
