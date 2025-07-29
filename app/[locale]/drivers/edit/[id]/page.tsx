'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
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
} from '@mui/material';
import { Controller, useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDriverWithContract } from '@/hooks/useDriverWithContract';
import { useCompanies } from '@/hooks/useCompanies';
import { useUpdateDriver } from '@/hooks/useUpdateDriver';
import FileUploadBox from '@/components/FileUploadBox';
import FileTile from '@/components/FileTile';
import { useDownloadDriverFile } from '@/hooks/useDownloadDriverFile';
import { ApplicationFile } from '@/types/file';
import { getHourlyWage, getAvailableSteps } from '@/data/payScales';
import dayjs from 'dayjs';

// Schema will be defined inside the component to access translations

type FormInputs = {
    CompanyId: string;                      // Required - backend: companyId
    Email: string;                          // Required - backend: email
    FirstName: string;                      // Required - backend: firstName
    LastName: string;                       // Required - backend: lastName
    DateOfBirth?: string;                   // Optional - backend: dateOfBirth
    PhoneNumber?: string;                   // Optional - backend: phoneNumber
    Address?: string;                       // Optional - backend: address
    Postcode?: string;                      // Optional - backend: postcode
    City?: string;                          // Optional - backend: city
    Country?: string;                       // Optional - backend: country
    BSN?: string;                           // Optional - backend: bsn
    EmploymentStartDate: string;            // Required - backend: employmentStartDate
    PermanentContract?: boolean;            // Optional - backend: permanentContract
    ContractDuration?: number;              // Optional - backend: contractDuration (in months)
    ProbationPeriod?: string;               // Optional - backend: probationPeriod
    NoticePeriod?: string;                  // Optional - backend: noticePeriod
    Function: string;                       // Required - backend: function
    WorkweekDuration: number;               // Required - backend: workweekDuration
    WorkweekDurationPercentage?: number;    // Calculated - backend: workweekDurationPercentage
    WeeklySchedule?: string;                // Optional - backend: weeklySchedule
    WorkingHours?: string;                  // Optional - backend: workingHours
    PayScale?: string;                      // Optional - backend: payScale
    PayScaleStep?: number;                  // Optional - backend: payScaleStep
    CommuteKilometers?: number;             // Optional - backend: commuteKilometers
    KilometersAllowanceAllowed?: boolean;   // Optional - backend: kilometersAllowanceAllowed
    Remark?: string;                        // Optional - backend: remark
};

const getPeriodOptions = (t: any) => [
    { value: '1', label: t('drivers.create.periodOptions.1') },
    { value: '2', label: t('drivers.create.periodOptions.2') },
    { value: '3', label: t('drivers.create.periodOptions.3') },
    { value: '4', label: t('drivers.create.periodOptions.4') },
    { value: '5', label: t('drivers.create.periodOptions.5') },
    { value: '6', label: t('drivers.create.periodOptions.6') },
];

const getProbationPeriodOptions = (t: any) => [
    { value: '0', label: '0 months' },
    { value: '1', label: '1 month' },
];

