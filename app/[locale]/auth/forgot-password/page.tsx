'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { TextField, Button, Typography, Alert, CircularProgress, Link as MuiLink } from '@mui/material';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { forgotPassword } from '@/utils/api';
import Link from 'next/link';
import {useTranslations} from 'next-intl';

type ForgotPasswordFormInputs = {
    email: string;
};

export default function ForgotPasswordPage() {
    const t = useTranslations();
    
    // Validation schema - moved inside component to access translations
    const forgotPasswordSchema = yup.object().shape({
        email: yup.string().email(t('auth.forgotPassword.validation.emailInvalid')).required(t('auth.forgotPassword.validation.emailRequired')),
    });
    
    const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormInputs>({
        resolver: yupResolver(forgotPasswordSchema),
    });

    const [apiError, setApiError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const onSubmit: SubmitHandler<ForgotPasswordFormInputs> = async (data) => {
        setApiError(null);
        setSuccessMessage(null);
        setLoading(true);

        try {
            const response = await forgotPassword(data.email);

            if (response.isSuccess) {
                setSuccessMessage(t('auth.forgotPassword.success'));
            } else {
                setApiError(response.errors?.[0] || t('auth.forgotPassword.errors.unexpectedError'));
            }
        } catch (error: any) {
            setApiError(error?.response?.data?.errors?.[0] || t('auth.forgotPassword.errors.tryAgainLater'));
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
                    {t('auth.forgotPassword.title')}
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
                            {t('auth.forgotPassword.goToLogin')}
                        </MuiLink>
                    </>
                )}

                {/* Hide form if success */}
                {!successMessage && (
                    <>
                        <TextField
                            label={t('auth.forgotPassword.fields.email')}
                            fullWidth
                            variant="outlined"
                            {...register('email')}
                            error={!!errors.email}
                            helperText={errors.email?.message}
                            sx={{ mb: 2 }}
                            disabled={loading} // Disable input during loading
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{ mt: 2 }}
                            disabled={loading} // Disable button during loading
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : t('auth.forgotPassword.button')}
                        </Button>
                    </>
                )}
            </form>
        </div>
    );
}
