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
import { useCreateDriver } from '@/hooks/useCreateDriver';

const schema = yup.object().shape({
    CompanyId: yup.string().required('Company is required'),
    Email: yup.string().email('Invalid email').required('Email is required'),
    Password: yup.string().required('Password is required'),
    FirstName: yup.string().required('First name is required'),
    LastName: yup.string().required('Last name is required'),
    DateOfBirth: yup.string().optional(),
    PhoneNumber: yup.string().optional(),
    Address: yup.string().optional(),
    Postcode: yup.string().optional(),
    City: yup.string().optional(),
    Country: yup.string().optional(),
    BSN: yup.string().optional(),
    DateOfEmployment: yup.string().required('Employment start date is required'),
    LastWorkingDay: yup.string().required('Contract end date is required'),
    ProbationPeriod: yup.string().optional(),
    NoticePeriod: yup.string().optional(),
    Function: yup.string().required('Function is required').max(100, 'Function must be less than 100 characters'),
    WorkweekDuration: yup.number().required('Workweek duration is required').min(1, 'Must be at least 1 hour'),
    WeeklySchedule: yup.string().optional(),
    WorkingHours: yup.string().optional(),
    CompensationPerMonthExclBtw: yup.number().optional().min(0, 'Must be a positive number'),
    PayScale: yup.string().optional(),
    PayScaleStep: yup.number().optional().min(0, 'Must be a positive number'),
    HourlyWage100Percent: yup.number().optional().min(0, 'Must be a positive number'),
    DeviatingWage: yup.number().optional().min(0, 'Must be a positive number'),
    CommuteKilometers: yup.number().optional().min(0, 'Must be a positive number'),
    TravelExpenses: yup.number().optional().min(0, 'Must be a positive number'),
    MaxTravelExpenses: yup.number().optional().min(0, 'Must be a positive number'),
    VacationAge: yup.number().optional().min(0, 'Must be a positive number'),
    VacationDays: yup.number().optional().min(0, 'Must be a positive number'),
    Atv: yup.number().optional().min(0, 'Must be a positive number'),
    VacationAllowance: yup.number().optional().min(0, 'Must be a positive number').max(100, 'Must be 100% or less'),
    Remark: yup.string().optional(),
});

