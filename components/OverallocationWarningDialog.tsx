import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Alert,
    Chip
} from '@mui/material';
import { Warning, Person, LocalShipping, Schedule } from '@mui/icons-material';
import { ConflictWarning } from '@/utils/conflictDetection';

type Props = {
    open: boolean;
    onClose: () => void;
    onAssignAnyway: () => void;
    conflict: ConflictWarning | null;
    isLoading?: boolean;
};

export default function OverallocationWarningDialog({ 
    open, 
    onClose, 
    onAssignAnyway, 
    conflict,
    isLoading = false 
}: Props) {
    if (!conflict) return null;

    const isDriver = conflict.type === 'driver';
    const resourceIcon = isDriver ? <Person /> : <LocalShipping />;
    const resourceType = isDriver ? 'Driver' : 'Truck';
    const resourceLabel = isDriver ? conflict.resourceName : `Truck ${conflict.resourceName}`;

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm" 
            fullWidth
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="warning" />
                Resource Overallocation Warning
            </DialogTitle>
            
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            This assignment would exceed the recommended 8-hour daily limit for this resource.
                        </Typography>
                    </Alert>

                    {/* Resource Info */}
                    <Box sx={{ 
                        p: 2, 
                        backgroundColor: 'grey.50', 
                        borderRadius: 1, 
                        border: '1px solid',
                        borderColor: 'grey.200'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            {resourceIcon}
                            <Typography variant="h6">
                                {resourceLabel}
                            </Typography>
                            <Chip 
                                label={conflict.dayName} 
                                size="small" 
                                color="primary" 
                                variant="outlined" 
                            />
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Schedule fontSize="small" color="action" />
                                <Typography variant="body2">
                                    Current scheduled hours: <strong>{conflict.currentHours}h</strong>
                                </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Schedule fontSize="small" color="primary" />
                                <Typography variant="body2">
                                    New assignment hours: <strong>{conflict.newHours}h</strong>
                                </Typography>
                            </Box>
                            
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1,
                                pt: 1,
                                borderTop: '1px solid',
                                borderColor: 'grey.300'
                            }}>
                                <Schedule fontSize="small" color="warning" />
                                <Typography variant="body2" color="warning.main">
                                    <strong>Total hours would be: {conflict.totalHours}h</strong>
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Explanation */}
                    <Typography variant="body2" color="text.secondary">
                        The recommended daily limit is 8 hours per {resourceType.toLowerCase()}. 
                        You can still proceed with this assignment if needed, but please consider 
                        the workload implications.
                    </Typography>
                </Box>
            </DialogContent>
            
            <DialogActions>
                <Button 
                    onClick={onClose} 
                    disabled={isLoading}
                    color="inherit"
                >
                    Cancel
                </Button>
                <Button 
                    onClick={onAssignAnyway} 
                    variant="contained" 
                    color="warning"
                    disabled={isLoading}
                >
                    {isLoading ? 'Assigning...' : 'Assign Anyway'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
