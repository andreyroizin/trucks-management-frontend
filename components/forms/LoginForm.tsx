'use client';

import { useAuth } from '@/hooks/useAuth';
import { useForm, SubmitHandler } from 'react-hook-form';
import { TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import * as yup from 'yup';
import {useRouter} from "next/navigation";
import {useTranslations} from 'next-intl';
import { getCurrentUser } from '@/utils/api';

type LoginFormInputs = {
    email: string;
    password: string;
};

export default function LoginForm() {
    const { login } = useAuth();
    const t = useTranslations();
    const router = useRouter();
    
    // Validation schema - moved inside component to access translations
    const loginSchema = yup.object().shape({
        email: yup.string().email(t('auth.login.validation.emailInvalid')).required(t('auth.login.validation.emailRequired')),
        password: yup.string().min(6, t('auth.login.validation.passwordMinLength')).required(t('auth.login.validation.passwordRequired')),
    });
    
    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
        resolver: yupResolver(loginSchema),
    });
    const [apiError, setApiError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
        setApiError(null); // Clear previous error
        setLoading(true); // Start loading
        try {
            const response = await login(data);

            if (!response.isSuccess) {
                setApiError(response.errors?.[0] || t('auth.login.errors.unknownError'));
            } else {
                const user = await getCurrentUser();
                if (user.roles.includes('driver')) {
                    router.push('/dashboard/driver');
                } else {
                    router.push('/');
                }
            }
        } catch (error: any) {
            console.error('Error:', error);
            setApiError(error.message || t('auth.login.errors.unexpectedError'));
        } finally {
            setLoading(false); // End loading
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
            <Typography variant="h5" sx={{ marginBottom: '1rem' }}>
                {t('auth.login.title')}
            </Typography>

            {/* Display API error message */}
            {apiError && <Alert severity="error" sx={{ marginBottom: '1rem' }}>{apiError}</Alert>}

            <TextField
                label={t('auth.login.fields.email')}
                fullWidth
                variant="outlined"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{ marginBottom: '1rem' }}
                disabled={loading} // Disable input while loading
            />
            <TextField
                label={t('auth.login.fields.password')}
                fullWidth
                type="password"
                variant="outlined"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                sx={{ marginBottom: '1rem' }}
                disabled={loading} // Disable input while loading
            />
            <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ marginTop: '1rem' }}
                disabled={loading} // Disable button while loading
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : t('auth.login.button')}
            </Button>
        </form>
    );
}
