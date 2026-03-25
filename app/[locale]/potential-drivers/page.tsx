'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
    Box, Typography, Button, CircularProgress, Alert, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, Tooltip, TextField, MenuItem, Select,
    FormControl, InputLabel, TablePagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAuth } from '@/hooks/useAuth';
import { usePotentialDrivers } from '@/hooks/usePotentialDrivers';
import { useDeletePotentialDriver } from '@/hooks/useDeletePotentialDriver';
import { useFeatureModules } from '@/providers/FeatureModuleProvider';
import { PotentialDriverStatus } from '@/types/potentialDriver';
import ConfirmModal from '@/components/ConfirmModal';

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'warning' | 'success' | 'error' | 'info' | 'secondary'> = {
    New: 'default',
    Contacted: 'primary',
    Interviewing: 'warning',
    OfferMade: 'secondary',
    Accepted: 'success',
    Rejected: 'error',
    Converted: 'info',
};

const ALL_STATUSES: PotentialDriverStatus[] = [
    'New', 'Contacted', 'Interviewing', 'OfferMade', 'Accepted', 'Rejected', 'Converted',
];

export default function PotentialDriversPage() {
    const router = useRouter();
    const t = useTranslations();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { isModuleEnabled } = useFeatureModules();

    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const isGlobalAdmin = user?.roles?.includes('globalAdmin');
    const isCustomerAdmin = user?.roles?.includes('customerAdmin');
    const hasAccess = isGlobalAdmin || isCustomerAdmin;

    const { data, isLoading, isError } = usePotentialDrivers(
        page + 1, pageSize, statusFilter || undefined, search || undefined,
    );

    const { mutateAsync: deleteMutation, isPending: isDeleting } = useDeletePotentialDriver();

    if (authLoading) return <CircularProgress sx={{ m: 4 }} />;
    if (!isAuthenticated || !hasAccess || !isModuleEnabled('HR')) {
        return <Alert severity="error" sx={{ m: 4 }}>Access denied.</Alert>;
    }

    const handleDelete = async () => {
        if (!deleteId) return;
        await deleteMutation(deleteId);
        setDeleteId(null);
    };

    return (
        <Box sx={{ p: 4 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight={700}>{t('potentialDrivers.title')}</Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                        {t('potentialDrivers.subtitle')}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => router.push('/potential-drivers/create')}
                >
                    {t('potentialDrivers.addNew')}
                </Button>
            </Box>

            {/* Filters */}
            <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                <TextField
                    size="small"
                    label={t('potentialDrivers.list.columns.name')}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    sx={{ minWidth: 220 }}
                />
                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>{t('potentialDrivers.fields.status.label')}</InputLabel>
                    <Select
                        value={statusFilter}
                        label={t('potentialDrivers.fields.status.label')}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                    >
                        <MenuItem value="">{t('potentialDrivers.fields.status.label')} — All</MenuItem>
                        {ALL_STATUSES.map((s) => (
                            <MenuItem key={s} value={s}>{t(`potentialDrivers.status.${s}`)}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to load potential drivers.</Alert>}

            {isLoading ? (
                <CircularProgress />
            ) : (
                <Paper variant="outlined">
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('potentialDrivers.list.columns.name')}</TableCell>
                                    <TableCell>{t('potentialDrivers.list.columns.phone')}</TableCell>
                                    <TableCell>{t('potentialDrivers.list.columns.email')}</TableCell>
                                    <TableCell>{t('potentialDrivers.list.columns.status')}</TableCell>
                                    <TableCell>{t('potentialDrivers.list.columns.expectedStart')}</TableCell>
                                    {isGlobalAdmin && <TableCell>{t('potentialDrivers.list.columns.company')}</TableCell>}
                                    <TableCell align="right">{t('potentialDrivers.list.columns.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data?.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">{t('potentialDrivers.emptyState')}</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {data?.data.map((p) => (
                                    <TableRow
                                        key={p.id}
                                        sx={{ opacity: p.status === 'Converted' ? 0.6 : 1 }}
                                        hover
                                    >
                                        <TableCell sx={{ fontWeight: 500 }}>
                                            {p.firstName} {p.lastName}
                                        </TableCell>
                                        <TableCell>{p.phoneNumber}</TableCell>
                                        <TableCell>{p.email}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={t(`potentialDrivers.status.${p.status}`)}
                                                color={STATUS_COLORS[p.status] ?? 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {p.expectedStartDate
                                                ? new Date(p.expectedStartDate).toLocaleDateString()
                                                : '—'}
                                        </TableCell>
                                        {isGlobalAdmin && <TableCell>{p.companyName ?? '—'}</TableCell>}
                                        <TableCell align="right">
                                            <Tooltip title={t('potentialDrivers.actions.view')}>
                                                <IconButton size="small" onClick={() => router.push(`/potential-drivers/${p.id}`)}>
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('potentialDrivers.actions.edit')}>
                                                <IconButton size="small" onClick={() => router.push(`/potential-drivers/edit/${p.id}`)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            {p.status !== 'Converted' && (
                                                <Tooltip title={t('potentialDrivers.actions.convert')}>
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => router.push(`/potential-drivers/${p.id}?convert=1`)}
                                                    >
                                                        <PersonAddIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title={t('potentialDrivers.actions.delete')}>
                                                <IconButton size="small" color="error" onClick={() => setDeleteId(p.id)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        component="div"
                        count={data?.totalCount ?? 0}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        rowsPerPage={pageSize}
                        onRowsPerPageChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(0); }}
                        rowsPerPageOptions={[10, 25, 50]}
                    />
                </Paper>
            )}

            <ConfirmModal
                open={!!deleteId}
                title={t('potentialDrivers.detail.deleteConfirm')}
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                loading={isDeleting}
            />
        </Box>
    );
}
