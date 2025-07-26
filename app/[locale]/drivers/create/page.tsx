'use client';

import React from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Autocomplete,
    Grid,
} from '@mui/material';
import { Controller, useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCompanies } from '@/hooks/useCompanies';

const schema = yup.object().shape({
    companyId: yup.string().required('Company is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().required('Password is required'),
    firstName: yup.string().required('First name is required'),
    lastName: yup.string().required('Last name is required'),
    dateOfBirth: yup.string().optional(),
    phoneNumber: yup.string().optional(),
    address: yup.string().optional(),
    postcode: yup.string().optional(),
    city: yup.string().optional(),
    country: yup.string().optional(),
    bsnNumber: yup.string().optional(),
    employmentStartDate: yup.string().required('Employment start date is required'),
    contractEndDate: yup.string().required('Contract end date is required'),
    probationPeriod: yup.string().optional(),
    noticePeriod: yup.string().optional(),
    function: yup.string().optional(),
    workweekDuration: yup.number().required('Workweek duration is required').min(1, 'Must be at least 1 hour'),
    weeklySchedule: yup.string().optional(),
    workingHours: yup.string().optional(),
    remark: yup.string().optional(),
});

type FormInputs = {
    companyId: string;              // Required
    email: string;                  // Required
    password: string;               // Required
    firstName: string;              // Required
    lastName: string;               // Required
    dateOfBirth?: string;           // Optional
    phoneNumber?: string;           // Optional
    address?: string;               // Optional
    postcode?: string;              // Optional
    city?: string;                  // Optional
    country?: string;               // Optional
    bsnNumber?: string;             // Optional
    employmentStartDate: string;    // Required
    contractEndDate: string;        // Required
    probationPeriod?: string;       // Optional
    noticePeriod?: string;          // Optional
    function?: string;              // Optional
    workweekDuration: number;       // Required
    weeklySchedule?: string;        // Optional
    workingHours?: string;          // Optional
    remark?: string;                // Optional
};

const periodOptions = [
    { value: '1', label: '1 month' },
    { value: '2', label: '2 months' },
    { value: '3', label: '3 months' },
    { value: '4', label: '4 months' },
    { value: '5', label: '5 months' },
    { value: '6', label: '6 months' },
];

export default function CreateDriverPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { data: companiesData, isLoading: isCompaniesLoading } = useCompanies(1, 100);

    const {
        handleSubmit,
        control,
        reset,
        watch,
        formState: { errors },
    } = useForm<FormInputs>({
        resolver: yupResolver(schema),
        defaultValues: {
            companyId: '',
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            phoneNumber: '',
            address: '',
            postcode: '',
            city: '',
            country: '',
            bsnNumber: '',
            employmentStartDate: '',
            contractEndDate: '',
            probationPeriod: '',
            noticePeriod: '',
            function: '',
            workweekDuration: 40,
            weeklySchedule: '',
            workingHours: '',
            remark: '',
        },
    });

    // Check access permissions
    const allowedRoles = ['globalAdmin', 'customerAdmin'];
    const hasAccess = user?.roles.some(r => allowedRoles.includes(r));

    // Watch workweek duration to calculate percentage
    const workweekDuration = watch('workweekDuration');
    const workweekPercentage = workweekDuration ? Math.round((workweekDuration / 40) * 100) : 0;

    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        try {
            // TODO: Implement driver creation logic
            console.log('Form data:', data);
            reset();
            router.push('/drivers');
        } catch {
            /* Error handling will be added when backend is implemented */
        }
    };

    if (authLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated || !hasAccess) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">You don't have permission to access this page.</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="800px" p={4}>
            {/* Header Block */}
            <Box mb={4}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                    New Driver Creation Form
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Use this form to create a new employment contract for a driver. Please ensure all fields are filled out accurately.
                </Typography>
            </Box>

            {/* Form Block */}
            <Box>
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* General Information Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            General Information
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="companyId"
                                    control={control}
                                    render={({ field }) => (
                                        <Autocomplete
                                            options={companiesData?.data || []}
                                            getOptionLabel={(option) => option.name}
                                            onChange={(_, value) => field.onChange(value?.id || '')}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Company"
                                                    variant="outlined"
                                                    margin="normal"
                                                    fullWidth
                                                    error={!!errors.companyId}
                                                    helperText={errors.companyId?.message}
                                                    required
                                                />
                                            )}
                                            loading={isCompaniesLoading}
                                            value={
                                                companiesData?.data.find(c => c.id === field.value) || null
                                            }
                                            isOptionEqualToValue={(option, val) => option.id === val.id}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Employee Information Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Employee Information
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            {/* Email & Password */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="email"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Email"
                                            type="email"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.email}
                                            helperText={errors.email?.message}
                                            required
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="password"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Password"
                                            type="password"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.password}
                                            helperText={errors.password?.message}
                                            required
                                        />
                                    )}
                                />
                            </Grid>
                            
                            {/* First Name & Last Name */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="firstName"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="First Name"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.firstName}
                                            helperText={errors.firstName?.message}
                                            required
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="lastName"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Last Name"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.lastName}
                                            helperText={errors.lastName?.message}
                                            required
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Date of Birth & Phone Number */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="dateOfBirth"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Date of Birth"
                                            type="date"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.dateOfBirth}
                                            helperText={errors.dateOfBirth?.message}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="phoneNumber"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Phone Number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.phoneNumber}
                                            helperText={errors.phoneNumber?.message}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Address & PostCode */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="address"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Address"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.address}
                                            helperText={errors.address?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="postcode"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="PostCode"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.postcode}
                                            helperText={errors.postcode?.message}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* City & Country */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="city"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="City"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.city}
                                            helperText={errors.city?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="country"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Country"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.country}
                                            helperText={errors.country?.message}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* BSN Number */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="bsnNumber"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="BSN Number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.bsnNumber}
                                            helperText={errors.bsnNumber?.message}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Employment Dates Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Employment Dates
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            {/* Employment Start Date & Contract End Date */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="employmentStartDate"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Employment Start Date"
                                            type="date"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.employmentStartDate}
                                            helperText={errors.employmentStartDate?.message}
                                            required
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="contractEndDate"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Contract End Date"
                                            type="date"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.contractEndDate}
                                            helperText={errors.contractEndDate?.message}
                                            required
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Probation Period & Notice Period */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="probationPeriod"
                                    control={control}
                                    render={({ field }) => (
                                        <Autocomplete
                                            options={periodOptions}
                                            getOptionLabel={(option) => option.label}
                                            onChange={(_, value) => field.onChange(value?.value || '')}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Probation Period"
                                                    variant="outlined"
                                                    margin="normal"
                                                    fullWidth
                                                    error={!!errors.probationPeriod}
                                                    helperText={errors.probationPeriod?.message}
                                                />
                                            )}
                                            value={
                                                periodOptions.find(option => option.value === field.value) || null
                                            }
                                            isOptionEqualToValue={(option, val) => option.value === val.value}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="noticePeriod"
                                    control={control}
                                    render={({ field }) => (
                                        <Autocomplete
                                            options={periodOptions}
                                            getOptionLabel={(option) => option.label}
                                            onChange={(_, value) => field.onChange(value?.value || '')}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Notice Period"
                                                    variant="outlined"
                                                    margin="normal"
                                                    fullWidth
                                                    error={!!errors.noticePeriod}
                                                    helperText={errors.noticePeriod?.message}
                                                />
                                            )}
                                            value={
                                                periodOptions.find(option => option.value === field.value) || null
                                            }
                                            isOptionEqualToValue={(option, val) => option.value === val.value}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Work Conditions Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Work Conditions
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            {/* Function - Full Width */}
                            <Grid item xs={12}>
                                <Controller
                                    name="function"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Function"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.function}
                                            helperText={errors.function?.message}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Workweek Duration & Percentage */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="workweekDuration"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Workweek Duration (hours)"
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.workweekDuration}
                                            helperText={errors.workweekDuration?.message}
                                            required
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Workweek Duration Percentage"
                                    value={`${workweekPercentage}%`}
                                    fullWidth
                                    margin="normal"
                                    variant="outlined"
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                    sx={{
                                        '& .MuiInputBase-input': {
                                            backgroundColor: 'grey.50',
                                        },
                                    }}
                                />
                            </Grid>

                            {/* Weekly Schedule & Working Hours */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="weeklySchedule"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Weekly Schedule"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.weeklySchedule}
                                            helperText={errors.weeklySchedule?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="workingHours"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Working Hours"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.workingHours}
                                            helperText={errors.workingHours?.message}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Remark Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Remark
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            <Grid item xs={12}>
                                <Controller
                                    name="remark"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Remark"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            multiline
                                            rows={3}
                                            error={!!errors.remark}
                                            helperText={errors.remark?.message}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <Box mt={3}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                        >
                            Create Driver
                        </Button>
                    </Box>
                </form>
            </Box>
        </Box>
    );
} 