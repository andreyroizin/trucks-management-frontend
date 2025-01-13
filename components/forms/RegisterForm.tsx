import { useForm, SubmitHandler } from 'react-hook-form';
import { TextField, Button, Typography, MenuItem, Select, FormControl, InputLabel, Alert, CircularProgress } from '@mui/material';
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
    const [loading, setLoading] = useState(false); // Added loading state

    const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
        setApiError(null);
        setSuccessMessage(null);
        setLoading(true); // Start loading

        try {
            const response = await registerApi(data);
            if (response.isSuccess) {
                setSuccessMessage('Registration successful!');
            } else {
                setApiError(response.errors?.[0] || 'Unknown error occurred');
            }
        } catch (error: any) {
            setApiError(error?.response?.data?.errors?.[0] || 'An unexpected error occurred. Please try again later.');
        } finally {
            setLoading(false); // Stop loading
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
            <Typography variant="h5" sx={{ marginBottom: '1rem' }}>Register</Typography>

            {/* Display API Error */}
            {apiError && <Alert severity="error" sx={{ marginBottom: '1rem' }}>{apiError}</Alert>}

            {/* Display Success Message */}
            {successMessage && <Alert severity="success" sx={{ marginBottom: '1rem' }}>{successMessage}</Alert>}

            <TextField
                label="First Name"
                fullWidth
                variant="outlined"
                {...register('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
                sx={{ marginBottom: '1rem' }}
                disabled={loading} // Disable during loading
            />

            <TextField
                label="Last Name"
                fullWidth
                variant="outlined"
                {...register('lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
                sx={{ marginBottom: '1rem' }}
                disabled={loading} // Disable during loading
            />

            <TextField
                label="Email"
                fullWidth
                variant="outlined"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{ marginBottom: '1rem' }}
                disabled={loading} // Disable during loading
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
                disabled={loading} // Disable during loading
            />

            <TextField
                label="Confirm Password"
                fullWidth
                type="password"
                variant="outlined"
                {...register('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                sx={{ marginBottom: '1rem' }}
                disabled={loading} // Disable during loading
            />

            {/* Company Select */}
            <FormControl fullWidth sx={{ marginBottom: '1rem' }} error={!!errors.companyId} disabled={loading}>
                <InputLabel>Company</InputLabel>
                <Select defaultValue="" {...register('companyId')} disabled={loading}>
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
            <FormControl fullWidth sx={{ marginBottom: '1rem' }} error={!!errors.role} disabled={loading}>
                <InputLabel>Role</InputLabel>
                <Select defaultValue="" {...register('role')} disabled={loading}>
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

            <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ marginTop: '1rem' }}
                disabled={loading} // Disable during loading
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
            </Button>
        </form>
    );
}
