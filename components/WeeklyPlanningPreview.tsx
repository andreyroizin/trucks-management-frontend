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
    Divider,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Autocomplete
} from '@mui/material';
import { CalendarToday, PlayArrow, Add } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useWeeklyPreview, WeeklyPreviewClient, WeeklyPreviewDay } from '@/hooks/useWeeklyPreview';
import { useWeeklyRides } from '@/hooks/useWeeklyRides';
import { useClients } from '@/hooks/useClients';
import { useGenerateRides, GenerateRidesInput } from '@/hooks/useGenerateRides';
import WeekSelector from './WeekSelector';
import ClientDayCell from './ClientDayCell';
import WeeklyAssignmentGrid from './WeeklyAssignmentGrid';

type ModifiedCounts = {
    [clientId: string]: {
        [date: string]: number;
    };
};

export default function WeeklyPlanningPreview() {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [modifiedCounts, setModifiedCounts] = useState<ModifiedCounts>({});
    
    // Add ride dialog state
    const [addRideDialog, setAddRideDialog] = useState<{
        open: boolean;
        date: string;
        dayName: string;
    }>({
        open: false,
        date: '',
        dayName: ''
    });
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [truckCount, setTruckCount] = useState<number>(1);
    
    // Generation confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        totalRides: number;
        summary: string;
    }>({
        open: false,
        totalRides: 0,
        summary: ''
    });

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

    // Check if rides exist for this week (to decide between planning vs assignment view)
    const { 
        data: ridesData, 
        isLoading: isLoadingRides,
        isError: isRidesError 
    } = useWeeklyRides(weekStartDate, companyId);

    // Fetch clients for the add ride dialog
    const { data: clientsData } = useClients(1, 1000);
    
    // Generate rides mutation
    const { mutateAsync: generateRides, isPending: isGenerating } = useGenerateRides();

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
        // Get trucks from template clients
        const templateTrucks = day.clients.reduce((total, client) => {
            return total + getEffectiveTruckCount(client, day.date);
        }, 0);

        // Get trucks from manually added clients (not in template)
        const manualTrucks = Object.entries(modifiedCounts).reduce((total, [clientId, dates]) => {
            const trucksForThisDate = dates[day.date] || 0;
            const isClientInTemplate = day.clients.some(client => client.clientId === clientId);
            return total + (isClientInTemplate ? 0 : trucksForThisDate);
        }, 0);

        return templateTrucks + manualTrucks;
    };

    const getManuallyAddedClients = (day: WeeklyPreviewDay) => {
        const manualClients: Array<{ clientId: string; clientName: string; trucksNeeded: number }> = [];
        
        Object.entries(modifiedCounts).forEach(([clientId, dates]) => {
            const trucksForThisDate = dates[day.date] || 0;
            const isClientInTemplate = day.clients.some(client => client.clientId === clientId);
            
            if (!isClientInTemplate && trucksForThisDate > 0) {
                const client = clientsData?.data.find(c => c.id === clientId);
                if (client) {
                    manualClients.push({
                        clientId,
                        clientName: client.name,
                        trucksNeeded: trucksForThisDate
                    });
                }
            }
        });
        
        return manualClients;
    };

    const getAvailableClientsForDate = (date: string) => {
        if (!clientsData?.data) return [];
        
        // Get all clients that are already used for this date
        const usedClientIds = new Set<string>();
        
        // Add template clients that have trucks > 0
        const dayData = previewData?.days.find(day => day.date === date);
        dayData?.clients.forEach(client => {
            if (getEffectiveTruckCount(client, date) > 0) {
                usedClientIds.add(client.clientId);
            }
        });
        
        // Add manually added clients
        Object.entries(modifiedCounts).forEach(([clientId, dates]) => {
            if ((dates[date] || 0) > 0) {
                usedClientIds.add(clientId);
            }
        });
        
        // Return only clients that are not used
        return clientsData.data.filter(client => !usedClientIds.has(client.id));
    };

    const getTotalTrucksForWeek = (): number => {
        if (!previewData) return 0;
        return previewData.days.reduce((total, day) => {
            return total + getTotalTrucksForDay(day);
        }, 0);
    };

    const handleGenerateRides = () => {
        if (!previewData) return;
        
        // Calculate total rides and create summary
        let totalRides = 0;
        const clientSummary: { [clientName: string]: number } = {};
        
        previewData.days.forEach(day => {
            // Template-based clients
            day.clients.forEach(client => {
                const effectiveCount = getEffectiveTruckCount(client, day.date);
                if (effectiveCount > 0) {
                    totalRides += effectiveCount;
                    clientSummary[client.clientName] = (clientSummary[client.clientName] || 0) + effectiveCount;
                }
            });
            
            // Manually added clients
            getManuallyAddedClients(day).forEach(client => {
                totalRides += client.trucksNeeded;
                clientSummary[client.clientName] = (clientSummary[client.clientName] || 0) + client.trucksNeeded;
            });
        });
        
        // Create summary text
        const summaryLines = Object.entries(clientSummary).map(([clientName, count]) => 
            `${clientName}: ${count} ride${count !== 1 ? 's' : ''}`
        );
        const summary = summaryLines.join('\n');
        
        // Show confirmation dialog
        setConfirmDialog({
            open: true,
            totalRides,
            summary
        });
    };

    const handleAddRideClick = (date: string, dayName: string) => {
        setAddRideDialog({
            open: true,
            date,
            dayName
        });
        setSelectedClient(null);
        setTruckCount(1);
    };

    const handleAddRideClose = () => {
        setAddRideDialog({
            open: false,
            date: '',
            dayName: ''
        });
        setSelectedClient(null);
        setTruckCount(1);
    };

    const handleAddRideConfirm = () => {
        if (selectedClient && truckCount > 0) {
            // Add the new ride to modified counts
            handleTruckCountChange(selectedClient.id, addRideDialog.date, truckCount);
            handleAddRideClose();
        }
    };

    const handleDeleteClient = (clientId: string, date: string) => {
        // Set the truck count to 0 to effectively delete the client for this date
        handleTruckCountChange(clientId, date, 0);
    };

    const handleConfirmGeneration = async () => {
        if (!previewData) return;
        
        try {
            // Transform preview data to generation API format
            const generationInput: GenerateRidesInput = {
                weekStartDate: weekStartDate,
                companyId: companyId,
                days: previewData.days
                    .map(day => {
                        const clients: { clientId: string; trucksToGenerate: number }[] = [];
                        
                        // Add template-based clients
                        day.clients.forEach(client => {
                            const effectiveCount = getEffectiveTruckCount(client, day.date);
                            if (effectiveCount > 0) {
                                clients.push({
                                    clientId: client.clientId,
                                    trucksToGenerate: effectiveCount
                                });
                            }
                        });
                        
                        // Add manually added clients
                        getManuallyAddedClients(day).forEach(client => {
                            if (client.trucksNeeded > 0) {
                                clients.push({
                                    clientId: client.clientId,
                                    trucksToGenerate: client.trucksNeeded
                                });
                            }
                        });
                        
                        return {
                            date: day.date.split('T')[0], // Convert to YYYY-MM-DD
                            clients
                        };
                    })
                    .filter(day => day.clients.length > 0) // Only include days with clients
            };
            
            console.log('Generating rides with input:', generationInput);
            
            const result = await generateRides(generationInput);
            
            // Close confirmation dialog
            setConfirmDialog({ open: false, totalRides: 0, summary: '' });
            
            // Reset modifications since rides are now generated
            setModifiedCounts({});
            
            // Show success message
            alert(`Success! ${result.totalRidesCreated} rides created for the week of ${new Date(weekStartDate).toLocaleDateString()}. Switching to assignment view...`);
            
            // The component will automatically switch to assignment view on next render
            // because hasRidesForWeek() will now return true
            
        } catch (error: any) {
            console.error('Failed to generate rides:', error);
            alert(`Failed to generate rides: ${error.message}`);
        }
    };

    const handleCancelGeneration = () => {
        setConfirmDialog({ open: false, totalRides: 0, summary: '' });
    };

    // Determine if rides exist for this week
    const hasRidesForWeek = () => {
        if (!ridesData || isLoadingRides) return false;
        return ridesData.days.some(day => 
            day.clients.some(client => client.rides.length > 0)
        );
    };

    // If rides exist, show assignment grid; otherwise show planning grid
    if (hasRidesForWeek()) {
        return (
            <WeeklyAssignmentGrid 
                selectedDate={selectedDate} 
                onDateChange={setSelectedDate} 
            />
        );
    }

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
                    Review and adjust truck allocation before planning rides
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6">
                            Week Summary
                        </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                                onClick={handleGenerateRides}
                                disabled={getTotalTrucksForWeek() === 0 || isGenerating}
                                sx={{ px: 3, py: 1 }}
                            >
                                {isGenerating ? 'Planning Rides...' : 'Plan Rides for This Week'}
                            </Button>
                    </Box>
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
                                Review your changes before planning rides.
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
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
                                {/* Template-based clients */}
                                {day.clients.map((client) => {
                                    const effectiveCount = getEffectiveTruckCount(client, day.date);
                                    if (effectiveCount === 0) return null;
                                    
                                    // Template clients are deletable if they have been modified (set to 0 to delete)
                                    const isModified = modifiedCounts[client.clientId]?.[day.date] !== undefined;
                                    
                                    return (
                                        <ClientDayCell
                                            key={`template-${client.clientId}-${day.date}`}
                                            client={{
                                                ...client,
                                                trucksNeeded: effectiveCount
                                            }}
                                            dayName={day.dayName}
                                            onTruckCountChange={(clientId, newCount) => 
                                                handleTruckCountChange(clientId, day.date, newCount)
                                            }
                                            onDelete={(clientId) => handleDeleteClient(clientId, day.date)}
                                            isDeletable={true} // All clients can be deleted by setting count to 0
                                        />
                                    );
                                })}

                                {/* Manually added clients */}
                                {getManuallyAddedClients(day).map((client) => (
                                    <ClientDayCell
                                        key={`manual-${client.clientId}-${day.date}`}
                                        client={{
                                            clientId: client.clientId,
                                            clientName: client.clientName,
                                            trucksNeeded: client.trucksNeeded,
                                            sourceTemplates: []
                                        }}
                                        dayName={day.dayName}
                                        onTruckCountChange={(clientId, newCount) => 
                                            handleTruckCountChange(clientId, day.date, newCount)
                                        }
                                        onDelete={(clientId) => handleDeleteClient(clientId, day.date)}
                                        isDeletable={true} // Manually added clients are always deletable
                                    />
                                ))}

                                {/* Show message if no clients */}
                                {day.clients.length === 0 && getManuallyAddedClients(day).length === 0 && (
                                    <Typography 
                                        variant="body2" 
                                        color="text.secondary" 
                                        sx={{ textAlign: 'center', fontStyle: 'italic', mt: 2 }}
                                    >
                                        No trucks scheduled
                                    </Typography>
                                )}
                            </Box>

                            {/* Add ride button - only show if there are available clients */}
                            {getAvailableClientsForDate(day.date).length > 0 && (
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleAddRideClick(day.date, day.dayName)}
                                        sx={{ 
                                            border: '1px dashed',
                                            borderColor: 'primary.main',
                                            color: 'primary.main',
                                            '&:hover': {
                                                backgroundColor: 'primary.light',
                                                borderColor: 'primary.dark'
                                            }
                                        }}
                                    >
                                        <Add fontSize="small" />
                                    </IconButton>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                ))}
            </Grid>


            {getTotalTrucksForWeek() === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    No trucks are scheduled for this week. Create capacity templates in Long-Term Planning to see truck allocation here.
                </Alert>
            )}

            {/* Add Ride Dialog */}
            <Dialog open={addRideDialog.open} onClose={handleAddRideClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Add Ride for {addRideDialog.dayName}
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            Add a manual ride for {new Date(addRideDialog.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </Typography>
                        
                        <Autocomplete
                            options={getAvailableClientsForDate(addRideDialog.date)}
                            getOptionLabel={(option) => option.name}
                            value={selectedClient}
                            onChange={(_, newValue) => setSelectedClient(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Select Client"
                                    required
                                    helperText="Choose from available clients (not yet scheduled for this day)"
                                />
                            )}
                        />
                        
                            <TextField
                                label="Number of Trucks"
                                value={truckCount === 0 ? '' : truckCount.toString()}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Allow empty string while typing
                                    if (value === '') {
                                        setTruckCount(0); // Use 0 internally to represent empty
                                    } else {
                                        const numValue = parseInt(value);
                                        if (!isNaN(numValue) && numValue > 0) {
                                            setTruckCount(numValue);
                                        }
                                    }
                                }}
                                onBlur={(e) => {
                                    // Ensure minimum value of 1 when field loses focus
                                    if (truckCount === 0) {
                                        setTruckCount(1);
                                    }
                                }}
                                required
                                helperText="How many trucks are needed for this client"
                                inputProps={{
                                    inputMode: 'numeric',
                                    pattern: '[0-9]*'
                                }}
                            />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleAddRideClose} color="secondary">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleAddRideConfirm} 
                        variant="contained" 
                        disabled={!selectedClient || truckCount < 1}
                    >
                        Add Rides
                    </Button>
                    </DialogActions>
                </Dialog>

                {/* Confirmation Dialog for Ride Generation */}
                <Dialog open={confirmDialog.open} onClose={handleCancelGeneration} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        Confirm Ride Generation
                    </DialogTitle>
                    <DialogContent sx={{ pt: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="body1">
                                This will create <strong>{confirmDialog.totalRides} rides</strong> for the week of{' '}
                                <strong>{new Date(weekStartDate).toLocaleDateString()}</strong>.
                            </Typography>
                            
                            {confirmDialog.summary && (
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Breakdown by client:
                                    </Typography>
                                    <Box sx={{ 
                                        bgcolor: 'grey.50', 
                                        p: 2, 
                                        borderRadius: 1,
                                        fontFamily: 'monospace',
                                        whiteSpace: 'pre-line'
                                    }}>
                                        {confirmDialog.summary}
                                    </Box>
                                </Box>
                            )}
                            
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCancelGeneration} color="secondary">
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleConfirmGeneration} 
                            variant="contained" 
                            disabled={isGenerating}
                            startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : undefined}
                        >
                            {isGenerating ? 'Creating Rides...' : `Create ${confirmDialog.totalRides} Rides`}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    }
