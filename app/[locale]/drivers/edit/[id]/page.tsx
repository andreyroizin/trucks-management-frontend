'use client';

import React, { useEffect, useState } from 'react';
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
    DateOfEmployment: string;               // Required - backend: dateOfEmployment
    LastWorkingDay: string;                 // Required - backend: lastWorkingDay
    ProbationPeriod?: string;               // Optional - backend: probationPeriod
    NoticePeriod?: string;                  // Optional - backend: noticePeriod
    Function: string;                       // Required - backend: function
    WorkweekDuration: number;               // Required - backend: workweekDuration
    WorkweekDurationPercentage?: number;    // Calculated - backend: workweekDurationPercentage
    WeeklySchedule?: string;                // Optional - backend: weeklySchedule
    WorkingHours?: string;                  // Optional - backend: workingHours
    CompensationPerMonthExclBtw?: number;   // Optional - backend: compensationPerMonthExclBtw
    CompensationPerMonthInclBtw?: number;   // Calculated - backend: compensationPerMonthInclBtw
    PayScale?: string;                      // Optional - backend: payScale
    PayScaleStep?: number;                  // Optional - backend: payScaleStep
    HourlyWage100Percent?: number;          // Optional - backend: hourlyWage100Percent
    DeviatingWage?: number;                 // Optional - backend: deviatingWage
    CommuteKilometers?: number;             // Optional - backend: commuteKilometers
    TravelExpenses?: number;                // Optional - backend: travelExpenses
    MaxTravelExpenses?: number;             // Optional - backend: maxTravelExpenses
    VacationAge?: number;                   // Optional - backend: vacationAge
    VacationDays?: number;                  // Optional - backend: vacationDays
    Atv?: number;                           // Optional - backend: atv
    VacationAllowance?: number;             // Optional - backend: vacationAllowance
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

