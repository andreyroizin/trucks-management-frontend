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
    Grid,
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
    contactPerson: yup.string().optional(),
    companyId: yup.string().required('Company is required'),
});

type FormInputs = {
    name: string;
    contactPerson?: string;
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
            contactPerson: '',
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
        <Box maxWidth="800px" p={4}>
            {/* Header Block */}
            <Box mb={4}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                    New Client Creation Form
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Use this form to create a new client in clients list. Please ensure all fields are filled out accurately.
                </Typography>
            </Box>

            {/* Form Block */}
            <Box>
                {isError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error?.message || 'Failed to create client.'}
                    </Alert>
                )}

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* General Information Block */}
                <Box mb={4}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        General Information
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
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
                        </Grid>
                        <Grid item xs={12} sm={6}>
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
                                                required
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
                        </Grid>
                        <Grid item xs={12} sm={6}>
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
                                        error={!!errors.tav}
                                        helperText={errors.tav?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="contactPerson"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Contact Person"
                                        fullWidth
                                        margin="normal"
                                        variant="outlined"
                                        error={!!errors.contactPerson}
                                        helperText={errors.contactPerson?.message}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* Client Address Block */}
                <Box mb={4}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        Client Address
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="address"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Street Address"
                                        fullWidth
                                        margin="normal"
                                        variant="outlined"
                                        error={!!errors.address}
                                        helperText={errors.address?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
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
                                        error={!!errors.postcode}
                                        helperText={errors.postcode?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
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
                                        error={!!errors.city}
                                        helperText={errors.city?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
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
                                        error={!!errors.country}
                                        helperText={errors.country?.message}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* Contact Information Block */}
                <Box mb={4}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        Contact Information
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
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
                                        error={!!errors.phoneNumber}
                                        helperText={errors.phoneNumber?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
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
                                        error={!!errors.email}
                                        helperText={errors.email?.message}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* Remark Block */}
                <Box mb={4}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        Remark
                    </Typography>
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
                                multiline
                                rows={4}
                                placeholder="Enter any additional remarks or comments about the client..."
                                error={!!errors.remark}
                                helperText={errors.remark?.message}
                            />
                        )}
                    />
                </Box>



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
        </Box>
    );
}
