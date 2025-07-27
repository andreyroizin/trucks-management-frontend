'use client';

import {useEffect, useState} from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { changePassword } from '@/utils/api';
import {useAuth} from "@/hooks/useAuth";
import {useRouter} from "next/navigation";
import {useTranslations} from 'next-intl';

type ChangePasswordFormInputs = {
    oldPassword: string;
    newPassword: string;
    confirmNewPassword: string;
};

export default function ChangePasswordPage() {
    const { user, isAuthenticated, loading: loadingUser } = useAuth();
    const router = useRouter();
    const t = useTranslations();
    
    // Validation schema - moved inside component to access translations
    const changePasswordSchema = yup.object().shape({
        oldPassword: yup.string().required(t('auth.changePassword.validation.oldPasswordRequired')),
        newPassword: yup.string().min(6, t('auth.changePassword.validation.passwordMinLength')).required(t('auth.changePassword.validation.newPasswordRequired')),
        confirmNewPassword: yup
            .string()
            .oneOf([yup.ref('newPassword')], t('auth.changePassword.validation.passwordsMatch'))
            .required(t('auth.changePassword.validation.confirmPasswordRequired')),
    });
    
    const { register, handleSubmit, formState: { errors } } = useForm<ChangePasswordFormInputs>({
        resolver: yupResolver(changePasswordSchema),
    });

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
                setApiError(response.errors?.[0] || t('auth.changePassword.errors.unexpectedError'));
            }
        } catch (error: any) {
            setApiError(error?.response?.data?.errors?.[0] || t('auth.changePassword.errors.tryAgainLater'));
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
                    {t('auth.changePassword.title')}
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
                            label={t('auth.changePassword.fields.oldPassword')}
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
                            label={t('auth.changePassword.fields.newPassword')}
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
                            label={t('auth.changePassword.fields.confirmNewPassword')}
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
                            {loading ? <CircularProgress size={24} color="inherit" /> : t('auth.changePassword.button')}
                        </Button>
                    </>
                )}
            </form>
        </div>
    );
}
