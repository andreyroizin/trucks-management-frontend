'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
    Box, Typography, TextField, Button, Alert, CircularProgress,
    Autocomplete, Grid, MenuItem, Select, FormControl, InputLabel, FormHelperText,
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '@/hooks/useAuth';
import { useCompanies } from '@/hooks/useCompanies';
import { useCreateEmployee } from '@/hooks/useCreateEmployee';
import { useFeatureModules } from '@/providers/FeatureModuleProvider';
import { CreateEmployeeInput, EMPLOYEE_ROLES, EmployeeRole } from '@/types/employee';

const LANGUAGE_OPTIONS = [
    { value: 'nl', label: 'Nederlands' },
    { value: 'en', label: 'English' },
    { value: 'bg', label: 'Български' },
];

type FormInputs = {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    companyId: string;
    externalClientNumber?: string;
    language?: string;
};

export default function CreateEmployeePage() {
    const router = useRouter();
    const t = useTranslations();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { isModuleEnabled } = useFeatureModules();
    const { data: companiesData, isLoading: isCompaniesLoading } = useCompanies(1, 100);
    const { mutateAsync, isPending, isError, error } = useCreateEmployee();

    const isGlobalAdmin = user?.roles?.includes('globalAdmin');
    const isCustomerAdmin = user?.roles?.includes('customerAdmin');
    const hasAccess = isGlobalAdmin || isCustomerAdmin;

    const schema = yup.object().shape({
        email: yup.string().email(t('employees.fields.email.invalid')).required(t('employees.fields.email.required')),
        firstName: yup.string().required(t('employees.fields.firstName.required')),
        lastName: yup.string().required(t('employees.fields.lastName.required')),
        role: yup.string().required(t('employees.fields.role.required')),
        companyId: yup.string().required(t('employees.fields.company.required')),
        externalClientNumber: yup.string().optional(),
        language: yup.string().optional(),
    });

    const { handleSubmit, control, formState: { errors } } = useForm<FormInputs>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: yupResolver(schema) as any,
        defaultValues: {
            email: '',
            firstName: '',
            lastName: '',
            role: 'Planner',
            companyId: '',
            externalClientNumber: '',
            language: 'nl',
        },
    });

    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        const payload: CreateEmployeeInput = {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role as EmployeeRole,
            companyId: data.companyId || undefined,
            externalClientNumber: data.externalClientNumber || undefined,
            language: data.language || undefined,
        };
        await mutateAsync(payload);
        router.push('/employees');
    };

    if (authLoading) return <CircularProgress sx={{ m: 4 }} />;
    if (!isAuthenticated || !hasAccess || !isModuleEnabled('HR')) {
        return <Alert severity="error" sx={{ m: 4 }}>Access denied.</Alert>;
    }

    return (
        <Box sx={{ p: 4, maxWidth: 800 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>{t('employees.create.title')}</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>{t('employees.create.subtitle')}</Typography>

            {isError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {(error as Error)?.message || t('employees.create.error')}
                </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Personal Information */}
                <Box mb={4}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>{t('employees.sections.personal')}</Typography>
                    <Grid container columnSpacing={2} rowSpacing={0}>
                        <Grid item xs={12} sm={6}>
                            <Controller name="firstName" control={control} render={({ field }) => (
                                <TextField {...field} label={t('employees.fields.firstName.label')} fullWidth margin="normal" size="small" required error={!!errors.firstName} helperText={errors.firstName?.message} />
                            )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="lastName" control={control} render={({ field }) => (
                                <TextField {...field} label={t('employees.fields.lastName.label')} fullWidth margin="normal" size="small" required error={!!errors.lastName} helperText={errors.lastName?.message} />
                            )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="email" control={control} render={({ field }) => (
                                <TextField {...field} label={t('employees.fields.email.label')} type="email" fullWidth margin="normal" size="small" required error={!!errors.email} helperText={errors.email?.message} />
                            )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="companyId" control={control} render={({ field }) => (
                                <Autocomplete
                                    options={companiesData?.data || []}
                                    getOptionLabel={(o) => o.name}
                                    onChange={(_, v) => field.onChange(v?.id || '')}
                                    value={companiesData?.data.find(c => c.id === field.value) || null}
                                    isOptionEqualToValue={(o, v) => o.id === v.id}
                                    loading={isCompaniesLoading}
                                    renderInput={(params) => (
                                        <TextField {...params} label={t('employees.fields.company.label')} margin="normal" size="small" required error={!!errors.companyId} helperText={errors.companyId?.message} />
                                    )}
                                />
                            )} />
                        </Grid>
                    </Grid>
                </Box>

                {/* Role & Settings */}
                <Box mb={4}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>{t('employees.sections.role')}</Typography>
                    <Grid container columnSpacing={2} rowSpacing={0}>
                        <Grid item xs={12} sm={6}>
                            <Controller name="role" control={control} render={({ field }) => (
                                <FormControl fullWidth margin="normal" size="small" error={!!errors.role}>
                                    <InputLabel required>{t('employees.fields.role.label')}</InputLabel>
                                    <Select {...field} label={t('employees.fields.role.label')}>
                                        {EMPLOYEE_ROLES.map((r) => (
                                            <MenuItem key={r} value={r}>{t(`employees.role.${r}`)}</MenuItem>
                                        ))}
                                    </Select>
                                    {errors.role && <FormHelperText>{errors.role.message}</FormHelperText>}
                                </FormControl>
                            )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="language" control={control} render={({ field }) => (
                                <FormControl fullWidth margin="normal" size="small">
                                    <InputLabel>{t('employees.fields.language.label')}</InputLabel>
                                    <Select {...field} label={t('employees.fields.language.label')}>
                                        {LANGUAGE_OPTIONS.map((l) => (
                                            <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller name="externalClientNumber" control={control} render={({ field }) => (
                                <TextField {...field} label={t('employees.fields.externalClientNumber.label')} fullWidth margin="normal" size="small" />
                            )} />
                        </Grid>
                    </Grid>
                </Box>

                <Box display="flex" gap={2}>
                    <Button type="submit" variant="contained" disabled={isPending}>
                        {isPending ? <CircularProgress size={20} /> : t('employees.addNew')}
                    </Button>
                    <Button variant="outlined" onClick={() => router.push('/employees')}>
                        {t('employees.actions.cancel')}
                    </Button>
                </Box>
            </form>
        </Box>
    );
}
