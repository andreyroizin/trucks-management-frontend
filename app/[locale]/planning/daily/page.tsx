'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Button,
    Autocomplete,
    TextField,
    Chip,
    Divider
} from '@mui/material';
import {
    CalendarToday,
    ArrowBack,
    Assignment,
    Person,
    LocalShipping,
    Refresh
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useDailyRides, useAvailableDates } from '@/hooks/useDailyRides';
import { useDriversAndTrucks } from '@/hooks/useDriversAndTrucks';
import RideAssignmentCard from '@/components/RideAssignmentCard';
import AddDriverDialog from '@/components/AddDriverDialog';
import { useAssignDriverTruck, useUpdateRideHours, useAddSecondDriver, useRemoveSecondDriver } from '@/hooks/useRideAssignment';

export default function DailyPlanningPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    
    // Access control - only Customer Admin and Employer roles
    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                router.push('/auth/login');
            } else if (
                !user?.roles.includes('globalAdmin') &&
                !user?.roles.includes('customerAdmin') &&
                !user?.roles.includes('employer')
            ) {
                router.push('/403');
            }
        }
    }, [authLoading, isAuthenticated, user, router]);
    
    // Get date from URL params or default to today
    const urlDate = searchParams.get('date');
    const [selectedDate, setSelectedDate] = useState<string>(
        urlDate || new Date().toISOString().split('T')[0]
    );
    
    // Data fetching
    const { data: ridesData, isLoading: isLoadingRides, error: ridesError, refetch: refetchRides } = useDailyRides(selectedDate, user?.companyId);
    const { data: availableDates, isLoading: isLoadingDates } = useAvailableDates(user?.companyId);
    const { drivers, trucks, isLoading: isLoadingResources, error: resourcesError } = useDriversAndTrucks();
    
    // Assignment mutations
    const assignDriverTruckMutation = useAssignDriverTruck();
    const updateHoursMutation = useUpdateRideHours();
    const addSecondDriverMutation = useAddSecondDriver();
    const removeSecondDriverMutation = useRemoveSecondDriver();
    
    const [assigningRides, setAssigningRides] = useState<Set<string>>(new Set());
    
    // Second driver management
    const [addDriverDialog, setAddDriverDialog] = useState<{ open: boolean; rideId: string | null }>({ open: false, rideId: null });

    const isLoading = isLoadingRides || isLoadingResources || isLoadingDates;
    const error = ridesError || resourcesError;

    // Update URL when date changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('date', selectedDate);
            window.history.replaceState({}, '', url.toString());
        }
    }, [selectedDate]);

    // Assignment handlers (same as WeeklyAssignmentGrid)
    const handleDriverAssign = async (rideId: string, driverId: string | null) => {
        console.log('Assigning driver:', driverId, 'to ride:', rideId);
        
        const currentRide = ridesData?.clients
            .flatMap(client => client.rides)
            .find(ride => ride.id === rideId);
            
        if (!currentRide) return;
        
        setAssigningRides(prev => new Set(prev).add(rideId));
        
        try {
            const driverHours = currentRide.secondDriver ? currentRide.assignedDriver?.plannedHours || 8 : currentRide.plannedHours;
            
            await assignDriverTruckMutation.mutateAsync({
                rideId,
                data: {
                    driverId,
                    driverPlannedHours: driverId ? driverHours : null,
                    truckId: currentRide.assignedTruck?.id || null,
                    totalPlannedHours: currentRide.plannedHours
                }
            });
        } catch (error) {
            console.error('Failed to assign driver:', error);
        } finally {
            setAssigningRides(prev => {
                const newSet = new Set(prev);
                newSet.delete(rideId);
                return newSet;
            });
        }
    };

    const handleTruckAssign = async (rideId: string, truckId: string | null) => {
        console.log('Assigning truck:', truckId, 'to ride:', rideId);
        
        const currentRide = ridesData?.clients
            .flatMap(client => client.rides)
            .find(ride => ride.id === rideId);
            
        if (!currentRide) return;
        
        setAssigningRides(prev => new Set(prev).add(rideId));
        
        try {
            await assignDriverTruckMutation.mutateAsync({
                rideId,
                data: {
                    driverId: currentRide.assignedDriver?.id || null,
                    driverPlannedHours: currentRide.assignedDriver?.plannedHours || null,
                    truckId,
                    totalPlannedHours: currentRide.plannedHours
                }
            });
        } catch (error) {
            console.error('Failed to assign truck:', error);
        } finally {
            setAssigningRides(prev => {
                const newSet = new Set(prev);
                newSet.delete(rideId);
                return newSet;
            });
        }
    };

    const handleHoursChange = async (rideId: string, hours: number) => {
        console.log('Changing hours for ride:', rideId, 'to:', hours);
        
        const currentRide = ridesData?.clients
            .flatMap(client => client.rides)
            .find(ride => ride.id === rideId);
            
        if (!currentRide) return;
        
        setAssigningRides(prev => new Set(prev).add(rideId));
        
        try {
            const primaryDriverHours = currentRide.secondDriver ? currentRide.assignedDriver?.plannedHours : hours;
            
            await updateHoursMutation.mutateAsync({
                rideId,
                data: {
                    totalPlannedHours: hours,
                    primaryDriverHours: primaryDriverHours,
                    secondDriverHours: currentRide.secondDriver?.plannedHours
                }
            });
        } catch (error) {
            console.error('Failed to update hours:', error);
        } finally {
            setAssigningRides(prev => {
                const newSet = new Set(prev);
                newSet.delete(rideId);
                return newSet;
            });
        }
    };

    const handleDriverHoursChange = async (rideId: string, driverId: string, hours: number) => {
        console.log('Changing driver hours for ride:', rideId, 'driver:', driverId, 'to:', hours);
        
        const currentRide = ridesData?.clients
            .flatMap(client => client.rides)
            .find(ride => ride.id === rideId);
            
        if (!currentRide) return;

        setAssigningRides(prev => new Set(prev).add(rideId));
        
        try {
            const isPrimaryDriver = currentRide.assignedDriver?.id === driverId;
            const isSecondDriver = currentRide.secondDriver?.id === driverId;
            
            if (isPrimaryDriver) {
                await updateHoursMutation.mutateAsync({
                    rideId,
                    data: {
                        totalPlannedHours: currentRide.plannedHours,
                        primaryDriverHours: hours,
                        secondDriverHours: currentRide.secondDriver?.plannedHours
                    }
                });
            } else if (isSecondDriver) {
                await updateHoursMutation.mutateAsync({
                    rideId,
                    data: {
                        totalPlannedHours: currentRide.plannedHours,
                        primaryDriverHours: currentRide.assignedDriver?.plannedHours,
                        secondDriverHours: hours
                    }
                });
            }
        } catch (error) {
            console.error('Failed to update driver hours:', error);
        } finally {
            setAssigningRides(prev => {
                const newSet = new Set(prev);
                newSet.delete(rideId);
                return newSet;
            });
        }
    };

    const handleAddSecondDriver = (rideId: string) => {
        setAddDriverDialog({ open: true, rideId });
    };

    const handleAddDriverConfirm = async (driverId: string, secondDriverHours: number, primaryDriverHours: number) => {
        const rideId = addDriverDialog.rideId;
        if (!rideId || !ridesData) return;

        // Find the current ride to get its current state
        const currentRide = ridesData.clients
            .flatMap(client => client.rides)
            .find(ride => ride.id === rideId);
            
        if (!currentRide) return;

        setAssigningRides(prev => new Set(prev).add(rideId));
        
        try {
            // Add the second driver
            await addSecondDriverMutation.mutateAsync({
                rideId,
                data: {
                    driverId,
                    plannedHours: secondDriverHours
                }
            });

            // Update primary driver hours if they changed
            if (currentRide.assignedDriver && currentRide.assignedDriver.plannedHours !== primaryDriverHours) {
                await updateHoursMutation.mutateAsync({
                    rideId,
                    data: {
                        totalPlannedHours: currentRide.plannedHours,
                        primaryDriverHours: primaryDriverHours,
                        secondDriverHours: secondDriverHours
                    }
                });
            }

            // Close dialog
            setAddDriverDialog({ open: false, rideId: null });
        } catch (error) {
            console.error('Failed to add second driver:', error);
        } finally {
            setAssigningRides(prev => {
                const newSet = new Set(prev);
                newSet.delete(rideId);
                return newSet;
            });
        }
    };

    const handleRemoveSecondDriver = async (rideId: string, driverId: string) => {
        console.log('Removing second driver:', driverId, 'from ride:', rideId);
        
        setAssigningRides(prev => new Set(prev).add(rideId));
        
        try {
            await removeSecondDriverMutation.mutateAsync(rideId);
        } catch (error) {
            console.error('Failed to remove second driver:', error);
        } finally {
            setAssigningRides(prev => {
                const newSet = new Set(prev);
                newSet.delete(rideId);
                return newSet;
            });
        }
    };

    const handleSecondDriverAssign = async (rideId: string, driverId: string | null) => {
        console.log('Changing second driver for ride:', rideId, 'to driver:', driverId);
        // Implementation similar to weekly grid
    };

    // Calculate stats for the day
    const getStats = () => {
        if (!ridesData) return { total: 0, assigned: 0, partial: 0, unassigned: 0 };
        
        const allRides = ridesData.clients.flatMap(client => client.rides);
        const total = allRides.length;
        const assigned = allRides.filter(ride => ride.assignedDriver && ride.assignedTruck).length;
        const unassigned = allRides.filter(ride => !ride.assignedDriver && !ride.assignedTruck).length;
        const partial = total - assigned - unassigned;
        
        return { total, assigned, partial, unassigned };
    };

    const stats = getStats();

    // Format date for display
    const formatDateForDisplay = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (authLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">
                    Failed to load daily planning data: {error.message}
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => router.push('/planning/weekly')}
                        variant="outlined"
                        size="small"
                    >
                        Back to Weekly
                    </Button>
                    <Typography variant="h4">
                        Daily Planning
                    </Typography>
                </Box>
                <Typography variant="subtitle1" color="text.secondary">
                    Manage ride assignments and details for a specific day
                </Typography>
            </Box>

            {/* Date Selector and Stats */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CalendarToday color="primary" />
                            <Autocomplete
                                size="small"
                                options={availableDates || []}
                                getOptionLabel={(date) => formatDateForDisplay(date)}
                                value={selectedDate}
                                onChange={(_, newValue) => {
                                    if (newValue) {
                                        setSelectedDate(newValue);
                                    }
                                }}
                                sx={{ minWidth: 300 }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Date"
                                        variant="outlined"
                                    />
                                )}
                                renderOption={(props, date) => (
                                    <Box component="li" {...props}>
                                        <Typography variant="body2">
                                            {formatDateForDisplay(date)}
                                        </Typography>
                                    </Box>
                                )}
                            />
                            <Button
                                startIcon={<Refresh />}
                                onClick={() => refetchRides()}
                                variant="outlined"
                                size="small"
                            >
                                Refresh
                            </Button>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Chip
                                icon={<Assignment />}
                                label={`Total: ${stats.total}`}
                                color="primary"
                                variant="outlined"
                            />
                            <Chip
                                icon={<Person />}
                                label={`Assigned: ${stats.assigned}`}
                                color="success"
                                variant="outlined"
                            />
                            <Chip
                                icon={<LocalShipping />}
                                label={`Partial: ${stats.partial}`}
                                color="warning"
                                variant="outlined"
                            />
                            <Chip
                                icon={<Assignment />}
                                label={`Unassigned: ${stats.unassigned}`}
                                color="error"
                                variant="outlined"
                            />
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Rides Display */}
            {ridesData && ridesData.clients.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {ridesData.clients.map((client) => (
                        <Box key={client.clientId}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Assignment color="primary" />
                                {client.clientName}
                                <Chip size="small" label={`${client.rides.length} ride${client.rides.length !== 1 ? 's' : ''}`} />
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {client.rides.map((ride) => (
                                    <RideAssignmentCard
                                        key={ride.id}
                                        ride={ride}
                                        clientName={client.clientName}
                                        drivers={drivers || []}
                                        trucks={trucks || []}
                                        onDriverAssign={handleDriverAssign}
                                        onTruckAssign={handleTruckAssign}
                                        onHoursChange={handleHoursChange}
                                        onDriverHoursChange={handleDriverHoursChange}
                                        onSecondDriverAssign={handleSecondDriverAssign}
                                        onAddSecondDriver={handleAddSecondDriver}
                                        onRemoveSecondDriver={handleRemoveSecondDriver}
                                        isAssigning={assigningRides.has(ride.id)}
                                    />
                                ))}
                            </Box>
                            
                            {client !== ridesData.clients[ridesData.clients.length - 1] && (
                                <Divider sx={{ mt: 3 }} />
                            )}
                        </Box>
                    ))}
                </Box>
            ) : (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No rides planned for {formatDateForDisplay(selectedDate)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Select a different date or generate rides from the weekly planning view.
                    </Typography>
                </Paper>
            )}

            {/* Add Driver Dialog */}
            <AddDriverDialog
                open={addDriverDialog.open}
                onClose={() => setAddDriverDialog({ open: false, rideId: null })}
                onAdd={handleAddDriverConfirm}
                drivers={drivers || []}
                excludeDriverIds={[
                    // Exclude primary driver if assigned
                    ...(addDriverDialog.rideId && ridesData ? 
                        ridesData.clients
                            .flatMap(client => client.rides)
                            .filter(ride => ride.id === addDriverDialog.rideId && ride.assignedDriver)
                            .map(ride => ride.assignedDriver!.id)
                        : []
                    ),
                    // Exclude already assigned second driver
                    ...(addDriverDialog.rideId && ridesData ? 
                        ridesData.clients
                            .flatMap(client => client.rides)
                            .filter(ride => ride.id === addDriverDialog.rideId && ride.secondDriver)
                            .map(ride => ride.secondDriver!.id)
                        : []
                    )
                ]}
                totalRideHours={addDriverDialog.rideId && ridesData ? 
                    ridesData.clients
                        .flatMap(client => client.rides)
                        .find(ride => ride.id === addDriverDialog.rideId)?.plannedHours || 8
                    : 8
                }
                primaryDriverName={addDriverDialog.rideId && ridesData ? 
                    ridesData.clients
                        .flatMap(client => client.rides)
                        .find(ride => ride.id === addDriverDialog.rideId)?.assignedDriver?.fullName || "Primary driver"
                    : "Primary driver"
                }
                currentPrimaryDriverHours={addDriverDialog.rideId && ridesData ? 
                    ridesData.clients
                        .flatMap(client => client.rides)
                        .find(ride => ride.id === addDriverDialog.rideId)?.assignedDriver?.plannedHours || 8
                    : 8
                }
                isLoading={addDriverDialog.rideId ? assigningRides.has(addDriverDialog.rideId) : false}
            />
        </Box>
    );
}