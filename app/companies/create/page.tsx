// app/companies/create/page.tsx

'use client';

import React, { useEffect } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
} from '@mui/material';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreateCompany } from '@/hooks/useCreateCompany';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth'; // Ensure this hook is correctly implemented
import { useUserDetails } from '@/hooks/useUser';

// *** Validation Schema ***
const schema = yup.object().shape({
    name: yup.string().required('Company name is required'),
});

// *** Type for Form Inputs ***
type FormInputs = {
    name: string;
};

export default function CreateCompanyPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    // Initialize the create company mutation hook
    const { mutateAsync, isPending, isError, error } = useCreateCompany();

    // Form setup
    const {
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<FormInputs>({
        resolver: yupResolver(schema),
        defaultValues: {
            name: '',
        },
    });

    // Access control: Only allow 'globalAdmin' or 'customerAdmin'
    useEffect(() => {
        const allowedRoles = ['globalAdmin'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));

        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login'); // Redirect to login if not authorized
        }
    }, [isAuthenticated, authLoading, router, user?.roles]);

    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        try {
            await mutateAsync(data);
            reset();
            router.push('/companies'); // Redirect to Companies page after creation
        } catch (err) {
            // Error handling is managed by isError and error
        }
    };

    // Display loading state while fetching user details or during auth checks
    if (authLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box maxWidth="500px" mx="auto" p={2}>
            <Typography variant="h5" gutterBottom>
                Add New Company
            </Typography>

            {isError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error.message || 'Failed to create company.'}
                </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
                <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Company Name"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            error={!!errors.name}
                            helperText={errors.name?.message}
                            required
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
                        {isPending ? 'Creating...' : 'Create Company'}
                    </Button>
                </Box>
            </form>
        </Box>
    );
}
