'use client';

import React, {useEffect, useState, useMemo} from 'react';
import {Controller, SubmitHandler, useForm} from 'react-hook-form';
import {Alert, Box, Button, CircularProgress, TextField, Typography,} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import {useRouter, useSearchParams} from 'next/navigation';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {useCompanies} from '@/hooks/useCompanies';
import {Company, SurchargeInput, useCreateSurcharge} from '@/hooks/useCreateSurcharge';
import {useAuth} from "@/hooks/useAuth";
import { useTranslations } from 'next-intl';

export default function CreateSurchargeComponent() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const clientId = searchParams.get('clientId') ?? '';
    const t = useTranslations('surcharges.create');

    // --- VALIDATION SCHEMA ---
    const surchargeSchema = useMemo(() => yup.object().shape({
        value: yup.number().positive(t('fields.value.positive')).required(t('fields.value.required')),
        company: yup
            .object({
                id: yup.string().required(),
                name: yup.string().required(),
            })
            .nullable()
            .required(t('fields.company.required')),
    }), [t]);

    // Fetch companies
    const { data: companiesData, isLoading: isLoadingCompanies } = useCompanies(1, 1000);

    // Mutation Hook
    const { mutateAsync, isPending } = useCreateSurcharge();

    // For mutation errors
    const [mutationError, setMutationError] = useState<string | null>(null);

    // Form Handling
    const {
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = useForm<SurchargeInput>({
        resolver: yupResolver(surchargeSchema),
        defaultValues: {
            value: 0,
            company: { id: '', name: '' },
            clientId
        },
    });

    // Access control
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, user?.roles, router]);

    // Submit Handler
    const onSubmit: SubmitHandler<SurchargeInput> = async (data) => {
        setMutationError(null);
        try {
            await mutateAsync(data);
            router.push(`/surcharges/${clientId}`);
        } catch (err: any) {
            console.error(err)
            setMutationError(err.response.data.errors[0] || err.message);
        }
    };

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

                {/* Company Selection */}
                <Controller
                    name="company"
                    control={control}
                    render={({ field }) => (
                        <Autocomplete<Company, false, false, false>
                            options={companiesData?.data || []}
                            getOptionLabel={(option) => option.name ?? ''}
                            loading={isLoadingCompanies}
                            value={field.value ?? null}          // Must allow null
                            onChange={(_, newValue) => setValue('company', (newValue as Company))}
                            isOptionEqualToValue={(option, val) => option.id === val?.id}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('fields.company.label')}
                                    variant="outlined"
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.company}
                                    helperText={errors.company?.message}
                                    required
                                />
                            )}
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
