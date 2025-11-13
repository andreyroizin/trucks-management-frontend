'use client';

import React, { useMemo, useState } from 'react';
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
import { useTranslations } from 'next-intl';

type Props = {
    onCreateNew: () => void;
    onEdit: (template: CapacityTemplate) => void;
};

export default function CapacityTemplatesList({ onCreateNew, onEdit }: Props) {
    const { user } = useAuth();
    const t = useTranslations('planning.longTerm.list');
    const { data: templates, isLoading, error } = useCapacityTemplates(user?.companyId);
    const { mutateAsync: deleteTemplate, isPending: isDeleting } = useDeleteCapacityTemplate();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string, clientName: string) => {
        if (window.confirm(t('confirmDelete', { clientName }))) {
            try {
                setDeletingId(id);
                await deleteTemplate(id);
            } catch (error) {
                console.error('Failed to delete template:', error);
                alert(t('errors.deleteFailed'));
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

    const dayLabels = useMemo(
        () => [
            t('days.short.mon'),
            t('days.short.tue'),
            t('days.short.wed'),
            t('days.short.thu'),
            t('days.short.fri'),
            t('days.short.sat'),
            t('days.short.sun'),
        ],
        [t]
    );

    const getWeeklyPattern = (template: CapacityTemplate) => {
        const trucks = [
            template.mondayTrucks, template.tuesdayTrucks, template.wednesdayTrucks,
            template.thursdayTrucks, template.fridayTrucks, template.saturdayTrucks, template.sundayTrucks
        ];
        
        return dayLabels
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
                {t('errors.loadFailed')}
            </Alert>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                    {t('title', { count: templates?.length || 0 })}
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onCreateNew}
                >
                    {t('actions.create')}
                </Button>
            </Box>

            {templates?.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                        {t('empty.title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        {t('empty.description')}
                    </Typography>
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={onCreateNew}>
                        {t('empty.button')}
                    </Button>
                </Paper>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('table.headers.client')}</TableCell>
                                <TableCell>{t('table.headers.dateRange')}</TableCell>
                                <TableCell>{t('table.headers.weeklyPattern')}</TableCell>
                                <TableCell align="center">{t('table.headers.totalTrucks')}</TableCell>
                                <TableCell align="center">{t('table.headers.status')}</TableCell>
                                <TableCell>{t('table.headers.notes')}</TableCell>
                                <TableCell align="center">{t('table.headers.actions')}</TableCell>
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
                                            label={template.isActive ? t('status.active') : t('status.inactive')}
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
                                        <Tooltip title={t('actions.edit')}>
                                            <IconButton
                                                size="small"
                                                onClick={() => onEdit(template)}
                                                color="primary"
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={t('actions.delete')}>
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
