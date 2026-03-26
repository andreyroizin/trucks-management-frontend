'use client';

import React, {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Autocomplete,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Divider
} from '@mui/material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {DesktopDatePicker} from '@mui/x-date-pickers/DesktopDatePicker';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';

import {useAuth} from '@/hooks/useAuth';
import {useDrivers} from '@/hooks/useDrivers';
import {useCompanies} from '@/hooks/useCompanies';

import {useCreateEmployeeContract, CreateEmployeeContractInput, ContractType} from '@/hooks/useCreateEmployeeContract';

// React Hook Form + Yup
import {useForm, Controller, SubmitHandler, useWatch} from 'react-hook-form';
import * as yup from 'yup';
import {yupResolver} from '@hookform/resolvers/yup';
import {useTranslations} from 'next-intl';

const CONTRACT_TYPES: ContractType[] = ['CAO', 'ZZP', 'Inleen', 'BriefLoonschaal', 'Raam', 'Bemiddeling'];

export default function CreateEmployeeContractPage() {
    dayjs.extend(utc);
    dayjs.extend(timezone);
    const AMSTERDAM_TZ = 'Europe/Amsterdam';

    const router = useRouter();
    const {isAuthenticated, loading: authLoading} = useAuth();
    const t = useTranslations();

    // --- VALIDATION SCHEMA - moved inside component to access translations ---
    const createContractSchema = yup.object().shape({
        employeeFirstName: yup.string().required(t('contracts.create.validation.employeeFirstNameRequired')),
        employeeLastName: yup.string().required(t('contracts.create.validation.employeeLastNameRequired')),
        companyName: yup.string().required(t('contracts.create.validation.companyNameRequired')),
        employerName: yup.string().required(t('contracts.create.validation.employerNameRequired')),
    });

    // Restrict access
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Fetch data
    const {data: driversData, isLoading: loadingDrivers} = useDrivers();
    const {data: companiesData, isLoading: loadingCompanies} = useCompanies(1, 1000);

    // React Hook Form
    const {
        handleSubmit,
        control,
        setValue,
        formState: {errors},
    } = useForm<CreateEmployeeContractInput>({
        resolver: yupResolver(createContractSchema),
        defaultValues: {
            // Optional booleans
            nightHoursAllowed: true,
            kilometersAllowanceAllowed: true,
            commuteKilometers: 12.5,
            payScale: 'D',
            payScaleStep: 6,
            hourlyWage100Percent: 17.5,
            deviatingWage: 18,
            travelExpenses: 0.23,
            maxTravelExpenses: 100,
            vacationAge: 44,
            vacationDays: 28,
            atv: 3.5,
            vacationAllowance: 8,
            function: 'Truck Driver',
            probationPeriod: '2 months',
            workweekDuration: 40,
            weeklySchedule: 'Mon-Fri',
            workingHours: '07:00 - 19:00',
            noticePeriod: '1 month',
            compensationPerMonthExclBtw: 3000,
            compensationPerMonthInclBtw: 3630,
        },
    });

    const contractType = useWatch({ control, name: 'contractType' });
    const {mutateAsync: createContract, isPending} = useCreateEmployeeContract();
    const [apiError, setApiError] = React.useState<string | null>(null);

    // On Submit
    const onSubmit: SubmitHandler<CreateEmployeeContractInput> = async (data) => {
        setApiError(null);
        try {
            await createContract(data);
            router.push('/contracts');
        } catch (err: any) {
            setApiError(err.message || t('contracts.create.errors.createFailed'));
        }
    };

    // If loading
    if (authLoading || loadingDrivers || loadingCompanies) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
                <CircularProgress/>
            </Box>
        );
    }

    // Handler: choose driver => prefill some employee fields
    const handleDriverSelect = (driverId: string) => {
        // optional
        setValue('driverId', driverId);
        const foundDriver = driversData?.find((d) => d.id === driverId);
        if (foundDriver?.user) {
            setValue('employeeFirstName', foundDriver.user.firstName || '');
            setValue('employeeLastName', foundDriver.user.lastName || '');
        }
    };

    // Handler: choose company => prefill some company fields
    const handleCompanySelect = (companyId: string) => {
        // optional
        setValue('companyId', companyId);
        const foundCompany = companiesData?.data.find((c) => c.id === companyId);
        if (foundCompany) {
            setValue('companyName', foundCompany.name);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box
                component="form"
                onSubmit={handleSubmit(onSubmit)}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center', // center the 2 columns
                    p: 2,
                }}
            >
                <Typography variant="h5" mb={2}>
                    {t('contracts.create.title')}
                </Typography>

                {apiError && (
                    <Alert severity="error" sx={{mb: 2}}>
                        {apiError}
                    </Alert>
                )}

                {/* 2-column grid (driver/employee left, company right) */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {xs: '1fr', md: '1fr 1fr'},
                        gap: 2,
                        maxWidth: 1000,
                        width: '100%',
                    }}
                >
                    {/* LEFT COLUMN (Driver + Employee) */}
                    <Box display="flex" flexDirection="column" gap={2}>
                        {/* Contract Type */}
                        <Controller
                            name="contractType"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Contract Type"
                                    helperText="Select the type of contract"
                                >
                                    {CONTRACT_TYPES.map((ct) => (
                                        <MenuItem key={ct} value={ct}>{ct}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />

                        {/* Driver (optional) */}
                        <Controller
                            name="driverId"
                            control={control}
                            render={({field}) => (
                                <Autocomplete
                                    options={driversData || []}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    getOptionLabel={(option) =>
                                        option.user?.firstName + ' ' + option.user?.lastName
                                    }
                                    value={driversData?.find((d) => d.id === field.value) || null}
                                    onChange={(_, newVal) => {
                                        handleDriverSelect(newVal?.id || '');
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={t('contracts.create.fields.driver')}
                                            helperText={t('contracts.create.fields.driverHelp')}
                                        />
                                    )}
                                />
                            )}
                        />

                        {/* commuteKilometers */}
                        <Controller
                            name="commuteKilometers"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Commute Kilometers"
                                    type="number"
                                    helperText="Distance from home to work in km (optional)"
                                />
                            )}
                        />

                        {/* employeeFirstName (required) */}
                        <Controller
                            name="employeeFirstName"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Employee First Name *"
                                    error={!!errors.employeeFirstName}
                                    helperText={
                                        errors.employeeFirstName?.message ||
                                        'This is a required field'
                                    }
                                    value={field.value ?? ''}
                                />
                            )}
                        />

                        {/* employeeLastName (required) */}
                        <Controller
                            name="employeeLastName"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Employee Last Name *"
                                    error={!!errors.employeeLastName}
                                    helperText={
                                        errors.employeeLastName?.message ||
                                        'This is a required field'
                                    }
                                    value={field.value ?? ''}
                                />
                            )}
                        />

                        {/* dateOfBirth */}
                        <Controller
                            name="dateOfBirth"
                            control={control}
                            render={({field}) => (
                                <DesktopDatePicker
                                    label="Date of Birth"
                                    value={field.value ? dayjs.utc(field.value).tz(AMSTERDAM_TZ) : null}
                                    onChange={(newVal) => {
                                        if (newVal) {
                                            const utcMidnight = dayjs.utc(newVal).startOf('day').toISOString();
                                            field.onChange(utcMidnight);
                                        } else {
                                            field.onChange(null);
                                        }
                                    }}
                                    format="DD-MM-YYYY"
                                    slotProps={{
                                        textField: {
                                            helperText: "DD-MM-YYYY",
                                            fullWidth: true,
                                        }
                                    }}
                                />
                            )}
                        />

                        {/* bsn */}
                        <Controller
                            name="bsn"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="BSN"
                                    helperText="Citizen service number (optional)"
                                />
                            )}
                        />

                        {/* dateOfEmployment */}
                        <Controller
                            name="dateOfEmployment"
                            control={control}
                            render={({field}) => (
                                <DesktopDatePicker
                                    label="Date of Employment"
                                    value={field.value ? dayjs.utc(field.value).tz(AMSTERDAM_TZ) : null}
                                    onChange={(newVal) => {
                                        if (newVal) {
                                            const utcMidnight = dayjs.utc(newVal).startOf('day').toISOString();
                                            field.onChange(utcMidnight);
                                        } else {
                                            field.onChange(null);
                                        }
                                    }}
                                    format="DD-MM-YYYY"
                                    slotProps={{
                                        textField: {
                                            helperText: "Start date (optional)",
                                            fullWidth: true,
                                        }
                                    }}
                                />
                            )}
                        />

                        {/* lastWorkingDay */}
                        <Controller
                            name="lastWorkingDay"
                            control={control}
                            render={({field}) => (
                                <DesktopDatePicker
                                    label="Last Working Day"
                                    value={field.value ? dayjs.utc(field.value).tz(AMSTERDAM_TZ) : null}
                                    onChange={(newVal) => {
                                        if (newVal) {
                                            const utcMidnight = dayjs.utc(newVal).startOf('day').toISOString();
                                            field.onChange(utcMidnight);
                                        } else {
                                            field.onChange(null);
                                        }
                                    }}
                                    format="DD-MM-YYYY"
                                    slotProps={{
                                        textField: {
                                            helperText: "If applicable",
                                            fullWidth: true,
                                            margin: "normal"
                                        }
                                    }}
                                />
                            )}
                        />

                        {/* employeeAddress */}
                        <Controller
                            name="employeeAddress"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Employee Address"
                                    helperText="Street + House Number (optional)"
                                />
                            )}
                        />

                        {/* employeePostcode */}
                        <Controller
                            name="employeePostcode"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Employee Postcode"
                                    helperText="Postal code (optional)"
                                />
                            )}
                        />

                        {/* employeeCity */}
                        <Controller
                            name="employeeCity"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Employee City"
                                    helperText="City (optional)"
                                />
                            )}
                        />

                        {/* function */}
                        <Controller
                            name="function"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Function/Role"
                                    helperText="Job role (optional)"
                                />
                            )}
                        />

                        {/* probationPeriod */}
                        <Controller
                            name="probationPeriod"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Probation Period"
                                    helperText="e.g. '2 months' (optional)"
                                />
                            )}
                        />

                        {/* workweekDuration */}
                        <Controller
                            name="workweekDuration"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Workweek (hrs)"
                                    type="number"
                                    helperText="Hours/week (optional)"
                                />
                            )}
                        />

                        {/* weeklySchedule */}
                        <Controller
                            name="weeklySchedule"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Weekly Schedule"
                                    helperText="e.g. 'Mon-Fri' (optional)"
                                />
                            )}
                        />

                        {/* workingHours */}
                        <Controller
                            name="workingHours"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Working Hours"
                                    helperText="e.g. '07:00 - 19:00' (optional)"
                                />
                            )}
                        />

                        {/* noticePeriod */}
                        <Controller
                            name="noticePeriod"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Notice Period"
                                    helperText="e.g. '1 month' (optional)"
                                />
                            )}
                        />
                        {/* nightHoursAllowed */}
                        <Controller
                            name="nightHoursAllowed"
                            control={control}
                            render={({field}) => (
                                <FormControlLabel
                                    sx={{mt: 1}}
                                    control={
                                        <Checkbox
                                            checked={field.value ?? false}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                        />
                                    }
                                    label="Night Hours Allowed?"
                                />
                            )}
                        />
                    </Box>

                    {/* RIGHT COLUMN (Company fields) */}
                    <Box display="flex" flexDirection="column" gap={2}>
                        {/* companyId (optional) */}
                        <Controller
                            name="companyId"
                            control={control}
                            render={({field}) => (
                                <Autocomplete
                                    options={companiesData?.data || []}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    getOptionLabel={(option) => option.name || ''}
                                    value={
                                        companiesData?.data.find((c) => c.id === field.value) || null
                                    }
                                    onChange={(_, newVal) => {
                                        if (newVal) {
                                            handleCompanySelect(newVal.id);
                                        } else {
                                            handleCompanySelect('');
                                        }
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Company (optional)"
                                            helperText="Link this contract to existing company"
                                        />
                                    )}
                                />
                            )}
                        />

                        {/* companyName (required) */}
                        <Controller
                            name="companyName"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Company Name *"
                                    error={!!errors.companyName}
                                    helperText={
                                        errors.companyName?.message ||
                                        'Required company name'
                                    }
                                    value={field.value ?? ''}
                                />
                            )}
                        />

                        {/* employerName (required) */}
                        <Controller
                            name="employerName"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Employer Name *"
                                    error={!!errors.employerName}
                                    helperText={
                                        errors.employerName?.message ||
                                        'Name of the person/employer'
                                    }
                                />
                            )}
                        />

                        {/* companyAddress */}
                        <Controller
                            name="companyAddress"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Company Address"
                                    helperText="Street + Number (optional)"
                                />
                            )}
                        />

                        {/* companyPostcode */}
                        <Controller
                            name="companyPostcode"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Company Postcode"
                                    helperText="Postal code (optional)"
                                />
                            )}
                        />

                        {/* companyCity */}
                        <Controller
                            name="companyCity"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Company City"
                                    helperText="City (optional)"
                                />
                            )}
                        />

                        {/* companyPhoneNumber */}
                        <Controller
                            name="companyPhoneNumber"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Company Phone"
                                    helperText="Contact phone (optional)"
                                />
                            )}
                        />

                        {/* companyBtw */}
                        <Controller
                            name="companyBtw"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Company BTW"
                                    helperText="e.g. NL123456789B01 (optional)"
                                />
                            )}
                        />

                        {/* companyKvk */}
                        <Controller
                            name="companyKvk"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Company KVK"
                                    helperText="Chamber of Commerce # (optional)"
                                />
                            )}
                        />

                        {/* compensationPerMonthExclBtw */}
                        <Controller
                            name="compensationPerMonthExclBtw"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Compensation/Month Excl BTW"
                                    type="number"
                                    helperText="Gross monthly wage (optional)"
                                />
                            )}
                        />

                        {/* compensationPerMonthInclBtw */}
                        <Controller
                            name="compensationPerMonthInclBtw"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Compensation/Month Incl BTW"
                                    type="number"
                                    helperText="Monthly wage inc. tax (optional)"
                                />
                            )}
                        />

                        {/* payScale */}
                        <Controller
                            name="payScale"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Pay Scale"
                                    helperText="A/B/C/D etc. (optional)"
                                >
                                    {['A', 'B', 'C', 'D', 'E'].map((scale) => (
                                        <MenuItem key={scale} value={scale}>
                                            {scale}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />

                        {/* payScaleStep */}
                        <Controller
                            name="payScaleStep"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Pay Scale Step"
                                    helperText="0 to 10 (optional)"
                                >
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                        <MenuItem key={n} value={n}>
                                            {n}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />

                        {/* hourlyWage100Percent */}
                        <Controller
                            name="hourlyWage100Percent"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Hourly Wage (100%)"
                                    type="number"
                                    helperText="Base rate per hour (optional)"
                                />
                            )}
                        />

                        {/* deviatingWage */}
                        <Controller
                            name="deviatingWage"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Deviating Wage"
                                    type="number"
                                    helperText="If different from base wage (optional)"
                                />
                            )}
                        />

                        {/* kilometersAllowanceAllowed */}
                        <Controller
                            name="kilometersAllowanceAllowed"
                            control={control}
                            render={({field}) => (
                                <FormControlLabel
                                    sx={{mt: 1}}
                                    control={
                                        <Checkbox
                                            checked={field.value ?? false}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                        />
                                    }
                                    label="Kilometers Allowance Allowed"
                                />
                            )}
                        />

                        {/* travelExpenses */}
                        <Controller
                            name="travelExpenses"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Travel Expenses"
                                    type="number"
                                    helperText="€/km or allowance rate (optional)"
                                />
                            )}
                        />

                        {/* maxTravelExpenses */}
                        <Controller
                            name="maxTravelExpenses"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Max Travel Expenses"
                                    type="number"
                                    helperText="Maximum reimbursed (optional)"
                                />
                            )}
                        />

                        {/* vacationAge */}
                        <Controller
                            name="vacationAge"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Vacation Age"
                                    type="number"
                                    helperText="Employee's age for vacation calc (opt)"
                                />
                            )}
                        />

                        {/* vacationDays */}
                        <Controller
                            name="vacationDays"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Vacation Days"
                                    type="number"
                                    helperText="Days per year (optional)"
                                />
                            )}
                        />

                        {/* atv */}
                        <Controller
                            name="atv"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="ATV"
                                    type="number"
                                    helperText="Additional days/hours (optional)"
                                />
                            )}
                        />

                        {/* vacationAllowance */}
                        <Controller
                            name="vacationAllowance"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Vacation Allowance (%)"
                                    type="number"
                                    helperText="Percentage of wage (optional)"
                                />
                            )}
                        />
                    </Box>
                </Box>

                {/* RAAM FIELDS */}
                {contractType === 'Raam' && (
                    <Box mt={2} width="100%" maxWidth={1000}>
                        <Divider sx={{mb: 2}}/>
                        <Typography variant="h6" mb={2}>Raam (Framework) Contract Fields</Typography>
                        <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', md: '1fr 1fr'}, gap: 2}}>
                            <Controller name="raamContractNumber" control={control} render={({field}) => (
                                <TextField {...field} label="Raam Contract Number" helperText="e.g. RAAM-2026-001 (optional)"/>
                            )}/>
                            <Controller name="raamOpdrachtgeverName" control={control} render={({field}) => (
                                <TextField {...field} label="Opdrachtgever Name *" helperText="Transport company name (required)"/>
                            )}/>
                            <Controller name="raamOpdrachtgeverKvk" control={control} render={({field}) => (
                                <TextField {...field} label="Opdrachtgever KvK" helperText="KvK number of transport company"/>
                            )}/>
                            <Controller name="raamOpdrachtgeverAddress" control={control} render={({field}) => (
                                <TextField {...field} label="Opdrachtgever Address"/>
                            )}/>
                            <Controller name="raamOpdrachtgeverCity" control={control} render={({field}) => (
                                <TextField {...field} label="Opdrachtgever City"/>
                            )}/>
                            <Controller name="raamWorkDescription" control={control} render={({field}) => (
                                <TextField {...field} label="Work Description" helperText="e.g. Vervoer van goederen over de weg"/>
                            )}/>
                            <Controller name="raamLocation" control={control} render={({field}) => (
                                <TextField {...field} label="Location" helperText="e.g. Nederland"/>
                            )}/>
                            <Controller name="raamHourlyRateExclBtw" control={control} render={({field}) => (
                                <TextField {...field} type="number" label="Hourly Rate Excl BTW (€) *" helperText="Rate Boratech charges the transport company (required)"/>
                            )}/>
                            <Controller name="raamBtwPercentage" control={control} render={({field}) => (
                                <TextField {...field} type="number" label="BTW %" helperText="Default 21"/>
                            )}/>
                            <Controller name="raamPaymentTermDays" control={control} render={({field}) => (
                                <TextField {...field} label="Payment Term" helperText="e.g. 14 dagen"/>
                            )}/>
                            <Controller name="raamStartDate" control={control} render={({field}) => (
                                <DesktopDatePicker
                                    label="Start Date"
                                    value={field.value ? dayjs(field.value) : null}
                                    onChange={(v) => field.onChange(v ? v.toISOString() : null)}
                                    slotProps={{textField: {helperText: 'Raam contract start date'}}}
                                />
                            )}/>
                            <Controller name="raamEndDate" control={control} render={({field}) => (
                                <DesktopDatePicker
                                    label="End Date"
                                    value={field.value ? dayjs(field.value) : null}
                                    onChange={(v) => field.onChange(v ? v.toISOString() : null)}
                                    slotProps={{textField: {helperText: 'Leave empty for indefinite duration'}}}
                                />
                            )}/>
                        </Box>
                    </Box>
                )}

                {/* BEMIDDELING FIELDS */}
                {contractType === 'Bemiddeling' && (
                    <Box mt={2} width="100%" maxWidth={1000}>
                        <Divider sx={{mb: 2}}/>
                        <Typography variant="h6" mb={2}>Bemiddeling (Mediation) Contract Fields</Typography>
                        <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', md: '1fr 1fr'}, gap: 2}}>
                            <Controller name="bemiddelingContractNumber" control={control} render={({field}) => (
                                <TextField {...field} label="Bemiddeling Contract Number" helperText="e.g. BEM-2026-001 (optional)"/>
                            )}/>
                            <Controller name="bemiddelingOpdrachtnemerKvk" control={control} render={({field}) => (
                                <TextField {...field} label="Driver KvK Number *" helperText="ZZP driver's KvK (required)"/>
                            )}/>
                            <Controller name="bemiddelingOpdrachtnemerBtw" control={control} render={({field}) => (
                                <TextField {...field} label="Driver BTW Number" helperText="ZZP driver's BTW number (optional)"/>
                            )}/>
                            <Controller name="bemiddelingWorkDescription" control={control} render={({field}) => (
                                <TextField {...field} label="Work Description" helperText="e.g. Vervoer van goederen over de weg"/>
                            )}/>
                            <Controller name="bemiddelingLocation" control={control} render={({field}) => (
                                <TextField {...field} label="Location" helperText="e.g. Nederland"/>
                            )}/>
                            <Controller name="bemiddelingHourlyRateExclBtw" control={control} render={({field}) => (
                                <TextField {...field} type="number" label="Hourly Rate Excl BTW (€) *" helperText="Rate paid to driver (required)"/>
                            )}/>
                            <Controller name="bemiddelingBtwPercentage" control={control} render={({field}) => (
                                <TextField {...field} type="number" label="BTW %" helperText="Default 21"/>
                            )}/>
                            <Controller name="bemiddelingMediationFeePerWeek" control={control} render={({field}) => (
                                <TextField {...field} type="number" label="Mediation Fee / Week (€)" helperText="Boratech mediation fee per week"/>
                            )}/>
                            <Controller name="bemiddelingPaymentTermDays" control={control} render={({field}) => (
                                <TextField {...field} label="Payment Term" helperText="e.g. 14 dagen"/>
                            )}/>
                            <Controller name="bemiddelingStartDate" control={control} render={({field}) => (
                                <DesktopDatePicker
                                    label="Start Date"
                                    value={field.value ? dayjs(field.value) : null}
                                    onChange={(v) => field.onChange(v ? v.toISOString() : null)}
                                    slotProps={{textField: {helperText: 'Bemiddeling contract start date'}}}
                                />
                            )}/>
                            <Controller name="bemiddelingEndDate" control={control} render={({field}) => (
                                <DesktopDatePicker
                                    label="End Date"
                                    value={field.value ? dayjs(field.value) : null}
                                    onChange={(v) => field.onChange(v ? v.toISOString() : null)}
                                    slotProps={{textField: {helperText: 'Leave empty for indefinite duration'}}}
                                />
                            )}/>
                        </Box>
                    </Box>
                )}

                {/* SUBMIT BUTTON */}
                <Box mt={2} width="100%" maxWidth={1000}>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isPending}
                        fullWidth
                    >
                        {isPending ? <CircularProgress size={20} color="inherit"/> : 'Create Contract'}
                    </Button>
                </Box>
            </Box>
        </LocalizationProvider>
    );
}
