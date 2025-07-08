'use client';

import React, {Suspense, useEffect} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {Alert, Box, Button, CircularProgress, FormControl, TextField, Typography,} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import {Controller, SubmitHandler, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {useCreateRide} from '@/hooks/useCreateRide';
import {useCompanies} from '@/hooks/useCompanies';
import {useAuth} from '@/hooks/useAuth';

// --- VALIDATION SCHEMA ---
const rideSchema = yup.object().shape({
    name: yup.string().required('Ride name is required'),
    remark: yup.string().optional(),
    companyId: yup.string().required('Company is required'),
});

// --- FORM INPUT TYPE ---
type RideFormInputs = {
    name: string;
    remark?: string;
    companyId: string;
};

function RideCreatePageWrapper() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'customer', 'customerAccountant', 'employer'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, authLoading, router, user?.roles]);

    // Prefill companyId if provided in URL
    const prefillCompanyId = searchParams.get('companyId') || '';

    // Fetch Companies
    const { data: companiesData, isLoading: isLoadingCompanies } = useCompanies();

    // Create Mutation Hook
    const { mutateAsync: createRide, isPending, isError, error } = useCreateRide();

    // React Hook Form setup
    const {
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = useForm<RideFormInputs>({
        resolver: yupResolver(rideSchema),
        defaultValues: {
            name: '',
            remark: '',
            companyId: prefillCompanyId,
        },
    });

    // Handle Form Submission
    const onSubmit: SubmitHandler<RideFormInputs> = async (data) => {
        try {
            await createRide(data);
            router.push('/rides'); // Redirect to rides list after creation
        } catch (err) {
            console.error('Error creating ride:', err);
        }
    };

    return (
        <Box maxWidth="500px" mx="auto" p={4}>
            <Typography variant="h4" gutterBottom>
                Create Ride
            </Typography>

            {isError && <Alert severity="error">{error?.message || 'Failed to create ride'}</Alert>}

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Ride Name */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Ride Name"
                                variant="outlined"
                                error={!!errors.name}
                                helperText={errors.name?.message}
                            />
                        )}
                    />
                </FormControl>

                {/* Remark */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                    <Controller
                        name="remark"
                        control={control}
                        render={({ field }) => (
                            <TextField {...field} label="Remark" variant="outlined" />
                        )}
                    />
                </FormControl>

                {/* Company Selection */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                    <Controller
                        name="companyId"
                        control={control}
                        render={({ field }) => (
                            <Autocomplete
                                {...field}
                                loading={isLoadingCompanies}
                                options={companiesData?.data || []}
                                getOptionLabel={(option) => option.name}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                onChange={(_, newValue) => setValue('companyId', newValue?.id || '')}
                                value={companiesData?.data.find((c) => c.id === field.value) || null}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Company"
                                        variant="outlined"
                                        error={!!errors.companyId}
                                        helperText={errors.companyId?.message}
                                    />
                                )}
                            />
                        )}
                    />
                </FormControl>

                {/* Submit Button */}
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={isPending}
                    sx={{ mt: 2 }}
                >
                    {isPending ? <CircularProgress size={24} color="inherit" /> : 'Create Ride'}
                </Button>
            </form>
        </Box>
    );
}


export default function RideCreatePage() {
    return (
        <Suspense fallback={<CircularProgress />}>
            <RideCreatePageWrapper />
        </Suspense>
    );
}
