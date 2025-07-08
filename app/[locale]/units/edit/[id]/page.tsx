'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Typography, TextField, Button, CircularProgress, Alert } from '@mui/material';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useUnitDetail } from '@/hooks/useUnitDetail'; // If you have a fetch detail hook
import { useEditUnit } from '@/hooks/useEditUnit';
import { useAuth } from '@/hooks/useAuth';

// --- VALIDATION SCHEMA ---
const editUnitSchema = yup.object().shape({
    value: yup.string().required('Unit value is required'),
});

// --- FORM INPUT TYPE ---
type EditUnitFormInputs = {
    value: string;
};

export default function EditUnitPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    // Fetch existing unit detail if you want to prefill
    const { data: unit, isLoading, isError, error } = useUnitDetail(id as string);

    // Mutation Hook
    const { mutateAsync: mutateEditUnit, isPending } = useEditUnit();

    // Local error state
    const [apiError, setApiError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Access control (global admin only)
    useEffect(() => {
        if (!authLoading && (!isAuthenticated || !isGlobalAdmin)) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, isGlobalAdmin, router]);

    // Set up form
    const { handleSubmit, control, setValue, formState: { errors } } = useForm<EditUnitFormInputs>({
        resolver: yupResolver(editUnitSchema),
        defaultValues: {
            value: '',
        },
    });

    // Pre-fill if you fetched detail
    useEffect(() => {
        if (unit) {
            setValue('value', unit.value);
        }
    }, [unit, setValue]);

    // Submit Handler
    const onSubmit: SubmitHandler<EditUnitFormInputs> = async (data) => {
        setApiError(null);
        setSuccessMessage(null);

        try {
            await mutateEditUnit({ id: id as string, value: data.value });
            setSuccessMessage('Unit updated successfully!');
            router.push(`/units/${id}`); // Redirect to detail
        } catch (err: any) {
            setApiError(err.message || 'An unexpected error occurred');
        }
    };

    if (authLoading || isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isError || !unit) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error?.message || 'Failed to load unit details.'}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="600px" mx="auto" p={4}>
            <Typography variant="h4" gutterBottom>
                Edit Unit
            </Typography>

            {apiError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {apiError}
                </Alert>
            )}

            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {successMessage}
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

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={isPending}
                    sx={{ mt: 3 }}
                >
                    {isPending ? <CircularProgress size={20} /> : 'Save Changes'}
                </Button>
            </form>
        </Box>
    );
}
