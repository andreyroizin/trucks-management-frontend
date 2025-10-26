'use client';

import React, { useState } from 'react';
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

                {/* Primary Driver Assignment Dropdown */}
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

                {/* Second Drivers Section */}
                {secondDrivers.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Additional Drivers:
                        </Typography>
                        {secondDrivers.map((driver) => (
                            <Box 
                                key={driver.id}
                                sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1, 
                                    mb: 1,
                                    p: 1,
                                    backgroundColor: 'grey.50',
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'grey.200'
                                }}
                            >
                                <Person fontSize="small" color="secondary" />
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2">{driver.fullName}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {driver.plannedHours}h planned
                                    </Typography>
                                </Box>
                                <IconButton
                                    size="small"
                                    onClick={() => onRemoveSecondDriver?.(ride.id, driver.id)}
                                    disabled={isAssigning}
                                    sx={{ color: 'error.main' }}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            </Box>
                        ))}
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
                        sx={{ width: 140 }}
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
                {ride.assignedDriver && onAddSecondDriver && (
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
