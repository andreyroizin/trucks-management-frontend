'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useUserDetails, useUpdateUser } from '@/hooks/useUser';
import { useCompanies } from '@/hooks/useCompanies';
import { useRoles } from '@/hooks/useRoles';
import { useForm, SubmitHandler } from 'react-hook-form';
import {
    TextField,
    Button,
    Checkbox,
    FormControlLabel,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Typography,
    Alert,
    CircularProgress,
} from '@mui/material';
import {useEffect, useMemo, useState} from 'react';

type EditUserFormInputs = {
    email: string;
    firstName: string;
    lastName: string;
    companyId: string;
    roles: string[]; // Array of role names
};

export default function EditUserPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const userId = searchParams.get('id');
    const { data: userDetails, isLoading, isError } = useUserDetails(userId || '');
    const { mutate, isLoading: isMutating } = useUpdateUser();

    const { data: companies } = useCompanies();
    const { data: roles } = useRoles();

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);
    const userRoles = useMemo(() => userDetails?.roles.map(role => role.roleName), [userDetails?.roles]);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<EditUserFormInputs>({
        defaultValues: {
            email: '',
            firstName: '',
            lastName: '',
            companyId: '',
            roles: [],
        },
    });

    const selectedRoles = watch('roles', []);

    useEffect(() => {
        if (userDetails) {
            setValue('email', userDetails.email);
            setValue('firstName', userDetails.firstName);
            setValue('lastName', userDetails.lastName);
            setValue('companyId', userDetails.companyId);
            setValue('roles', userRoles || []); // Prepopulate roles
        }
    }, [userDetails, setValue]);

    const onSubmit: SubmitHandler<EditUserFormInputs> = (data) => {
        if (!userId) return;
        setApiError(null);
        setSuccessMessage(null);

        const updatedFields: Partial<EditUserFormInputs> = {};
        Object.keys(data).forEach((key) => {
            if (data[key as keyof EditUserFormInputs] !== userDetails?.[key as keyof EditUserFormInputs]) {
                updatedFields[key as keyof EditUserFormInputs] = data[key as keyof EditUserFormInputs];
            }
        });

        // Send roles as an array of role names
        updatedFields.roles = selectedRoles;

        mutate(
            { id: userId, updatedFields },
            {
                onSuccess: () => {
                    setSuccessMessage('User updated successfully');
                },
                onError: (error: any) => {
                    setApiError(error.message || 'An unexpected error occurred');
                },
            }
        );
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <CircularProgress />
            </div>
        );
    }

    if (isError || !userDetails) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Alert severity="error">Failed to load user details. Please try again later.</Alert>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
            <Typography variant="h4" gutterBottom>
                Edit User
            </Typography>

            {apiError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {apiError}
                </Alert>
            )}

            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {successMessage}
                </Alert>
            )}

            <form
                onSubmit={handleSubmit(onSubmit)}
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    backgroundColor: '#fff',
                    padding: '24px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
            >
                <TextField
                    label="Email"
                    fullWidth
                    variant="outlined"
                    {...register('email', { required: 'Email is required' })}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    sx={{ mb: 2 }}
                />

                <TextField
                    label="First Name"
                    fullWidth
                    variant="outlined"
                    {...register('firstName', { required: 'First Name is required' })}
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                    sx={{ mb: 2 }}
                />

                <TextField
                    label="Last Name"
                    fullWidth
                    variant="outlined"
                    {...register('lastName', { required: 'Last Name is required' })}
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                    sx={{ mb: 2 }}
                />

                <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.companyId}>
                    <InputLabel>Company</InputLabel>
                    <Select
                        {...register('companyId', { required: 'Company is required' })}
                        value={watch('companyId')}
                        onChange={(e) => setValue('companyId', e.target.value)}
                    >
                        {companies?.map((company) => (
                            <MenuItem key={company.id} value={company.id}>
                                {company.name}
                            </MenuItem>
                        ))}
                    </Select>
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

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                    disabled={isMutating}
                >
                    {isMutating ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                </Button>
            </form>
        </div>
    );
}
