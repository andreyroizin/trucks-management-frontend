'use client';

import React, { useEffect, useState } from 'react';
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
import { useParams, useRouter } from 'next/navigation';
import { Controller, useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerAdminDetail } from '@/hooks/useCustomerAdminDetail';
import { useCompanies } from '@/hooks/useCompanies';
import { useClients } from '@/hooks/useClients';
import { useUpdateCustomerAdmin } from '@/hooks/useUpdateCustomerAdmin';
import { useUpdateCustomerAdminAssociations } from '@/hooks/useUpdateCustomerAdminAssociations';

type FormInputs = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    address?: string;
    phoneNumber?: string;
    postcode?: string;
    city?: string;
    country?: string;
    remark?: string;
};

export default function EditCustomerAdminPage() {
    const t = useTranslations();

    const schema = yup.object().shape({
        id: yup.string().required(),
        email: yup.string().email(t('admins.create.fields.email.invalid')).required(t('admins.create.fields.email.required')),
        firstName: yup.string().required(t('admins.create.fields.firstName.required')),
        lastName: yup.string().required(t('admins.create.fields.lastName.required')),
        address: yup.string().optional(),
        phoneNumber: yup.string().optional(),
        postcode: yup.string().optional(),
        city: yup.string().optional(),
        country: yup.string().optional(),
        remark: yup.string().optional(),
    });

    const { id } = useParams();
    const router = useRouter();
    const adminId = id as string;

    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const {
        data: adminData,
        isLoading: isAdminLoading,
        isError: isAdminError,
        error: adminError,
    } = useCustomerAdminDetail(adminId);

    const { data: companiesData, isLoading: isCompaniesLoading } = useCompanies(1, 100);
    const { data: clientsData, isLoading: isClientsLoading } = useClients(1, 100);
    const { mutateAsync: updateBasic, isPending: isPendingBasic, isError: isErrorBasic, error: errorBasic } = useUpdateCustomerAdmin();
    const { mutateAsync: updateAssociations, isPending: isPendingAssociations, isError: isErrorAssociations, error: errorAssociations } = useUpdateCustomerAdminAssociations();

    const [selectedCompanies, setSelectedCompanies] = useState<Array<{ id: string; name: string }>>([]);
    const [selectedClients, setSelectedClients] = useState<Array<{ id: string; name: string }>>([]);

    // Set up form
    const {
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<FormInputs>({
        resolver: yupResolver(schema),
        defaultValues: {
            id: adminId,
            email: '',
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

    // Access control
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || !isGlobalAdmin)) router.push('/auth/login');
    }, [authLoading, isAuthenticated, isGlobalAdmin, router]);

    // Prefill data once fetched
    useEffect(() => {
        if (adminData) {
            reset({
                id: adminData.id,
                email: adminData.email,
                firstName: adminData.firstName,
                lastName: adminData.lastName,
                address: adminData.address || '',
                phoneNumber: adminData.phoneNumber || '',
                postcode: adminData.postcode || '',
                city: adminData.city || '',
                country: adminData.country || '',
                remark: adminData.remark || '',
            });

            // Set associations
            const companies = adminData.contactPersonInfo?.clientsCompanies
                ?.filter(cc => cc.companyId && cc.companyName)
                .map(cc => ({ id: cc.companyId!, name: cc.companyName! })) || [];

            const clients = adminData.contactPersonInfo?.clientsCompanies
                ?.filter(cc => cc.clientId && cc.clientName)
                .map(cc => ({ id: cc.clientId!, name: cc.clientName! })) || [];

            setSelectedCompanies(companies);
            setSelectedClients(clients);
        }
    }, [adminData, reset]);

    // Submit handler
    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        try {
            // Update basic info
            const cleanedBasic = {
                id: data.id,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                ...(data.address && data.address !== '' && { address: data.address }),
                ...(data.phoneNumber && data.phoneNumber !== '' && { phoneNumber: data.phoneNumber }),
                ...(data.postcode && data.postcode !== '' && { postcode: data.postcode }),
                ...(data.city && data.city !== '' && { city: data.city }),
                ...(data.country && data.country !== '' && { country: data.country }),
                ...(data.remark && data.remark !== '' && { remark: data.remark }),
            };

            await updateBasic(cleanedBasic);

            // Update associations
            await updateAssociations({
                userId: data.id,
                companyIds: selectedCompanies.map(c => c.id),
                clientIds: selectedClients.map(c => c.id),
            });

            router.push(`/admins/${adminId}`);
        } catch {
            // Error handled by isError / error
        }
    };

    // Loading states
    if (authLoading || isAdminLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }
    if (isAdminError) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{adminError?.message || t('admins.edit.errors.loadFailed')}</Alert>
            </Box>
        );
    }

    const isPending = isPendingBasic || isPendingAssociations;
    const isError = isErrorBasic || isErrorAssociations;
    const error = errorBasic || errorAssociations;

    return (
        <Box maxWidth="800px" p={4}>
            {/* Header Block */}
            <Box mb={4}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                    {t('admins.edit.title')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {t('admins.edit.subtitle')}
                </Typography>
            </Box>

            {/* Form Block */}
            <Box>
                {isError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error?.message || t('admins.edit.errors.updateFailed')}
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
                            {isPending ? t('admins.edit.buttons.submitting') : t('admins.edit.buttons.submit')}
                        </Button>
                    </Box>
                </form>
            </Box>
        </Box>
    );
}

