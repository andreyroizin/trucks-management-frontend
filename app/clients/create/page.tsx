'use client';

import React, { useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Autocomplete,  // For MUI Select Autocomplete
} from '@mui/material';
import { Controller, useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCompanies } from '@/hooks/useCompanies';  // Assumes you have this
import { useCreateClient } from '@/hooks/useCreateClient';

const schema = yup.object().shape({
    name: yup.string().required('Client name is required'),
    companyId: yup.string().required('Company is required'),
});

type FormInputs = {
    name: string;
    tav?: string;
    address?: string;
    postcode?: string;
    city?: string;
    country?: string;
    phoneNumber?: string;
    email?: string;
    remark?: string;
    companyId: string;
};

export default function CreateClientPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { data: companiesData, isLoading: isCompaniesLoading } = useCompanies();
    const { mutateAsync, isPending, isError, error } = useCreateClient();

    const {
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<FormInputs>({
        resolver: yupResolver(schema),
        defaultValues: {
            name: '',
            companyId: '',
        },
    });

    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'employer'];
        const hasAccess = user?.roles.some(r => allowedRoles.includes(r));
        if (!authLoading && (!isAuthenticated || !hasAccess)) router.push('/auth/login');
    }, [authLoading, isAuthenticated, router, user?.roles]);

    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        try {
            await mutateAsync(data);
            reset();
            router.push('/clients');
        } catch {
            /* Error handled by isError & error */
        }
    };

    if (authLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box maxWidth="500px" mx="auto" p={2}>
            <Typography variant="h5" gutterBottom>
                Create Client
            </Typography>

            {isError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error?.message || 'Failed to create client.'}
                </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
                <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Client Name"
                            fullWidth
                            margin="normal"
                            variant="outlined"
                            error={!!errors.name}
                            helperText={errors.name?.message}
                            required
                        />
                    )}
                />

                {/* Additional Fields */}
                <Controller
                    name="tav"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="TAV"
                            fullWidth
                            margin="normal"
                            variant="outlined"
                        />
                    )}
                />
                <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Address"
                            fullWidth
                            margin="normal"
                            variant="outlined"
                        />
                    )}
                />
                <Controller
                    name="postcode"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Postcode"
                            fullWidth
                            margin="normal"
                            variant="outlined"
                        />
                    )}
                />
                <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="City"
                            fullWidth
                            margin="normal"
                            variant="outlined"
                        />
                    )}
                />
                <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Country"
                            fullWidth
                            margin="normal"
                            variant="outlined"
                        />
                    )}
                />
                <Controller
                    name="phoneNumber"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Phone Number"
                            fullWidth
                            margin="normal"
                            variant="outlined"
                        />
                    )}
                />
                <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Email"
                            fullWidth
                            margin="normal"
                            variant="outlined"
                        />
                    )}
                />
                <Controller
                    name="remark"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Remark"
                            fullWidth
                            margin="normal"
                            variant="outlined"
                        />
                    )}
                />

                {/* Autocomplete for Companies */}
                <Controller
                    name="companyId"
                    control={control}
                    render={({ field }) => (
                        <Autocomplete
                            options={companiesData?.data || []}
                            getOptionLabel={(option) => option.name}
                            onChange={(_, value) => field.onChange(value?.id || '')}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Company"
                                    variant="outlined"
                                    margin="normal"
                                    fullWidth
                                    error={!!errors.companyId}
                                    helperText={errors.companyId?.message}
                                />
                            )}
                            loading={isCompaniesLoading}
                            value={
                                companiesData?.data.find(c => c.id === field.value) || null
                            }
                            isOptionEqualToValue={(option, val) => option.id === val.id}
                        />
                    )}
                />

                <Box mt={3}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={isPending}
                        startIcon={isPending ? <CircularProgress size={20} /> : null}
                    >
                        {isPending ? 'Creating...' : 'Create Client'}
                    </Button>
                </Box>
            </form>
        </Box>
    );
}
