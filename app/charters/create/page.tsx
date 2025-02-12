'use client';

import React, { useEffect, useState, Suspense } from 'react';
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
import { useRouter } from 'next/navigation';
import { useCreateCharter, CreateCharterInput } from '@/hooks/useCreateCharter';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/hooks/useAuth';

// *** Validation Schema ***
const charterSchema = yup.object().shape({
    name: yup.string().required('Charter name is required'),
    clientId: yup.string().required('Client is required'),
    remark: yup.string().optional(),
});

function CreateCharterForm() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    // Check roles (example: only globalAdmin or customerAdmin)
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin'];
        const hasAccess = user?.roles.some(r => allowedRoles.includes(r));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, user, router]);

    // Data for clients (Autocomplete)
    const { data: clientsData, isLoading: isLoadingClients } = useClients(1, 1000);

    // Local state for API errors
    const [apiError, setApiError] = useState<string | null>(null);

    // useCreateCharter Hook
    const { mutateAsync, isPending } = useCreateCharter();

    // Setup React Hook Form
    const {
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<CreateCharterInput>({
        resolver: yupResolver(charterSchema),
        defaultValues: {
            name: '',
            clientId: '',
            remark: '',
        },
    });

    // Submit Handler
    const onSubmit: SubmitHandler<CreateCharterInput> = async (data) => {
        setApiError(null);
        try {
            await mutateAsync(data);
            router.push('/charters'); // Navigate to Charters list after creation
        } catch (err: any) {
            setApiError(err.message);
        }
    };

    // Show loading if clients are still fetching
    if (isLoadingClients || authLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box maxWidth="600px" mx="auto" p={4}>
            <Typography variant="h4" gutterBottom>
                Create Charter
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
                            label="Charter Name"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            error={!!errors.name}
                            helperText={errors.name?.message}
                            required
                        />
                    )}
                />

                {/* Autocomplete for Clients */}
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
                                    label="Select Client"
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

                {/* Remark */}
                <Controller
                    name="remark"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Remark"
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
                        {isPending ? <CircularProgress size={20} /> : 'Create Charter'}
                    </Button>
                </Box>
            </form>
        </Box>
    );
}

export default function CreateCharterPage() {
    return (
        <Suspense fallback={<CircularProgress />}>
            <CreateCharterForm />
        </Suspense>
    );
}
