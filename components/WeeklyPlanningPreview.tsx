'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Button,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import { CalendarToday, PlayArrow } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useWeeklyPreview, WeeklyPreviewClient, WeeklyPreviewDay } from '@/hooks/useWeeklyPreview';
import WeekSelector from './WeekSelector';
import ClientDayCell from './ClientDayCell';

type ModifiedCounts = {
    [clientId: string]: {
        [date: string]: number;
    };
};

export default function WeeklyPlanningPreview() {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [modifiedCounts, setModifiedCounts] = useState<ModifiedCounts>({});

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
        data: previewData, 
        isLoading, 
        isError, 
        error 
    } = useWeeklyPreview(weekStartDate, companyId);

    // Reset modifications when week changes
    useEffect(() => {
        setModifiedCounts({});
    }, [weekStartDate]);

    const handleTruckCountChange = (clientId: string, date: string, newCount: number) => {
        setModifiedCounts(prev => ({
            ...prev,
            [clientId]: {
                ...prev[clientId],
                [date]: newCount
            }
        }));
    };

    const getEffectiveTruckCount = (client: WeeklyPreviewClient, date: string): number => {
        return modifiedCounts[client.clientId]?.[date] ?? client.trucksNeeded;
    };

    const hasModifications = (): boolean => {
        return Object.keys(modifiedCounts).length > 0;
    };

    const getTotalTrucksForDay = (day: WeeklyPreviewDay): number => {
        return day.clients.reduce((total, client) => {
            return total + getEffectiveTruckCount(client, day.date);
        }, 0);
    };

    const getTotalTrucksForWeek = (): number => {
        if (!previewData) return 0;
        return previewData.days.reduce((total, day) => {
            return total + getTotalTrucksForDay(day);
        }, 0);
    };

    const handleGenerateRides = () => {
        // TODO: Implement ride generation in next step
        console.log('Generate rides with modifications:', modifiedCounts);
        alert('Ride generation will be implemented in the next step!');
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                Failed to load weekly preview: {error?.message}
            </Alert>
        );
    }

    if (!previewData) {
        return (
            <Alert severity="info" sx={{ mt: 2 }}>
                No preview data available
            </Alert>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday />
                    Weekly Planning Preview
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Review and adjust truck allocation before generating rides
                </Typography>
            </Box>

            {/* Week Selector */}
            <WeekSelector 
                selectedDate={selectedDate} 
                onDateChange={setSelectedDate} 
            />

            {/* Summary */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Week Summary
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 4 }}>
                        <Typography>
                            <strong>Total Trucks:</strong> {getTotalTrucksForWeek()}
                        </Typography>
                        <Typography>
                            <strong>Active Days:</strong> {previewData.days.filter(day => day.clients.length > 0).length}
                        </Typography>
                        <Typography>
                            <strong>Total Clients:</strong> {
                                new Set(
                                    previewData.days.flatMap(day => 
                                        day.clients.map(client => client.clientId)
                                    )
                                ).size
                            }
                        </Typography>
                    </Box>
                    {hasModifications() && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            You have made modifications to the template-based allocation. 
                            Review your changes before generating rides.
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Weekly Grid */}
            <Grid container spacing={2}>
                {previewData.days.map((day) => (
                    <Grid item xs={12} md={6} lg={1.71} key={day.date}>
                        <Paper 
                            sx={{ 
                                p: 2, 
                                minHeight: 300,
                                backgroundColor: day.clients.length === 0 ? 'grey.50' : 'background.paper'
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
                                    {getTotalTrucksForDay(day)} truck{getTotalTrucksForDay(day) !== 1 ? 's' : ''}
                                </Typography>
                            </Box>

                            {/* Clients for this day */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {day.clients.length === 0 ? (
                                    <Typography 
                                        variant="body2" 
                                        color="text.secondary" 
                                        sx={{ textAlign: 'center', fontStyle: 'italic', mt: 2 }}
                                    >
                                        No trucks scheduled
                                    </Typography>
                                ) : (
                                    day.clients.map((client) => {
                                        const effectiveCount = getEffectiveTruckCount(client, day.date);
                                        if (effectiveCount === 0) return null;
                                        
                                        return (
                                            <ClientDayCell
                                                key={`${client.clientId}-${day.date}`}
                                                client={{
                                                    ...client,
                                                    trucksNeeded: effectiveCount
                                                }}
                                                dayName={day.dayName}
                                                onTruckCountChange={(clientId, newCount) => 
                                                    handleTruckCountChange(clientId, day.date, newCount)
                                                }
                                            />
                                        );
                                    })
                                )}
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Generate Rides Button */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<PlayArrow />}
                    onClick={handleGenerateRides}
                    disabled={getTotalTrucksForWeek() === 0}
                    sx={{ px: 4, py: 1.5 }}
                >
                    Generate Rides for This Week
                </Button>
            </Box>

            {getTotalTrucksForWeek() === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    No trucks are scheduled for this week. Create capacity templates in Long-Term Planning to see truck allocation here.
                </Alert>
            )}
        </Box>
    );
}
