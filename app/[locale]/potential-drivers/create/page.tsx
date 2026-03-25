'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
    Box, Typography, TextField, Button, Alert, CircularProgress,
    Autocomplete, Grid, Checkbox, FormControlLabel, MenuItem, Select,
    FormControl, InputLabel, FormHelperText,
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '@/hooks/useAuth';
import { useCompanies } from '@/hooks/useCompanies';
import { useCreatePotentialDriver } from '@/hooks/useCreatePotentialDriver';
import { useFeatureModules } from '@/providers/FeatureModuleProvider';
import { CreatePotentialDriverInput, PotentialDriverStatus } from '@/types/potentialDriver';

const STATUS_OPTIONS: PotentialDriverStatus[] = [
    'New', 'Contacted', 'Interviewing', 'OfferMade', 'Accepted', 'Rejected',
];
const SOURCE_OPTIONS = ['Referral', 'JobBoard', 'LinkedIn', 'WalkIn', 'Other'];

type FormInputs = {
    companyId: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    status: string;
    source?: string;
    notes?: string;
    experienceYears?: number;
    hasCELicense?: boolean;
    expectedStartDate?: string;
};

export default function CreatePotentialDriverPage() {
    const router = useRouter();
    const t = useTranslations();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { isModuleEnabled } = useFeatureModules();
    const { data: companiesData, isLoading: isCompaniesLoading } = useCompanies(1, 100);
    const { mutateAsync, isPending, isError, error } = useCreatePotentialDriver();

    const schema = yup.object().shape({
        companyId: yup.string().required(t('potentialDrivers.fields.company.required')),
        firstName: yup.string().required(t('potentialDrivers.fields.firstName.required')),
        lastName: yup.string().required(t('potentialDrivers.fields.lastName.required')),
        email: yup.string().email(t('potentialDrivers.fields.email.invalid')).required(t('potentialDrivers.fields.email.required')),
        phoneNumber: yup.string().required(t('potentialDrivers.fields.phoneNumber.required')),
        status: yup.string().required(),
        source: yup.string().optional(),
        notes: yup.string().optional(),
        experienceYears: yup.number().optional().min(0),
        hasCELicense: yup.boolean().optional(),
        expectedStartDate: yup.string().optional(),
    });

    const isGlobalAdmin = user?.roles?.includes('globalAdmin');
    const isCustomerAdmin = user?.roles?.includes('customerAdmin');
    const hasAccess = isGlobalAdmin || isCustomerAdmin;

    const { handleSubmit, control, formState: { errors } } = useForm<FormInputs>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: yupResolver(schema) as any,
        defaultValues: {
            companyId: '',
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            status: 'New',
            source: '',
            notes: '',
            hasCELicense: false,
            expectedStartDate: '',
        },
    });

    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        const payload: CreatePotentialDriverInput = {
            companyId: data.companyId,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phoneNumber: data.phoneNumber,
            status: data.status as PotentialDriverStatus,
            source: data.source || undefined,
            notes: data.notes || undefined,
            experienceYears: data.experienceYears,
            hasCELicense: data.hasCELicense,
            expectedStartDate: data.expectedStartDate || undefined,
        };
        await mutateAsync(payload);
        router.push('/potential-drivers');
    };

    if (authLoading) return <CircularProgress sx={{ m: 4 }} />;
    if (!isAuthenticated || !hasAccess || !isModuleEnabled('HR')) {
        return <Alert severity="error" sx={{ m: 4 }}>Access denied.</Alert>;
    }

    return (
        <Box sx={{ p: 4, maxWidth: 800 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>{t('potentialDrivers.create.title')}</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>{t('potentialDrivers.create.subtitle')}</Typography>

            {isError && <Alert severity="error" sx={{ mb: 2 }}>{(error as any)?.message || t('potentialDrivers.create.error')}</Alert>}

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Personal Information */}
                <Box mb={4}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>{t('potentialDrivers.sections.personal')}</Typography>
                    <Grid container columnSpacing={2} rowSpacing={0}>
                        <Grid item xs={12} sm={6}>
                            <Controller name="firstName" control={control} render={({ field }) => (
                                <TextField {...field} label={t('potentialDrivers.fields.firstName.label')} fullWidth margin="normal" size="small" required error={!!errors.firstName} helperText={errors.firstName?.message} />
                            )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="lastName" control={control} render={({ field }) => (
                                <TextField {...field} label={t('potentialDrivers.fields.lastName.label')} fullWidth margin="normal" size="small" required error={!!errors.lastName} helperText={errors.lastName?.message} />
                            )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="email" control={control} render={({ field }) => (
                                <TextField {...field} label={t('potentialDrivers.fields.email.label')} type="email" fullWidth margin="normal" size="small" required error={!!errors.email} helperText={errors.email?.message} />
                            )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="phoneNumber" control={control} render={({ field }) => (
                                <TextField {...field} label={t('potentialDrivers.fields.phoneNumber.label')} fullWidth margin="normal" size="small" required error={!!errors.phoneNumber} helperText={errors.phoneNumber?.message} />
                            )} />
                        </Grid>
                        <Grid item xs={12}>
                            <Controller name="companyId" control={control} render={({ field }) => (
                                <Autocomplete
                                    options={companiesData?.data || []}
                                    getOptionLabel={(o) => o.name}
                                    onChange={(_, v) => field.onChange(v?.id || '')}
                                    value={companiesData?.data.find(c => c.id === field.value) || null}
                                    isOptionEqualToValue={(o, v) => o.id === v.id}
                                    loading={isCompaniesLoading}
                                    renderInput={(params) => (
                                        <TextField {...params} label={t('potentialDrivers.fields.company.label')} margin="normal" size="small" required error={!!errors.companyId} helperText={errors.companyId?.message} />
                                    )}
                                />
                            )} />
                        </Grid>
                    </Grid>
                </Box>

                {/* Recruitment Details */}
                <Box mb={4}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>{t('potentialDrivers.sections.recruitment')}</Typography>
                    <Grid container columnSpacing={2} rowSpacing={0}>
                        <Grid item xs={12} sm={6}>
                            <Controller name="status" control={control} render={({ field }) => (
                                <FormControl fullWidth margin="normal" size="small">
                                    <InputLabel>{t('potentialDrivers.fields.status.label')}</InputLabel>
                                    <Select {...field} label={t('potentialDrivers.fields.status.label')}>
                                        {STATUS_OPTIONS.map((s) => (
                                            <MenuItem key={s} value={s}>{t(`potentialDrivers.status.${s}`)}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="source" control={control} render={({ field }) => (
                                <FormControl fullWidth margin="normal" size="small">
                                    <InputLabel>{t('potentialDrivers.fields.source.label')}</InputLabel>
                                    <Select {...field} label={t('potentialDrivers.fields.source.label')}>
                                        <MenuItem value="">—</MenuItem>
                                        {SOURCE_OPTIONS.map((s) => (
                                            <MenuItem key={s} value={s}>{t(`potentialDrivers.source.${s}`)}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="experienceYears" control={control} render={({ field }) => (
                                <TextField {...field} label={t('potentialDrivers.fields.experienceYears.label')} type="number" fullWidth margin="normal" size="small"
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                    value={field.value ?? ''} />
                            )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="expectedStartDate" control={control} render={({ field }) => (
                                <TextField {...field} label={t('potentialDrivers.fields.expectedStartDate.label')} type="date" fullWidth margin="normal" size="small" InputLabelProps={{ shrink: true }} />
                            )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="hasCELicense" control={control} render={({ field }) => (
                                <FormControlLabel
                                    control={<Checkbox checked={field.value ?? false} onChange={(e) => field.onChange(e.target.checked)} />}
                                    label={t('potentialDrivers.fields.hasCELicense.label')}
                                    sx={{ mt: 2 }}
                                />
                            )} />
                        </Grid>
                        <Grid item xs={12}>
                            <Controller name="notes" control={control} render={({ field }) => (
                                <TextField {...field} label={t('potentialDrivers.fields.notes.label')} placeholder={t('potentialDrivers.fields.notes.placeholder')} multiline rows={3} fullWidth margin="normal" size="small" />
                            )} />
                        </Grid>
                    </Grid>
                </Box>

                <Box display="flex" gap={2}>
                    <Button type="submit" variant="contained" disabled={isPending}>
                        {isPending ? <CircularProgress size={20} /> : t('potentialDrivers.addNew')}
                    </Button>
                    <Button variant="outlined" onClick={() => router.push('/potential-drivers')}>
                        Cancel
                    </Button>
                </Box>
            </form>
        </Box>
    );
}
