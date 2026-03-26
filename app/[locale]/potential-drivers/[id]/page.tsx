'use client';

import React, { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
    Box, Typography, Button, CircularProgress, Alert, Chip, Grid,
    Divider, Dialog, DialogTitle, DialogContent, DialogContentText,
    DialogActions, Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useAuth } from '@/hooks/useAuth';
import { usePotentialDriverDetail } from '@/hooks/usePotentialDriverDetail';
import { useDeletePotentialDriver } from '@/hooks/useDeletePotentialDriver';
import { usePotentialDriverPrefill } from '@/hooks/useConvertPotentialDriver';
import { useFeatureModules } from '@/providers/FeatureModuleProvider';

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'warning' | 'success' | 'error' | 'info' | 'secondary'> = {
    New: 'default',
    Contacted: 'primary',
    Interviewing: 'warning',
    OfferMade: 'secondary',
    Accepted: 'success',
    Rejected: 'error',
    Converted: 'info',
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

export default function PotentialDriverDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { isModuleEnabled } = useFeatureModules();

    const prospectId = id as string;
    const { data: prospect, isLoading, isError } = usePotentialDriverDetail(prospectId);
    const { mutateAsync: deleteProspect, isPending: isDeleting } = useDeletePotentialDriver();
    const { getPrefill } = usePotentialDriverPrefill(prospectId);

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [convertDialogOpen, setConvertDialogOpen] = useState(
        searchParams.get('convert') === '1',
    );
    const [convertLoading, setConvertLoading] = useState(false);

    const isGlobalAdmin = user?.roles?.includes('globalAdmin');
    const isCustomerAdmin = user?.roles?.includes('customerAdmin');
    const hasAccess = isGlobalAdmin || isCustomerAdmin;

    if (authLoading || isLoading) return <CircularProgress sx={{ m: 4 }} />;
    if (!isAuthenticated || !hasAccess || !isModuleEnabled('HR')) {
        return <Alert severity="error" sx={{ m: 4 }}>Access denied.</Alert>;
    }
    if (isError || !prospect) return <Alert severity="error" sx={{ m: 4 }}>Prospect not found.</Alert>;

    const handleDelete = async () => {
        await deleteProspect(prospectId);
        router.push('/potential-drivers');
    };

    const handleConvert = async () => {
        setConvertLoading(true);
        try {
            const prefill = await getPrefill();
            const params = new URLSearchParams({
                prospectId: prefill.prospectId,
                firstName: prefill.firstName,
                lastName: prefill.lastName,
                email: prefill.email,
                phoneNumber: prefill.phoneNumber,
                companyId: prefill.companyId,
            });
            router.push(`/drivers/create?${params.toString()}`);
        } finally {
            setConvertLoading(false);
            setConvertDialogOpen(false);
        }
    };

    const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString() : undefined;

    return (
        <Box sx={{ p: 4, maxWidth: 900 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Box>
                    <Typography variant="h4" fontWeight={700}>
                        {prospect.firstName} {prospect.lastName}
                    </Typography>
                    <Stack direction="row" spacing={1} mt={1} alignItems="center">
                        <Chip
                            label={t(`potentialDrivers.status.${prospect.status}`)}
                            color={STATUS_COLORS[prospect.status] ?? 'default'}
                            size="small"
                        />
                        {prospect.companyName && (
                            <Typography variant="body2" color="text.secondary">{prospect.companyName}</Typography>
                        )}
                    </Stack>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button startIcon={<EditIcon />} variant="outlined" size="small" onClick={() => router.push(`/potential-drivers/edit/${prospectId}`)}>
                        {t('potentialDrivers.actions.edit')}
                    </Button>
                    {prospect.status !== 'Converted' && (
                        <Button startIcon={<PersonAddIcon />} variant="contained" size="small" onClick={() => setConvertDialogOpen(true)}>
                            {t('potentialDrivers.actions.convert')}
                        </Button>
                    )}
                    <Button startIcon={<DeleteIcon />} variant="outlined" color="error" size="small" onClick={() => setDeleteDialogOpen(true)}>
                        {t('potentialDrivers.actions.delete')}
                    </Button>
                </Stack>
            </Box>

            {/* Converted banner */}
            {prospect.status === 'Converted' && prospect.convertedToDriverId && (
                <Alert
                    severity="success"
                    sx={{ mt: 2 }}
                    action={
                        <Button size="small" endIcon={<OpenInNewIcon />} onClick={() => router.push(`/drivers/${prospect.convertedToDriverId}`)}>
                            {t('potentialDrivers.actions.viewDriver')}
                        </Button>
                    }
                >
                    {t('potentialDrivers.detail.convertedLabel')}: {formatDate(prospect.convertedAt)}
                </Alert>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Personal */}
            <Typography variant="h6" fontWeight={600} gutterBottom>{t('potentialDrivers.sections.personal')}</Typography>
            <Grid container spacing={2} mb={3}>
                <DetailRow label={t('potentialDrivers.fields.email.label')} value={prospect.email} />
                <DetailRow label={t('potentialDrivers.fields.phoneNumber.label')} value={prospect.phoneNumber} />
                <DetailRow label={t('potentialDrivers.fields.experienceYears.label')} value={prospect.experienceYears !== undefined ? `${prospect.experienceYears} yr` : undefined} />
                <DetailRow label={t('potentialDrivers.fields.hasCELicense.label')} value={prospect.hasCELicense === true ? '✓ Yes' : prospect.hasCELicense === false ? '✗ No' : undefined} />
            </Grid>

            {/* Recruitment */}
            <Typography variant="h6" fontWeight={600} gutterBottom>{t('potentialDrivers.sections.recruitment')}</Typography>
            <Grid container spacing={2} mb={3}>
                <DetailRow label={t('potentialDrivers.fields.source.label')} value={prospect.source ? t(`potentialDrivers.source.${prospect.source}`) : undefined} />
                <DetailRow label={t('potentialDrivers.fields.expectedStartDate.label')} value={formatDate(prospect.expectedStartDate)} />
                <DetailRow label={t('potentialDrivers.fields.firstContactDate.label')} value={formatDate(prospect.firstContactDate)} />
                <DetailRow label={t('potentialDrivers.fields.lastContactDate.label')} value={formatDate(prospect.lastContactDate)} />
                {prospect.notes && (
                    <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">{t('potentialDrivers.fields.notes.label')}</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{prospect.notes}</Typography>
                    </Grid>
                )}
            </Grid>

            {/* Delete dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Candidate</DialogTitle>
                <DialogContent>
                    <DialogContentText>{t('potentialDrivers.detail.deleteConfirm')}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" disabled={isDeleting}>
                        {isDeleting ? <CircularProgress size={20} /> : t('potentialDrivers.actions.delete')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Convert dialog */}
            <Dialog open={convertDialogOpen} onClose={() => setConvertDialogOpen(false)}>
                <DialogTitle>{t('potentialDrivers.convert.title')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{t('potentialDrivers.convert.description')}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConvertDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleConvert} variant="contained" disabled={convertLoading}>
                        {convertLoading ? <CircularProgress size={20} /> : t('potentialDrivers.convert.confirm')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
