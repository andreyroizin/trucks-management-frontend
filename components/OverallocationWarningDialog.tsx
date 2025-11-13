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
import { useTranslations } from 'next-intl';

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
    const t = useTranslations('planning.weekly.assignment.overallocation');
    if (!conflict) return null;

    const isDriver = conflict.type === 'driver';
    const resourceIcon = isDriver ? <Person /> : <LocalShipping />;
    const resourceType = isDriver ? t('resourceTypes.driver') : t('resourceTypes.truck');
    const resourceLabel = isDriver
        ? conflict.resourceName
        : t('resourceLabel.truck', { name: conflict.resourceName });

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm" 
            fullWidth
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="warning" />
                {t('title')}
            </DialogTitle>
            
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            {t('warning', { hours: conflict.availableHours, type: resourceType.toLowerCase() })}
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
                                {t.rich('details.currentHours', {
                                    hours: conflict.currentHours,
                                    strong: (chunks) => <strong>{chunks}</strong>,
                                })}
                                </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Schedule fontSize="small" color="primary" />
                                <Typography variant="body2">
                                {t.rich('details.newHours', {
                                    hours: conflict.newHours,
                                    strong: (chunks) => <strong>{chunks}</strong>,
                                })}
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
                                <Schedule fontSize="small" color="info" />
                                <Typography variant="body2" color="info.main">
                                    {t.rich('details.availableHours', {
                                        hours: conflict.availableHours,
                                        strong: (chunks) => <strong>{chunks}</strong>,
                                    })}
                                </Typography>
                            </Box>
                            
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1,
                                pt: 1
                            }}>
                                <Schedule fontSize="small" color="warning" />
                                <Typography variant="body2" color="warning.main">
                                    <strong>
                                        {t('details.totalHours', {
                                            total: conflict.totalHours,
                                            exceeded: (conflict.totalHours - conflict.availableHours).toFixed(1),
                                        })}
                                    </strong>
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Explanation */}
                    <Typography variant="body2" color="text.secondary">
                        {t('explanation', {
                            hours: conflict.availableHours,
                            type: resourceType.toLowerCase(),
                        })}
                    </Typography>
                </Box>
            </DialogContent>
            
            <DialogActions>
                <Button 
                    onClick={onClose} 
                    disabled={isLoading}
                    color="inherit"
                >
                    {t('buttons.cancel')}
                </Button>
                <Button 
                    onClick={onAssignAnyway} 
                    variant="contained" 
                    color="warning"
                    disabled={isLoading}
                >
                    {isLoading ? t('buttons.assigning') : t('buttons.assignAnyway')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
