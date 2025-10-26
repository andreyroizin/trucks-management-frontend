'use client';

import React, { useState, useEffect, useRef } from 'react';
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
    Divider,
    IconButton,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    CalendarToday,
    Assignment,
    Person,
    LocalShipping,
    Refresh,
    ChevronLeft,
    ChevronRight
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useWeeklyRides } from '@/hooks/useWeeklyRides';
import { useDriversAndTrucks } from '@/hooks/useDriversAndTrucks';
import { useAssignDriverTruck, useUpdateRideHours, useAddSecondDriver, useRemoveSecondDriver } from '@/hooks/useRideAssignment';
import WeekSelector from './WeekSelector';
import RideAssignmentCard from './RideAssignmentCard';
import AddDriverDialog from './AddDriverDialog';
import OverallocationWarningDialog from './OverallocationWarningDialog';
import { checkDriverConflict, checkTruckConflict, checkDriverHoursConflict, ConflictWarning } from '@/utils/conflictDetection';

type Props = {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
};

export default function WeeklyAssignmentGrid({ selectedDate, onDateChange }: Props) {
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [assigningRides, setAssigningRides] = useState<Set<string>>(new Set());
    const [scrollPosition, setScrollPosition] = useState(0);
    const [activeFilter, setActiveFilter] = useState<'all' | 'assigned' | 'partial' | 'unassigned'>('all');
    
    // Second driver management
    const [addDriverDialog, setAddDriverDialog] = useState<{ open: boolean; rideId: string | null }>({ open: false, rideId: null });

    // Conflict detection
    const [conflictWarning, setConflictWarning] = useState<{
        open: boolean;
        conflict: ConflictWarning | null;
        pendingAction: (() => void) | null;
    }>({ open: false, conflict: null, pendingAction: null });

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
    
    // Assignment mutations
    const assignDriverTruckMutation = useAssignDriverTruck();
    const updateHoursMutation = useUpdateRideHours();
    const addSecondDriverMutation = useAddSecondDriver();
    const removeSecondDriverMutation = useRemoveSecondDriver();

    const isLoading = isLoadingRides || isLoadingResources;
    const error = ridesError || resourcesError;

    const handleDriverAssign = async (rideId: string, driverId: string | null) => {
        console.log('Assigning driver:', driverId, 'to ride:', rideId);
        
        // Find the current ride to get its current state
        const currentRide = ridesData?.days
            .flatMap(day => day.clients)
            .flatMap(client => client.rides)
            .find(ride => ride.id === rideId);
            
        if (!currentRide || !ridesData) return;

        // If unassigning driver, proceed without conflict check
        if (!driverId) {
            return performDriverAssignment(rideId, driverId);
        }

        // Check for driver conflict
        const driverHours = currentRide.secondDriver ? currentRide.assignedDriver?.plannedHours || 8 : currentRide.plannedHours;
        const driverName = drivers?.find(d => d.id === driverId)?.fullName || 'Unknown Driver';
        const conflict = checkDriverConflict(ridesData, rideId, driverId, driverHours, driverName);

        if (conflict) {
            // Show warning dialog
            setConflictWarning({
                open: true,
                conflict,
                pendingAction: () => performDriverAssignment(rideId, driverId)
            });
        } else {
            // No conflict, proceed directly
            performDriverAssignment(rideId, driverId);
        }
    };

    const performDriverAssignment = async (rideId: string, driverId: string | null) => {
        const currentRide = ridesData?.days
            .flatMap(day => day.clients)
            .flatMap(client => client.rides)
            .find(ride => ride.id === rideId);
            
        if (!currentRide) return;
        
        setAssigningRides(prev => new Set(prev).add(rideId));
        
        try {
            // If only 1 driver (no second driver), driver hours = total ride hours
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
        
        // Find the current ride to get its current state
        const currentRide = ridesData?.days
            .flatMap(day => day.clients)
            .flatMap(client => client.rides)
            .find(ride => ride.id === rideId);
            
        if (!currentRide || !ridesData) return;

        // If unassigning truck, proceed without conflict check
        if (!truckId) {
            return performTruckAssignment(rideId, truckId);
        }

        // Check for truck conflict
        const truckHours = currentRide.plannedHours;
        const truckLicensePlate = trucks?.find(t => t.id === truckId)?.licensePlate || 'Unknown Truck';
        const conflict = checkTruckConflict(ridesData, rideId, truckId, truckHours, truckLicensePlate);

        if (conflict) {
            // Show warning dialog
            setConflictWarning({
                open: true,
                conflict,
                pendingAction: () => performTruckAssignment(rideId, truckId)
            });
        } else {
            // No conflict, proceed directly
            performTruckAssignment(rideId, truckId);
        }
    };

    const performTruckAssignment = async (rideId: string, truckId: string | null) => {
        const currentRide = ridesData?.days
            .flatMap(day => day.clients)
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

    const handleDriverHoursChange = async (rideId: string, driverId: string, hours: number) => {
        console.log('Changing driver hours for ride:', rideId, 'driver:', driverId, 'to:', hours);
        
        // Find the current ride to get its current state
        const currentRide = ridesData?.days
            .flatMap(day => day.clients)
            .flatMap(client => client.rides)
            .find(ride => ride.id === rideId);
            
        if (!currentRide || !ridesData) return;

        // Check for driver hours conflict
        const driverName = drivers?.find(d => d.id === driverId)?.fullName || 'Unknown Driver';
        const conflict = checkDriverHoursConflict(ridesData, rideId, driverId, hours, driverName);

        if (conflict) {
            // Show warning dialog
            setConflictWarning({
                open: true,
                conflict,
                pendingAction: () => performDriverHoursUpdate(rideId, driverId, hours)
            });
        } else {
            // No conflict, proceed directly
            performDriverHoursUpdate(rideId, driverId, hours);
        }
    };

    const performDriverHoursUpdate = async (rideId: string, driverId: string, hours: number) => {
        const currentRide = ridesData?.days
            .flatMap(day => day.clients)
            .flatMap(client => client.rides)
            .find(ride => ride.id === rideId);
            
        if (!currentRide) return;

        setAssigningRides(prev => new Set(prev).add(rideId));
        
        try {
            // Determine if this is primary or second driver
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

    const handleHoursChange = async (rideId: string, hours: number) => {
        console.log('Changing hours for ride:', rideId, 'to:', hours);
        
        // Find the current ride to get its current state
        const currentRide = ridesData?.days
            .flatMap(day => day.clients)
            .flatMap(client => client.rides)
            .find(ride => ride.id === rideId);
            
        if (!currentRide || !ridesData) return;

        // Check for truck conflict if truck is assigned (truck hours = planned hours)
        if (currentRide.assignedTruck) {
            const truckLicensePlate = trucks?.find(t => t.id === currentRide.assignedTruck!.id)?.licensePlate || 'Unknown Truck';
            const conflict = checkTruckConflict(ridesData, rideId, currentRide.assignedTruck.id, hours, truckLicensePlate);

            if (conflict) {
                // Show warning dialog
                setConflictWarning({
                    open: true,
                    conflict,
                    pendingAction: () => performHoursUpdate(rideId, hours)
                });
                return;
            }
        }

        // No conflict, proceed directly
        performHoursUpdate(rideId, hours);
    };

    const performHoursUpdate = async (rideId: string, hours: number) => {
        const currentRide = ridesData?.days
            .flatMap(day => day.clients)
            .flatMap(client => client.rides)
            .find(ride => ride.id === rideId);
            
        if (!currentRide) return;
        
        setAssigningRides(prev => new Set(prev).add(rideId));
        
        try {
            // If only 1 driver (no second driver), driver hours = total ride hours
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

    // Second driver handlers
    const handleAddSecondDriver = (rideId: string) => {
        setAddDriverDialog({ open: true, rideId });
    };

    const handleAddDriverConfirm = async (driverId: string, secondDriverHours: number, primaryDriverHours: number) => {
        const rideId = addDriverDialog.rideId;
        if (!rideId || !ridesData) return;

        // Find the current ride to get its current state
        const currentRide = ridesData?.days
            .flatMap(day => day.clients)
            .flatMap(client => client.rides)
            .find(ride => ride.id === rideId);
            
        if (!currentRide) return;

        // Check for conflicts for both primary and second driver
        const primaryDriverName = currentRide.assignedDriver?.fullName || 'Primary Driver';
        const secondDriverName = drivers?.find(d => d.id === driverId)?.fullName || 'Second Driver';

        // Check primary driver conflict (if hours are changing)
        if (currentRide.assignedDriver && primaryDriverHours !== currentRide.assignedDriver.plannedHours) {
            const primaryConflict = checkDriverHoursConflict(ridesData, rideId, currentRide.assignedDriver.id, primaryDriverHours, primaryDriverName);
            if (primaryConflict) {
                setConflictWarning({
                    open: true,
                    conflict: primaryConflict,
                    pendingAction: () => performAddSecondDriver(rideId, driverId, secondDriverHours, primaryDriverHours)
                });
                return;
            }
        }

        // Check second driver conflict
        const secondConflict = checkDriverConflict(ridesData, rideId, driverId, secondDriverHours, secondDriverName);
        if (secondConflict) {
            setConflictWarning({
                open: true,
                conflict: secondConflict,
                pendingAction: () => performAddSecondDriver(rideId, driverId, secondDriverHours, primaryDriverHours)
            });
            return;
        }

        // No conflicts, proceed directly
        performAddSecondDriver(rideId, driverId, secondDriverHours, primaryDriverHours);
        setAddDriverDialog({ open: false, rideId: null });
    };

    const performAddSecondDriver = async (rideId: string, driverId: string, secondDriverHours: number, primaryDriverHours: number) => {
        const currentRide = ridesData?.days
            .flatMap(day => day.clients)
            .flatMap(client => client.rides)
            .find(ride => ride.id === rideId);
            
        if (!currentRide) return;

        setAssigningRides(prev => new Set(prev).add(rideId));
        try {
            // First, update the primary driver hours with user-specified hours
            if (currentRide.assignedDriver) {
                await updateHoursMutation.mutateAsync({
                    rideId,
                    data: {
                        totalPlannedHours: currentRide.plannedHours,
                        primaryDriverHours: primaryDriverHours,
                        secondDriverHours: 0 // Will be set by the next call
                    }
                });
            }
            
            // Then add the second driver with user-specified hours
            await addSecondDriverMutation.mutateAsync({
                rideId,
                data: {
                    driverId,
                    plannedHours: secondDriverHours
                }
            });
            
            console.log('Added second driver:', driverId, 'with hours:', secondDriverHours, 'primary driver hours:', primaryDriverHours, 'to ride:', rideId);
        } catch (error) {
            console.error('Failed to add second driver:', error);
        } finally {
            setAssigningRides(prev => {
                const newSet = new Set(prev);
                newSet.delete(rideId);
                return newSet;
            });
            setAddDriverDialog({ open: false, rideId: null });
        }
    };

    const handleSecondDriverAssign = async (rideId: string, driverId: string | null) => {
        console.log('Changing second driver for ride:', rideId, 'to driver:', driverId);
        
        // Find the current ride to get its current state
        const currentRide = ridesData?.days
            .flatMap(day => day.clients)
            .flatMap(client => client.rides)
            .find(ride => ride.id === rideId);
            
        if (!currentRide || !ridesData) return;

        // If removing second driver, proceed without conflict check
        if (!driverId) {
            return performSecondDriverAssign(rideId, driverId);
        }

        // Check for second driver conflict (using default 4 hours)
        const defaultHours = 4;
        const driverName = drivers?.find(d => d.id === driverId)?.fullName || 'Second Driver';
        const conflict = checkDriverConflict(ridesData, rideId, driverId, defaultHours, driverName);

        if (conflict) {
            setConflictWarning({
                open: true,
                conflict,
                pendingAction: () => performSecondDriverAssign(rideId, driverId)
            });
        } else {
            // No conflict, proceed directly
            performSecondDriverAssign(rideId, driverId);
        }
    };

    const performSecondDriverAssign = async (rideId: string, driverId: string | null) => {
        const currentRide = ridesData?.days
            .flatMap(day => day.clients)
            .flatMap(client => client.rides)
            .find(ride => ride.id === rideId);
            
        if (!currentRide) return;

        setAssigningRides(prev => new Set(prev).add(rideId));
        
        try {
            if (driverId) {
                // Remove current second driver first, then add new one
                if (currentRide.secondDriver) {
                    await removeSecondDriverMutation.mutateAsync(rideId);
                }
                
                // Add new second driver with default hours
                await addSecondDriverMutation.mutateAsync({
                    rideId,
                    data: {
                        driverId,
                        plannedHours: 4 // Default hours for new second driver
                    }
                });
            } else {
                // Remove second driver
                if (currentRide.secondDriver) {
                    await removeSecondDriverMutation.mutateAsync(rideId);
                }
            }
            
            console.log('Changed second driver for ride:', rideId);
        } catch (error) {
            console.error('Failed to change second driver:', error);
        } finally {
            setAssigningRides(prev => {
                const newSet = new Set(prev);
                newSet.delete(rideId);
                return newSet;
            });
        }
    };

    const handleRemoveSecondDriver = async (rideId: string, driverId: string) => {
        // Find the current ride to get its current state
        const currentRide = ridesData?.days
            .flatMap(day => day.clients)
            .flatMap(client => client.rides)
            .find(ride => ride.id === rideId);
            
        if (!currentRide) return;

        setAssigningRides(prev => new Set(prev).add(rideId));
        try {
            // Remove the second driver
            await removeSecondDriverMutation.mutateAsync(rideId);
            
            // After removing second driver, primary driver should get all ride hours again
            if (currentRide.assignedDriver) {
                await updateHoursMutation.mutateAsync({
                    rideId,
                    data: {
                        totalPlannedHours: currentRide.plannedHours,
                        primaryDriverHours: currentRide.plannedHours, // Primary driver gets all hours
                        secondDriverHours: undefined // No second driver
                    }
                });
            }
            
            console.log('Removed second driver from ride:', rideId);
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

    // Filter rides based on active filter
    const getFilteredRidesData = () => {
        if (!ridesData || activeFilter === 'all') return ridesData;

        return {
            ...ridesData,
            days: ridesData.days.map(day => ({
                ...day,
                clients: day.clients.map(client => ({
                    ...client,
                    rides: client.rides.filter(ride => {
                        const hasDriver = !!ride.assignedDriver;
                        const hasTruck = !!ride.assignedTruck;
                        
                        switch (activeFilter) {
                            case 'assigned':
                                return hasDriver && hasTruck;
                            case 'partial':
                                return (hasDriver && !hasTruck) || (!hasDriver && hasTruck);
                            case 'unassigned':
                                return !hasDriver && !hasTruck;
                            default:
                                return true;
                        }
                    })
                })).filter(client => client.rides.length > 0) // Remove clients with no rides after filtering
            }))
        };
    };

    const filteredRidesData = getFilteredRidesData();

    // Horizontal scroll navigation
    const cardWidth = 320; // Minimum card width in pixels
    const scrollAmount = cardWidth + 16; // Card width + gap
    const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [, forceUpdate] = useState({});

    // Conflict warning dialog handlers
    const handleConflictWarningClose = () => {
        setConflictWarning({ open: false, conflict: null, pendingAction: null });
    };

    const handleConflictWarningAssignAnyway = () => {
        if (conflictWarning.pendingAction) {
            conflictWarning.pendingAction();
        }
        handleConflictWarningClose();
    };

    // Set up scroll container ref and event listener for desktop
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container && !isMobile) {
            setScrollContainer(container);
            
            const handleScroll = () => {
                // Force re-render to update button states
                forceUpdate({});
            };
            
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [isMobile]);

    const handleScrollLeft = () => {
        if (isMobile) {
            setScrollPosition(prev => Math.max(0, prev - scrollAmount));
        } else if (scrollContainer) {
            scrollContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
    };

    const handleScrollRight = () => {
        if (isMobile) {
            const maxScroll = (filteredRidesData?.days.length || 0) * scrollAmount - (window.innerWidth - 100);
            setScrollPosition(prev => Math.min(maxScroll, prev + scrollAmount));
        } else if (scrollContainer) {
            scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const canScrollLeft = isMobile 
        ? scrollPosition > 0 
        : scrollContainer ? scrollContainer.scrollLeft > 0 : false;
    
    const canScrollRight = isMobile 
        ? filteredRidesData && scrollPosition < (filteredRidesData.days.length * scrollAmount - (window.innerWidth - 100))
        : scrollContainer ? scrollContainer.scrollLeft < (scrollContainer.scrollWidth - scrollContainer.clientWidth) : false;

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
                    {activeFilter !== 'all' && (
                        <Chip 
                            label={`Filtered: ${activeFilter === 'assigned' ? 'Fully Assigned' : 
                                   activeFilter === 'partial' ? 'Partially Assigned' : 'Unassigned'}`}
                            size="small"
                            color={activeFilter === 'assigned' ? 'success' : 
                                   activeFilter === 'partial' ? 'warning' : 'error'}
                            sx={{ ml: 2 }}
                        />
                    )}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Assign drivers and trucks to generated rides
                    {activeFilter !== 'all' && ' • Click "All Rides" to clear filter'}
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
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Chip
                            icon={<Assignment />}
                            label={`All Rides: ${getTotalRidesForWeek()}`}
                            color="primary"
                            variant={activeFilter === 'all' ? 'filled' : 'outlined'}
                            clickable
                            onClick={() => setActiveFilter('all')}
                            sx={{ 
                                cursor: 'pointer',
                                '&:hover': {
                                    backgroundColor: activeFilter === 'all' ? 'primary.dark' : 'primary.light'
                                }
                            }}
                        />
                        <Chip
                            icon={<Person />}
                            label={`Fully Assigned: ${stats.assigned}`}
                            color="success"
                            variant={activeFilter === 'assigned' ? 'filled' : 'outlined'}
                            clickable
                            onClick={() => setActiveFilter('assigned')}
                            sx={{ 
                                cursor: 'pointer',
                                '&:hover': {
                                    backgroundColor: activeFilter === 'assigned' ? 'success.dark' : 'success.light'
                                }
                            }}
                        />
                        <Chip
                            icon={<LocalShipping />}
                            label={`Partially Assigned: ${stats.partial}`}
                            color="warning"
                            variant={activeFilter === 'partial' ? 'filled' : 'outlined'}
                            clickable
                            onClick={() => setActiveFilter('partial')}
                            sx={{ 
                                cursor: 'pointer',
                                '&:hover': {
                                    backgroundColor: activeFilter === 'partial' ? 'warning.dark' : 'warning.light'
                                }
                            }}
                        />
                        <Chip
                            icon={<Assignment />}
                            label={`Unassigned: ${stats.unassigned}`}
                            color="error"
                            variant={activeFilter === 'unassigned' ? 'filled' : 'outlined'}
                            clickable
                            onClick={() => setActiveFilter('unassigned')}
                            sx={{ 
                                cursor: 'pointer',
                                '&:hover': {
                                    backgroundColor: activeFilter === 'unassigned' ? 'error.dark' : 'error.light'
                                }
                            }}
                        />
                    </Box>
                </CardContent>
            </Card>

            {/* Weekly Grid with Horizontal Scroll */}
            <Box sx={{ position: 'relative' }}>
                {/* Desktop Scroll Navigation - Top Right */}
                {!isMobile && (
                    <Box sx={{ 
                        position: 'absolute', 
                        top: -60, 
                        right: 0, 
                        zIndex: 2,
                        display: 'flex',
                        gap: 1
                    }}>
                        <IconButton
                            onClick={handleScrollLeft}
                            disabled={!canScrollLeft}
                            size="small"
                            sx={{
                                backgroundColor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                '&:hover': {
                                    backgroundColor: 'grey.50'
                                },
                                '&.Mui-disabled': {
                                    opacity: 0.3
                                }
                            }}
                        >
                            <ChevronLeft fontSize="small" />
                        </IconButton>
                        <IconButton
                            onClick={handleScrollRight}
                            disabled={!canScrollRight}
                            size="small"
                            sx={{
                                backgroundColor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                '&:hover': {
                                    backgroundColor: 'grey.50'
                                },
                                '&.Mui-disabled': {
                                    opacity: 0.3
                                }
                            }}
                        >
                            <ChevronRight fontSize="small" />
                        </IconButton>
                    </Box>
                )}

                {/* Mobile Scroll Navigation - Side Overlay */}
                {isMobile && (
                    <>
                        <IconButton
                            onClick={handleScrollLeft}
                            disabled={!canScrollLeft}
                            sx={{
                                position: 'absolute',
                                left: 0,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 2,
                                backgroundColor: 'background.paper',
                                boxShadow: 2,
                                '&:hover': {
                                    backgroundColor: 'grey.100'
                                },
                                '&.Mui-disabled': {
                                    display: 'none'
                                }
                            }}
                        >
                            <ChevronLeft />
                        </IconButton>
                        <IconButton
                            onClick={handleScrollRight}
                            disabled={!canScrollRight}
                            sx={{
                                position: 'absolute',
                                right: 0,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 2,
                                backgroundColor: 'background.paper',
                                boxShadow: 2,
                                '&:hover': {
                                    backgroundColor: 'grey.100'
                                },
                                '&.Mui-disabled': {
                                    display: 'none'
                                }
                            }}
                        >
                            <ChevronRight />
                        </IconButton>
                    </>
                )}

                {/* Scrollable Container */}
                <Box
                    ref={scrollContainerRef}
                    sx={{
                        display: 'flex',
                        gap: 2,
                        overflowX: isMobile ? 'hidden' : 'auto',
                        overflowY: 'visible',
                        transform: isMobile ? `translateX(-${scrollPosition}px)` : 'none',
                        transition: isMobile ? 'transform 0.3s ease-in-out' : 'none',
                        px: isMobile ? 5 : 0, // Add padding for scroll buttons
                        '&::-webkit-scrollbar': {
                            height: 8,
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: 'grey.100',
                            borderRadius: 4,
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'grey.400',
                            borderRadius: 4,
                            '&:hover': {
                                backgroundColor: 'grey.600',
                            },
                        },
                    }}
                >
                    {filteredRidesData?.days.map((day) => (
                        <Paper 
                            key={day.date}
                            sx={{ 
                                p: 2, 
                                minHeight: 400,
                                minWidth: cardWidth,
                                maxWidth: isMobile ? cardWidth : 'none',
                                flex: isMobile ? '0 0 auto' : '1 1 0',
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
                                                onDriverHoursChange={handleDriverHoursChange}
                                                onSecondDriverAssign={handleSecondDriverAssign}
                                                onAddSecondDriver={handleAddSecondDriver}
                                                onRemoveSecondDriver={handleRemoveSecondDriver}
                                                secondDrivers={ride.secondDriver ? [{ 
                                                    id: ride.secondDriver.id, 
                                                    fullName: ride.secondDriver.fullName, 
                                                    plannedHours: ride.secondDriver.plannedHours 
                                                }] : []}
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
                    ))}
                </Box>
            </Box>

            {getTotalRidesForWeek() === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    No rides found for this week. Generate rides in the Weekly Planning view first.
                </Alert>
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
                        ridesData.days
                            .flatMap(day => day.clients)
                            .flatMap(client => client.rides)
                            .filter(ride => ride.id === addDriverDialog.rideId && ride.assignedDriver)
                            .map(ride => ride.assignedDriver!.id)
                        : []
                    ),
                    // Exclude already assigned second driver
                    ...(addDriverDialog.rideId && ridesData ? 
                        ridesData.days
                            .flatMap(day => day.clients)
                            .flatMap(client => client.rides)
                            .filter(ride => ride.id === addDriverDialog.rideId && ride.secondDriver)
                            .map(ride => ride.secondDriver!.id)
                        : []
                    )
                ]}
                totalRideHours={addDriverDialog.rideId && ridesData ? 
                    ridesData.days
                        .flatMap(day => day.clients)
                        .flatMap(client => client.rides)
                        .find(ride => ride.id === addDriverDialog.rideId)?.plannedHours || 8
                    : 8
                }
                primaryDriverName={addDriverDialog.rideId && ridesData ? 
                    ridesData.days
                        .flatMap(day => day.clients)
                        .flatMap(client => client.rides)
                        .find(ride => ride.id === addDriverDialog.rideId)?.assignedDriver?.fullName || "Primary driver"
                    : "Primary driver"
                }
                currentPrimaryDriverHours={addDriverDialog.rideId && ridesData ? 
                    ridesData.days
                        .flatMap(day => day.clients)
                        .flatMap(client => client.rides)
                        .find(ride => ride.id === addDriverDialog.rideId)?.assignedDriver?.plannedHours || 8
                    : 8
                }
                isLoading={addDriverDialog.rideId ? assigningRides.has(addDriverDialog.rideId) : false}
            />

            {/* Overallocation Warning Dialog */}
            <OverallocationWarningDialog
                open={conflictWarning.open}
                onClose={handleConflictWarningClose}
                onAssignAnyway={handleConflictWarningAssignAnyway}
                conflict={conflictWarning.conflict}
                isLoading={conflictWarning.pendingAction ? assigningRides.size > 0 : false}
            />
        </Box>
    );
}
