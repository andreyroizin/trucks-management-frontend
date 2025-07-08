'use client';

import {useEffect, useState} from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { changePassword } from '@/utils/api';
import {useAuth} from "@/hooks/useAuth";
import {useRouter} from "next/navigation";

// Validation schema
const changePasswordSchema = yup.object().shape({
    oldPassword: yup.string().required('Old Password is required'),
    newPassword: yup.string().min(6, 'Password must be at least 6 characters').required('New Password is required'),
    confirmNewPassword: yup
        .string()
        .oneOf([yup.ref('newPassword')], 'Passwords must match')
        .required('Confirm New Password is required'),
});

type ChangePasswordFormInputs = {
    oldPassword: string;
    newPassword: string;
    confirmNewPassword: string;
};

export default function ChangePasswordPage() {
    const { user, isAuthenticated, loading: loadingUser } = useAuth();
    const { register, handleSubmit, formState: { errors } } = useForm<ChangePasswordFormInputs>({
        resolver: yupResolver(changePasswordSchema),
    });

    const router = useRouter();
    const [apiError, setApiError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!loading && (!isAuthenticated)) {
            router.push('/auth/login'); // Redirect to login if not authorized
        }
    }, [isAuthenticated, loading, loadingUser, user, router]);

    const onSubmit: SubmitHandler<ChangePasswordFormInputs> = async (data) => {
        setApiError(null);
        setSuccessMessage(null);
        setLoading(true);

        try {
            const response = await changePassword(data);

            if (response.isSuccess) {
                setSuccessMessage(response.data); // Use the success message from the API response
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
                    Change Password
                </Typography>

                {/* Display API Error */}
                {apiError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {apiError}
                    </Alert>
                )}

                {/* Display Success Message */}
                {successMessage && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {successMessage}
                    </Alert>
                )}

                {!successMessage && (
                    <>
                        <TextField
                            label="Old Password"
                            type="password"
                            fullWidth
                            variant="outlined"
                            {...register('oldPassword')}
                            error={!!errors.oldPassword}
                            helperText={errors.oldPassword?.message}
                            sx={{ mb: 2 }}
                            disabled={loading}
                        />

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
                            label="Confirm New Password"
                            type="password"
                            fullWidth
                            variant="outlined"
                            {...register('confirmNewPassword')}
                            error={!!errors.confirmNewPassword}
                            helperText={errors.confirmNewPassword?.message}
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
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Change Password'}
                        </Button>
                    </>
                )}
            </form>
        </div>
    );
}
