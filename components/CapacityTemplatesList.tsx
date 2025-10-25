'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Button,
    CircularProgress,
    Alert,
    Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import AddIcon from '@mui/icons-material/AddRounded';
import { useCapacityTemplates, useDeleteCapacityTemplate, CapacityTemplate } from '@/hooks/useCapacityTemplates';
import { useAuth } from '@/hooks/useAuth';

type Props = {
    onCreateNew: () => void;
    onEdit: (template: CapacityTemplate) => void;
};

export default function CapacityTemplatesList({ onCreateNew, onEdit }: Props) {
    const { user } = useAuth();
    const { data: templates, isLoading, error } = useCapacityTemplates(user?.companyId);
    const { mutateAsync: deleteTemplate, isPending: isDeleting } = useDeleteCapacityTemplate();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string, clientName: string) => {
        if (window.confirm(`Are you sure you want to delete the capacity template for ${clientName}?`)) {
            try {
                setDeletingId(id);
                await deleteTemplate(id);
            } catch (error) {
                console.error('Failed to delete template:', error);
                alert('Failed to delete template. Please try again.');
            } finally {
                setDeletingId(null);
            }
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB');
    };

    const getTotalTrucks = (template: CapacityTemplate) => {
        return template.mondayTrucks + template.tuesdayTrucks + template.wednesdayTrucks +
               template.thursdayTrucks + template.fridayTrucks + template.saturdayTrucks + template.sundayTrucks;
    };

    const getWeeklyPattern = (template: CapacityTemplate) => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const trucks = [
            template.mondayTrucks, template.tuesdayTrucks, template.wednesdayTrucks,
            template.thursdayTrucks, template.fridayTrucks, template.saturdayTrucks, template.sundayTrucks
        ];
        
        return days
            .map((day, index) => trucks[index] > 0 ? `${day}: ${trucks[index]}` : null)
            .filter(Boolean)
            .join(', ');
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error">
                Failed to load capacity templates. Please try again.
            </Alert>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                    Capacity Templates ({templates?.length || 0})
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onCreateNew}
                >
                    Create Template
                </Button>
            </Box>

            {templates?.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                        No capacity templates found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        Create your first template to define recurring delivery patterns for clients.
                    </Typography>
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={onCreateNew}>
                        Create First Template
                    </Button>
                </Paper>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Client</TableCell>
                                <TableCell>Date Range</TableCell>
                                <TableCell>Weekly Pattern</TableCell>
                                <TableCell align="center">Total Trucks</TableCell>
                                <TableCell align="center">Status</TableCell>
                                <TableCell>Notes</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {templates?.map((template) => (
                                <TableRow key={template.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>
                                            {template.client.name}
                                        </Typography>
                                        {template.client.city && (
                                            <Typography variant="caption" color="text.secondary">
                                                {template.client.city}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {formatDate(template.startDate)} - {formatDate(template.endDate)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                                            {getWeeklyPattern(template)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip 
                                            label={getTotalTrucks(template)} 
                                            size="small" 
                                            color="primary" 
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={template.isActive ? 'Active' : 'Inactive'}
                                            size="small"
                                            color={template.isActive ? 'success' : 'default'}
                                            variant={template.isActive ? 'filled' : 'outlined'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ maxWidth: 150 }}>
                                            {template.notes || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title="Edit Template">
                                            <IconButton
                                                size="small"
                                                onClick={() => onEdit(template)}
                                                color="primary"
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete Template">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(template.id, template.client.name)}
                                                color="error"
                                                disabled={deletingId === template.id}
                                            >
                                                {deletingId === template.id ? (
                                                    <CircularProgress size={16} />
                                                ) : (
                                                    <DeleteIcon fontSize="small" />
                                                )}
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}
