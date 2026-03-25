'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Autocomplete,
    Grid,
    Checkbox,
    FormControlLabel,
    Dialog,
    DialogContent,
    DialogActions,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Controller, useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCompanies } from '@/hooks/useCompanies';
import { useCreateDriver } from '@/hooks/useCreateDriver';
import FileUploadBox from '@/components/FileUploadBox';
import { getHourlyWage, getAvailableSteps } from '@/data/payScales';
import ContractTypeSection from '@/components/ContractTypeSection';
import { ContractTypeValue } from '@/constants/contractTypes';
import dayjs from 'dayjs';
import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';
import nl from 'i18n-iso-countries/langs/nl.json';
import bg from 'i18n-iso-countries/langs/bg.json';

// Register country data for multiple languages
countries.registerLocale(en);
countries.registerLocale(nl);
countries.registerLocale(bg);
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const AMSTERDAM_TZ = 'Europe/Amsterdam';

// Schema will be defined inside the component to access translations

type FormInputs = {
    CompanyId: string;                      // Required - backend: CompanyId
    UsedByCompanyIds?: string[];            // Optional - backend: UsedByCompanyIds
    Email: string;                          // Required - backend: Email
    Password: string;                       // Required - backend: Password
    FirstName: string;                      // Required - backend: FirstName
    LastName: string;                       // Required - backend: LastName
    DateOfBirth: string;                    // Required - backend: DateOfBirth
    PhoneNumber?: string;                   // Optional - backend: PhoneNumber
    Address: string;                        // Required - backend: Address
    Postcode: string;                       // Required - backend: Postcode
    City: string;                           // Required - backend: City
    Country?: string;                       // Optional - backend: Country
    BSN: string;                            // Required - backend: BSN
    IBAN?: string;                          // Optional - backend: IBAN
    EmploymentStartDate: string;            // Required - form field, converts to DateOfEmployment for backend
    PermanentContract?: boolean;            // Optional - backend: PermanentContract
    ContractDuration?: number;              // Optional - backend: ContractDuration (in months)
    LastWorkingDay?: string;                // Optional - backend: lastWorkingDay (calculated from EmploymentStartDate + ContractDuration, but editable)
    ProbationPeriod?: string | null;        // Optional - backend: ProbationPeriod
    NoticePeriod?: string | null;           // Optional - backend: NoticePeriod
    Function: string;                       // Required - backend: Function
    WorkweekDuration: number;               // Required - backend: WorkweekDuration
    WorkweekDurationPercentage?: number;    // Calculated - backend: WorkweekDurationPercentage
    WeeklySchedule: string;                 // Required - backend: WeeklySchedule
    WorkingHours: string;                   // Required - backend: WorkingHours
    PayScale: string;                       // Required - backend: PayScale
    PayScaleStep: number;                   // Required - backend: PayScaleStep
    HourlyWage?: number;                    // Optional - backend: hourlyWage (editable, prefilled from CAO)
    CommuteKilometers?: number;             // Optional - backend: CommuteKilometers
    KilometersAllowanceAllowed?: boolean;   // Optional - backend: KilometersAllowanceAllowed
    ATV: number;                            // Required - backend: Atv (default 3.5)
    Remark?: string;                        // Optional - backend: Remark

    // Contract type + type-specific fields
    ContractType: ContractTypeValue;
    // ZZP
    ZzpBtwNumber?: string;
    ZzpKvkNumber?: string;
    ZzpHourlyRateExclBtw?: number;
    ZzpBtwPercentage?: number;
    ZzpMediationFeePerWeek?: number;
    ZzpContractNumber?: string;
    ZzpWorkDescription?: string;
    ZzpLocation?: string;
    // Inleen
    InleenLendingCompanyId?: string;
    InleenBorrowingCompanyId?: string;
    InleenStartDate?: string;
    InleenEndDate?: string;
    InleenHourlyRate?: number;
    InleenWorkDescription?: string;
    InleenLocation?: string;
    // BriefLoonschaal
    BriefMonthlySalary?: number;
    BriefGrade?: string;
    BriefExpectedMonthlyHours?: number;
};

