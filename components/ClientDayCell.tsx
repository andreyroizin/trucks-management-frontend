'use client';

import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    TextField, 
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';
import { Edit, Check, Close, Info, Delete } from '@mui/icons-material';
import { WeeklyPreviewClient } from '@/hooks/useWeeklyPreview';

type Props = {
    client: WeeklyPreviewClient;
    dayName: string;
    onTruckCountChange: (clientId: string, newCount: number) => void;
    onDelete?: (clientId: string) => void;
    isEditable?: boolean;
    isDeletable?: boolean;
};

export default function ClientDayCell({ 
    client, 
    dayName, 
    onTruckCountChange,
    onDelete,
    isEditable = true,
    isDeletable = false
}: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(client.trucksNeeded.toString());
    const [currentCount, setCurrentCount] = useState(client.trucksNeeded);

    // Update local state when client data changes
    useEffect(() => {
        setCurrentCount(client.trucksNeeded);
        setEditValue(client.trucksNeeded.toString());
    }, [client.trucksNeeded]);

    const handleStartEdit = () => {
        setIsEditing(true);
        setEditValue(currentCount.toString());
    };

    const handleSaveEdit = () => {
        const newCount = parseInt(editValue) || 0;
        if (newCount !== currentCount) {
            setCurrentCount(newCount);
            onTruckCountChange(client.clientId, newCount);
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditValue(currentCount.toString());
        setIsEditing(false);
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            handleSaveEdit();
        } else if (event.key === 'Escape') {
            handleCancelEdit();
        }
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete(client.clientId);
        }
    };

    const isModified = currentCount !== client.trucksNeeded;

    if (currentCount === 0) {
        return null; // Don't render cells with 0 trucks
    }

    return (
        <Box
            sx={{
                p: 1,
                mb: 1,
                border: '1px solid',
                borderColor: isModified ? 'warning.main' : 'divider',
                borderRadius: 1,
                backgroundColor: isModified ? 'warning.light' : 'background.paper',
                minHeight: 60,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}
        >
            {/* Header with Client Name and Delete Button */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Typography variant="body2" fontWeight="medium" noWrap sx={{ flexGrow: 1 }}>
                    {client.clientName}
                </Typography>
                {isDeletable && (
                    <IconButton 
                        size="small" 
                        onClick={handleDelete}
                        sx={{ 
                            ml: 0.5, 
                            p: 0.25,
                            color: 'error.main',
                            '&:hover': {
                                backgroundColor: 'error.light'
                            }
                        }}
                    >
                        <Delete fontSize="small" />
                    </IconButton>
                )}
            </Box>

            {/* Truck Count */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                {isEditing ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TextField
                            size="small"
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            inputProps={{ min: 0, style: { width: 50, textAlign: 'center' } }}
                            autoFocus
                        />
                        <IconButton size="small" onClick={handleSaveEdit} color="primary">
                            <Check fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={handleCancelEdit}>
                            <Close fontSize="small" />
                        </IconButton>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip
                            label={`${currentCount} truck${currentCount !== 1 ? 's' : ''}`}
                            size="small"
                            color={isModified ? 'warning' : 'primary'}
                            variant={isModified ? 'filled' : 'outlined'}
                        />
                        {isEditable && (
                            <IconButton size="small" onClick={handleStartEdit}>
                                <Edit fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                )}
            </Box>

            {/* Template Info */}
            {client.sourceTemplates.length > 0 && (
                <Box sx={{ mt: 0.5 }}>
                    <Tooltip 
                        title={`From ${client.sourceTemplates.length} template${client.sourceTemplates.length !== 1 ? 's' : ''}`}
                        arrow
                    >
                        <Info fontSize="small" color="action" sx={{ cursor: 'help' }} />
                    </Tooltip>
                </Box>
            )}

            {/* Modified Indicator */}
            {isModified && (
                <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
                    Modified from {client.trucksNeeded}
                </Typography>
            )}
        </Box>
    );
}
