'use client';

import React, { useState, useCallback } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    RestoreOutlined,
    ContentCopyOutlined,
    EventBusyOutlined,
    AccessTimeOutlined
} from '@mui/icons-material';
import { DriverAvailability, TruckAvailability } from '@/hooks/useWeeklyAvailability';
import { useTranslations } from 'next-intl';

type Resource = DriverAvailability | TruckAvailability;

type Props = {
    resources: Resource[];
    weekStartDate: string;
    type: 'driver' | 'truck';
    onAvailabilityChange: (resourceId: string, date: string, hours: number) => void;
    isLoading?: boolean;
    clearLocalChanges?: boolean; // Trigger to clear local changes after save
};

export default function AvailabilityGrid({
    resources,
    weekStartDate,
    type,
    onAvailabilityChange,
    isLoading = false,
    clearLocalChanges = false
}: Props) {
    const t = useTranslations('planning.weekly.assignment.availabilityGrid');
    const [localChanges, setLocalChanges] = useState<Record<string, Record<string, string>>>({});

    // Clear local changes when parent component triggers it (after successful save)
    React.useEffect(() => {
        if (clearLocalChanges) {
            setLocalChanges({});
        }
    }, [clearLocalChanges]);

    // Generate the 7 days of the week
    const weekDates = React.useMemo(() => {
        const dates = [];
        const startDate = new Date(weekStartDate);
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            dates.push({
                date: date.toISOString().split('T')[0],
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                fullDayName: date.toLocaleDateString('en-US', { weekday: 'long' })
            });
        }
        return dates;
    }, [weekStartDate]);

    const getResourceId = (resource: Resource): string => {
        return type === 'driver' 
            ? (resource as DriverAvailability).driverId 
            : (resource as TruckAvailability).truckId;
    };

    const getResourceName = (resource: Resource): string => {
        return type === 'driver' 
            ? (resource as DriverAvailability).fullName 
            : (resource as TruckAvailability).licensePlate;
    };
    const resourceLabelPlural = t(`resourceType.${type}.plural`);
    const resourceLabelSingular = t(`resourceType.${type}.singular`);

    const getCurrentHours = (resource: Resource, date: string): number => {
        const resourceId = getResourceId(resource);
        
        // Check local changes first
        if (localChanges[resourceId]?.[date] !== undefined) {
            const localValue = parseFloat(localChanges[resourceId][date]);
            return isNaN(localValue) ? 8.0 : localValue;
        }
        
        // Fall back to resource data
        const dayAvailability = resource.availability[date];
        return dayAvailability ? dayAvailability.hours : 8.0;
    };

    const getDisplayValue = (resource: Resource, date: string): string => {
        const resourceId = getResourceId(resource);
        
        // Show local changes if they exist
        if (localChanges[resourceId]?.[date] !== undefined) {
            return localChanges[resourceId][date];
        }
        
        // Show actual hours
        return getCurrentHours(resource, date).toString();
    };

    const isCustom = (resource: Resource, date: string): boolean => {
        const dayAvailability = resource.availability[date];
        return dayAvailability ? dayAvailability.isCustom : false;
    };

    const handleHoursChange = useCallback((resourceId: string, date: string, value: string) => {
        setLocalChanges(prev => ({
            ...prev,
            [resourceId]: {
                ...prev[resourceId],
                [date]: value
            }
        }));
    }, []);

    const handleHoursBlur = useCallback((resourceId: string, date: string, value: string) => {
        const numValue = parseFloat(value);
        
        if (isNaN(numValue) || numValue < 0 || numValue > 24) {
            // Reset to current value if invalid
            setLocalChanges(prev => {
                const newChanges = { ...prev };
                if (newChanges[resourceId]) {
                    delete newChanges[resourceId][date];
                    if (Object.keys(newChanges[resourceId]).length === 0) {
                        delete newChanges[resourceId];
                    }
                }
                return newChanges;
            });
            return;
        }

        // Apply the change - but don't clear local changes immediately
        // The parent component will handle the state update
        onAvailabilityChange(resourceId, date, numValue);
    }, [onAvailabilityChange]);

    // Quick action handlers
    const handleSetAllWeek = (resourceId: string, hours: number) => {
        // Update local changes first for immediate visual feedback
        setLocalChanges(prev => ({
            ...prev,
            [resourceId]: weekDates.reduce((acc, { date }) => ({
                ...acc,
                [date]: hours.toString()
            }), prev[resourceId] || {})
        }));
        
        // Then notify parent
        weekDates.forEach(({ date }) => {
            onAvailabilityChange(resourceId, date, hours);
        });
    };

    const handleWeekdaysOnly = (resourceId: string, weekdayHours: number) => {
        // Update local changes first for immediate visual feedback
        const updates: Record<string, string> = {};
        weekDates.forEach(({ date }, index) => {
            // Monday = 0, Sunday = 6
            const isWeekend = index === 5 || index === 6; // Saturday or Sunday
            const hours = isWeekend ? 0 : weekdayHours;
            updates[date] = hours.toString();
        });
        
        setLocalChanges(prev => ({
            ...prev,
            [resourceId]: {
                ...prev[resourceId],
                ...updates
            }
        }));
        
        // Then notify parent
        weekDates.forEach(({ date }, index) => {
            const isWeekend = index === 5 || index === 6;
            onAvailabilityChange(resourceId, date, isWeekend ? 0 : weekdayHours);
        });
    };

    const handleWeekendOff = (resourceId: string) => {
        // Update local changes first for immediate visual feedback
        const updates: Record<string, string> = {};
        weekDates.forEach(({ date }, index) => {
            const isWeekend = index === 5 || index === 6; // Saturday or Sunday
            if (isWeekend) {
                updates[date] = '0';
            }
        });
        
        setLocalChanges(prev => ({
            ...prev,
            [resourceId]: {
                ...prev[resourceId],
                ...updates
            }
        }));
        
        // Then notify parent
        weekDates.forEach(({ date }, index) => {
            const isWeekend = index === 5 || index === 6;
            if (isWeekend) {
                onAvailabilityChange(resourceId, date, 0);
            }
        });
    };

    const handleResetAll = (resourceId: string) => {
        // Update local changes first for immediate visual feedback
        setLocalChanges(prev => ({
            ...prev,
            [resourceId]: weekDates.reduce((acc, { date }) => ({
                ...acc,
                [date]: '8'
            }), prev[resourceId] || {})
        }));
        
        // Then notify parent
        weekDates.forEach(({ date }) => {
            onAvailabilityChange(resourceId, date, 8.0);
        });
    };

    const getCellColor = (resource: Resource, date: string): string => {
        const hours = getCurrentHours(resource, date);
        const custom = isCustom(resource, date);
        
        if (hours === 0) return '#ffebee'; // Light red for unavailable
        if (hours > 8) return '#e8f5e8'; // Light green for overtime
        if (custom) return '#e3f2fd'; // Light blue for custom
        return '#f5f5f5'; // Light gray for default
    };

    const getCellBorderColor = (resource: Resource, date: string): string => {
        const hours = getCurrentHours(resource, date);
        const custom = isCustom(resource, date);
        
        if (hours === 0) return '#f44336'; // Red for unavailable
        if (hours > 8) return '#4caf50'; // Green for overtime
        if (custom) return '#2196f3'; // Blue for custom
        return '#e0e0e0'; // Gray for default
    };

    return (
        <Box>
            {/* Quick Actions */}
            <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ mr: 2 }}>
                    {t('quickActions.title', { resource: resourceLabelPlural })}
                </Typography>
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AccessTimeOutlined />}
                    onClick={() => {
                        // Apply to all resources
                        resources.forEach(resource => {
                            handleSetAllWeek(getResourceId(resource), 8);
                        });
                    }}
                >
                    {t('quickActions.setAll', { hours: 8 })}
                </Button>
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ContentCopyOutlined />}
                    onClick={() => {
                        resources.forEach(resource => {
                            handleWeekdaysOnly(getResourceId(resource), 8);
                        });
                    }}
                >
                    {t('quickActions.weekdays', { hours: 8 })}
                </Button>
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EventBusyOutlined />}
                    onClick={() => {
                        resources.forEach(resource => {
                            handleWeekendOff(getResourceId(resource));
                        });
                    }}
                >
                    {t('quickActions.weekend')}
                </Button>
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<RestoreOutlined />}
                    onClick={() => {
                        resources.forEach(resource => {
                            handleResetAll(getResourceId(resource));
                        });
                    }}
                >
                    {t('quickActions.reset')}
                </Button>
            </Box>

            {/* Availability Grid */}
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>
                                {t('headers.resource', { resource: resourceLabelSingular })}
                            </TableCell>
                            {weekDates.map(({ date, dayName, fullDayName }) => (
                                <TableCell key={date} align="center" sx={{ minWidth: 80, fontWeight: 'bold' }}>
                                    <Tooltip title={fullDayName}>
                                        <Box>
                                            <Typography variant="caption" display="block">
                                                {dayName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(date).getDate()}
                                            </Typography>
                                        </Box>
                                    </Tooltip>
                                </TableCell>
                            ))}
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                {t('headers.actions')}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {resources.map((resource) => {
                            const resourceId = getResourceId(resource);
                            const resourceName = getResourceName(resource);
                            
                            return (
                                <TableRow key={resourceId}>
                                    <TableCell sx={{ fontWeight: 'medium' }}>
                                        <Typography variant="body2">
                                            {resourceName}
                                        </Typography>
                                    </TableCell>
                                    {weekDates.map(({ date }) => (
                                        <TableCell key={date} align="center">
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={getDisplayValue(resource, date)}
                                                onChange={(e) => handleHoursChange(resourceId, date, e.target.value)}
                                                onBlur={(e) => handleHoursBlur(resourceId, date, e.target.value)}
                                                disabled={isLoading}
                                                inputProps={{
                                                    min: 0,
                                                    max: 24,
                                                    step: 0.5,
                                                    style: { textAlign: 'center' }
                                                }}
                                                sx={{
                                                    width: 70,
                                                    '& .MuiInputBase-root': {
                                                        backgroundColor: getCellColor(resource, date),
                                                        borderColor: getCellBorderColor(resource, date),
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                    ))}
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title={t('tooltips.setAll', { hours: 8 })}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleSetAllWeek(resourceId, 8)}
                                                    disabled={isLoading}
                                                >
                                                    <AccessTimeOutlined fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('tooltips.weekend')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleWeekendOff(resourceId)}
                                                    disabled={isLoading}
                                                >
                                                    <EventBusyOutlined fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('tooltips.reset')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleResetAll(resourceId)}
                                                    disabled={isLoading}
                                                >
                                                    <RestoreOutlined fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {resources.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                        No {type === 'driver' ? 'drivers' : 'trucks'} available
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
