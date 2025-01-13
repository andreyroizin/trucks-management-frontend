'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { TextField, Button, Typography, Alert, CircularProgress, Link as MuiLink } from '@mui/material';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { resetPasswordWithToken } from '@/utils/api';
import { ResetPasswordPayload } from '@/types/api';
import Link from 'next/link';

// Validation schema
const resetPasswordSchema = yup.object().shape({
    newPassword: yup.string().min(6, 'Password must be at least 6 characters').required('New Password is required'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('newPassword'), null], 'Passwords must match')
        .required('Confirm Password is required'),
});

type ResetPasswordFormInputs = {
    newPassword: string;
    confirmPassword: string;
};

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormInputs>({
        resolver: yupResolver(resetPasswordSchema),
    });

    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const onSubmit: SubmitHandler<ResetPasswordFormInputs> = async (data) => {
        setApiError(null);
        setSuccessMessage(null);
        setLoading(true);

        try {
            const payload: ResetPasswordPayload = {
                email,
                token,
                newPassword: data.newPassword,
                confirmPassword: data.confirmPassword,
            };

            const response = await resetPasswordWithToken(payload);

            if (response.isSuccess) {
                setSuccessMessage('Your password has been successfully reset.');
            } else {
                setApiError(response.errors?.[0] || 'An unexpected error occurred.');
            }
        } catch (error: any) {
            setApiError(error?.response?.data?.errors?.[0] || 'An unexpected error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <form
                onSubmit={handleSubmit(onSubmit)}
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    backgroundColor: '#fff',
                    padding: '24px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
            >
                <Typography variant="h5" sx={{ mb: 2 }}>
                    Reset Password
                </Typography>

                {/* Display API Error */}
                {apiError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {apiError}
                    </Alert>
                )}

                {/* Display Success Message */}
                {successMessage && (
                    <>
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {successMessage}
                        </Alert>
                        <MuiLink
                            component={Link}
                            href="/auth/login"
                            variant="body2"
                            sx={{
                                display: 'block',
                                textAlign: 'center',
                                mt: 2,
                                color: 'primary.main',
                                textDecoration: 'underline',
                            }}
                        >
                            Go to Login
                        </MuiLink>
                    </>
                )}

                {!successMessage && (
                    <>
                        <TextField
                            label="New Password"
                            type="password"
                            fullWidth
                            variant="outlined"
                            {...register('newPassword')}
                            error={!!errors.newPassword}
                            helperText={errors.newPassword?.message}
                            sx={{ mb: 2 }}
                            disabled={loading}
                        />

                        <TextField
                            label="Confirm Password"
                            type="password"
                            fullWidth
                            variant="outlined"
                            {...register('confirmPassword')}
                            error={!!errors.confirmPassword}
                            helperText={errors.confirmPassword?.message}
                            sx={{ mb: 2 }}
                            disabled={loading}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{ mt: 2 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
                        </Button>
                    </>
                )}
            </form>
        </div>
    );
}
