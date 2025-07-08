'use client';

import React, {useEffect, useState} from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Box, Typography, TextField, Button, CircularProgress, Alert } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreateRate, CreateRateInput } from '@/hooks/useCreateRate';
import Link from "next/link";
import {useAuth} from "@/hooks/useAuth";

// --- VALIDATION SCHEMA ---
const rateSchema = yup.object().shape({
    name: yup.string().required('Name is required'),
    value: yup.number().positive('Value must be greater than zero').required('Value is required'),
    clientId: yup.string().required('Client is required'),
});

export default function CreateRatePageWrapper() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const clientId = searchParams.get('clientId') ?? '';

    // Mutation Hook
    const { mutateAsync, isPending } = useCreateRate();

    // State for error messages
    const [mutationError, setMutationError] = useState<string | null>(null);

    // Form Handling
    const {
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<CreateRateInput>({
        resolver: yupResolver(rateSchema),
        defaultValues: { name: '', value: 0, clientId },
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
    const onSubmit: SubmitHandler<CreateRateInput> = async (data) => {
        setMutationError(null);
        try {
            await mutateAsync(data);
            router.push(`/rates/${clientId}`); // Redirect to rates list
        } catch (err: any) {
            setMutationError(err.message);
        }
    };

    return (
        <Box maxWidth="600px" mx="auto" p={4}>
            <Typography variant="h4" gutterBottom>
                Create Rate
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
                            label="Rate Name"
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
                            label="Rate Value"
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
                        {isPending ? <CircularProgress size={20} /> : 'Create Rate'}
                    </Button>
                </Box>
            </form>
        </Box>
    );
}
