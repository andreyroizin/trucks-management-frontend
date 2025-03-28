'use client';

import React, { useEffect, useState } from 'react';
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

// --- VALIDATION SCHEMA ---
const driverCompSchema = yup.object({
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
});

export default function DriverCompensationsPage() {
    const router = useRouter();
    const { id } = useParams();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

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
            setSuccessMessage('Driver compensations updated successfully!');
        } catch (err: any) {
            setSuccessMessage(null);
            alert(err.message || 'Failed to update driver compensations');
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
                <Alert severity="error">{error?.message || 'Failed to load data.'}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="600px" mx="auto" mt={4}>
            <Typography variant="h5" mb={2}>
                Driver Rates & Allowances
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
                            label="Percentage of Work"
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
                            label="Night Hours Allowed"
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
                            label="Night Hours 19%"
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
                            label="Driver Rate Per Hour"
                            type="number"
                            fullWidth
                            margin="normal"
                            error={!!errors.driverRatePerHour}
                            helperText={errors.driverRatePerHour?.message}
                            inputProps={{
                                step: '0.01',
                                inputMode: 'decimal',
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
                            label="Night Allowance Rate"
                            type="number"
                            fullWidth
                            margin="normal"
                            error={!!errors.nightAllowanceRate}
                            helperText={errors.nightAllowanceRate?.message}
                            inputProps={{
                                step: '0.01',
                                inputMode: 'decimal',
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
                            label="Kilometer Allowance Enabled"
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
                            label="Kilometers One Way Value"
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
                            label="Kilometers Min"
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
                            label="Kilometers Max"
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
                            label="Kilometer Allowance"
                            type="number"
                            fullWidth
                            margin="normal"
                            error={!!errors.kilometerAllowance}
                            helperText={errors.kilometerAllowance?.message}
                            inputProps={{
                                step: '0.01',
                                inputMode: 'decimal',
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
                            label="Salary (4 Weeks)"
                            type="number"
                            fullWidth
                            margin="normal"
                            error={!!errors.salary4Weeks}
                            helperText={errors.salary4Weeks?.message}
                            inputProps={{
                                step: '0.01',
                                inputMode: 'decimal',
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
                            label="Weekly Salary"
                            type="number"
                            fullWidth
                            margin="normal"
                            error={!!errors.weeklySalary}
                            helperText={errors.weeklySalary?.message}
                            inputProps={{
                                step: '0.01',
                                inputMode: 'decimal',
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
                            label="Date of Employment (YYYY-MM-DD)"
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
                    {isPending ? <CircularProgress size={20} color="inherit" /> : 'Save'}
                </Button>
            </Box>
        </Box>
    );
}
