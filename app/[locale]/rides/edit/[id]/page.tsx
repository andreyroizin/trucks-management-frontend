'use client';

import React, {useEffect, useState, useMemo} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {Alert, Box, Button, CircularProgress, FormControl, TextField, Typography,} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import {Controller, SubmitHandler, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';

import {useEditRide} from '@/hooks/useEditRide';
import {useRideDetail} from '@/hooks/useRideDetail'; // to fetch existing ride data
import {useCompanies} from '@/hooks/useCompanies';
import {useAuth} from '@/hooks/useAuth';
import { useTranslations } from 'next-intl';

type UpdateRideFormInputs = {
    name: string;
    remark?: string;
    companyId: string;
};

export default function EditRidePage() {
    const router = useRouter();
    const { id } = useParams();

    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const t = useTranslations('rides.edit');

    // --- Validation Schema ---
    const updateRideSchema = useMemo(() => yup.object().shape({
        name: yup.string().required(t('fields.name.required')),
        remark: yup.string().optional(),
        companyId: yup.string().required(t('fields.company.required')),
    }), [t]);

    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'customer', 'customerAccountant', 'employer'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, authLoading, router, user?.roles]);

    // Fetch existing ride details
    const { data: ride, isLoading, isError, error } = useRideDetail(id as string);

    // Companies for Autocomplete
    const { data: companiesData, isLoading: isLoadingCompanies } = useCompanies(1, 1000);

    // Hook to update ride
    const { mutateAsync: editRide, isPending, isError: isEditError, error: editError } = useEditRide();

    // Local error state
    const [apiError, setApiError] = useState<string | null>(null);

    // React Hook Form
    const {
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = useForm<UpdateRideFormInputs>({
        resolver: yupResolver(updateRideSchema),
        defaultValues: {
            name: '',
            remark: '',
            companyId: '',
        },
    });

    // Pre-fill form with existing data
    useEffect(() => {
        if (ride) {
            setValue('name', ride.name);
            setValue('remark', ride.remark || '');
            setValue('companyId', ride.companyId);
        }
    }, [ride, setValue]);

    // Submit Handler
    const onSubmit: SubmitHandler<UpdateRideFormInputs> = async (data) => {
        setApiError(null);
        try {
            await editRide({ id: id as string, ...data });
            // Navigate away e.g. to ride detail
            router.push(`/rides/${id}`);
        } catch (err: any) {
            setApiError(err.message);
        }
    };

    if (authLoading || isLoading || isLoadingCompanies) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isError || !ride) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error?.message || t('loadError')}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="600px" mx="auto" p={4}>
            <Typography variant="h4" gutterBottom>
                {t('title')}
            </Typography>

            {apiError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {apiError}
                </Alert>
            )}

            {isEditError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {editError?.message || t('updateError')}
                </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Ride Name */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label={t('fields.name.label')}
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
                            <TextField {...field} label={t('fields.remark.label')} variant="outlined" />
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
                                options={companiesData?.data || []}
                                getOptionLabel={(option) => option.name}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                                value={companiesData?.data.find((c) => c.id === field.value) || null}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={t('fields.company.label')}
                                        variant="outlined"
                                        error={!!errors.companyId}
                                        helperText={errors.companyId?.message}
                                    />
                                )}
                            />
                        )}
                    />
                </FormControl>

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={isPending}
                >
                    {isPending ? <CircularProgress size={20} color="inherit" /> : t('button')}
                </Button>
            </form>
        </Box>
    );
}
