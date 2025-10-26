'use client';

import React, { useState, useEffect } from 'react';
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
    Delete
} from '@mui/icons-material';
import { WeeklyRide } from '@/hooks/useWeeklyRides';
import { Driver, Truck } from '@/hooks/useDriversAndTrucks';

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
    }, [ride.plannedHours]);

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

    const handleHoursChange = (newHours: number) => {
        setHoursValue(newHours);
        if (onHoursChange) {
            onHoursChange(ride.id, newHours);
        }
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
                {/* Header with Status Label and Client Name */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Chip 
                            label={getStatusText()} 
                            size="small" 
                            color={getStatusColor()}
                            variant="outlined"
                        />
                        <Typography variant="body1" fontWeight="medium">
                            {clientName}
                        </Typography>
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
                                value={ride.assignedDriver.plannedHours}
                                onChange={(e) => {
                                    const value = parseFloat(e.target.value);
                                    if (!isNaN(value) && value >= 0 && onDriverHoursChange) {
                                        onDriverHoursChange(ride.id, ride.assignedDriver!.id, value);
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
                                value={ride.secondDriver.plannedHours}
                                onChange={(e) => {
                                    const value = parseFloat(e.target.value);
                                    if (!isNaN(value) && value >= 0 && onDriverHoursChange) {
                                        onDriverHoursChange(ride.id, ride.secondDriver!.id, value);
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
                        value={hoursValue}
                        onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value >= 0) {
                                handleHoursChange(value);
                            }
                        }}
                        disabled={isAssigning}
                        inputProps={{ min: 0, max: 24, step: 0.5 }}
                        sx={{ flexGrow: 1 }}
                        variant="outlined"
                    />
                </Box>

                {/* Route Info (if available) */}
                {(ride.routeFromName || ride.routeToName) && (
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            Route: {ride.routeFromName || 'Unknown'} → {ride.routeToName || 'Unknown'}
                        </Typography>
                    </Box>
                )}

                {/* Notes (if available) */}
                {ride.notes && (
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            Notes: {ride.notes}
                        </Typography>
                    </Box>
                )}

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
            </CardContent>
        </Card>
    );
}
