'use client';

import React, {useEffect} from 'react';
import {useRouter, useParams} from 'next/navigation';
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
    Divider,
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
import {
    useUpdateEmployeeContract,
    EmployeeContractDetail,
} from '@/hooks/useEmployeeContractUpdate';
import type {ContractType} from '@/hooks/useCreateEmployeeContract';

// React Hook Form + Yup
import {useForm, Controller, SubmitHandler, useWatch} from 'react-hook-form';
import * as yup from 'yup';
import {yupResolver} from '@hookform/resolvers/yup';
import {useEmployeeContractDetail} from "@/hooks/useEmployeeContractDetail";

const CONTRACT_TYPES: ContractType[] = ['CAO', 'ZZP', 'Inleen', 'BriefLoonschaal', 'Raam', 'Bemiddeling'];

// --- VALIDATION SCHEMA ---
const editContractSchema = yup.object().shape({
    id: yup.string().required('Contract id required'),
    companyId: yup.string().required('Company is required'),
    employeeFirstName: yup.string().required('Employee first name is required'),
    employeeLastName: yup.string().required('Employee last name is required'),
    companyName: yup.string().required('Company name is required'),
    employerName: yup.string().required('Employer name is required'),
});

export default function EditEmployeeContractPage() {
    dayjs.extend(utc);
    dayjs.extend(timezone);
    const AMSTERDAM_TZ = 'Europe/Amsterdam';

    const router = useRouter();
    const {id} = useParams(); // /contracts/edit/[id]
    const {user, isAuthenticated, loading: authLoading} = useAuth();

    // 1) Restrict access to roles
    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                router.push('/auth/login');
            } else if (
                !user?.roles.includes('customerAdmin') &&
                !user?.roles.includes('globalAdmin')
            ) {
                router.push('/403');
            }
        }
    }, [authLoading, isAuthenticated, user, router]);

    // 2) Fetch data for Autocomplete
    const {data: driversData, isLoading: loadingDrivers} = useDrivers();
    const {data: companiesData, isLoading: loadingCompanies} = useCompanies(1, 1000);

    // 3) Fetch existing contract detail
    const {
        data: contract,
        isLoading,
        isError,
        error,
    } = useEmployeeContractDetail(id as string);

    // 4) Setup form
    const {
        handleSubmit,
        control,
        setValue,
        formState: {errors},
    } = useForm<EmployeeContractDetail>({
        resolver: yupResolver(editContractSchema),
    });

    // 5) Populate once detail is loaded
    useEffect(() => {
        if (contract) {
            Object.entries(contract).forEach(([key, val]) => {
                setValue(key as keyof EmployeeContractDetail, val as any);
            });
            setValue('driverId', contract.driver?.id || '');
            setValue('companyId', contract.company?.id || '');
        }
    }, [contract, setValue]);

    const contractType = useWatch({ control, name: 'contractType' });

    // 6) Mutation
    const {mutateAsync: updateContract, isPending} = useUpdateEmployeeContract(id as string);

    // Local error
    const [apiError, setApiError] = React.useState<string | null>(null);

    // On Submit
    const onSubmit: SubmitHandler<EmployeeContractDetail> = async (data) => {
        setApiError(null);
        try {
            await updateContract(data);
            router.push(`/contracts/${id}`);
        } catch (err: any) {
            console.error(err)
            setApiError(err.response?.data?.errors?.[0] || err.message || 'Failed to update contract');
        }
    };

    // If loading
    if (authLoading || loadingDrivers || loadingCompanies || isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
                <CircularProgress/>
            </Box>
        );
    }
    if (isError || !contract) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
                <Alert severity="error">{error?.message || 'Failed to load contract detail'}</Alert>
            </Box>
        );
    }

    // Handler: driver select => set driverId
    const handleDriverSelect = (driverId: string) => {
        setValue('driverId', driverId);
        const foundDriver = driversData?.find((d) => d.id === driverId);
        if (foundDriver?.user) {
            setValue('employeeFirstName', foundDriver.user.firstName || '');
            setValue('employeeLastName', foundDriver.user.lastName || '');
        }
    };

    // Handler: company select => set companyId + maybe companyName
    const handleCompanySelect = (companyId: string) => {
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
                    Edit Employee Contract
                </Typography>

                {apiError && (
                    <Alert severity="error" sx={{mb: 2}}>
                        {apiError}
                    </Alert>
                )}

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {xs: '1fr', md: '1fr 1fr'},
                        gap: 2,
                        maxWidth: 1000,
                        width: '100%',
                    }}
                >
                    {/* LEFT COLUMN (Driver + Employee fields) */}
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

                        {/* driverId (Autocomplete) */}
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
                                    onChange={(_, newVal) => handleDriverSelect(newVal?.id || '')}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Driver (optional)"
                                            helperText="If selected, we prefill the name"
                                        />
                                    )}
                                />
                            )}
                        />

                        {/* employeeFirstName */}
                        <Controller
                            name="employeeFirstName"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Employee First Name *"
                                    error={!!errors.employeeFirstName}
                                    helperText={
                                        errors.employeeFirstName?.message || 'Required'
                                    }
                                />
                            )}
                        />

                        {/* employeeLastName */}
                        <Controller
                            name="employeeLastName"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Employee Last Name *"
                                    error={!!errors.employeeLastName}
                                    helperText={
                                        errors.employeeLastName?.message || 'Required'
                                    }
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
                                            const isoMidnight = dayjs.utc(newVal).startOf('day').toISOString();
                                            field.onChange(isoMidnight);
                                        } else {
                                            field.onChange(null);
                                        }
                                    }}
                                    format="DD-MM-YYYY"
                                    slotProps={{
                                        textField: {
                                            helperText: 'DD-MM-YYYY',
                                            fullWidth: true,
                                        },
                                    }}
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
                                            const iso = dayjs.utc(newVal).startOf('day').toISOString();
                                            field.onChange(iso);
                                        } else {
                                            field.onChange(null);
                                        }
                                    }}
                                    format="DD-MM-YYYY"
                                    slotProps={{
                                        textField: {
                                            helperText: 'Start date (optional)',
                                            fullWidth: true,
                                        },
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
                                            const iso = dayjs.utc(newVal).startOf('day').toISOString();
                                            field.onChange(iso);
                                        } else {
                                            field.onChange(null);
                                        }
                                    }}
                                    format="DD-MM-YYYY"
                                    slotProps={{
                                        textField: {
                                            helperText: 'If applicable',
                                            fullWidth: true,
                                        },
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
                                    helperText="Citizen service number"
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

                    {/* RIGHT COLUMN (Company + wage fields) */}
                    <Box display="flex" flexDirection="column" gap={2}>
                        {/* companyId (Autocomplete) */}
                        <Controller
                            name="companyId"
                            control={control}
                            render={({field}) => (
                                <Autocomplete
                                    options={companiesData?.data || []}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    getOptionLabel={(option) => option.name}
                                    value={
                                        companiesData?.data.find((co) => co.id === field.value) || null
                                    }
                                    onChange={(_, newVal) => handleCompanySelect(newVal?.id || '')}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Company*"
                                            error={!!errors.companyId}
                                            helperText="Link this contract to existing company"
                                        />
                                    )}
                                />
                            )}
                        />

                        {/* companyName */}
                        <Controller
                            name="companyName"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Company Name *"
                                    error={!!errors.companyName}
                                    helperText={errors.companyName?.message || 'Required'}
                                />
                            )}
                        />

                        {/* employerName */}
                        <Controller
                            name="employerName"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    label="Employer Name *"
                                    error={!!errors.employerName}
                                    helperText={errors.employerName?.message || 'Required'}
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
                                    control={
                                        <Checkbox
                                            checked={field.value ?? false}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                        />
                                    }
                                    label="Kilometers Allowance?"
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
                                <TextField {...field} label="Opdrachtgever KvK"/>
                            )}/>
                            <Controller name="raamOpdrachtgeverAddress" control={control} render={({field}) => (
                                <TextField {...field} label="Opdrachtgever Address"/>
                            )}/>
                            <Controller name="raamOpdrachtgeverCity" control={control} render={({field}) => (
                                <TextField {...field} label="Opdrachtgever City"/>
                            )}/>
                            <Controller name="raamWorkDescription" control={control} render={({field}) => (
                                <TextField {...field} label="Work Description"/>
                            )}/>
                            <Controller name="raamLocation" control={control} render={({field}) => (
                                <TextField {...field} label="Location" helperText="e.g. Nederland"/>
                            )}/>
                            <Controller name="raamHourlyRateExclBtw" control={control} render={({field}) => (
                                <TextField {...field} type="number" label="Hourly Rate Excl BTW (€) *"/>
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
                                <TextField {...field} label="Driver BTW Number"/>
                            )}/>
                            <Controller name="bemiddelingWorkDescription" control={control} render={({field}) => (
                                <TextField {...field} label="Work Description"/>
                            )}/>
                            <Controller name="bemiddelingLocation" control={control} render={({field}) => (
                                <TextField {...field} label="Location" helperText="e.g. Nederland"/>
                            )}/>
                            <Controller name="bemiddelingHourlyRateExclBtw" control={control} render={({field}) => (
                                <TextField {...field} type="number" label="Hourly Rate Excl BTW (€) *"/>
                            )}/>
                            <Controller name="bemiddelingBtwPercentage" control={control} render={({field}) => (
                                <TextField {...field} type="number" label="BTW %" helperText="Default 21"/>
                            )}/>
                            <Controller name="bemiddelingMediationFeePerWeek" control={control} render={({field}) => (
                                <TextField {...field} type="number" label="Mediation Fee / Week (€)"/>
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
                        {isPending ? <CircularProgress size={20} color="inherit"/> : 'Save Changes'}
                    </Button>
                </Box>
            </Box>
        </LocalizationProvider>
    );
}
