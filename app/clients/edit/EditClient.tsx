// app/clients/edit/page.tsx

'use client';

import React, { useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Autocomplete,
} from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import { Controller, useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '@/hooks/useAuth';
import { useCompanies } from '@/hooks/useCompanies'; // reuse for company list
import { useClientDetails } from '@/hooks/useClientDetails'; // fetch existing client data
import { useEditClient } from '@/hooks/useEditClient'; // the mutation hook that uses isPending

// *** Validation Schema ***
const schema = yup.object().shape({
    id:          yup.string().required(),
    name:        yup.string().required('Client name is required'),
    tav:         yup.string().optional(),
    address:     yup.string().optional(),
    postcode:    yup.string().optional(),
    city:        yup.string().optional(),
    country:     yup.string().optional(),
    phoneNumber: yup.string().optional(),
    email:       yup.string().optional(),
    remark:      yup.string().optional(),
    companyId:   yup.string().required('Company is required'),
});

// *** FormInputs Type ***
type FormInputs = {
    id: string;
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

export default function EditClientPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const clientId = searchParams.get('id') || '';

    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { data: companiesData, isLoading: isCompaniesLoading } = useCompanies();
    const {
        data: clientData,
        isLoading: isClientLoading,
        isError: isClientError,
        error: clientError,
    } = useClientDetails(clientId);

    const { mutateAsync, isPending, isError, error } = useEditClient();

    // Set up form
    const {
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<FormInputs>({
        resolver: yupResolver(schema),
        defaultValues: {
            id: clientId,
            name: '',
            tav: '',
            address: '',
            postcode: '',
            city: '',
            country: '',
            phoneNumber: '',
            email: '',
            remark: '',
            companyId: '',
        },
    });

    // Access control
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'employer'];
        const hasAccess = user?.roles.some(r => allowedRoles.includes(r));
        if (!authLoading && (!isAuthenticated || !hasAccess)) router.push('/auth/login');
    }, [authLoading, isAuthenticated, router, user?.roles]);

    // Prefill data once fetched
    useEffect(() => {
        if (clientData) {
            reset({
                id:        clientData.id,
                name:      clientData.name,
                tav:       clientData.tav || '',
                address:   clientData.address || '',
                postcode:  clientData.postcode || '',
                city:      clientData.city || '',
                country:   clientData.country || '',
                phoneNumber: clientData.phoneNumber || '',
                email:     clientData.email || '',
                remark:    clientData.remark || '',
                companyId: clientData.company.id,
            });
        }
    }, [clientData, reset]);

    // Submit handler
    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        try {
            await mutateAsync(data);
            router.push(`/clients/${clientId}`);
        } catch {
            // Error handled by isError / error
        }
    };

    // Loading states
    if (authLoading || isClientLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }
    if (isClientError) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{clientError?.message || 'Failed to load client.'}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="500px" mx="auto" p={2}>
            <Typography variant="h5" gutterBottom>
                Edit Client
            </Typography>

            {isError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error?.message || 'Failed to edit client.'}
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

                {/* Additional fields */}
                <Controller
                    name="tav"
                    control={control}
                    render={({ field }) => (
                        <TextField {...field} label="TAV" fullWidth margin="normal" variant="outlined" />
                    )}
                />
                <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                        <TextField {...field} label="Address" fullWidth margin="normal" variant="outlined" />
                    )}
                />
                <Controller
                    name="postcode"
                    control={control}
                    render={({ field }) => (
                        <TextField {...field} label="Postcode" fullWidth margin="normal" variant="outlined" />
                    )}
                />
                <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                        <TextField {...field} label="City" fullWidth margin="normal" variant="outlined" />
                    )}
                />
                <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                        <TextField {...field} label="Country" fullWidth margin="normal" variant="outlined" />
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
                        <TextField {...field} label="Email" fullWidth margin="normal" variant="outlined" />
                    )}
                />
                <Controller
                    name="remark"
                    control={control}
                    render={({ field }) => (
                        <TextField {...field} label="Remark" fullWidth margin="normal" variant="outlined" />
                    )}
                />

                {/* MUI Autocomplete for Companies */}
                <Controller
                    name="companyId"
                    control={control}
                    render={({ field }) => (
                        <Autocomplete
                            options={companiesData?.data || []}
                            getOptionLabel={(option) => option.name}
                            onChange={(_, val) => field.onChange(val?.id || '')}
                            value={companiesData?.data.find(c => c.id === field.value) || null}
                            isOptionEqualToValue={(opt, val) => opt.id === val.id}
                            loading={isCompaniesLoading}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Company"
                                    margin="normal"
                                    variant="outlined"
                                    fullWidth
                                    error={!!errors.companyId}
                                    helperText={errors.companyId?.message}
                                />
                            )}
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
                        {isPending ? 'Updating...' : 'Update Client'}
                    </Button>
                </Box>
            </form>
        </Box>
    );
}
