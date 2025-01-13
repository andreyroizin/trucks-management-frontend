'use client';

import { useAuth } from '@/hooks/useAuth';
import { useForm, SubmitHandler } from 'react-hook-form';
import { TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import * as yup from 'yup';

// Validation schema
const loginSchema = yup.object().shape({
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

type LoginFormInputs = {
    email: string;
    password: string;
};

export default function LoginForm() {
    const { login } = useAuth();
    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
        resolver: yupResolver(loginSchema),
    });
    const [apiError, setApiError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false); // Loading state

    const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
        setApiError(null); // Clear previous error
        setLoading(true); // Start loading
        try {
            const response = await login(data);

            if (!response.isSuccess) {
                setApiError(response.errors?.[0] || 'Unknown error occurred');
            } else {
                window.location.href = '/'; // Redirect to home page
            }
        } catch (error: any) {
            console.error('Error:', error);
            setApiError(error.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false); // End loading
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
            <Typography variant="h5" sx={{ marginBottom: '1rem' }}>
                Login
            </Typography>

            {/* Display API error message */}
            {apiError && <Alert severity="error" sx={{ marginBottom: '1rem' }}>{apiError}</Alert>}

            <TextField
                label="Email"
                fullWidth
                variant="outlined"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{ marginBottom: '1rem' }}
                disabled={loading} // Disable input while loading
            />
            <TextField
                label="Password"
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
            </Button>
        </form>
    );
}
