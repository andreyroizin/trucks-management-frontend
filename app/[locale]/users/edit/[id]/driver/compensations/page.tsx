'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Box,
    CircularProgress,
    Alert,
    Typography,
    TextField,
    Button,
    FormControlLabel,
    Checkbox
} from '@mui/material';

import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { useAuth } from '@/hooks/useAuth';
import {
    useGetDriverCompensations,
    useUpdateDriverCompensations,
    CompensationSettings,
} from '@/hooks/useDriverCompensations';
import { useTranslations } from 'next-intl';

export default function DriverCompensationsPage() {
    const router = useRouter();
    const { id } = useParams();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const t = useTranslations('users.compensations');

    // --- VALIDATION SCHEMA ---
    const driverCompSchema = useMemo(() => yup.object({
        percentageOfWork: yup.number().required(),
        nightHoursAllowed: yup.boolean().required(),
        nightHours19Percent: yup.boolean().required(),
        driverRatePerHour: yup.number().required(),
        nightAllowanceRate: yup.number().required(),
        kilometerAllowanceEnabled: yup.boolean().required(),
        kilometersOneWayValue: yup.number().required(),
        kilometersMin: yup.number().required(),
        kilometersMax: yup.number().required(),
        kilometerAllowance: yup.number().required(),
        salary4Weeks: yup.number().required(),
        weeklySalary: yup.number().required(),
        dateOfEmployment: yup.string().required(), // e.g. '2024-12-23'
    }), []);

    // Restrict access
    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                router.push('/auth/login');
            } else if (
                !user?.roles.includes('globalAdmin') &&
                !user?.roles.includes('customerAdmin')
            ) {
                router.push('/403');
            }
        }
    }, [authLoading, isAuthenticated, user, router]);

    // Fetch data
    const userId = typeof id === 'string' ? id : '';
    const { data, isLoading, isError, error } = useGetDriverCompensations(userId);

    // Success message
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form
    const {
        control,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<CompensationSettings>({
        resolver: yupResolver(driverCompSchema),
        defaultValues: {
            percentageOfWork: 0,
            nightHoursAllowed: false,
            nightHours19Percent: false,
            driverRatePerHour: 0,
            nightAllowanceRate: 0,
            kilometerAllowanceEnabled: false,
            kilometersOneWayValue: 0,
            kilometersMin: 0,
            kilometersMax: 0,
            kilometerAllowance: 0,
            salary4Weeks: 0,
            weeklySalary: 0,
            dateOfEmployment: '',
        },
    });

    // Populate data
    useEffect(() => {
        if (data?.compensationSettings) {
            Object.entries(data.compensationSettings).forEach(([key, val]) => {
                setValue(key as keyof CompensationSettings, val as any);
            });
        }
    }, [data, setValue]);

    // Mutation
    const { mutateAsync: updateComp, isPending } = useUpdateDriverCompensations();

    // Handle submit
    const onSubmit: SubmitHandler<CompensationSettings> = async (values) => {
        setSuccessMessage(null);
        try {
            await updateComp({ userId, data: values });
            setSuccessMessage(t('successMessage'));
        } catch (err: any) {
            setSuccessMessage(null);
            alert(err.message || t('updateError'));
        }
    };

    if (authLoading || isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }
    if (isError || !data) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <Alert severity="error">{error?.message || t('loadError')}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="600px" mx="auto" mt={4}>
            <Typography variant="h5" mb={2}>
                {t('title')}
            </Typography>

            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {successMessage}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                {/* 1) percentageOfWork */}
                <Controller
                    name="percentageOfWork"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t('fields.percentageOfWork.label')}
                            type="number"
                            fullWidth
                            margin="normal"
                            error={!!errors.percentageOfWork}
                            helperText={errors.percentageOfWork?.message}
                        />
                    )}
                />
                {/* 2) nightHoursAllowed */}
                <Controller
                    name="nightHoursAllowed"
                    control={control}
                    render={({ field }) => (
                        <FormControlLabel
                            label={t('fields.nightHoursAllowed.label')}
                            control={
                                <Checkbox
                                    checked={field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                />
                            }
                        />
                    )}
                />

                {/* 3) nightHours19Percent */}
                <Controller
                    name="nightHours19Percent"
                    control={control}
                    render={({ field }) => (
                        <FormControlLabel
                            label={t('fields.nightHours19Percent.label')}
                            control={
                                <Checkbox
                                    checked={field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                />
                            }
                        />
                    )}
                />

                {/* 4) driverRatePerHour */}
                <Controller
                    name="driverRatePerHour"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t('fields.driverRatePerHour.label')}
                            type="number"
                            fullWidth
                            margin="normal"
                            error={!!errors.driverRatePerHour}
                            helperText={errors.driverRatePerHour?.message}
                            slotProps={{
                                input: {
                                    inputMode: 'decimal',
                                }
                            }}
                        />
                    )}
                />

                {/* 5) nightAllowanceRate */}
                <Controller
                    name="nightAllowanceRate"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t('fields.nightAllowanceRate.label')}
                            type="number"
                            fullWidth
                            margin="normal"
                            error={!!errors.nightAllowanceRate}
                            helperText={errors.nightAllowanceRate?.message}
                            slotProps={{
                                input: {
                                    inputMode: 'decimal',
                                }
                            }}
                        />
                    )}
                />

                {/* 6) kilometerAllowanceEnabled */}
                <Controller
                    name="kilometerAllowanceEnabled"
                    control={control}
                    render={({ field }) => (
                        <FormControlLabel
                            label={t('fields.kilometerAllowanceEnabled.label')}
                            control={
                                <Checkbox
                                    checked={field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                />
                            }
                        />
                    )}
                />

                {/* 7) kilometersOneWayValue */}
                <Controller
                    name="kilometersOneWayValue"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t('fields.kilometersOneWayValue.label')}
                            type="number"
                            fullWidth
                            margin="normal"
                            error={!!errors.kilometersOneWayValue}
                            helperText={errors.kilometersOneWayValue?.message}
                        />
                    )}
                />

                {/* 8) kilometersMin */}
                <Controller
                    name="kilometersMin"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t('fields.kilometersMin.label')}
                            type="number"
                            fullWidth
                            margin="normal"
                            error={!!errors.kilometersMin}
                            helperText={errors.kilometersMin?.message}
                        />
                    )}
                />

                {/* 9) kilometersMax */}
                <Controller
                    name="kilometersMax"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t('fields.kilometersMax.label')}
                            type="number"
                            fullWidth
                            margin="normal"
                            error={!!errors.kilometersMax}
                            helperText={errors.kilometersMax?.message}
                        />
                    )}
                />

                {/* 10) kilometerAllowance */}
                <Controller
                    name="kilometerAllowance"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t('fields.kilometerAllowance.label')}
                            type="number"
                            fullWidth
                            margin="normal"
                            error={!!errors.kilometerAllowance}
                            helperText={errors.kilometerAllowance?.message}
                            slotProps={{
                                input: {
                                    inputMode: 'decimal',
                                }
                            }}
                        />
                    )}
                />

                {/* 12) salary4Weeks */}
                <Controller
                    name="salary4Weeks"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t('fields.salary4Weeks.label')}
                            type="number"
                            fullWidth
                            margin="normal"
                            error={!!errors.salary4Weeks}
                            helperText={errors.salary4Weeks?.message}
                            slotProps={{
                                input: {
                                    inputMode: 'decimal',
                                }
                            }}
                        />
                    )}
                />

                {/* 13) weeklySalary */}
                <Controller
                    name="weeklySalary"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t('fields.weeklySalary.label')}
                            type="number"
                            fullWidth
                            margin="normal"
                            error={!!errors.weeklySalary}
                            helperText={errors.weeklySalary?.message}
                            slotProps={{
                                input: {
                                    inputMode: 'decimal',
                                }
                            }}
                        />
                    )}
                />

                {/* 14) dateOfEmployment */}
                <Controller
                    name="dateOfEmployment"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t('fields.dateOfEmployment.label')}
                            fullWidth
                            margin="normal"
                            error={!!errors.dateOfEmployment}
                            helperText={errors.dateOfEmployment?.message}
                        />
                    )}
                />

                <Button
                    type="submit"
                    variant="contained"
                    sx={{ mt: 2 }}
                    disabled={isPending}
                >
                    {isPending ? <CircularProgress size={20} color="inherit" /> : t('button')}
                </Button>
            </Box>
        </Box>
    );
}
