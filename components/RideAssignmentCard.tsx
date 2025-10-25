'use client';

import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Autocomplete,
    TextField
} from '@mui/material';
import {
    Person,
    LocalShipping,
    Schedule,
    Assignment
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

                {/* Driver Assignment Dropdown */}
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
                                label="Driver"
                                placeholder="Select driver..."
                                variant="outlined"
                            />
                        )}
                        renderOption={(props, driver) => (
                            <Box component="li" {...props}>
                                <Box>
                                    <Typography variant="body2">{driver.fullName}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {driver.email}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    />
                </Box>

                {/* Truck Assignment Dropdown */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <LocalShipping fontSize="small" color="primary" />
                    <Autocomplete
                        size="small"
                        options={trucks}
                        getOptionLabel={(truck) => `${truck.licensePlate} (${truck.brand} ${truck.model})`}
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
                                <Box>
                                    <Typography variant="body2">{truck.licensePlate}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {truck.brand} {truck.model} ({truck.year})
                                    </Typography>
                                </Box>
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
            </CardContent>
        </Card>
    );
}
