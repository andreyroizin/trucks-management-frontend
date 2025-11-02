import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    CircularProgress,
    Grid
} from '@mui/material';
import { Edit, Schedule, LocationOn, Notes } from '@mui/icons-material';
import { WeeklyRide } from '@/hooks/useWeeklyRides';
import { useUpdateRideDetails, RideDetailsUpdatePayload } from '@/hooks/useRideDetails';

type Props = {
    open: boolean;
    onClose: () => void;
    ride: WeeklyRide | null;
    clientName: string;
};

export default function RideDetailsDialog({ open, onClose, ride, clientName }: Props) {
    const [formData, setFormData] = useState<RideDetailsUpdatePayload>({
        routeFromName: '',
        routeToName: '',
        notes: '',
        plannedStartTime: '',
        plannedEndTime: ''
    });

    const updateRideDetailsMutation = useUpdateRideDetails();

    // Initialize form data when ride changes
    useEffect(() => {
        if (ride) {
            setFormData({
                routeFromName: ride.routeFromName || '',
                routeToName: ride.routeToName || '',
                notes: ride.notes || '',
                plannedStartTime: ride.plannedStartTime || '',
                plannedEndTime: ride.plannedEndTime || ''
            });
        }
    }, [ride]);

    const handleInputChange = (field: keyof RideDetailsUpdatePayload) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = event.target.value;
        setFormData(prev => ({
            ...prev,
            [field]: value === '' ? null : value
        }));
    };

    const handleSave = async () => {
        if (!ride) return;

        // Convert empty strings to null for API (backend expects null, not empty strings)
        const apiData = {
            routeFromName: formData.routeFromName === '' ? null : formData.routeFromName,
            routeToName: formData.routeToName === '' ? null : formData.routeToName,
            notes: formData.notes === '' ? null : formData.notes,
            plannedStartTime: formData.plannedStartTime === '' ? null : formData.plannedStartTime,
            plannedEndTime: formData.plannedEndTime === '' ? null : formData.plannedEndTime
        };

        console.log('Saving ride details with data:', apiData);

        try {
            await updateRideDetailsMutation.mutateAsync({
                rideId: ride.id,
                data: apiData
            });
            console.log('Ride details saved successfully');
            onClose();
        } catch (error) {
            console.error('Failed to save ride details:', error);
        }
    };

    const handleClose = () => {
        if (!updateRideDetailsMutation.isPending) {
            onClose();
        }
    };

    // Format time for display (HH:mm:ss to HH:mm)
    const formatTimeForInput = (time: string | null | undefined) => {
        if (!time) return '';
        // Convert HH:mm:ss to HH:mm for input[type="time"]
        return time.substring(0, 5);
    };

    // Format time for API (HH:mm to HH:mm:ss)
    const formatTimeForAPI = (time: string) => {
        if (!time) return null;
        // Add seconds if not present
        return time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
    };

    const handleTimeChange = (field: 'plannedStartTime' | 'plannedEndTime') => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = event.target.value;
        const formattedValue = value === '' ? null : formatTimeForAPI(value);
        console.log(`Time change for ${field}:`, { originalValue: value, formattedValue });
        
        setFormData(prev => ({
            ...prev,
            [field]: formattedValue
        }));
    };

    if (!ride) return null;

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="md" 
            fullWidth
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Edit />
                Additional Ride Details
            </DialogTitle>
            
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Edit route information, timing, and notes for this ride to <strong>{clientName}</strong>.
                    </Typography>

                    <Grid container spacing={3}>
                        {/* Route Information */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocationOn fontSize="small" />
                                Route Information
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="From Location"
                                value={formData.routeFromName || ''}
                                onChange={handleInputChange('routeFromName')}
                                placeholder="e.g., Main Warehouse"
                                variant="outlined"
                                inputProps={{ maxLength: 255 }}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="To Location"
                                value={formData.routeToName || ''}
                                onChange={handleInputChange('routeToName')}
                                placeholder="e.g., Client Office"
                                variant="outlined"
                                inputProps={{ maxLength: 255 }}
                            />
                        </Grid>

                        {/* Timing Information */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                                <Schedule fontSize="small" />
                                Planned Timing
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Start Time"
                                type="time"
                                value={formatTimeForInput(formData.plannedStartTime)}
                                onChange={handleTimeChange('plannedStartTime')}
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="End Time"
                                type="time"
                                value={formatTimeForInput(formData.plannedEndTime)}
                                onChange={handleTimeChange('plannedEndTime')}
                                variant="outlined"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        {/* Notes */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                                <Notes fontSize="small" />
                                Additional Notes
                            </Typography>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Notes"
                                value={formData.notes || ''}
                                onChange={handleInputChange('notes')}
                                placeholder="Special instructions, delivery notes, etc."
                                variant="outlined"
                                multiline
                                rows={3}
                                inputProps={{ maxLength: 1000 }}
                                helperText={`${(formData.notes || '').length}/1000 characters`}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            
            <DialogActions>
                <Button 
                    onClick={handleClose} 
                    disabled={updateRideDetailsMutation.isPending}
                    color="inherit"
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleSave} 
                    variant="contained" 
                    disabled={updateRideDetailsMutation.isPending}
                    startIcon={updateRideDetailsMutation.isPending ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {updateRideDetailsMutation.isPending ? 'Saving...' : 'Save Details'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