type FormInputs = {
    CompanyId: string;                      // Required - backend: CompanyId
    Email: string;                          // Required - backend: Email
    Password: string;                       // Required - backend: Password
    FirstName: string;                      // Required - backend: FirstName
    LastName: string;                       // Required - backend: LastName
    DateOfBirth?: string;                   // Optional - backend: DateOfBirth
    PhoneNumber?: string;                   // Optional - backend: PhoneNumber
    Address?: string;                       // Optional - backend: Address
    Postcode?: string;                      // Optional - backend: Postcode
    City?: string;                          // Optional - backend: City
    Country?: string;                       // Optional - backend: Country
    BSN?: string;                           // Optional - backend: BSN
    DateOfEmployment: string;               // Required - backend: DateOfEmployment
    LastWorkingDay: string;                 // Required - backend: LastWorkingDay
    ProbationPeriod?: string;               // Optional - backend: ProbationPeriod
    NoticePeriod?: string;                  // Optional - backend: NoticePeriod
    Function: string;                       // Required - backend: Function
    WorkweekDuration: number;               // Required - backend: WorkweekDuration
    WorkweekDurationPercentage?: number;    // Calculated - backend: WorkweekDurationPercentage
    WeeklySchedule?: string;                // Optional - backend: WeeklySchedule
    WorkingHours?: string;                  // Optional - backend: WorkingHours
    CompensationPerMonthExclBtw?: number;   // Optional - backend: CompensationPerMonthExclBtw
    CompensationPerMonthInclBtw?: number;   // Calculated - backend: CompensationPerMonthInclBtw
    PayScale?: string;                      // Optional - backend: PayScale
    PayScaleStep?: number;                  // Optional - backend: PayScaleStep
    HourlyWage100Percent?: number;          // Optional - backend: HourlyWage100Percent
    DeviatingWage?: number;                 // Optional - backend: DeviatingWage
    CommuteKilometers?: number;             // Optional - backend: CommuteKilometers
    TravelExpenses?: number;                // Optional - backend: TravelExpenses
    MaxTravelExpenses?: number;             // Optional - backend: MaxTravelExpenses
    VacationAge?: number;                   // Optional - backend: VacationAge
    VacationDays?: number;                  // Optional - backend: VacationDays
    Atv?: number;                           // Optional - backend: Atv
    VacationAllowance?: number;             // Optional - backend: VacationAllowance
    Remark?: string;                        // Optional - backend: Remark
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
    const { mutateAsync, isPending, isError, error } = useCreateDriver();

    const {
        handleSubmit,
        control,
        reset,
        watch,
        formState: { errors },
    } = useForm<FormInputs>({
        resolver: yupResolver(schema),
        defaultValues: {
            CompanyId: '',
            Email: '',
            Password: '',
            FirstName: '',
            LastName: '',
            DateOfBirth: '',
            PhoneNumber: '',
            Address: '',
            Postcode: '',
            City: '',
            Country: '',
            BSN: '',
            DateOfEmployment: '',
            LastWorkingDay: '',
            ProbationPeriod: '',
            NoticePeriod: '',
            Function: '',
            WorkweekDuration: 40, // Keep 40 as reasonable default for work hours
            WeeklySchedule: '',
            WorkingHours: '',
            CompensationPerMonthExclBtw: undefined,
            PayScale: '',
            PayScaleStep: undefined,
            HourlyWage100Percent: undefined,
            DeviatingWage: undefined,
            CommuteKilometers: undefined,
            TravelExpenses: undefined,
            MaxTravelExpenses: undefined,
            VacationAge: undefined,
            VacationDays: undefined,
            Atv: undefined,
            VacationAllowance: undefined,
            Remark: '',
        },
    });

    // Check access permissions
    const allowedRoles = ['globalAdmin', 'customerAdmin'];
    const hasAccess = user?.roles.some(r => allowedRoles.includes(r));

    // Watch workweek duration to calculate percentage
    const workweekDuration = watch('WorkweekDuration');
    const workweekPercentage = workweekDuration ? Math.round((workweekDuration / 40) * 100) : 0;

    // Watch monthly compensation to calculate VAT inclusion
    const monthlyCompensationExclVat = watch('CompensationPerMonthExclBtw');
    const monthlyCompensationInclVat = monthlyCompensationExclVat ? 
        Math.round((monthlyCompensationExclVat + (monthlyCompensationExclVat * 0.21)) * 100) / 100 : 0;

    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        try {
            // Clean data by removing empty strings and null values
            const cleanedEntries = Object.entries(data).filter(([key, value]) => 
                value !== undefined && value !== null && value !== ''
            );
            const cleanedData = Object.fromEntries(cleanedEntries) as any;

            // Add calculated fields
            if (cleanedData.WorkweekDuration) {
                cleanedData.WorkweekDurationPercentage = Math.round((cleanedData.WorkweekDuration / 40) * 100);
            }
            
            if (cleanedData.CompensationPerMonthExclBtw) {
                cleanedData.CompensationPerMonthInclBtw = Math.round((cleanedData.CompensationPerMonthExclBtw + (cleanedData.CompensationPerMonthExclBtw * 0.21)) * 100) / 100;
            }

            // Format dates to ISO 8601 format if they exist
            if (cleanedData.DateOfBirth) {
                cleanedData.DateOfBirth = new Date(cleanedData.DateOfBirth).toISOString();
            }
            if (cleanedData.DateOfEmployment) {
                cleanedData.DateOfEmployment = new Date(cleanedData.DateOfEmployment).toISOString();
            }
            if (cleanedData.LastWorkingDay) {
                cleanedData.LastWorkingDay = new Date(cleanedData.LastWorkingDay).toISOString();
            }

            await mutateAsync(cleanedData);
            reset();
            router.push('/drivers');
        } catch {
            /* Error handled by isError & error */
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
                {isError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error?.message || 'Failed to create driver.'}
                    </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* General Information Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            General Information
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="CompanyId"
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
                                                    error={!!errors.CompanyId}
                                                    helperText={errors.CompanyId?.message}
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
                                    name="Email"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Email"
                                            type="email"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.Email}
                                            helperText={errors.Email?.message}
                                            required
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="Password"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Password"
                                            type="password"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.Password}
                                            helperText={errors.Password?.message}
                                            required
                                        />
                                    )}
                                />
                            </Grid>
                            
                            {/* First Name & Last Name */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="FirstName"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="First Name"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.FirstName}
                                            helperText={errors.FirstName?.message}
                                            required
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="LastName"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Last Name"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.LastName}
                                            helperText={errors.LastName?.message}
                                            required
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Date of Birth & Phone Number */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="DateOfBirth"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Date of Birth"
                                            type="date"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.DateOfBirth}
                                            helperText={errors.DateOfBirth?.message}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="PhoneNumber"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Phone Number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.PhoneNumber}
                                            helperText={errors.PhoneNumber?.message}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Address & PostCode */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="Address"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Address"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.Address}
                                            helperText={errors.Address?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="Postcode"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="PostCode"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.Postcode}
                                            helperText={errors.Postcode?.message}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* City & Country */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="City"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="City"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.City}
                                            helperText={errors.City?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="Country"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Country"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.Country}
                                            helperText={errors.Country?.message}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* BSN Number */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="BSN"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="BSN Number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.BSN}
                                            helperText={errors.BSN?.message}
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
                                    name="DateOfEmployment"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Employment Start Date"
                                            type="date"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.DateOfEmployment}
                                            helperText={errors.DateOfEmployment?.message}
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
                                    name="LastWorkingDay"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Contract End Date"
                                            type="date"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.LastWorkingDay}
                                            helperText={errors.LastWorkingDay?.message}
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
                                    name="ProbationPeriod"
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
                                                    error={!!errors.ProbationPeriod}
                                                    helperText={errors.ProbationPeriod?.message}
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
                                    name="NoticePeriod"
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
                                                    error={!!errors.NoticePeriod}
                                                    helperText={errors.NoticePeriod?.message}
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
                                    name="Function"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Function"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.Function}
                                            helperText={errors.Function?.message}
                                            required
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Workweek Duration & Percentage */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="WorkweekDuration"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Workweek Duration (hours)"
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.WorkweekDuration}
                                            helperText={errors.WorkweekDuration?.message}
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
                                    name="WeeklySchedule"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Weekly Schedule"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.WeeklySchedule}
                                            helperText={errors.WeeklySchedule?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="WorkingHours"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Working Hours"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.WorkingHours}
                                            helperText={errors.WorkingHours?.message}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Compensation Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Compensation
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            {/* Monthly Compensation Excl. VAT & Incl. VAT */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="CompensationPerMonthExclBtw"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Monthly Compensation (Excl. VAT)"
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.CompensationPerMonthExclBtw}
                                            helperText={errors.CompensationPerMonthExclBtw?.message}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            inputProps={{
                                                step: "0.01",
                                                min: "0"
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Monthly Compensation (Incl. VAT)"
                                    value={monthlyCompensationInclVat.toFixed(2)}
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

                            {/* Pay Scale & Pay Step */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="PayScale"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Pay Scale"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.PayScale}
                                            helperText={errors.PayScale?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="PayScaleStep"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Pay Step"
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.PayScaleStep}
                                            helperText={errors.PayScaleStep?.message}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            inputProps={{
                                                step: "0.01",
                                                min: "0"
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Hourly Wage & Deviating Wage */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="HourlyWage100Percent"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Hourly Wage (100%)"
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.HourlyWage100Percent}
                                            helperText={errors.HourlyWage100Percent?.message}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            inputProps={{
                                                step: "0.01",
                                                min: "0"
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="DeviatingWage"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Deviating Wage (if applicable)"
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.DeviatingWage}
                                            helperText={errors.DeviatingWage?.message}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            inputProps={{
                                                step: "0.01",
                                                min: "0"
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Commute and Travel Expenses Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Commute and Travel Expenses
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            {/* Commute Kilometers - Full Width */}
                            <Grid item xs={12}>
                                <Controller
                                    name="CommuteKilometers"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Commute Kilometers"
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.CommuteKilometers}
                                            helperText={errors.CommuteKilometers?.message}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            inputProps={{
                                                step: "0.01",
                                                min: "0"
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Travel Expenses Rate & Maximum Travel Expenses */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="TravelExpenses"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Travel Expenses Rate"
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.TravelExpenses}
                                            helperText={errors.TravelExpenses?.message}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            inputProps={{
                                                step: "0.01",
                                                min: "0"
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="MaxTravelExpenses"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Maximum Travel Expenses"
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.MaxTravelExpenses}
                                            helperText={errors.MaxTravelExpenses?.message}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            inputProps={{
                                                step: "0.01",
                                                min: "0"
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Vacation & Allowances Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Vacation & Allowances
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            {/* Vacation Age Threshold & Vacation Days */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="VacationAge"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Vacation Age Threshold"
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.VacationAge}
                                            helperText={errors.VacationAge?.message}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            inputProps={{
                                                step: "0.01",
                                                min: "0"
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="VacationDays"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Vacation Days"
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.VacationDays}
                                            helperText={errors.VacationDays?.message}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            inputProps={{
                                                step: "0.01",
                                                min: "0"
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* ATV & Vacation Allowance Percentage */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="Atv"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="ATV (Reduced Working Hours)"
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.Atv}
                                            helperText={errors.Atv?.message}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            inputProps={{
                                                step: "0.01",
                                                min: "0"
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="VacationAllowance"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Vacation Allowance (%)"
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.VacationAllowance}
                                            helperText={errors.VacationAllowance?.message}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            inputProps={{
                                                step: "0.01",
                                                min: "0",
                                                max: "100"
                                            }}
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
                                    name="Remark"
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
                                            error={!!errors.Remark}
                                            helperText={errors.Remark?.message}
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
                            disabled={isPending}
                        >
                            {isPending ? 'Creating Driver...' : 'Create Driver'}
                        </Button>
                    </Box>
                </form>
            </Box>
        </Box>
    );
} 