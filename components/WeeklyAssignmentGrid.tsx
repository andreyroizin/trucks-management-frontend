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
import WeekSelector from './WeekSelector';
import RideAssignmentCard from './RideAssignmentCard';

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
        </Box>
    );
}
