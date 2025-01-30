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
import { useUpdateCompany } from '@/hooks/useUpdateCompany';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth'; // Ensure this hook is correctly implemented
import { useCompanyDetails } from '@/hooks/useCompanyDetails';

type FormInputs = {
    name: string;
};

// *** Validation Schema ***
const schema = yup.object().shape({
    name: yup.string().required('Company name is required'),
});

export default function EditCompanyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const companyId = searchParams.get('id') as string;
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    // Fetch company details
    const { data: company, isLoading: isLoadingCompany, isError: isErrorCompany, error: companyError } = useCompanyDetails(companyId);

    // Initialize the update company mutation hook
    const { mutateAsync, isPending: isUpdating, isError: isUpdateError, error: updateError } = useUpdateCompany();

    // Form setup
    const {
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<FormInputs>({
        resolver: yupResolver(schema),
        defaultValues: {
            name: company?.name || '',
        },
    });

    // Populate form with existing company data when fetched
    useEffect(() => {
        if (company) {
            reset({ name: company.name });
        }
    }, [company, reset]);

    // Access control: Only allow 'globalAdmin' or 'customerAdmin'
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));

        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login'); // Redirect to login if not authorized
        }
    }, [isAuthenticated, authLoading, router, user?.roles]);

    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        try {
            await mutateAsync({ id: companyId, name: data.name });
            reset();
            router.push(`/companies/${companyId}`); // Redirect to Company Detail page after update
        } catch (err) {
            // Error handling is managed by isUpdateError and updateError
        }
    };

    // Display loading state while fetching company details or during auth checks
    if (authLoading || isLoadingCompany) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    // Display error if fetching company details fails
    if (isErrorCompany) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{companyError.message || 'Failed to load company details.'}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="500px" mx="auto" p={2}>
            <Typography variant="h5" gutterBottom>
                Edit Company
            </Typography>

            {isUpdateError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {updateError.message || 'Failed to update company.'}
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
                        disabled={isUpdating}
                        startIcon={isUpdating ? <CircularProgress size={20} /> : null}
                    >
                        {isUpdating ? 'Updating...' : 'Update Company'}
                    </Button>
                </Box>
            </form>
        </Box>
    );
}
