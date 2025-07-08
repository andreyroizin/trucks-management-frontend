'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import {
    Box,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Alert,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCompanies } from '@/hooks/useCompanies';
import { useCreateCar, CarInput } from '@/hooks/useCreateCar';

// --- VALIDATION SCHEMA ---
const carSchema = yup.object().shape({
    companyId: yup.string().required('Company is required'),
    licensePlate: yup.string().required('License plate is required'),
    remark: yup.string().optional(),
});

function CreateCarForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { data: companiesData, isLoading: isLoadingCompanies } = useCompanies();
    const { mutateAsync, isPending } = useCreateCar();

    // Ensure only customerAdmins & globalAdmins can access
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin'];
        const hasAccess = user?.roles.some((r) => allowedRoles.includes(r));
        if (!authLoading && (!isAuthenticated || !hasAccess)) router.push('/auth/login');
    }, [authLoading, isAuthenticated, router, user?.roles]);

    // Extract companyId from search params (if provided)
    const companyIdFromUrl = searchParams.get('companyId');

    // State for API error
    const [apiError, setApiError] = useState<string | null>(null);

    // Form Handling
    const {
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = useForm<CarInput>({
        resolver: yupResolver(carSchema),
        defaultValues: {
            companyId: '',
            licensePlate: '',
            remark: '',
        },
    });

    // Pre-fill company if provided in the URL
    useEffect(() => {
        if (companyIdFromUrl && companiesData?.data) {
            const matchedCompany = companiesData.data.find((c) => c.id === companyIdFromUrl);
            if (matchedCompany) {
                setValue('companyId', matchedCompany.id);
            }
        }
    }, [companyIdFromUrl, companiesData, setValue]);

    // Submit Handler
    const onSubmit: SubmitHandler<CarInput> = async (data) => {
        setApiError(null);
        try {
            await mutateAsync(data);
            router.push(`/cars?companyId=${data.companyId}`);
        } catch (err: any) {
            setApiError(err.message);
        }
    };

    return (
        <Box maxWidth="600px" mx="auto" p={4}>
            <Typography variant="h4" gutterBottom>
                Create Car
            </Typography>

            {/* Display API Error */}
            {apiError && <Alert severity="error">{apiError}</Alert>}

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Company Selection */}
                <Controller
                    name="companyId"
                    control={control}
                    render={({ field }) => (
                        <Autocomplete
                            options={companiesData?.data || []}
                            getOptionLabel={(option) => option.name ?? ''}
                            loading={isLoadingCompanies}
                            value={companiesData?.data.find((c) => c.id === field.value) || null}
                            onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Select Company"
                                    variant="outlined"
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.companyId}
                                    helperText={errors.companyId?.message}
                                    required
                                />
                            )}
                        />
                    )}
                />

                {/* License Plate */}
                <Controller
                    name="licensePlate"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="License Plate"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            error={!!errors.licensePlate}
                            helperText={errors.licensePlate?.message}
                            required
                        />
                    )}
                />

                {/* Remark (Optional) */}
                <Controller
                    name="remark"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Remark"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            error={!!errors.remark}
                            helperText={errors.remark?.message}
                        />
                    )}
                />

                {/* Submit Button */}
                <Box mt={3}>
                    <Button type="submit" variant="contained" color="primary" fullWidth disabled={isPending}>
                        {isPending ? <CircularProgress size={20} /> : 'Create Car'}
                    </Button>
                </Box>
            </form>
        </Box>
    );
}

export default function CreateCarPage() {
    return (
        <Suspense fallback={<CircularProgress />}>
            <CreateCarForm />
        </Suspense>
    );
}
