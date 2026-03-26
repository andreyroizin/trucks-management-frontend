'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
    Box, Typography, Button, CircularProgress, Alert, Chip, Grid,
    Divider, Dialog, DialogTitle, DialogContent, DialogContentText,
    DialogActions, Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '@/hooks/useAuth';
import { useEmployeeDetail } from '@/hooks/useEmployeeDetail';
import { useDeleteEmployee } from '@/hooks/useDeleteEmployee';
import { useFeatureModules } from '@/providers/FeatureModuleProvider';
import { EmployeeRole } from '@/types/employee';

const ROLE_COLORS: Record<EmployeeRole, 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error'> = {
    Planner: 'primary',
    Admin: 'secondary',
    Manager: 'warning',
    Accountant: 'success',
    HR: 'info',
    Other: 'default',
};

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
    if (!value && value !== 0 && value !== false) return null;
    return (
        <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="body2" fontWeight={500}>{value}</Typography>
        </Grid>
    );
}

export default function EmployeeDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const t = useTranslations();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { isModuleEnabled } = useFeatureModules();

    const employeeId = id as string;
    const { data: employee, isLoading, isError } = useEmployeeDetail(employeeId);
    const { mutateAsync: deleteEmployee, isPending: isDeleting } = useDeleteEmployee();

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const isGlobalAdmin = user?.roles?.includes('globalAdmin');
    const isCustomerAdmin = user?.roles?.includes('customerAdmin');
    const hasAccess = isGlobalAdmin || isCustomerAdmin;

    if (authLoading || isLoading) return <CircularProgress sx={{ m: 4 }} />;
    if (!isAuthenticated || !hasAccess || !isModuleEnabled('HR')) {
        return <Alert severity="error" sx={{ m: 4 }}>Access denied.</Alert>;
    }
    if (isError || !employee) return <Alert severity="error" sx={{ m: 4 }}>{t('employees.detail.notFound')}</Alert>;

    const handleDelete = async () => {
        await deleteEmployee(employeeId);
        router.push('/employees');
    };

    const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString() : undefined;

    return (
        <Box sx={{ p: 4, maxWidth: 900 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Box>
                    <Typography variant="h4" fontWeight={700}>
                        {employee.firstName} {employee.lastName}
                    </Typography>
                    <Stack direction="row" spacing={1} mt={1} alignItems="center">
                        <Chip
                            label={t(`employees.role.${employee.role}`)}
                            color={ROLE_COLORS[employee.role as EmployeeRole] ?? 'default'}
                            size="small"
                        />
                        {employee.companyName && (
                            <Typography variant="body2" color="text.secondary">{employee.companyName}</Typography>
                        )}
                    </Stack>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button
                        startIcon={<EditIcon />}
                        variant="outlined"
                        size="small"
                        onClick={() => router.push(`/employees/edit/${employeeId}`)}
                    >
                        {t('employees.actions.edit')}
                    </Button>
                    <Button
                        startIcon={<DeleteIcon />}
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        {t('employees.actions.delete')}
                    </Button>
                </Stack>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Contact */}
            <Typography variant="h6" fontWeight={600} gutterBottom>{t('employees.sections.personal')}</Typography>
            <Grid container spacing={2} mb={3}>
                <DetailRow label={t('employees.fields.email.label')} value={employee.email} />
                <DetailRow label={t('employees.fields.language.label')} value={employee.language} />
                <DetailRow label={t('employees.fields.externalClientNumber.label')} value={employee.externalClientNumber} />
            </Grid>

            {/* Contract */}
            {employee.employeeContractId && (
                <>
                    <Typography variant="h6" fontWeight={600} gutterBottom>{t('employees.sections.contract')}</Typography>
                    <Grid container spacing={2} mb={3}>
                        <DetailRow label={t('employees.fields.contractType.label')} value={employee.contractType} />
                    </Grid>
                </>
            )}

            {/* Metadata */}
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
                <DetailRow label={t('employees.fields.createdAt')} value={formatDate(employee.createdAt)} />
                <DetailRow label={t('employees.fields.updatedAt')} value={formatDate(employee.updatedAt)} />
            </Grid>

            {/* Delete dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>{t('employees.detail.deleteTitle')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{t('employees.detail.deleteConfirm')}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>{t('employees.actions.cancel')}</Button>
                    <Button onClick={handleDelete} color="error" disabled={isDeleting}>
                        {isDeleting ? <CircularProgress size={20} /> : t('employees.actions.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