export default function EditDriverPage() {
    const { id } = useParams();
    const router = useRouter();
    const driverId = id as string;
    const t = useTranslations();
    
    const periodOptions = getPeriodOptions(t);
    const probationPeriodOptions = getProbationPeriodOptions(t);
    
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const {
        data: driverData,
        isLoading: isDriverLoading,
        isError: isDriverError,
        error: driverError,
    } = useDriverWithContract(driverId);
    
    const { data: companiesData, isLoading: isCompaniesLoading } = useCompanies(1, 100);
    const { mutateAsync, isPending, isError, error } = useUpdateDriver();
    const downloadFile = useDownloadDriverFile();
    
    const schema = yup.object().shape({
        CompanyId: yup.string().required(t('drivers.create.fields.company.required')),
        Email: yup.string().email(t('drivers.create.fields.email.invalid')).required(t('drivers.create.fields.email.required')),
        FirstName: yup.string().required(t('drivers.create.fields.firstName.required')),
        LastName: yup.string().required(t('drivers.create.fields.lastName.required')),
        DateOfBirth: yup.string().optional(),
        PhoneNumber: yup.string().optional(),
        Address: yup.string().optional(),
        Postcode: yup.string().optional(),
        City: yup.string().optional(),
        Country: yup.string().optional(),
        BSN: yup.string().optional(),
        EmploymentStartDate: yup.string().required(t('drivers.create.fields.employmentStartDate.required')),
        PermanentContract: yup.boolean().optional(),
        ContractDuration: yup.number().optional().min(1, t('drivers.create.validation.positiveNumber')),
        ProbationPeriod: yup.string().optional(),
        NoticePeriod: yup.string().optional(),
        Function: yup.string().required(t('drivers.create.fields.function.required')).max(100, t('drivers.create.fields.function.maxLength')),
        WorkweekDuration: yup.number().required(t('drivers.create.fields.workweekDuration.required')).min(1, t('drivers.create.fields.workweekDuration.minHours')),
        WeeklySchedule: yup.string().optional(),
        WorkingHours: yup.string().optional(),
        PayScale: yup.string().optional(),
        PayScaleStep: yup.number().optional().min(0, t('drivers.create.validation.positiveNumber')),
        CommuteKilometers: yup.number().optional().min(0, t('drivers.create.validation.positiveNumber')),
        KilometersAllowanceAllowed: yup.boolean().optional(),
        Remark: yup.string().optional(),
    });

    // File management state
    const [newUploads, setNewUploads] = useState<{ fileId: string; originalFileName: string }[]>([]);
    const [fileIdsToDelete, setFileIdsToDelete] = useState<string[]>([]);

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
            FirstName: '',
            LastName: '',
            DateOfBirth: '',
            PhoneNumber: '',
            Address: '',
            Postcode: '',
            City: '',
            Country: '',
            BSN: '',
            EmploymentStartDate: '',
            PermanentContract: false,
            ContractDuration: undefined,
            ProbationPeriod: '',
            NoticePeriod: '',
            Function: '',
            WorkweekDuration: undefined,
            WeeklySchedule: '',
            WorkingHours: '',
            PayScale: '',
            PayScaleStep: undefined,
            CommuteKilometers: undefined,
            KilometersAllowanceAllowed: false,
            Remark: '',
        },
    });

    // Access control
    const hasAccess = user?.roles.includes('globalAdmin') || user?.roles.includes('customerAdmin');

    // Watch workweek duration to calculate percentage
    const workweekDuration = watch('WorkweekDuration');
    const workweekPercentage = workweekDuration ? Math.round((workweekDuration / 40) * 100) : 0;

    // Watch pay scale and step to calculate hourly wage
    const payScale = watch('PayScale');
    const payScaleStep = watch('PayScaleStep');
    const hourlyWage = getHourlyWage(payScale || '', payScaleStep || 0);
    const availableSteps = getAvailableSteps(payScale || '');

    // Watch permanent contract to show/hide duration field
    const watchedPermanentContract = watch('PermanentContract');

    // Calculate contract duration in months based on start and end dates
    const calculateContractDuration = (startDate: string, endDate: string): number => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Calculate the difference in months
        const yearsDiff = end.getFullYear() - start.getFullYear();
        const monthsDiff = end.getMonth() - start.getMonth();
        const daysDiff = end.getDate() - start.getDate();
        
        let totalMonths = yearsDiff * 12 + monthsDiff;
        
        // If the end day is before the start day, subtract one month
        if (daysDiff < 0) {
            totalMonths -= 1;
        }
        
        return Math.max(0, totalMonths);
    };

    // Calculate contract end date if duration is specified
    const calculateContractEndDate = (startDate: string, durationMonths: number): string => {
        if (!startDate || !durationMonths) return '';
        const start = new Date(startDate);
        const end = new Date(start);
        end.setMonth(end.getMonth() + durationMonths);
        return end.toISOString();
    };

    // Calculate ATV based on workweek duration
    const calculateATV = (workweekDuration: number): number => {
        if (!workweekDuration || workweekDuration <= 0) return 0;
        if (workweekDuration >= 40) return 104;
        // Proportional calculation: (workweekDuration / 40) * 104
        return Math.round((workweekDuration / 40) * 104);
    };

    // Watch workweek duration to calculate ATV
    const watchedWorkweekDuration = watch('WorkweekDuration');
    const calculatedATV = useMemo(() => {
        return calculateATV(watchedWorkweekDuration || 0);
    }, [watchedWorkweekDuration]);

    // Pre-fill form when driver data is loaded
    useEffect(() => {
        if (driverData) {
            reset({
                CompanyId: driverData.companyId || '',
                Email: driverData.email || '',
                FirstName: driverData.firstName || '',
                LastName: driverData.lastName || '',
                DateOfBirth: driverData.dateOfBirth ? driverData.dateOfBirth.split('T')[0] : '',
                PhoneNumber: driverData.phoneNumber || '',
                Address: driverData.address || '',
                Postcode: driverData.postcode || '',
                City: driverData.city || '',
                Country: driverData.country || '',
                BSN: driverData.bsn || '',
                EmploymentStartDate: driverData.dateOfEmployment ? dayjs(driverData.dateOfEmployment).format('YYYY-MM-DD') : '',
                PermanentContract: (driverData as any).permanentContract || false,
                ContractDuration: !(driverData as any).permanentContract && driverData.dateOfEmployment && driverData.lastWorkingDay ? 
                    calculateContractDuration(driverData.dateOfEmployment, driverData.lastWorkingDay) : 
                    ((driverData as any).contractDuration ? Number((driverData as any).contractDuration) : undefined),
                ProbationPeriod: driverData.probationPeriod || '',
                NoticePeriod: driverData.noticePeriod || '',
                Function: driverData.function || '',
                WorkweekDuration: driverData.workweekDuration ? Number(driverData.workweekDuration) : undefined,
                WeeklySchedule: driverData.weeklySchedule || '',
                WorkingHours: driverData.workingHours || '',
                PayScale: driverData.payScale || '',
                PayScaleStep: driverData.payScaleStep ? Number(driverData.payScaleStep) : undefined,
                CommuteKilometers: driverData.commuteKilometers ? Number(driverData.commuteKilometers) : undefined,
                KilometersAllowanceAllowed: (driverData as any).kilometersAllowanceAllowed || false,
                Remark: driverData.remark || '',
            });
        }
    }, [driverData, reset]);

    // File management handlers
    const handleFileDelete = (file: ApplicationFile) => {
        setFileIdsToDelete((prev) =>
            prev.includes(file.id) ? prev : [...prev, file.id]
        );

        if (driverData?.files) {
            driverData.files = driverData?.files?.filter((f) => f.id !== file.id);
        }
    };

    const handleFileClick = async (file: ApplicationFile): Promise<void> => {
        await downloadFile(file);
    };

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

            // Format dates to ISO 8601 format if they exist
            if (cleanedData.DateOfBirth) {
                cleanedData.DateOfBirth = new Date(cleanedData.DateOfBirth).toISOString();
            }
            if (cleanedData.EmploymentStartDate) {
                cleanedData.EmploymentStartDate = new Date(cleanedData.EmploymentStartDate).toISOString();
            }
            if (cleanedData.ContractDuration) {
                cleanedData.ContractDuration = Number(cleanedData.ContractDuration);
            }
            if (cleanedData.ContractDuration && cleanedData.EmploymentStartDate) {
                cleanedData.contractEndDate = calculateContractEndDate(cleanedData.EmploymentStartDate, cleanedData.ContractDuration);
            }

            // Prepare data for backend
            const backendData = {
                companyId: cleanedData.CompanyId,
                email: cleanedData.Email,
                firstName: cleanedData.FirstName,
                lastName: cleanedData.LastName,
                dateOfBirth: cleanedData.DateOfBirth,
                phoneNumber: cleanedData.PhoneNumber,
                address: cleanedData.Address,
                postcode: cleanedData.Postcode,
                city: cleanedData.City,
                country: cleanedData.Country,
                bsn: cleanedData.BSN,
                dateOfEmployment: cleanedData.EmploymentStartDate ? new Date(cleanedData.EmploymentStartDate).toISOString() : undefined,
                permanentContract: cleanedData.PermanentContract,
                contractDuration: cleanedData.ContractDuration,
                lastWorkingDay: !cleanedData.PermanentContract && cleanedData.ContractDuration && cleanedData.EmploymentStartDate ? 
                    calculateContractEndDate(cleanedData.EmploymentStartDate, cleanedData.ContractDuration) : undefined,
                probationPeriod: cleanedData.ProbationPeriod,
                noticePeriod: cleanedData.NoticePeriod,
                function: cleanedData.Function,
                workweekDuration: cleanedData.WorkweekDuration,
                workweekDurationPercentage: cleanedData.WorkweekDurationPercentage,
                weeklySchedule: cleanedData.WeeklySchedule,
                workingHours: cleanedData.WorkingHours,
                payScale: cleanedData.PayScale,
                payScaleStep: cleanedData.PayScaleStep,
                hourlyWage100Percent: cleanedData.PayScale && cleanedData.PayScaleStep ? getHourlyWage(cleanedData.PayScale, cleanedData.PayScaleStep) || undefined : undefined,
                commuteKilometers: cleanedData.CommuteKilometers,
                kilometersAllowanceAllowed: cleanedData.KilometersAllowanceAllowed,
                atv: calculateATV(cleanedData.WorkweekDuration || 0),
                remark: cleanedData.Remark,
                // Include file operations
                newUploads: newUploads,
                fileIdsToDelete: fileIdsToDelete,
            };

            await mutateAsync({ driverId, data: backendData });
            router.push('/drivers');
        } catch {
            /* Error handled by isError & error */
        }
    };

    if (authLoading || isDriverLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isDriverError || !driverData) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">
                    {driverError?.message || t('drivers.edit.errors.loadFailed')}
                </Alert>
            </Box>
        );
    }

    if (!isAuthenticated || !hasAccess) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{t('drivers.edit.errors.noPermission')}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="800px" p={4}>
            {/* Header Block */}
            <Box mb={4}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                    {t('drivers.edit.title')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {t('drivers.edit.subtitle', { firstName: driverData.firstName, lastName: driverData.lastName })}
                </Typography>
            </Box>

            {/* Form Block */}
            <Box>
                {isError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error?.message || t('drivers.edit.errors.updateFailed')}
                    </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* General Information Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('drivers.edit.sections.general')}
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
                                                    label={t('drivers.edit.fields.company.label')}
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
                            {t('drivers.edit.sections.employee')}
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            {/* Email & Phone Number */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="Email"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.edit.fields.email.label')}
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
                                    name="PhoneNumber"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.edit.fields.phoneNumber.label')}
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.PhoneNumber}
                                            helperText={errors.PhoneNumber?.message}
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
                                            label={t('drivers.edit.fields.firstName.label')}
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
                                            label={t('drivers.edit.fields.lastName.label')}
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

                            {/* Date of Birth & Address */}
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

                            {/* PostCode & City */}
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

                            {/* Country & BSN */}
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
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="BSN"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.edit.fields.bsn.label')}
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
                            {t('drivers.edit.sections.employmentDates')}
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="EmploymentStartDate"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.edit.fields.employmentStartDate.label')}
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
                                            label={t('drivers.edit.fields.permanentContract.label')}
                                            sx={{ mt: 2 }}
                                        />
                                    )}
                                />
                            </Grid>
                            {!watchedPermanentContract && (
                                <Grid item xs={12} sm={6}>
                                    <Controller
                                        name="ContractDuration"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label={t('drivers.edit.fields.contractDuration.label')}
                                                type="number"
                                                fullWidth
                                                margin="normal"
                                                variant="outlined"
                                                error={!!errors.ContractDuration}
                                                helperText={errors.ContractDuration?.message}
                                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                inputProps={{
                                                    min: "1",
                                                    step: "1"
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </Box>

                    {/* Work Conditions Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('drivers.edit.sections.workConditions')}
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
                                            onChange={(_, value) => field.onChange(value?.value || '')}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={t('drivers.edit.fields.probationPeriod.label')}
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
                                            options={periodOptions}
                                            getOptionLabel={(option) => option.label}
                                            onChange={(_, value) => field.onChange(value?.value || '')}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={t('drivers.edit.fields.noticePeriod.label')}
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
                                        <TextField
                                            {...field}
                                            label={t('drivers.edit.fields.function.label')}
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
                                            {...field}
                                            label={t('drivers.edit.fields.workweekDuration.label')}
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.WorkweekDuration}
                                            helperText={errors.WorkweekDuration?.message}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            required
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label={t('drivers.edit.fields.workweekDuration.label') + " Percentage"}
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
                                            label={t('drivers.edit.fields.weeklySchedule.label')}
                                            placeholder={t('drivers.edit.fields.weeklySchedule.placeholder')}
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
                                            label={t('drivers.edit.fields.workingHours.label')}
                                            placeholder={t('drivers.edit.fields.workingHours.placeholder')}
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
                            {t('drivers.edit.sections.compensation')}
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
                                                    label={t('drivers.edit.fields.payScale.label')}
                                                    variant="outlined"
                                                    margin="normal"
                                                    fullWidth
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
                                                    label={t('drivers.edit.fields.payScaleStep.label')}
                                                    variant="outlined"
                                                    margin="normal"
                                                    fullWidth
                                                    error={!!errors.PayScaleStep}
                                                    helperText={errors.PayScaleStep?.message || (!payScale ? 'Select Pay Scale first' : '')}
                                                />
                                            )}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Hourly Wage (Calculated) */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label={t('drivers.edit.fields.hourlyWage100Percent.label')}
                                    value={hourlyWage ? `€${hourlyWage.toFixed(2)}` : ''}
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
                        </Grid>
                    </Box>

                    {/* Commute and Travel Expenses Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('drivers.edit.sections.commute')}
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="CommuteKilometers"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.edit.fields.commuteKilometers.label')}
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.CommuteKilometers}
                                            helperText={errors.CommuteKilometers?.message}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
                                            label={t('drivers.edit.fields.kilometersAllowanceAllowed.label')}
                                            sx={{ mt: 2 }}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Vacation & Allowances Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('drivers.edit.sections.vacation')}
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            <Grid item xs={12}>
                                <TextField
                                    label={t('drivers.edit.fields.atv.label')}
                                    type="number"
                                    fullWidth
                                    margin="normal"
                                    variant="outlined"
                                    value={calculatedATV}
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                    sx={{
                                        '& .MuiInputBase-input': {
                                            backgroundColor: '#f5f5f5',
                                        },
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Remark Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('drivers.edit.sections.remark')}
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            <Grid item xs={12}>
                                <Controller
                                    name="Remark"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.edit.fields.remark.label')}
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
                            {t('drivers.edit.sections.documents')}
                        </Typography>
                        
                        {/* Existing Files */}
                        {driverData?.files && driverData.files.length > 0 && (
                            <Box mb={3}>
                                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                    {t('drivers.edit.documents.current', { count: driverData.files.length })}
                                </Typography>
                                <Grid container spacing={2}>
                                    {driverData.files
                                        .filter(file => !fileIdsToDelete.includes(file.id))
                                        .map((file) => (
                                            <Grid item xs={12} key={file.id}>
                                                <FileTile
                                                    file={file}
                                                    onClick={handleFileClick}
                                                    onDelete={handleFileDelete}
                                                />
                                            </Grid>
                                        ))}
                                </Grid>
                            </Box>
                        )}

                        {/* Upload New Files */}
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                {t('drivers.edit.documents.uploadNew')}
                            </Typography>
                            <FileUploadBox
                                uploadUrl="/temporary-uploads"
                                onFilesChange={setNewUploads}
                                maxSizeMB={10}
                                accept="image/png,image/jpeg,image/jpg,image/heic,application/pdf"
                            />
                        </Box>
                    </Box>

                    <Box mt={3}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={isPending}
                        >
                            {isPending ? t('drivers.edit.buttons.submitting') : t('drivers.edit.buttons.submit')}
                        </Button>
                    </Box>
                </form>
            </Box>
        </Box>
    );
} 