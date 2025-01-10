"use client"

import { useForm, SubmitHandler } from 'react-hook-form';
import { TextField, Button, Typography } from '@mui/material';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Validation schema
const registerSchema = yup.object().shape({
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    confirmPassword: yup.string()
        .oneOf([yup.ref('password'), null], 'Passwords must match')
        .required('Confirm Password is required'),
});

type RegisterFormInputs = {
    email: string;
    password: string;
    confirmPassword: string;
};

export default function RegisterForm() {
    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormInputs>({
        resolver: yupResolver(registerSchema),
    });

    const onSubmit: SubmitHandler<RegisterFormInputs> = (data) => {
        console.log('Register Data:', data);
        // Replace this with your API call
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full max-w-md p-6 bg-white rounded-lg shadow-md"
        >
            <Typography variant="h5" className="mb-4">
                Register
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

            <TextField
                label="Confirm Password"
                fullWidth
                type="password"
                variant="outlined"
                {...register('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                className="mb-4"
            />

            <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                className="mt-4"
            >
                Register
            </Button>
        </form>
    );
}
