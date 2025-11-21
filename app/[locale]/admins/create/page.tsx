'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Autocomplete,
    Grid,
} from '@mui/material';
import { Controller, useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCompanies } from '@/hooks/useCompanies';
import { useClients } from '@/hooks/useClients';
import { useCreateCustomerAdmin } from '@/hooks/useCreateCustomerAdmin';

type FormInputs = {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    address?: string;
    phoneNumber?: string;
    postcode?: string;
    city?: string;
    country?: string;
    remark?: string;
    companyIds?: string[];
    clientIds?: string[];
};

export default function CreateCustomerAdminPage() {
    const t = useTranslations();

    const schema = yup.object().shape({
        email: yup.string().email(t('admins.create.fields.email.invalid')).required(t('admins.create.fields.email.required')),
        password: yup.string()
            .min(6, t('admins.create.fields.password.minLength'))
            .matches(/[a-z]/, t('admins.create.fields.password.lowercase'))
            .matches(/[^a-zA-Z0-9]/, t('admins.create.fields.password.specialChar'))
            .required(t('admins.create.fields.password.required')),
        confirmPassword: yup.string()
            .oneOf([yup.ref('password')], t('admins.create.fields.confirmPassword.mustMatch'))
            .required(t('admins.create.fields.confirmPassword.required')),
        firstName: yup.string().required(t('admins.create.fields.firstName.required')),
        lastName: yup.string().required(t('admins.create.fields.lastName.required')),
        address: yup.string().optional(),
        phoneNumber: yup.string().optional(),
        postcode: yup.string().optional(),
        city: yup.string().optional(),
        country: yup.string().optional(),
        remark: yup.string().optional(),
    });

    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { data: companiesData, isLoading: isCompaniesLoading } = useCompanies(1, 100);
    const { data: clientsData, isLoading: isClientsLoading } = useClients(1, 100);
    const { mutateAsync, isPending, isError, error } = useCreateCustomerAdmin();

    const [selectedCompanies, setSelectedCompanies] = useState<Array<{ id: string; name: string }>>([]);
    const [selectedClients, setSelectedClients] = useState<Array<{ id: string; name: string }>>([]);
    const [backendErrors, setBackendErrors] = useState<string[]>([]);

    const {
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<FormInputs>({
        resolver: yupResolver(schema),
        defaultValues: {
            email: '',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            address: '',
            phoneNumber: '',
            postcode: '',
            city: '',
            country: '',
            remark: '',
        },
    });

    // Check access permissions
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        setBackendErrors([]); // Clear previous errors
        try {
            // Clean data by removing empty strings and null values
            const cleanedData = Object.fromEntries(
                Object.entries(data).filter(([key, value]) =>
                    value !== undefined && value !== null && value !== ''
                )
            ) as FormInputs;

            // Add roles and associations
            const payload = {
                ...cleanedData,
                roles: ['customerAdmin'],
                companyIds: selectedCompanies.map(c => c.id),
                clientIds: selectedClients.map(c => c.id),
            };

            await mutateAsync(payload);
            reset();
            setSelectedCompanies([]);
            setSelectedClients([]);
            setBackendErrors([]);
            router.push('/admins');
        } catch (err: any) {
            // Extract backend errors if available
            if (err?.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                setBackendErrors(err.response.data.errors);
            } else if (err?.message) {
                setBackendErrors([err.message]);
            }
        }
    };

    if (authLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated || !isGlobalAdmin) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{t('admins.create.errors.noPermission')}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="800px" p={4}>
            {/* Header Block */}
            <Box mb={4}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                    {t('admins.create.title')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {t('admins.create.subtitle')}
                </Typography>
            </Box>

            {/* Form Block */}
            <Box>
                {/* Display backend errors */}
                {backendErrors.length > 0 && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                            {t('admins.create.errors.validationFailed')}
                        </Typography>
                        <Box component="ul" sx={{ m: 0, pl: 2 }}>
                            {backendErrors.map((err, index) => (
                                <li key={index}>
                                    <Typography variant="body2">{err}</Typography>
                                </li>
                            ))}
                        </Box>
                    </Alert>
                )}

                {/* Display generic error if no specific backend errors */}
                {isError && backendErrors.length === 0 && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error?.message || t('admins.create.errors.createFailed')}
                    </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* General Information Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('admins.create.sections.general')}
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            {/* First Name */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="firstName"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('admins.create.fields.firstName.label')}
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.firstName}
                                            helperText={errors.firstName?.message}
                                            required
                                        />
                                    )}
                                />
                            </Grid>
                            {/* Last Name */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="lastName"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('admins.create.fields.lastName.label')}
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.lastName}
                                            helperText={errors.lastName?.message}
                                            required
                                        />
                                    )}
                                />
                            </Grid>
                            {/* Email */}
                            <Grid item xs={12}>
                                <Controller
                                    name="email"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('admins.create.fields.email.label')}
                                            type="email"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.email}
                                            helperText={errors.email?.message}
                                            required
                                        />
                                    )}
                                />
                            </Grid>
                            {/* Password */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="password"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('admins.create.fields.password.label')}
                                            type="password"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.password}
                                            helperText={errors.password?.message || t('admins.create.fields.password.hint')}
                                            required
                                        />
                                    )}
                                />
                            </Grid>
                            {/* Confirm Password */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="confirmPassword"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('admins.create.fields.confirmPassword.label')}
                                            type="password"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.confirmPassword}
                                            helperText={errors.confirmPassword?.message}
                                            required
                                        />
                                    )}
                                />
                            </Grid>
                            {/* Phone Number */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="phoneNumber"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('admins.create.fields.phoneNumber.label')}
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.phoneNumber}
                                            helperText={errors.phoneNumber?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            {/* Address */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="address"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('admins.create.fields.address.label')}
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.address}
                                            helperText={errors.address?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            {/* Postcode */}
                            <Grid item xs={12} sm={4}>
                                <Controller
                                    name="postcode"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('admins.create.fields.postcode.label')}
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.postcode}
                                            helperText={errors.postcode?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            {/* City */}
                            <Grid item xs={12} sm={4}>
                                <Controller
                                    name="city"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('admins.create.fields.city.label')}
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.city}
                                            helperText={errors.city?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            {/* Country */}
                            <Grid item xs={12} sm={4}>
                                <Controller
                                    name="country"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('admins.create.fields.country.label')}
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

                    {/* Associations Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('admins.create.sections.associations')}
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            {/* Companies */}
                            <Grid item xs={12}>
                                <Autocomplete
                                    multiple
                                    options={companiesData?.data || []}
                                    getOptionLabel={(option) => option.name}
                                    value={selectedCompanies}
                                    onChange={(_, newValue) => setSelectedCompanies(newValue)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={t('admins.create.fields.companies.label')}
                                            variant="outlined"
                                            margin="normal"
                                            fullWidth
                                        />
                                    )}
                                    loading={isCompaniesLoading}
                                    isOptionEqualToValue={(option, val) => option.id === val.id}
                                />
                            </Grid>
                            {/* Clients */}
                            <Grid item xs={12}>
                                <Autocomplete
                                    multiple
                                    options={clientsData?.data || []}
                                    getOptionLabel={(option) => option.name}
                                    value={selectedClients}
                                    onChange={(_, newValue) => setSelectedClients(newValue)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={t('admins.create.fields.clients.label')}
                                            variant="outlined"
                                            margin="normal"
                                            fullWidth
                                        />
                                    )}
                                    loading={isClientsLoading}
                                    isOptionEqualToValue={(option, val) => option.id === val.id}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Remark Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('admins.create.sections.remark')}
                        </Typography>
                        <Controller
                            name="remark"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label={t('admins.create.fields.remark.label')}
                                    fullWidth
                                    margin="normal"
                                    variant="outlined"
                                    multiline
                                    rows={4}
                                    placeholder={t('admins.create.fields.remark.placeholder')}
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
                            {isPending ? t('admins.create.buttons.submitting') : t('admins.create.buttons.submit')}
                        </Button>
                    </Box>
                </form>
            </Box>
        </Box>
    );
}

