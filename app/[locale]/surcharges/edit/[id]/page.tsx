'use client';

import { useParams, useRouter } from 'next/navigation';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { Box, Typography, TextField, Button, CircularProgress, Alert } from '@mui/material';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useEffect, useState } from 'react';
import { useSurchargeDetails } from '@/hooks/useSurchargeDetails';
import { useEditSurcharge } from '@/hooks/useEditSurcharge';
import { useAuth } from '@/hooks/useAuth';

// --- VALIDATION SCHEMA ---
const editSurchargeSchema = yup.object().shape({
    value: yup.number().positive('Value must be greater than zero').required('Value is required'),
});

// --- FORM INPUT TYPE ---
type EditSurchargeFormInputs = {
    value: number;
};

export default function EditSurchargePage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { data: surcharge, isLoading, isError } = useSurchargeDetails(id as string);
    const { mutateAsync: mutateEditSurcharge, isPending } = useEditSurcharge();

    // Roles logic
    const isCustomerAdmin = user?.roles.includes('customerAdmin');
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    const [apiError, setApiError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || (!isCustomerAdmin && !isGlobalAdmin))) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, isCustomerAdmin, isGlobalAdmin, router]);

    // Setup form
    const { handleSubmit, control, setValue, formState: { errors } } = useForm<EditSurchargeFormInputs>({
        resolver: yupResolver(editSurchargeSchema),
        defaultValues: {
            value: 0,
        },
    });

    useEffect(() => {
        if (surcharge) {
            setValue('value', surcharge.value);
        }
    }, [surcharge, setValue]);

    // Submit handler
    const onSubmit: SubmitHandler<EditSurchargeFormInputs> = async (data) => {
        setApiError(null);
        setSuccessMessage(null);

        try {
            await mutateEditSurcharge({ id: id as string, value: data.value });
            setSuccessMessage('Surcharge updated successfully!');
            router.push(`/surcharges/detail/${id}`);
        } catch (error: any) {
            setApiError(error.message || 'An unexpected error occurred.');
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isError || !surcharge) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">Failed to load surcharge details. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="600px" mx="auto" p={4}>
            <Typography variant="h4" gutterBottom>
                Edit Surcharge
            </Typography>

            {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
            {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

            <form onSubmit={handleSubmit(onSubmit)}>
                <Controller
                    name="value"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Surcharge Value"
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

                <Box mt={3}>
                    <Button type="submit" variant="contained" color="primary" fullWidth disabled={isPending}>
                        {isPending ? <CircularProgress size={20} /> : 'Save Changes'}
                    </Button>
                </Box>
            </form>
        </Box>
    );
}