export default function EditDriverPage() {
    const { id } = useParams();
    const router = useRouter();
    const driverId = id as string;
    const t = useTranslations();
    
    const periodOptions = getPeriodOptions(t);
    
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
        DateOfEmployment: yup.string().required(t('drivers.create.fields.dateOfEmployment.required')),
        LastWorkingDay: yup.string().required(t('drivers.create.fields.lastWorkingDay.required')),
        ProbationPeriod: yup.string().optional(),
        NoticePeriod: yup.string().optional(),
        Function: yup.string().required(t('drivers.create.fields.function.required')).max(100, t('drivers.create.fields.function.maxLength')),
        WorkweekDuration: yup.number().required(t('drivers.create.fields.workweekDuration.required')).min(1, t('drivers.create.fields.workweekDuration.minHours')),
        WeeklySchedule: yup.string().optional(),
        WorkingHours: yup.string().optional(),
        CompensationPerMonthExclBtw: yup.number().optional().min(0, t('drivers.validation.positiveNumber')),
        PayScale: yup.string().optional(),
        PayScaleStep: yup.number().optional().min(0, t('drivers.validation.positiveNumber')),
        HourlyWage100Percent: yup.number().optional().min(0, t('drivers.validation.positiveNumber')),
        DeviatingWage: yup.number().optional().min(0, t('drivers.validation.positiveNumber')),
        CommuteKilometers: yup.number().optional().min(0, t('drivers.validation.positiveNumber')),
        TravelExpenses: yup.number().optional().min(0, t('drivers.validation.positiveNumber')),
        MaxTravelExpenses: yup.number().optional().min(0, t('drivers.validation.positiveNumber')),
        VacationAge: yup.number().optional().min(0, t('drivers.validation.positiveNumber')),
        VacationDays: yup.number().optional().min(0, t('drivers.validation.positiveNumber')),
        Atv: yup.number().optional().min(0, t('drivers.validation.positiveNumber')),
        VacationAllowance: yup.number().optional().min(0, t('drivers.validation.positiveNumber')).max(100, t('drivers.create.fields.vacationAllowance.maxPercent')),
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
            DateOfEmployment: '',
            LastWorkingDay: '',
            ProbationPeriod: '',
            NoticePeriod: '',
            Function: '',
            WorkweekDuration: 40 as number,
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

    // Access control
    const hasAccess = user?.roles.includes('globalAdmin') || user?.roles.includes('customerAdmin');

    // Watch workweek duration to calculate percentage
    const workweekDuration = watch('WorkweekDuration');
    const workweekPercentage = workweekDuration ? Math.round((workweekDuration / 40) * 100) : 0;

    // Watch monthly compensation to calculate VAT inclusion
    const monthlyCompensationExclVat = watch('CompensationPerMonthExclBtw');
    const monthlyCompensationInclVat = monthlyCompensationExclVat ? 
        Math.round((monthlyCompensationExclVat + (monthlyCompensationExclVat * 0.21)) * 100) / 100 : 0;

    // Prefill data once fetched
    useEffect(() => {
        if (driverData) {
            // Format dates for HTML input
            const formatDateForInput = (dateString?: string) => {
                if (!dateString) return '';
                try {
                    return new Date(dateString).toISOString().split('T')[0];
                } catch {
                    return '';
                }
            };

            reset({
                CompanyId: driverData.companyId || '',
                Email: driverData.email || '',
                FirstName: driverData.firstName || '',
                LastName: driverData.lastName || '',
                DateOfBirth: formatDateForInput(driverData.dateOfBirth),
                PhoneNumber: driverData.phoneNumber || '',
                Address: driverData.address || '',
                Postcode: driverData.postcode || '',
                City: driverData.city || '',
                Country: driverData.country || '',
                BSN: driverData.bsn || '',
                DateOfEmployment: formatDateForInput(driverData.dateOfEmployment),
                LastWorkingDay: formatDateForInput(driverData.lastWorkingDay),
                ProbationPeriod: driverData.probationPeriod || '',
                NoticePeriod: driverData.noticePeriod || '',
                Function: driverData.function || '',
                WorkweekDuration: driverData.workweekDuration ? Number(driverData.workweekDuration) : 40,
                WeeklySchedule: driverData.weeklySchedule || '',
                WorkingHours: driverData.workingHours || '',
                CompensationPerMonthExclBtw: driverData.compensationPerMonthExclBtw ? Number(driverData.compensationPerMonthExclBtw) : undefined,
                PayScale: driverData.payScale || '',
                PayScaleStep: driverData.payScaleStep ? Number(driverData.payScaleStep) : undefined,
                HourlyWage100Percent: driverData.hourlyWage100Percent ? Number(driverData.hourlyWage100Percent) : undefined,
                DeviatingWage: driverData.deviatingWage ? Number(driverData.deviatingWage) : undefined,
                CommuteKilometers: driverData.commuteKilometers ? Number(driverData.commuteKilometers) : undefined,
                TravelExpenses: driverData.travelExpenses ? Number(driverData.travelExpenses) : undefined,
                MaxTravelExpenses: driverData.maxTravelExpenses ? Number(driverData.maxTravelExpenses) : undefined,
                VacationAge: driverData.vacationAge ? Number(driverData.vacationAge) : undefined,
                VacationDays: driverData.vacationDays ? Number(driverData.vacationDays) : undefined,
                Atv: driverData.atv ? Number(driverData.atv) : undefined,
                VacationAllowance: driverData.vacationAllowance ? Number(driverData.vacationAllowance) : undefined,
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
            // Clean data by removing empty strings and undefined values
            const cleanedData = Object.fromEntries(
                Object.entries(data).filter(([key, value]) => 
                    value !== undefined && value !== null && value !== ''
                )
            ) as FormInputs;

            // Calculate computed fields
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

            // Convert field names to backend format (camelCase)
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
                dateOfEmployment: cleanedData.DateOfEmployment,
                lastWorkingDay: cleanedData.LastWorkingDay,
                probationPeriod: cleanedData.ProbationPeriod,
                noticePeriod: cleanedData.NoticePeriod,
                function: cleanedData.Function,
                workweekDuration: cleanedData.WorkweekDuration,
                workweekDurationPercentage: cleanedData.WorkweekDurationPercentage,
                weeklySchedule: cleanedData.WeeklySchedule,
                workingHours: cleanedData.WorkingHours,
                compensationPerMonthExclBtw: cleanedData.CompensationPerMonthExclBtw,
                compensationPerMonthInclBtw: cleanedData.CompensationPerMonthInclBtw,
                payScale: cleanedData.PayScale,
                payScaleStep: cleanedData.PayScaleStep,
                hourlyWage100Percent: cleanedData.HourlyWage100Percent,
                deviatingWage: cleanedData.DeviatingWage,
                commuteKilometers: cleanedData.CommuteKilometers,
                travelExpenses: cleanedData.TravelExpenses,
                maxTravelExpenses: cleanedData.MaxTravelExpenses,
                vacationAge: cleanedData.VacationAge,
                vacationDays: cleanedData.VacationDays,
                atv: cleanedData.Atv,
                vacationAllowance: cleanedData.VacationAllowance,
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
                            {/* Employment Start Date & Contract End Date */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="DateOfEmployment"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.edit.fields.dateOfEmployment.label')}
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
                                            label={t('drivers.edit.fields.lastWorkingDay.label')}
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
                                                    label={t('drivers.edit.fields.probationPeriod.label')}
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

                    {/* Work Conditions Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('drivers.edit.sections.workConditions')}
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

                            {/* Workweek Duration & Percentage */}
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

                            {/* Weekly Schedule & Working Hours */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="WeeklySchedule"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.edit.fields.weeklySchedule.label')}
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
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="CompensationPerMonthExclBtw"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.edit.fields.compensationPerMonthExclBtw.label')}
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.CompensationPerMonthExclBtw}
                                            helperText={errors.CompensationPerMonthExclBtw?.message}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label={t('drivers.edit.fields.monthlyCompensationIncl.label')}
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
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="PayScale"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.edit.fields.payScale.label')}
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
                                            label={t('drivers.edit.fields.payScaleStep.label')}
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.PayScaleStep}
                                            helperText={errors.PayScaleStep?.message}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="HourlyWage100Percent"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.edit.fields.hourlyWage100Percent.label')}
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.HourlyWage100Percent}
                                            helperText={errors.HourlyWage100Percent?.message}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
                                            label={t('drivers.edit.fields.deviatingWage.label')}
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.DeviatingWage}
                                            helperText={errors.DeviatingWage?.message}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                    )}
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
                            <Grid item xs={12}>
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
                                    name="TravelExpenses"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.edit.fields.travelExpenses.label')}
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.TravelExpenses}
                                            helperText={errors.TravelExpenses?.message}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
                                            label={t('drivers.edit.fields.maxTravelExpenses.label')}
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.MaxTravelExpenses}
                                            helperText={errors.MaxTravelExpenses?.message}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="VacationAge"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.edit.fields.vacationAge.label')}
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.VacationAge}
                                            helperText={errors.VacationAge?.message}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
                                            label={t('drivers.edit.fields.vacationDays.label')}
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.VacationDays}
                                            helperText={errors.VacationDays?.message}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="Atv"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.edit.fields.atv.label')}
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.Atv}
                                            helperText={errors.Atv?.message}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
                                            label={t('drivers.edit.fields.vacationAllowance.label')}
                                            type="number"
                                            fullWidth
                                            margin="normal"
                                            variant="outlined"
                                            error={!!errors.VacationAllowance}
                                            helperText={errors.VacationAllowance?.message}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                    )}
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