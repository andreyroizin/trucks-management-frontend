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
import { useAuth } from '@/hooks/useAuth';
import { useEmployees } from '@/hooks/useEmployees';
import { useDeleteEmployee } from '@/hooks/useDeleteEmployee';
import { useFeatureModules } from '@/providers/FeatureModuleProvider';
import { EMPLOYEE_ROLES, EmployeeRole } from '@/types/employee';
import ConfirmModal from '@/components/ConfirmModal';
import LanguageSelectDesktop from '@/components/LanguageSelectDesktop';

const ROLE_COLORS: Record<EmployeeRole, 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error'> = {
    Planner: 'primary',
    Admin: 'secondary',
    Manager: 'warning',
    Accountant: 'success',
    HR: 'info',
    Other: 'default',
};

export default function EmployeesPage() {
    const router = useRouter();
    const t = useTranslations();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { isModuleEnabled } = useFeatureModules();

    const [roleFilter, setRoleFilter] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const isGlobalAdmin = user?.roles?.includes('globalAdmin');
    const isCustomerAdmin = user?.roles?.includes('customerAdmin');
    const hasAccess = isGlobalAdmin || isCustomerAdmin;

    const { data, isLoading, isError } = useEmployees(
        page + 1, pageSize, roleFilter || undefined, search || undefined,
    );

    const { mutateAsync: deleteMutation } = useDeleteEmployee();

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
                    <Typography variant="h4" fontWeight={700}>{t('employees.title')}</Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                        {t('employees.subtitle')}
                    </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                    <LanguageSelectDesktop />
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => router.push('/employees/create')}
                    >
                        {t('employees.addNew')}
                    </Button>
                </Box>
            </Box>

            {/* Filters */}
            <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                <TextField
                    size="small"
                    label={t('employees.list.search')}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    sx={{ minWidth: 220 }}
                />
                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>{t('employees.fields.role.label')}</InputLabel>
                    <Select
                        value={roleFilter}
                        label={t('employees.fields.role.label')}
                        onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
                    >
                        <MenuItem value="">{t('employees.fields.role.label')} — All</MenuItem>
                        {EMPLOYEE_ROLES.map((r) => (
                            <MenuItem key={r} value={r}>{t(`employees.role.${r}`)}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {isError && <Alert severity="error" sx={{ mb: 2 }}>{t('employees.list.loadError')}</Alert>}

            {isLoading ? (
                <CircularProgress />
            ) : (
                <Paper variant="outlined">
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('employees.list.columns.name')}</TableCell>
                                    <TableCell>{t('employees.list.columns.email')}</TableCell>
                                    <TableCell>{t('employees.list.columns.role')}</TableCell>
                                    {isGlobalAdmin && <TableCell>{t('employees.list.columns.company')}</TableCell>}
                                    <TableCell align="right">{t('employees.list.columns.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data?.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">{t('employees.emptyState')}</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {data?.data.map((e) => (
                                    <TableRow
                                        key={e.id}
                                        hover
                                        onClick={() => router.push(`/employees/${e.id}`)}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        <TableCell sx={{ fontWeight: 500 }}>
                                            {e.firstName} {e.lastName}
                                        </TableCell>
                                        <TableCell>{e.email}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={t(`employees.role.${e.role}`)}
                                                color={ROLE_COLORS[e.role as EmployeeRole] ?? 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        {isGlobalAdmin && <TableCell>{e.companyName ?? '—'}</TableCell>}
                                        <TableCell align="right" onClick={(ev) => ev.stopPropagation()}>
                                            <Tooltip title={t('employees.actions.view')}>
                                                <IconButton size="small" onClick={() => router.push(`/employees/${e.id}`)}>
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('employees.actions.edit')}>
                                                <IconButton size="small" onClick={() => router.push(`/employees/edit/${e.id}`)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('employees.actions.delete')}>
                                                <IconButton size="small" color="error" onClick={() => setDeleteId(e.id)}>
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
                title={t('employees.detail.deleteConfirm')}
                onConfirm={handleDelete}
                onClose={() => setDeleteId(null)}
            />
        </Box>
    );
}
