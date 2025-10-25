'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Chip,
    Button,
    Divider
} from '@mui/material';
import {
    CalendarToday,
    Assignment,
    Person,
    LocalShipping,
    Refresh
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useWeeklyRides } from '@/hooks/useWeeklyRides';
import { useDriversAndTrucks } from '@/hooks/useDriversAndTrucks';
import WeekSelector from './WeekSelector';
import RideAssignmentCard from './RideAssignmentCard';

type Props = {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
};

export default function WeeklyAssignmentGrid({ selectedDate, onDateChange }: Props) {
    const { user } = useAuth();
    const [assigningRides, setAssigningRides] = useState<Set<string>>(new Set());

    // Format date for API (YYYY-MM-DD)
    const formatDateForAPI = (date: Date): string => {
        return date.toISOString().split('T')[0];
    };

    // Get company ID based on user role
    const getCompanyId = (): string | undefined => {
        const isGlobalAdmin = user?.roles.includes('globalAdmin');
        if (isGlobalAdmin) {
            // For now, global admins will see all companies (no companyId filter)
            // In the future, we could add a company selector here
            return undefined;
        }
        // For non-global admins, the backend will automatically filter by their company
        return undefined;
    };

    const weekStartDate = formatDateForAPI(selectedDate);
    const companyId = getCompanyId();

    const { 
        data: ridesData, 
        isLoading: isLoadingRides, 
        isError: isRidesError, 
        error: ridesError,
        refetch: refetchRides
    } = useWeeklyRides(weekStartDate, companyId);

    const { 
        drivers, 
        trucks, 
        isLoading: isLoadingResources, 
        error: resourcesError 
    } = useDriversAndTrucks();

    const isLoading = isLoadingRides || isLoadingResources;
    const error = ridesError || resourcesError;

    const handleDriverAssign = async (rideId: string, driverId: string | null) => {
        console.log('Assigning driver:', driverId, 'to ride:', rideId);
        // TODO: Implement driver assignment API call in next step
        setAssigningRides(prev => new Set(prev).add(rideId));
        
        // Simulate API call
        setTimeout(() => {
            setAssigningRides(prev => {
                const newSet = new Set(prev);
                newSet.delete(rideId);
                return newSet;
            });
        }, 1000);
    };

    const handleTruckAssign = async (rideId: string, truckId: string | null) => {
        console.log('Assigning truck:', truckId, 'to ride:', rideId);
        // TODO: Implement truck assignment API call in next step
        setAssigningRides(prev => new Set(prev).add(rideId));
        
        // Simulate API call
        setTimeout(() => {
            setAssigningRides(prev => {
                const newSet = new Set(prev);
                newSet.delete(rideId);
                return newSet;
            });
        }, 1000);
    };

    const handleHoursChange = async (rideId: string, hours: number) => {
        console.log('Changing hours for ride:', rideId, 'to:', hours);
        // TODO: Implement hours update API call in next step
        setAssigningRides(prev => new Set(prev).add(rideId));
        
        // Simulate API call
        setTimeout(() => {
            setAssigningRides(prev => {
                const newSet = new Set(prev);
                newSet.delete(rideId);
                return newSet;
            });
        }, 500);
    };

    const getTotalRidesForWeek = (): number => {
        if (!ridesData) return 0;
        return ridesData.days.reduce((total, day) => {
            return total + day.clients.reduce((dayTotal, client) => {
                return dayTotal + client.rides.length;
            }, 0);
        }, 0);
    };

    const getAssignmentStats = () => {
        if (!ridesData) return { assigned: 0, unassigned: 0, partial: 0 };
        
        let assigned = 0;
        let unassigned = 0;
        let partial = 0;
        
        ridesData.days.forEach(day => {
            day.clients.forEach(client => {
                client.rides.forEach(ride => {
                    const hasDriver = !!ride.assignedDriver;
                    const hasTruck = !!ride.assignedTruck;
                    
                    if (hasDriver && hasTruck) {
                        assigned++;
                    } else if (!hasDriver && !hasTruck) {
                        unassigned++;
                    } else {
                        partial++;
                    }
                });
            });
        });
        
        return { assigned, unassigned, partial };
    };

    const stats = getAssignmentStats();

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (isRidesError) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                Failed to load weekly rides: {ridesError?.message}
            </Alert>
        );
    }

    if (resourcesError) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                Failed to load drivers and trucks: {resourcesError?.message}
            </Alert>
        );
    }

    if (!ridesData) {
        return (
            <Alert severity="info" sx={{ mt: 2 }}>
                No rides data available
            </Alert>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assignment />
                    Weekly Assignment Grid
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Assign drivers and trucks to generated rides
                </Typography>
            </Box>

            {/* Week Selector */}
            <WeekSelector 
                selectedDate={selectedDate} 
                onDateChange={onDateChange} 
            />

            {/* Summary */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6">
                            Assignment Summary
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Refresh />}
                            onClick={() => refetchRides()}
                        >
                            Refresh
                        </Button>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography><strong>Total Rides:</strong></Typography>
                            <Chip label={getTotalRidesForWeek()} color="primary" size="small" />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography><strong>Fully Assigned:</strong></Typography>
                            <Chip label={stats.assigned} color="success" size="small" />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography><strong>Partially Assigned:</strong></Typography>
                            <Chip label={stats.partial} color="warning" size="small" />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography><strong>Unassigned:</strong></Typography>
                            <Chip label={stats.unassigned} color="error" size="small" />
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Weekly Grid */}
            <Grid container spacing={2}>
                {ridesData.days.map((day) => (
                    <Grid item xs={12} md={6} lg={1.71} key={day.date}>
                        <Paper 
                            sx={{ 
                                p: 2, 
                                minHeight: 400,
                                backgroundColor: day.clients.length === 0 ? 'grey.50' : 'background.paper',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            {/* Day Header */}
                            <Box sx={{ mb: 2, textAlign: 'center' }}>
                                <Typography variant="h6" fontWeight="bold">
                                    {day.dayName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {new Date(day.date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric' 
                                    })}
                                </Typography>
                                <Divider sx={{ mt: 1 }} />
                                <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                                    {day.clients.reduce((total, client) => total + client.rides.length, 0)} ride{day.clients.reduce((total, client) => total + client.rides.length, 0) !== 1 ? 's' : ''}
                                </Typography>
                            </Box>

                            {/* Rides for this day */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
                                {day.clients.map((client) => (
                                    <Box key={client.clientId}>
                                        {client.rides.map((ride) => (
                                            <RideAssignmentCard
                                                key={ride.id}
                                                ride={ride}
                                                clientName={client.clientName}
                                                drivers={drivers}
                                                trucks={trucks}
                                                onDriverAssign={handleDriverAssign}
                                                onTruckAssign={handleTruckAssign}
                                                onHoursChange={handleHoursChange}
                                                isAssigning={assigningRides.has(ride.id)}
                                            />
                                        ))}
                                    </Box>
                                ))}

                                {/* Show message if no rides */}
                                {day.clients.length === 0 && (
                                    <Typography 
                                        variant="body2" 
                                        color="text.secondary" 
                                        sx={{ textAlign: 'center', fontStyle: 'italic', mt: 2 }}
                                    >
                                        No rides scheduled
                                    </Typography>
                                )}
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {getTotalRidesForWeek() === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    No rides found for this week. Generate rides in the Weekly Planning view first.
                </Alert>
            )}
        </Box>
    );
}
