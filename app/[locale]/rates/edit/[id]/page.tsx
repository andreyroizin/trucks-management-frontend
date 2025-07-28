'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import {
    Box,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Alert,
} from '@mui/material';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '@/hooks/useAuth';
import { useRateDetail } from '@/hooks/useRateDetail';
import { useEditRate, EditRateInput } from '@/hooks/useEditRate';
import { useTranslations } from 'next-intl';

export default function EditRatePage() {
    const router = useRouter();
    const { id } = useParams();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const t = useTranslations('rates.edit');

    // Validation Schema
    const rateSchema = useMemo(() => yup.object().shape({
        name: yup.string().required(t('fields.name.required')),
        value: yup.number().positive(t('fields.value.positive')).required(t('fields.value.required')),
    }), [t]);

    // Fetch rate details
    const { data: rate, isLoading, isError, error } = useRateDetail(id as string);

    // Edit Mutation Hook
    const { mutateAsync, isPending } = useEditRate();

    // Access control
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin'];
        const hasAccess = user?.roles.some(r => allowedRoles.includes(r));
        if (!authLoading && (!isAuthenticated || !hasAccess)) router.push('/auth/login');
    }, [authLoading, isAuthenticated, router, user?.roles]);

    // State for API feedback
    const [mutationError, setMutationError] = useState<string | null>(null);

    // Form Handling
    const {
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = useForm<EditRateInput>({
        resolver: yupResolver(rateSchema),
        defaultValues: {
            name: '',
            value: 0,
        },
    });

    // Prefill Data
    useEffect(() => {
        if (rate) {
            setValue('name', rate.name);
            setValue('value', rate.value);
        }
    }, [rate, setValue]);

    // Submit Handler
    const onSubmit: SubmitHandler<EditRateInput> = async (data) => {
        setMutationError(null);
        try {
            await mutateAsync({ id: id as string, ...data });
            router.push(`/rates/detail/${id}`);
        } catch (err: any) {
            setMutationError(err.message || t('updateError'));
        }
    };

    if (authLoading || isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isError || !rate) {
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

            {/* Display Mutation Error */}
            {mutationError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {mutationError}
                </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Name Input */}
                <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t('fields.name.label')}
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            error={!!errors.name}
                            helperText={errors.name?.message}
                            required
                        />
                    )}
                />

                {/* Value Input */}
                <Controller
                    name="value"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t('fields.value.label')}
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            type="number"
                            error={!!errors.value}
                            helperText={errors.value?.message}
                            required
                        />
                    )}
                />

                {/* Submit Button */}
                <Box mt={3}>
                    <Button type="submit" variant="contained" color="primary" fullWidth disabled={isPending}>
                        {isPending ? <CircularProgress size={20} /> : t('button')}
                    </Button>
                </Box>
            </form>
        </Box>
    );
}
