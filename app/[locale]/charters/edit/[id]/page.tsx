'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    Box,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Alert,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { useCharterDetail } from '@/hooks/useCharterDetail';  // Hook to fetch existing charter
import { useEditCharter, EditCharterInput } from '@/hooks/useEditCharter';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/hooks/useAuth';
import {useTranslations} from 'next-intl';

export default function EditCharterPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const t = useTranslations();
    
    // *** Validation Schema - moved inside component to access translations ***
    const editCharterSchema = yup.object().shape({
        name: yup.string().required(t('charters.edit.validation.nameRequired')),
        clientId: yup.string().required(t('charters.edit.validation.clientRequired')),
    });

    // Fetch existing data
    const { data: charter, isLoading: isLoadingCharter, isError, error } = useCharterDetail(id as string);

    // Clients data for autocomplete
    const { data: clientsData, isLoading: isLoadingClients } = useClients(1, 1000);

    // useEditCharter hook
    const { mutateAsync: editCharter, isPending } = useEditCharter();

    // Local error message
    const [apiError, setApiError] = useState<string | null>(null);

    // React Hook Form
    const {
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = useForm<EditCharterInput>({
        resolver: yupResolver(editCharterSchema),
        defaultValues: {
            name: '',
            clientId: '',
            remark: '',
        },
    });

    // Access control (optional)
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin'];
        const hasAccess = user?.roles.some(r => allowedRoles.includes(r));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, user?.roles, router]);

    // Prefill form when data arrives
    useEffect(() => {
        if (charter) {
            setValue('name', charter.name);
            setValue('clientId', charter.clientId);
            setValue('remark', charter.remark || '');
        }
    }, [charter, setValue]);

    // Submit Handler
    const onSubmit: SubmitHandler<EditCharterInput> = async (formData) => {
        setApiError(null);
        try {
            await editCharter({ id: id as string, ...formData });
            router.push(`/charters/${id}`); // Go back to detail page or list
        } catch (err: any) {
            setApiError(err.message);
        }
    };

    if (authLoading || isLoadingCharter || isLoadingClients) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isError || !charter) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error?.message || t('charters.edit.errors.loadFailed')}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="600px" mx="auto" p={4}>
            <Typography variant="h4" gutterBottom>
                {t('charters.edit.title')}
            </Typography>

            {apiError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {apiError}
                </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Charter Name */}
                <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t('charters.edit.fields.charterName')}
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            error={!!errors.name}
                            helperText={errors.name?.message}
                            required
                        />
                    )}
                />

                {/* Client Selection */}
                <Controller
                    name="clientId"
                    control={control}
                    render={({ field }) => (
                        <Autocomplete
                            options={clientsData?.data || []}
                            getOptionLabel={(option) => option.name || ''}
                            value={clientsData?.data.find((cl) => cl.id === field.value) || null}
                            onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('charters.edit.fields.selectClient')}
                                    variant="outlined"
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.clientId}
                                    helperText={errors.clientId?.message}
                                    required
                                />
                            )}
                        />
                    )}
                />

                {/* Remark (optional) */}
                <Controller
                    name="remark"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label={t('charters.edit.fields.remark')}
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            error={!!errors.remark}
                            helperText={errors.remark?.message}
                        />
                    )}
                />

                <Box mt={3}>
                    <Button type="submit" variant="contained" color="primary" fullWidth disabled={isPending}>
                        {isPending ? <CircularProgress size={20} /> : t('charters.edit.button')}
                    </Button>
                </Box>
            </form>
        </Box>
    );
}
