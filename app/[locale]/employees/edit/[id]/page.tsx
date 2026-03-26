'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
    Box, Typography, TextField, Button, Alert, CircularProgress,
    Autocomplete, Grid, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '@/hooks/useAuth';
import { useCompanies } from '@/hooks/useCompanies';
import { useEmployeeDetail } from '@/hooks/useEmployeeDetail';
import { useUpdateEmployee } from '@/hooks/useUpdateEmployee';
import { useFeatureModules } from '@/providers/FeatureModuleProvider';
import { EMPLOYEE_ROLES, EmployeeRole, UpdateEmployeeInput } from '@/types/employee';

const LANGUAGE_OPTIONS = [
    { value: 'nl', label: 'Nederlands' },
    { value: 'en', label: 'English' },
    { value: 'bg', label: 'Български' },
];

type FormInputs = {
    firstName: string;
    lastName: string;
    role: string;
    companyId?: string;
    externalClientNumber?: string;
    language?: string;
};

export default function EditEmployeePage() {
    const { id } = useParams();
    const router = useRouter();
    const t = useTranslations();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { isModuleEnabled } = useFeatureModules();

    const employeeId = id as string;
    const { data: employee, isLoading, isError } = useEmployeeDetail(employeeId);
    const { data: companiesData, isLoading: isCompaniesLoading } = useCompanies(1, 100);
    const { mutateAsync, isPending, isError: isUpdateError, error } = useUpdateEmployee();

    const isGlobalAdmin = user?.roles?.includes('globalAdmin');
    const isCustomerAdmin = user?.roles?.includes('customerAdmin');
    const hasAccess = isGlobalAdmin || isCustomerAdmin;

    const schema = yup.object().shape({
        firstName: yup.string().required(t('employees.fields.firstName.required')),
        lastName: yup.string().required(t('employees.fields.lastName.required')),
        role: yup.string().required(t('employees.fields.role.required')),
        companyId: yup.string().optional(),
        externalClientNumber: yup.string().optional(),
        language: yup.string().optional(),
    });

    const { handleSubmit, control, reset, formState: { errors } } = useForm<FormInputs>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: yupResolver(schema) as any,
        defaultValues: {
            firstName: '',
            lastName: '',
            role: 'Planner',
            companyId: '',
            externalClientNumber: '',
            language: 'nl',
        },
    });

    useEffect(() => {
        if (employee) {
            reset({
                firstName: employee.firstName,
                lastName: employee.lastName,
                role: employee.role,
                companyId: employee.companyId ?? '',
                externalClientNumber: employee.externalClientNumber ?? '',
                language: employee.language ?? 'nl',
            });
        }
    }, [employee, reset]);

    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        const payload: UpdateEmployeeInput = {
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role as EmployeeRole,
            companyId: data.companyId || undefined,
            externalClientNumber: data.externalClientNumber || undefined,
            language: data.language || undefined,
        };
        await mutateAsync({ id: employeeId, data: payload });
        router.push(`/employees/${employeeId}`);
    };

    if (authLoading || isLoading) return <CircularProgress sx={{ m: 4 }} />;
    if (!isAuthenticated || !hasAccess || !isModuleEnabled('HR')) {
        return <Alert severity="error" sx={{ m: 4 }}>Access denied.</Alert>;
    }
    if (isError || !employee) return <Alert severity="error" sx={{ m: 4 }}>{t('employees.detail.notFound')}</Alert>;

    return (
        <Box sx={{ p: 4, maxWidth: 800 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                {t('employees.edit.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                {employee.firstName} {employee.lastName}
            </Typography>

            {isUpdateError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {(error as Error)?.message || t('employees.edit.error')}
                </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Personal */}
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
                        {isGlobalAdmin && (
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
                                            <TextField {...params} label={t('employees.fields.company.label')} margin="normal" size="small" />
                                        )}
                                    />
                                )} />
                            </Grid>
                        )}
                    </Grid>
                </Box>

                {/* Role & Settings */}
                <Box mb={4}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>{t('employees.sections.role')}</Typography>
                    <Grid container columnSpacing={2} rowSpacing={0}>
                        <Grid item xs={12} sm={6}>
                            <Controller name="role" control={control} render={({ field }) => (
                                <FormControl fullWidth margin="normal" size="small">
                                    <InputLabel required>{t('employees.fields.role.label')}</InputLabel>
                                    <Select {...field} label={t('employees.fields.role.label')}>
                                        {EMPLOYEE_ROLES.map((r) => (
                                            <MenuItem key={r} value={r}>{t(`employees.role.${r}`)}</MenuItem>
                                        ))}
                                    </Select>
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
                        {isPending ? <CircularProgress size={20} /> : t('employees.edit.save')}
                    </Button>
                    <Button variant="outlined" onClick={() => router.push(`/employees/${employeeId}`)}>
                        {t('employees.actions.cancel')}
                    </Button>
                </Box>
            </form>
        </Box>
    );
}
