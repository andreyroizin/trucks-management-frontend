import {useForm, SubmitHandler} from 'react-hook-form';
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
import {yupResolver} from '@hookform/resolvers/yup';
import {useState} from 'react';
import {useCompanies} from '@/hooks/useCompanies';
import {useRoles} from '@/hooks/useRoles';
import {register as registerApi} from '@/utils/api';
import * as yup from 'yup';
import {countries} from '@/data/countries';
import {useClients} from "@/hooks/useClients";

const registerSchema = yup.object().shape({
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'Passwords must match')
        .required('Confirm Password is required'),
    firstName: yup.string().required('First Name is required'),
    lastName: yup.string().required('Last Name is required'),
    roles: yup
        .array()
        .of(yup.string().required('Role is required'))
        .compact() // Removes undefined values
        .required('At least one role must be selected'),
});

type RegisterFormInputs = {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    companyIds?: string[];
    clientIds?: string[];
    roles: string[];
    postcode?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    country?: string;
    remark?: string;
};

export default function RegisterForm() {
    const {register, handleSubmit, setValue, watch, formState: {errors}} = useForm<RegisterFormInputs>({
        resolver: yupResolver(registerSchema),
        defaultValues: {
            email: '',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            companyIds: [],
            clientIds: [],
            roles: [],
        },
    });

    const {data: companies, isLoading: isLoadingCompanies, isError: isErrorCompanies} = useCompanies();
    const {data: clients, isLoading: isLoadingClients, isError: isErrorClients} = useClients();
    const {data: roles, isLoading: isLoadingRoles, isError: isErrorRoles} = useRoles();

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


    if (isErrorCompanies || isErrorRoles || isErrorClients) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Unexpected error occurred. Please try again later.
            </div>
        );
    }

    // Show a loading indicator
    if (isLoadingCompanies || isLoadingRoles || isLoadingClients) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <CircularProgress size={24}/>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
            <Typography variant="h5" sx={{marginBottom: '1rem'}}>Register</Typography>
            {apiError && <Alert severity="error" sx={{marginBottom: '1rem'}}>{apiError}</Alert>}
            {successMessage && <Alert severity="success" sx={{marginBottom: '1rem'}}>{successMessage}</Alert>}

            {/* User Details */}
            <TextField label="First Name" fullWidth {...register('firstName')} error={!!errors.firstName}
                       helperText={errors.firstName?.message} sx={{mb: 2}}/>
            <TextField label="Last Name" fullWidth {...register('lastName')} error={!!errors.lastName}
                       helperText={errors.lastName?.message} sx={{mb: 2}}/>
            <TextField label="Email" fullWidth {...register('email')} error={!!errors.email}
                       helperText={errors.email?.message} sx={{mb: 2}}/>
            <TextField label="Password" fullWidth type="password" {...register('password')} error={!!errors.password}
                       helperText={errors.password?.message} sx={{mb: 2}}/>
            <TextField label="Confirm Password" fullWidth type="password" {...register('confirmPassword')}
                       error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} sx={{mb: 2}}/>

            {/* Address Details */}
            <TextField label="Address" fullWidth {...register('address')} sx={{mb: 2}}/>
            <TextField label="Postcode" fullWidth {...register('postcode')} sx={{mb: 2}}/>
            <TextField label="City" fullWidth {...register('city')} sx={{mb: 2}}/>
            <FormControl fullWidth sx={{mb: 2}}>
                <InputLabel>Country</InputLabel>
                <Select
                    {...register('country')}
                    defaultValue=""
                >
                    <MenuItem value="" disabled>
                        Select a country
                    </MenuItem>
                    {countries.map((country) => (
                        <MenuItem key={country.code} value={country.name}>
                            {country.name}
                        </MenuItem>
                    ))}
                </Select>
                <Typography variant="caption" color="error">
                    {errors.country?.message}
                </Typography>
            </FormControl>
            <TextField label="Phone Number" fullWidth {...register('phoneNumber')} sx={{mb: 2}}/>

            {/* Remark */}
            <TextField
                label="Remark"
                fullWidth
                multiline
                rows={4}
                {...register('remark')}
                sx={{mb: 2}}
            />

            {/* Company */}
            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Companies</InputLabel>
                <Select
                    {...register('companyIds')}
                    multiple
                    value={watch('companyIds')}
                    onChange={(event) => {
                        const {
                            target: { value },
                        } = event;
                        setValue('companyIds', typeof value === 'string' ? value.split(',') : value);
                    }}
                    renderValue={(selected) => {
                        if (!selected) return '';
                        const selectedNames = selected.map((id) => {
                            const company = companies?.data.find((c) => c.id === id);
                            return company ? company.name : id;
                        });
                        return selectedNames.join(', ');
                    }}
                >
                    {isLoadingCompanies ? (
                        <MenuItem disabled>
                            <em>Loading...</em>
                        </MenuItem>
                    ) : (
                        companies?.data.map((company) => (
                            <MenuItem key={company.id} value={company.id}>
                                <Checkbox checked={watch('companyIds')?.includes(company.id)} />
                                <Typography variant="body2">{company.name}</Typography>
                            </MenuItem>
                        ))
                    )}
                </Select>
                <Typography variant="caption" color="error">
                    {errors.companyIds?.message}
                </Typography>
            </FormControl>

            {/* Clients Selection */}
            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Clients</InputLabel>
                <Select
                    {...register('clientIds')}
                    multiple
                    value={watch('clientIds')}
                    onChange={(event) => {
                        const {
                            target: { value },
                        } = event;
                        setValue('clientIds', typeof value === 'string' ? value.split(',') : value);
                    }}
                    renderValue={(selected) => {
                        if (!selected || selected.length === 0) return '';
                        const selectedNames = selected.map((id) => {
                            const client = clients?.data.find((c) => c.id === id);
                            return client ? client.name : id;
                        });
                        return selectedNames.join(', ');
                    }}
                >
                    {isLoadingClients ? (
                        <MenuItem disabled>
                            <em>Loading...</em>
                        </MenuItem>
                    ) : (
                        clients?.data.map((client) => (
                            <MenuItem key={client.id} value={client.id}>
                                <Checkbox checked={watch('clientIds')?.includes(client.id)} />
                                <Typography variant="body2">{client.name}</Typography>
                            </MenuItem>
                        ))
                    )}
                </Select>
                <Typography variant="caption" color="error">
                    {errors.clientIds?.message}
                </Typography>
            </FormControl>

            {/* Roles Selection */}
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

            {apiError && <Alert severity="error" sx={{marginTop: '1rem'}}>{apiError}</Alert>}
            {successMessage && <Alert severity="success" sx={{marginTop: '1rem'}}>{successMessage}</Alert>}

            <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading} sx={{mt: 2}}>
                {loading ? <CircularProgress size={24}/> : 'Register'}
            </Button>

        </form>
    );
}
