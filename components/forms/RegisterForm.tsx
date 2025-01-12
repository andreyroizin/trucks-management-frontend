'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { TextField, Button, Typography, MenuItem, Select, FormControl, InputLabel, Alert } from '@mui/material';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { useCompanies } from '@/hooks/useCompanies';
import { useRoles } from '@/hooks/useRoles';
import { register as registerApi } from '@/utils/api';
import * as yup from 'yup';

// Validation schema
const registerSchema = yup.object().shape({
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password'), null], 'Passwords must match')
        .required('Confirm Password is required'),
    firstName: yup.string().required('First Name is required'),
    lastName: yup.string().required('Last Name is required'),
    companyId: yup.string().required('Company is required'),
    role: yup.string().required('Role is required'),
});

type RegisterFormInputs = {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    companyId: string;
    role: string;
};

export default function RegisterForm() {
    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormInputs>({
        resolver: yupResolver(registerSchema),
    });

    const { data: companies, isLoading: isLoadingCompanies, isError: isErrorCompanies } = useCompanies();
    const { data: roles, isLoading: isLoadingRoles, isError: isErrorRoles } = useRoles();

    const [apiError, setApiError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
        setApiError(null);
        setSuccessMessage(null);

        try {
            const response = await registerApi(data);
            if (response.isSuccess) {
                setSuccessMessage(response.data);
            } else {
                setApiError(response.errors?.[0] || 'Unknown error occurred');
            }
        } catch (error: any) {
            setApiError(error?.response?.data?.errors?.[0]|| 'An unexpected error occurred. Please try again later.');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
            <Typography variant="h5" className="mb-4">Register</Typography>

            {/* Display API Error */}
            {apiError && <Alert severity="error" className="mb-4">{apiError}</Alert>}

            {/* Display Success Message */}
            {successMessage && <Alert severity="success" className="mb-4">{successMessage}</Alert>}

            <TextField
                label="First Name"
                fullWidth
                variant="outlined"
                {...register('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
                className="mb-4"
            />

            <TextField
                label="Last Name"
                fullWidth
                variant="outlined"
                {...register('lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
                className="mb-4"
            />

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

            {/* Company Select */}
            <FormControl fullWidth className="mb-4" error={!!errors.companyId}>
                <InputLabel>Company</InputLabel>
                <Select
                    defaultValue=""
                    {...register('companyId')}
                >
                    <MenuItem value="" disabled>
                        {isLoadingCompanies ? 'Loading companies...' : 'Select a company'}
                    </MenuItem>
                    {isErrorCompanies && <MenuItem disabled>Error loading companies</MenuItem>}
                    {companies?.map((company) => (
                        <MenuItem key={company.id} value={company.id}>
                            {company.name}
                        </MenuItem>
                    ))}
                </Select>
                <Typography variant="caption" color="error">
                    {errors.companyId?.message}
                </Typography>
            </FormControl>

            {/* Role Select */}
            <FormControl fullWidth className="mb-4" error={!!errors.role}>
                <InputLabel>Role</InputLabel>
                <Select
                    defaultValue=""
                    {...register('role')}
                >
                    <MenuItem value="" disabled>
                        {isLoadingRoles ? 'Loading roles...' : 'Select a role'}
                    </MenuItem>
                    {isErrorRoles && <MenuItem disabled>Error loading roles</MenuItem>}
                    {roles?.map((role) => (
                        <MenuItem key={role.id} value={role.name}>
                            {role.name}
                        </MenuItem>
                    ))}
                </Select>
                <Typography variant="caption" color="error">
                    {errors.role?.message}
                </Typography>
            </FormControl>

            <Button type="submit" variant="contained" color="primary" fullWidth className="mt-4">
                Register
            </Button>
        </form>
    );
}
