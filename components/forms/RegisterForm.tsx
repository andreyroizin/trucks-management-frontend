import { useForm, SubmitHandler } from 'react-hook-form';
import {
    TextField,
    Button,
    Typography,
    Checkbox,
    FormControlLabel,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
} from '@mui/material';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { useCompanies } from '@/hooks/useCompanies';
import { useRoles } from '@/hooks/useRoles';
import { register as registerApi } from '@/utils/api';
import * as yup from 'yup';

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
    roles: yup.array().of(yup.string()).required('At least one role must be selected'),
});

type RegisterFormInputs = {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    companyId: string;
    roles: string[]; // Array of role names
};

export default function RegisterForm() {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegisterFormInputs>({
        resolver: yupResolver(registerSchema),
        defaultValues: {
            email: '',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            companyId: '',
            roles: [],
        },
    });

    const { data: companies, isLoading: isLoadingCompanies, isError: isErrorCompanies } = useCompanies();
    const { data: roles, isLoading: isLoadingRoles, isError: isErrorRoles } = useRoles();

    const [apiError, setApiError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const selectedRoles = watch('roles', []);

    const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
        setApiError(null);
        setSuccessMessage(null);
        setLoading(true);

        try {
            const response = await registerApi({
                ...data,
                roles: selectedRoles, // Ensure roles are sent as an array of strings
            });

            if (response.isSuccess) {
                setSuccessMessage('Registration successful!');
            } else {
                setApiError(response.errors?.[0] || 'Unknown error occurred');
            }
        } catch (error: any) {
            setApiError(error?.response?.data?.errors?.[0] || 'An unexpected error occurred. Please try again later.');
        } finally {
            setLoading(false);
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
                disabled={loading}
            />

            <TextField
                label="Last Name"
                fullWidth
                variant="outlined"
                {...register('lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
                sx={{ marginBottom: '1rem' }}
                disabled={loading}
            />

            <TextField
                label="Email"
                fullWidth
                variant="outlined"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{ marginBottom: '1rem' }}
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
            />

            <FormControl fullWidth sx={{ marginBottom: '1rem' }} error={!!errors.companyId}>
                <InputLabel>Company</InputLabel>
                <Select
                    {...register('companyId')}
                    defaultValue=""
                    disabled={loading}
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

            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Roles
            </Typography>
            {roles?.map((role) => (
                <FormControlLabel
                    key={role.id}
                    control={
                        <Checkbox
                            value={role.name}
                            checked={selectedRoles.includes(role.name)}
                            onChange={(e) => {
                                const updatedRoles = e.target.checked
                                    ? [...selectedRoles, role.name]
                                    : selectedRoles.filter((r) => r !== role.name);
                                setValue('roles', updatedRoles);
                            }}
                        />
                    }
                    label={role.name}
                />
            ))}
            {errors.roles && (
                <Typography variant="caption" color="error" sx={{ mb: 2 }}>
                    {errors.roles.message}
                </Typography>
            )}

            <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ marginTop: '1rem' }}
                disabled={loading}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
            </Button>
        </form>
    );
}
