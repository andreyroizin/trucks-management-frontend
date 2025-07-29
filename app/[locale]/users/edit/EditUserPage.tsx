'use client';

import {useRouter, useSearchParams} from 'next/navigation';
import {useUpdateUserBasic, useUserDetails} from '@/hooks/useUser';
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
import {useEffect, useState} from 'react';
import {useAuth} from '@/hooks/useAuth';
import {countries} from '@/data/countries';
import Link from "next/link";
import { useTranslations } from 'next-intl';

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
    const {mutate, isPending} = useUpdateUserBasic();
    const {data: roles} = useRoles();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);
    const isGlobalAdmin = user?.roles.includes('globalAdmin');
    const t = useTranslations('users.edit');

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
        const allowedRoles = ['globalAdmin', 'customerAdmin'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));

        if (!loading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login'); // Redirect to login if not authorized
        }

        if (userDetails) {
            setValue('email', userDetails.email);
            setValue('firstName', userDetails.firstName);
            setValue('lastName', userDetails.lastName);
            setValue('roles', userDetails.roles);
            setValue('postcode', userDetails.postcode || '');
            setValue('phoneNumber', userDetails.phoneNumber || '');
            setValue('address', userDetails.address || '');
            setValue('city', userDetails.city || '');
            setValue('country', userDetails.country || '');
            setValue('remark', userDetails.remark || '');
        }
    }, [userDetails, setValue, isAuthenticated, loading, user, router]);

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
                    setSuccessMessage(t('successMessage'));
                },
                onError: (error: any) => {
                    setApiError(error?.response?.data?.errors?.[0] || error.message || t('updateError'));
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
                <Alert severity="error">{t('loadError')}</Alert>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
            <Typography variant="h4" gutterBottom>
                {t('title')}
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


            {/* Conditional Navigation Buttons with Link */}
            {userDetails.driverInfo && (
                <Link href={`/users/edit/${userId}/driver`} passHref>
                    <Button
                        variant="contained"
                        color="primary"
                        component="a"
                        sx={{ mb: 2 }}
                    >
                        {t('navigation.editDriverData')}
                    </Button>
                </Link>
            )}

            {userDetails.contactPersonInfo && (
                <Link href={`/users/edit/${userId}/contact-person`} passHref>
                    <Button
                        variant="contained"
                        color="primary"
                        component="a"
                        sx={{ mb: 2 }}
                    >
                        {t('navigation.editContactPersonData')}
                    </Button>
                </Link>
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
                <TextField label={t('fields.email.label')} fullWidth {...register('email', {required: t('fields.email.required')})}
                           error={!!errors.email} helperText={errors.email?.message} sx={{mb: 2}}/>
                <TextField label={t('fields.firstName.label')} fullWidth {...register('firstName', {required: t('fields.firstName.required')})}
                           error={!!errors.firstName} helperText={errors.firstName?.message} sx={{mb: 2}}/>
                <TextField label={t('fields.lastName.label')} fullWidth {...register('lastName', {required: t('fields.lastName.required')})}
                           error={!!errors.lastName} helperText={errors.lastName?.message} sx={{mb: 2}}/>
                <TextField label={t('fields.address.label')} fullWidth {...register('address')} sx={{mb: 2}}/>
                <TextField label={t('fields.postcode.label')} fullWidth {...register('postcode')} sx={{mb: 2}}/>
                <TextField label={t('fields.city.label')} fullWidth {...register('city')} sx={{mb: 2}}/>
                <FormControl fullWidth sx={{mb: 2}}>
                    <InputLabel>{t('fields.country.label')}</InputLabel>
                    <Select {...register('country')} value={watch('country') || ''}
                            onChange={(e) => setValue('country', e.target.value)}>
                        <MenuItem value="" disabled>{t('fields.country.placeholder')}</MenuItem>
                        {countries.map((country) => (
                            <MenuItem key={country.code} value={country.name}>
                                {country.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField label={t('fields.phoneNumber.label')} fullWidth {...register('phoneNumber')} sx={{mb: 2}}/>
                <TextField label={t('fields.remark.label')} fullWidth multiline rows={4} {...register('remark')} sx={{mb: 2}}/>
                {isGlobalAdmin && (<Typography variant="subtitle1" sx={{mb: 1}}>{t('fields.roles.label')}</Typography>)}
                {isGlobalAdmin && roles?.map((role) => (
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
                    {isPending ? <CircularProgress size={24} color="inherit"/> : t('button')}
                </Button>
            </form>
        </div>
    );
}