const getPeriodOptions = (t: any) => [
    { value: '1', label: t('drivers.create.periodOptions.1') },
    { value: '2', label: t('drivers.create.periodOptions.2') },
    { value: '3', label: t('drivers.create.periodOptions.3') },
    { value: '4', label: t('drivers.create.periodOptions.4') },
    { value: '5', label: t('drivers.create.periodOptions.5') },
    { value: '6', label: t('drivers.create.periodOptions.6') },
];

// Probation period options - numbers only (unit is in label)
const getProbationPeriodOptions = () => [
    { value: '0', label: '0' },
    { value: '1', label: '1' },
];

// Notice period options - numbers only (unit is in label)
const getNoticePeriodOptions = () => [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' },
    { value: '6', label: '6' },
];

// Function options - Dutch only (stored in database as-is)
const getFunctionOptions = () => [
    { value: 'Chauffeur', label: 'Chauffeur' },
    { value: 'Administratieve Medewerker', label: 'Administratieve Medewerker' },
    { value: 'Vervoermanager', label: 'Vervoermanager' },
    { value: 'Planner', label: 'Planner' },
    { value: 'Support Medewerker', label: 'Support Medewerker' },
    { value: 'Transport Manager', label: 'Transport Manager' },
];

// Country options - uses i18n-iso-countries library
// Returns countries with translated labels but Dutch values (for DB storage)
const getCountryOptions = (locale: string = 'en') => {
    const countryObjTranslated = countries.getNames(locale, { select: 'official' });
    const countryObjDutch = countries.getNames('nl', { select: 'official' });
    
    return Object.entries(countryObjTranslated)
        .map(([code, translatedName]) => ({ 
            code,
            label: translatedName,           // Show translated name in dropdown
            value: countryObjDutch[code]     // Store Dutch name in database
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
};

export default function CreateDriverPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { data: companiesData, isLoading: isCompaniesLoading } = useCompanies(1, 100);
    const { mutateAsync, isPending, isError, error } = useCreateDriver();
    const t = useTranslations();
    const locale = useLocale();
    
    const periodOptions = getPeriodOptions(t);
    const probationPeriodOptions = getProbationPeriodOptions();
    const noticePeriodOptions = getNoticePeriodOptions();
    const functionOptions = getFunctionOptions();
    const countryOptions = getCountryOptions(locale);
    
    // Set default function value (Chauffeur)
    const defaultFunctionValue = functionOptions[0]?.value || '';
    
    const schema = yup.object().shape({
        CompanyId: yup.string().required(t('drivers.create.fields.company.required')),
        UsedByCompanyIds: yup.array().of(yup.string().required()).optional(),
        Email: yup.string().email(t('drivers.create.fields.email.invalid')).required(t('drivers.create.fields.email.required')),
        Password: yup
            .string()
            .required(t('drivers.create.fields.password.required'))
            .matches(/[^a-zA-Z0-9]/, t('drivers.create.validation.passwordSpecialChar')),
        FirstName: yup.string().required(t('drivers.create.fields.firstName.required')),
        LastName: yup.string().required(t('drivers.create.fields.lastName.required')),
        DateOfBirth: yup.string().required(t('drivers.create.fields.dateOfBirth.required')),
        PhoneNumber: yup.string().optional(),
        Address: yup.string().required(t('drivers.create.fields.address.required')),
        Postcode: yup.string().required(t('drivers.create.fields.postcode.required')),
        City: yup.string().required(t('drivers.create.fields.city.required')),
        Country: yup.string().optional(),
        BSN: yup.string().required(t('drivers.create.fields.bsn.required')),
        IBAN: yup.string().optional(),
        EmploymentStartDate: yup.string().required(t('drivers.create.fields.employmentStartDate.required')),
        PermanentContract: yup.boolean().optional(),
        ContractDuration: yup.number().optional().min(1, t('drivers.create.validation.positiveNumber')),
        LastWorkingDay: yup.string().optional(),
        ProbationPeriod: yup.string().nullable().optional(),
        NoticePeriod: yup.string().nullable().optional(),
        Function: yup.string().required(t('drivers.create.fields.function.required')).max(100, t('drivers.create.fields.function.maxLength')),
        WorkweekDuration: yup.number().required(t('drivers.create.fields.workweekDuration.required')).min(1, t('drivers.create.fields.workweekDuration.minHours')),
        WeeklySchedule: yup.string().required(t('drivers.create.fields.weeklySchedule.required')),
        WorkingHours: yup.string().required(t('drivers.create.fields.workingHours.required')),
        PayScale: yup.string().required(t('drivers.create.fields.payScale.required')),
        PayScaleStep: yup.number().required(t('drivers.create.fields.payScaleStep.required')).min(0, t('drivers.create.validation.positiveNumber')),
        HourlyWage: yup.number().optional().min(0, t('drivers.create.validation.positiveNumber')),
        CommuteKilometers: yup.number().optional().min(0, t('drivers.create.validation.positiveNumber')),
        KilometersAllowanceAllowed: yup.boolean().optional(),
        ATV: yup.number().required(t('drivers.create.fields.atv.required')).min(0, t('drivers.create.validation.positiveNumber')),
        Remark: yup.string().optional(),
    });

    // File upload state
    const [tempFiles, setTempFiles] = useState<{ fileId: string; originalFileName: string }[]>([]);
    
    // Local display value for contract duration (to handle empty states during editing)
    const [contractDurationDisplay, setContractDurationDisplay] = useState<string>('7');
    
    // Local display value for workweek duration (to handle empty states during editing)
    const [workweekDurationDisplay, setWorkweekDurationDisplay] = useState<string>('40');
    
    // Success dialog state
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [createdDriverId, setCreatedDriverId] = useState<string | null>(null);
    const [contractVersionId, setContractVersionId] = useState<string | null>(null);

    // Handle file upload changes with useCallback to prevent re-renders
    const handleFilesChange = useCallback((files: { fileId: string; originalFileName: string }[]) => {
        setTempFiles(files);
    }, []);

    const {
        handleSubmit,
        control,
        reset,
        watch,
        setValue,
        setError,
        formState: { errors },
    } = useForm<FormInputs>({
        resolver: yupResolver(schema),
        defaultValues: {
            CompanyId: '',
            UsedByCompanyIds: [],
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
            IBAN: '',
            EmploymentStartDate: dayjs().tz(AMSTERDAM_TZ).format('YYYY-MM-DD'),
            PermanentContract: false,
            ContractDuration: 7,
            LastWorkingDay: dayjs().tz(AMSTERDAM_TZ).add(7, 'month').format('YYYY-MM-DD'),
            ProbationPeriod: '1',
            NoticePeriod: '1',
            Function: defaultFunctionValue,
            WorkweekDuration: 40,
            WeeklySchedule: 'Maandag - Vrijdag',
            WorkingHours: '09:00 - 18:00',
            PayScale: 'D',
            PayScaleStep: 5,
            HourlyWage: undefined, // Will be auto-filled from CAO hourly wage
            CommuteKilometers: undefined,
            KilometersAllowanceAllowed: false,
            ATV: 3.5,
            Remark: '',
        },
    });

    // Check access permissions
    const allowedRoles = ['globalAdmin', 'customerAdmin'];
    const hasAccess = user?.roles.some(r => allowedRoles.includes(r));

    // Watch workweek duration to calculate percentage
    const workweekDuration = watch('WorkweekDuration');
    const workweekPercentage = workweekDuration ? Math.round((workweekDuration / 40) * 100) : 0;

    // Watch contract type
    const contractType: ContractTypeValue = watch('ContractType') ?? 'CAO';

    // Watch pay scale and step to calculate hourly wage
    const payScale = watch('PayScale');
    const payScaleStep = watch('PayScaleStep');
    const caoHourlyWage = getHourlyWage(payScale || '', payScaleStep || 0);
    const availableSteps = getAvailableSteps(payScale || '');
    const hourlyWage = watch('HourlyWage');

    // Auto-fill HourlyWage when CAO hourly wage is calculated
    useEffect(() => {
        if (caoHourlyWage && !hourlyWage) {
            setValue('HourlyWage', caoHourlyWage);
        }
    }, [caoHourlyWage, hourlyWage, setValue]);

    // Watch permanent contract to show/hide duration field
    const watchedPermanentContract = watch('PermanentContract');
    const watchedContractDuration = watch('ContractDuration');
    const watchedEmploymentStartDate = watch('EmploymentStartDate');

    // Calculate contract end date if duration is specified
    const calculateContractEndDate = (startDate: string, durationMonths: number): string => {
        if (!startDate || !durationMonths) return '';
        return dayjs.tz(startDate, AMSTERDAM_TZ).add(durationMonths, 'month').format('YYYY-MM-DD');
    };


    // Auto-calculate last working day when EmploymentStartDate or ContractDuration changes
    useEffect(() => {
        if (!watchedPermanentContract && watchedEmploymentStartDate && watchedContractDuration) {
            const calculated = calculateContractEndDate(watchedEmploymentStartDate, watchedContractDuration);
            setValue('LastWorkingDay', calculated);
        } else if (watchedPermanentContract) {
            setValue('LastWorkingDay', '');
        }
    }, [watchedEmploymentStartDate, watchedContractDuration, watchedPermanentContract, setValue]);

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
            if (cleanedData.EmploymentStartDate) {
                cleanedData.DateOfEmployment = new Date(cleanedData.EmploymentStartDate).toISOString();
                delete cleanedData.EmploymentStartDate; // Remove the temporary field name
            }

            // Format last working day to ISO 8601 format if it exists
            if (cleanedData.LastWorkingDay) {
                cleanedData.LastWorkingDay = new Date(cleanedData.LastWorkingDay).toISOString();
            }

            // Use editable hourly wage if provided, otherwise calculate from CAO
            if (cleanedData.HourlyWage !== undefined) {
                // User has edited the hourly wage, use that value
                cleanedData.HourlyWage100Percent = Number(cleanedData.HourlyWage);
            } else if (cleanedData.PayScale && cleanedData.PayScaleStep) {
                // No user input, calculate from CAO
                cleanedData.HourlyWage100Percent = getHourlyWage(cleanedData.PayScale, cleanedData.PayScaleStep);
            }
            delete cleanedData.HourlyWage; // Remove the form field name

            // Add ATV if provided
            if (cleanedData.ATV !== undefined) {
                cleanedData.Atv = Number(cleanedData.ATV);
                delete cleanedData.ATV; // Remove the form field name, use backend field name
            }

            // Add uploaded files to the request
            cleanedData.NewUploads = tempFiles;
            
            // Always include UsedByCompanyIds (even if empty array)
            cleanedData.UsedByCompanyIds = data.UsedByCompanyIds || [];

            const response = await mutateAsync(cleanedData);
            
            // Store driver ID and contract version ID for success dialog
            setCreatedDriverId(response.DriverId);
            setContractVersionId(response.contractVersionId || null);
            
            // Reset form
            reset();
            setTempFiles([]); // Clear uploaded files
            
            // Show success dialog
            setSuccessDialogOpen(true);
        } catch (error: any) {
            console.error('Driver creation error:', error);
            // Check if error is related to BSN duplication
            // Check multiple possible error message locations
            const errorMessage = error?.message || 
                                error?.response?.data?.errors?.[0] || 
                                error?.response?.data?.message ||
                                error?.response?.data?.error ||
                                '';
            console.error('Extracted error message:', errorMessage);
            
            if (errorMessage && typeof errorMessage === 'string' && 
                errorMessage.toLowerCase().includes('bsn') && 
                errorMessage.toLowerCase().includes('already exists')) {
                setError('BSN', {
                    type: 'manual',
                    message: t('drivers.create.errors.bsnAlreadyExists')
                });
            }
            // Error will also be shown in the Alert component via isError & error
        }
    };

    React.useEffect(() => {
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField) {
            const fieldElement = document.querySelector<HTMLElement>(`[name="${firstErrorField}"]`);
            if (fieldElement) {
                fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (typeof fieldElement.focus === 'function') {
                    fieldElement.focus({ preventScroll: true } as any);
                }
            }
        }
    }, [errors]);

    if (authLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!hasAccess) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{t('drivers.create.errors.noPermission')}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="800px" p={4}>
            {/* Header Block */}
            <Box mb={4}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                    {t('drivers.create.title')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {t('drivers.create.subtitle')}
                </Typography>
            </Box>

            {/* Form Block */}
            <Box>
                {isError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error?.message || t('drivers.create.errors.createFailed')}
                    </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* General Information Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('drivers.create.sections.general')}
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
                                                    label={t('drivers.create.fields.company.label')}
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
                            {/* Used By Companies (Multi-select) */}
                            <Grid item xs={12}>
                                <Controller
                                    name="UsedByCompanyIds"
                                    control={control}
                                    render={({ field }) => (
                                        <Autocomplete
                                            multiple
                                            options={companiesData?.data || []}
                                            getOptionLabel={(option) => option.name}
                                            onChange={(_, value) => field.onChange(value.map(v => v.id))}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={t('drivers.create.fields.usedByCompanies.label')}
                                                    variant="outlined"
                                                    margin="normal"
                                                    fullWidth
                                                    error={!!errors.UsedByCompanyIds}
                                                    helperText={errors.UsedByCompanyIds?.message || t('drivers.create.fields.usedByCompanies.helperText')}
                                                />
                                            )}
                                            loading={isCompaniesLoading}
                                            value={
                                                companiesData?.data.filter(c => 
                                                    field.value?.includes(c.id)
                                                ) || []
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
                            {t('drivers.create.sections.employee')}
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
                                            label={t('drivers.create.fields.email.label')}
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
                                            label={t('drivers.create.fields.password.label')}
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
                                            label={t('drivers.create.fields.firstName.label')}
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
                                            label={t('drivers.create.fields.lastName.label')}
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
                                            label={t('drivers.create.fields.dateOfBirth.label')}
                                            type="date"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            required
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
                                            label={t('drivers.create.fields.phoneNumber.label')}
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
                                            label={t('drivers.create.fields.address.label')}
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            required
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
                                            label={t('drivers.create.fields.postcode.label')}
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            required
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
                                            label={t('drivers.create.fields.city.label')}
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            required
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
                                        <Autocomplete
                                            options={countryOptions}
                                            getOptionLabel={(option) => option.label}
                                            onChange={(_, value) => field.onChange(value?.value || '')}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={t('drivers.create.fields.country.label')}
                                                    variant="outlined"
                                                    margin="normal"
                                                    fullWidth
                                                    error={!!errors.Country}
                                                    helperText={errors.Country?.message}
                                                />
                                            )}
                                            value={
                                                countryOptions.find(option => option.value === field.value) || null
                                            }
                                            isOptionEqualToValue={(option, val) => option.code === val.code}
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
                                            label={t('drivers.create.fields.bsn.label')}
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            required
                                            error={!!errors.BSN}
                                            helperText={errors.BSN?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            
                            {/* IBAN */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="IBAN"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.create.fields.iban.label')}
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.IBAN}
                                            helperText={errors.IBAN?.message}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Contract Type Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Contract Type
                        </Typography>
                        <ContractTypeSection
                            control={control}
                            watch={watch}
                            errors={errors}
                        />
                    </Box>

                    {/* Employment Dates Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('drivers.create.sections.employmentDates')}
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="EmploymentStartDate"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.create.fields.employmentStartDate.label')}
                                            type="date"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.EmploymentStartDate}
                                            helperText={errors.EmploymentStartDate?.message}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="PermanentContract"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    {...field}
                                                    checked={field.value || false}
                                                    onChange={(e) => field.onChange(e.target.checked)}
                                                />
                                            }
                                            label={t('drivers.create.fields.permanentContract.label')}
                                            sx={{ mt: 2 }}
                                        />
                                    )}
                                />
                            </Grid>
                            {!watchedPermanentContract && (
                                <>
                                <Grid item xs={12} sm={6}>
                                    <Controller
                                        name="ContractDuration"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                label={t('drivers.create.fields.contractDuration.label')}
                                                type="number"
                                                fullWidth
                                                margin="normal"
                                                variant="outlined"
                                                error={!!errors.ContractDuration}
                                                helperText={errors.ContractDuration?.message}
                                                    value={contractDurationDisplay}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setContractDurationDisplay(value);
                                                        
                                                        // Allow empty string for clearing
                                                        if (value === '') {
                                                            field.onChange(undefined);
                                                            return;
                                                        }
                                                        
                                                        const numValue = Number(value);
                                                        if (!isNaN(numValue) && numValue >= 1) {
                                                            field.onChange(numValue);
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        // If field is empty on blur, keep it empty
                                                        if (contractDurationDisplay === '') {
                                                            field.onChange(undefined);
                                                        }
                                                    }}
                                                inputProps={{
                                                    min: "1",
                                                    step: "1"
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
                                                    label={t('drivers.create.fields.lastWorkingDay.label')}
                                                    type="date"
                                                    fullWidth
                                                    margin="normal"
                                                    variant="outlined"
                                                    error={!!errors.LastWorkingDay}
                                                    helperText={errors.LastWorkingDay?.message}
                                                    InputLabelProps={{
                                                        shrink: true,
                                                    }}
                                                />
                                            )}
                                        />
                                    </Grid>
                                </>
                            )}
                        </Grid>
                    </Box>

                    {/* Work Conditions Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('drivers.create.sections.workConditions')}
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="ProbationPeriod"
                                    control={control}
                                    render={({ field }) => (
                                        <Autocomplete
                                            options={probationPeriodOptions}
                                            getOptionLabel={(option) => option.label}
                                            onChange={(_, value) => field.onChange(value?.value || null)}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={t('drivers.create.fields.probationPeriod.label')}
                                                    variant="outlined"
                                                    margin="normal"
                                                    fullWidth
                                                    error={!!errors.ProbationPeriod}
                                                    helperText={errors.ProbationPeriod?.message}
                                                />
                                            )}
                                            value={
                                                probationPeriodOptions.find(option => option.value === field.value) || null
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
                                            options={noticePeriodOptions}
                                            getOptionLabel={(option) => option.label}
                                            onChange={(_, value) => field.onChange(value?.value || null)}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={t('drivers.create.fields.noticePeriod.label')}
                                                    variant="outlined"
                                                    margin="normal"
                                                    fullWidth
                                                    error={!!errors.NoticePeriod}
                                                    helperText={errors.NoticePeriod?.message}
                                                />
                                            )}
                                            value={
                                                noticePeriodOptions.find(option => option.value === field.value) || null
                                            }
                                            isOptionEqualToValue={(option, val) => option.value === val.value}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Function Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Function
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            <Grid item xs={12}>
                                <Controller
                                    name="Function"
                                    control={control}
                                    render={({ field }) => (
                                        <Autocomplete
                                            options={functionOptions}
                                            getOptionLabel={(option) => option.label}
                                            onChange={(_, value) => field.onChange(value?.value || '')}
                                            renderInput={(params) => (
                                        <TextField
                                                    {...params}
                                            label={t('drivers.create.fields.function.label')}
                                            variant="outlined"
                                                    margin="normal"
                                                    fullWidth
                                            error={!!errors.Function}
                                            helperText={errors.Function?.message}
                                            required
                                                />
                                            )}
                                            value={
                                                functionOptions.find(option => option.value === field.value) || null
                                            }
                                            isOptionEqualToValue={(option, val) => option.value === val.value}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Work Details Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Work Details
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="WorkweekDuration"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            label={t('drivers.create.fields.workweekDuration.label')}
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.WorkweekDuration}
                                            helperText={errors.WorkweekDuration?.message}
                                            required
                                            value={workweekDurationDisplay}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setWorkweekDurationDisplay(value);
                                                
                                                // Allow empty string for clearing
                                                if (value === '') {
                                                    field.onChange(undefined);
                                                    return;
                                                }
                                                
                                                const numValue = Number(value);
                                                if (!isNaN(numValue) && numValue >= 0) {
                                                    field.onChange(numValue);
                                                }
                                            }}
                                            onBlur={() => {
                                                // If field is empty on blur, keep it empty
                                                if (workweekDurationDisplay === '') {
                                                    field.onChange(undefined);
                                                }
                                            }}
                                            inputProps={{
                                                min: "0",
                                                step: "1"
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label={t('drivers.create.fields.workweekDuration.label') + " Percentage"}
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
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="WeeklySchedule"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.create.fields.weeklySchedule.label')}
                                            placeholder={t('drivers.create.fields.weeklySchedule.placeholder')}
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            required
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
                                            label={t('drivers.create.fields.workingHours.label')}
                                            placeholder={t('drivers.create.fields.workingHours.placeholder')}
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            required
                                            error={!!errors.WorkingHours}
                                            helperText={errors.WorkingHours?.message}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Compensation Block — only for CAO */}
                    {contractType === 'CAO' && (
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('drivers.create.sections.compensation')}
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>


                            {/* Pay Scale & Pay Step */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="PayScale"
                                    control={control}
                                    render={({ field }) => (
                                        <Autocomplete
                                            options={['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']}
                                            value={field.value || null}
                                            onChange={(_, value) => field.onChange(value || '')}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={t('drivers.create.fields.payScale.label')}
                                                    variant="outlined"
                                                    margin="normal"
                                                    fullWidth
                                                    required
                                                    error={!!errors.PayScale}
                                                    helperText={errors.PayScale?.message}
                                                />
                                            )}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="PayScaleStep"
                                    control={control}
                                    render={({ field }) => (
                                        <Autocomplete
                                            options={availableSteps.length > 0 ? availableSteps : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                                            value={field.value || null}
                                            onChange={(_, value) => field.onChange(value || undefined)}
                                            disabled={!payScale}
                                            getOptionLabel={(option) => String(option)}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={t('drivers.create.fields.payScaleStep.label')}
                                                    variant="outlined"
                                                    margin="normal"
                                                    fullWidth
                                                    required
                                                    error={!!errors.PayScaleStep}
                                                    helperText={errors.PayScaleStep?.message || (!payScale ? 'Select Pay Scale first' : '')}
                                                />
                                            )}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* CAO Hourly Wage (Calculated) */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label={t('drivers.create.fields.caoHourlyWage.label')}
                                    value={caoHourlyWage ? `€${caoHourlyWage.toFixed(2)}` : ''}
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

                            {/* Hourly Wage (Editable) */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="HourlyWage"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.create.fields.hourlyWage.label')}
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                            error={!!errors.HourlyWage}
                                            helperText={errors.HourlyWage?.message}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Commute and Travel Expenses Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('drivers.create.sections.commute')}
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="CommuteKilometers"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.create.fields.commuteKilometers.label')}
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
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="KilometersAllowanceAllowed"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    {...field}
                                                    checked={field.value || false}
                                                    onChange={(e) => field.onChange(e.target.checked)}
                                                />
                                            }
                                            label={t('drivers.create.fields.kilometersAllowanceAllowed.label')}
                                            sx={{ mt: 2 }}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                    )} {/* end contractType === 'CAO' */}

                    {/* Vacation & Allowances Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('drivers.create.sections.vacation')}
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            <Grid item xs={12}>
                                <Controller
                                    name="ATV"
                                    control={control}
                                    render={({ field }) => (
                                <TextField
                                            {...field}
                                    label={t('drivers.create.fields.atv.label')}
                                    type="number"
                                    fullWidth
                                    margin="normal"
                                    variant="outlined"
                                            required
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                            error={!!errors.ATV}
                                            helperText={errors.ATV?.message}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Remark Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('drivers.create.sections.remark')}
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            <Grid item xs={12}>
                                <Controller
                                    name="Remark"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.create.fields.remark.label')}
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

                    {/* Documents Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('drivers.create.sections.documents')}
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            <Grid item xs={12}>
                                <FileUploadBox
                                    uploadUrl="/temporary-uploads"
                                    onFilesChange={handleFilesChange}
                                    maxSizeMB={10}
                                    accept="image/png,image/jpeg,image/jpg,image/heic,application/pdf"
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
                            {isPending ? t('drivers.create.buttons.submitting') : t('drivers.create.buttons.submit')}
                        </Button>
                    </Box>
                </form>
            </Box>
            
            {/* Success Dialog */}
            <Dialog 
                open={successDialogOpen} 
                onClose={() => {
                    setSuccessDialogOpen(false);
                    router.push('/drivers');
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
                    <Box display="flex" justifyContent="center" mb={2}>
                        <CheckCircleIcon
                            sx={{
                                fontSize: 64,
                                color: 'success.main',
                            }}
                        />
                    </Box>
                    <Typography variant="h5" fontWeight={500} gutterBottom>
                        {contractVersionId
                            ? t('drivers.create.success.contractGenerated')
                            : t('drivers.create.success.contractGenerationFailed')}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3 }}>
                    {contractVersionId && createdDriverId && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => {
                                setSuccessDialogOpen(false);
                                router.push(`/drivers/${createdDriverId}`);
                            }}
                            sx={{ mr: 2 }}
                        >
                            {t('drivers.create.success.viewContract')}
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setSuccessDialogOpen(false);
                            router.push('/drivers');
                        }}
                    >
                        {t('drivers.create.success.close')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
} 