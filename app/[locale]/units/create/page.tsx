'use client';

import React, { useEffect, useState } from 'react';
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
import { useCreateUnit, CreateUnitInput } from '@/hooks/useCreateUnit';
import { useRouter } from 'next/navigation';

// --- VALIDATION SCHEMA ---
const unitSchema = yup.object().shape({
    value: yup.string().required('Unit value is required'),
});

// --- COMPONENT ---
export default function CreateUnitPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    // Check for global admin
    useEffect(() => {
        if (!authLoading && (!isAuthenticated || !isGlobalAdmin)) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, isGlobalAdmin, router]);

    // Mutation Hook
    const { mutateAsync, isPending } = useCreateUnit();

    // Local error state for the mutation
    const [mutationError, setMutationError] = useState<string | null>(null);

    // Form Handling
    const {
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<CreateUnitInput>({
        resolver: yupResolver(unitSchema),
        defaultValues: { value: '' },
    });

    // Submit Handler
    const onSubmit: SubmitHandler<CreateUnitInput> = async (data) => {
        setMutationError(null);
        try {
            await mutateAsync(data);
            router.push('/units'); // Redirect to the units list
        } catch (err: any) {
            setMutationError(err.message);
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
        <Box maxWidth="600px" mx="auto" p={4}>
            <Typography variant="h4" gutterBottom>
                Create Unit
            </Typography>

            {/* Display any mutation error */}
            {mutationError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {mutationError}
                </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
                <Controller
                    name="value"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Unit Value"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            error={!!errors.value}
                            helperText={errors.value?.message}
                            required
                        />
                    )}
                />

                <Box mt={3}>
                    <Button type="submit" variant="contained" color="primary" fullWidth disabled={isPending}>
                        {isPending ? <CircularProgress size={20} /> : 'Create Unit'}
                    </Button>
                </Box>
            </form>
        </Box>
    );
}
