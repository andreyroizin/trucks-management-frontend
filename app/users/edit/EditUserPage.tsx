'use client';

import {useRouter, useSearchParams} from 'next/navigation';
import {UserDetailRole, useUpdateUserBasic, useUserDetails} from '@/hooks/useUser';
import {useRoles} from '@/hooks/useRoles';
import {SubmitHandler, useForm} from 'react-hook-form';
import {
    Alert,
    Button,
    Checkbox,
    CircularProgress,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import {useEffect, useMemo, useState} from 'react';
import {useAuth} from '@/hooks/useAuth';
import {countries} from '@/data/countries';

type EditUserFormInputs = {
    email: string;
    firstName: string;
    lastName: string;
    roles: string[]; // Array of role names
    postcode?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    country?: string;
    remark?: string;
};

export default function EditUserPage() {
    const {user, isAuthenticated, loading} = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const userId = searchParams.get('id');
    const {data: userDetails, isLoading, isError} = useUserDetails(userId || '');
    const { mutate, isPending} = useUpdateUserBasic();
    const {data: roles} = useRoles();

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);
    const userRoles = useMemo(() => {
        if (Array.isArray(userDetails?.roles) && typeof userDetails.roles[0] === "object") {
            // Narrow the type to UserDetailRole[]
            return (userDetails.roles as UserDetailRole[]).map((role) => role.roleName);
        }
        return [];
    }, [userDetails?.roles]);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: {errors},
    } = useForm<EditUserFormInputs>({
        defaultValues: {
            email: '',
            firstName: '',
            lastName: '',
            roles: [],
            postcode: '',
            phoneNumber: '',
            address: '',
            city: '',
            country: '',
            remark: '',
        },
    });

    const selectedRoles = watch('roles', []);

    useEffect(() => {
        if (!loading && (!isAuthenticated || !user?.roles.includes('globalAdmin'))) {
            router.push('/auth/login'); // Redirect to login if not authorized
        }

        if (userDetails) {
            setValue('email', userDetails.email);
            setValue('firstName', userDetails.firstName);
            setValue('lastName', userDetails.lastName);
            setValue('roles', userRoles || []);
            setValue('postcode', userDetails.postcode || '');
            setValue('phoneNumber', userDetails.phoneNumber || '');
            setValue('address', userDetails.address || '');
            setValue('city', userDetails.city || '');
            setValue('country', userDetails.country || '');
            setValue('remark', userDetails.remark || '');
        }
    }, [userDetails, setValue, isAuthenticated, loading, user, router, userRoles]);

    const onSubmit: SubmitHandler<EditUserFormInputs> = (data) => {
        if (!userId) return;
        setApiError(null);
        setSuccessMessage(null);

        const updatedFields: Partial<EditUserFormInputs> = {};
        Object.keys(data).forEach((key) => {
            if (data[key as keyof EditUserFormInputs] !== userDetails?.[key as keyof EditUserFormInputs]) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                updatedFields[key as keyof EditUserFormInputs] = data[key as keyof EditUserFormInputs];
            }
        });

        // Send roles as an array of role names
        updatedFields.roles = selectedRoles;

        mutate(
            {id: userId, updatedFields},
            {
                onSuccess: () => {
                    setSuccessMessage('User updated successfully');
                },
                onError: (error: any) => {
                    setApiError(error?.response?.data?.errors?.[0] || error.message || 'An unexpected error occurred');
                },
            }
        );
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <CircularProgress/>
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
                <Alert severity="error" sx={{mb: 2}}>
                    {apiError}
                </Alert>
            )}

            {successMessage && (
                <Alert severity="success" sx={{mb: 2}}>
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
                <TextField label="Email" fullWidth {...register('email', {required: 'Email is required'})}
                           error={!!errors.email} helperText={errors.email?.message} sx={{mb: 2}}/>
                <TextField label="First Name" fullWidth {...register('firstName', {required: 'First Name is required'})}
                           error={!!errors.firstName} helperText={errors.firstName?.message} sx={{mb: 2}}/>
                <TextField label="Last Name" fullWidth {...register('lastName', {required: 'Last Name is required'})}
                           error={!!errors.lastName} helperText={errors.lastName?.message} sx={{mb: 2}}/>
                <TextField label="Address" fullWidth {...register('address')} sx={{mb: 2}}/>
                <TextField label="Postcode" fullWidth {...register('postcode')} sx={{mb: 2}}/>
                <TextField label="City" fullWidth {...register('city')} sx={{mb: 2}}/>
                <FormControl fullWidth sx={{mb: 2}}>
                    <InputLabel>Country</InputLabel>
                    <Select {...register('country')} value={watch('country') || ''}
                            onChange={(e) => setValue('country', e.target.value)}>
                        <MenuItem value="" disabled>Select a country</MenuItem>
                        {countries.map((country) => (
                            <MenuItem key={country.code} value={country.name}>
                                {country.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField label="Phone Number" fullWidth {...register('phoneNumber')} sx={{mb: 2}}/>
                <TextField label="Remark" fullWidth multiline rows={4} {...register('remark')} sx={{mb: 2}}/>
                <Typography variant="subtitle1" sx={{mb: 1}}>Roles</Typography>
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
                {apiError && (
                    <Alert severity="error" sx={{mt: 2}}>
                        {apiError}
                    </Alert>
                )}

                {successMessage && (
                    <Alert severity="success" sx={{mt: 2}}>
                        {successMessage}
                    </Alert>
                )}
                <Button type="submit" variant="contained" color="primary" fullWidth disabled={isPending} sx={{mt: 2}}>
                    {isPending ? <CircularProgress size={24} color="inherit"/> : 'Save Changes'}
                </Button>
            </form>
        </div>
    );
}
