"use client"

import { useAuth } from '@/hooks/useAuth';
import { useForm, SubmitHandler } from 'react-hook-form';
import { TextField, Button, Typography } from '@mui/material';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

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

    const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
        try {
            await login(data);
            console.log('Logged in successfully');
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
            <Typography variant="h5" className="mb-4">
                Login
            </Typography>
            <TextField
                label="Email"
                fullWidth
                variant="outlined"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                className="mb-4"
            />
            <TextField
                label="Password"
                fullWidth
                type="password"
                variant="outlined"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                className="mb-4"
            />
            <Button type="submit" variant="contained" color="primary" fullWidth className="mt-4">
                Login
            </Button>
        </form>
    );
}
