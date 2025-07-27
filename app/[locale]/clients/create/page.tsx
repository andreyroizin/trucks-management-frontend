'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
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

type FormInputs = {
    name: string;               // Required
    companyId: string;          // Required
    tav?: string;               // Optional
    address?: string;           // Optional
    postcode?: string;          // Optional
    city?: string;              // Optional
    country?: string;           // Optional
    phoneNumber?: string;       // Optional
    email?: string;             // Optional
    remark?: string;            // Optional
};

export default function CreateClientPage() {
    const router = useRouter();
    const t = useTranslations();
    
    const schema = yup.object().shape({
        name: yup.string().required(t('clients.create.fields.name.required')),
        companyId: yup.string().required(t('clients.create.fields.company.required')),
        tav: yup.string().optional(),
        address: yup.string().optional(),
        postcode: yup.string().optional(),
        city: yup.string().optional(),
        country: yup.string().optional(),
        phoneNumber: yup.string().optional(),
        email: yup.string().optional(),
        remark: yup.string().optional(),
    });
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { data: companiesData, isLoading: isCompaniesLoading } = useCompanies(1, 100);
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
        const allowedRoles = ['globalAdmin', 'customerAdmin'];
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
                    {t('clients.create.title')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {t('clients.create.subtitle')}
                </Typography>
            </Box>

            {/* Form Block */}
            <Box>
                {isError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error?.message || t('clients.create.errors.createFailed')}
                    </Alert>
                )}

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* General Information Block */}
                <Box mb={4}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {t('clients.create.sections.general')}
                    </Typography>
                    <Grid container columnSpacing={2} rowSpacing={0}>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label={t('clients.create.fields.name.label')}
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
                                                label={t('clients.create.fields.company.label')}
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
                                        label={t('clients.create.fields.tav.label')}
                                        fullWidth
                                        margin="normal"
                                        variant="outlined"
                                        error={!!errors.tav}
                                        helperText={errors.tav?.message}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* Client Address Block */}
                <Box mb={4}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {t('clients.create.sections.address')}
                    </Typography>
                    <Grid container columnSpacing={2} rowSpacing={0}>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="address"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label={t('clients.create.fields.address.label')}
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
                                        label={t('clients.create.fields.postcode.label')}
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
                                        label={t('clients.create.fields.city.label')}
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
                                        label={t('clients.create.fields.country.label')}
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
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {t('clients.create.sections.contact')}
                    </Typography>
                    <Grid container columnSpacing={2} rowSpacing={0}>
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="phoneNumber"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label={t('clients.create.fields.phone.label')}
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
                                        label={t('clients.create.fields.email.label')}
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
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {t('clients.create.sections.remark')}
                    </Typography>
                    <Controller
                        name="remark"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label={t('clients.create.fields.remark.label')}
                                fullWidth
                                margin="normal"
                                variant="outlined"
                                multiline
                                rows={4}
                                placeholder={t('clients.create.fields.remark.placeholder')}
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
                        {isPending ? t('clients.create.buttons.submitting') : t('clients.create.buttons.submit')}
                    </Button>
                </Box>
            </form>
            </Box>
        </Box>
    );
}
