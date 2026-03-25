'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';
import nl from 'i18n-iso-countries/langs/nl.json';
import bg from 'i18n-iso-countries/langs/bg.json';
import ContractTypeSection from '@/components/ContractTypeSection';
import { ContractTypeValue } from '@/constants/contractTypes';

// Register country data for multiple languages
countries.registerLocale(en);
countries.registerLocale(nl);
countries.registerLocale(bg);

dayjs.extend(utc);
dayjs.extend(timezone);

const AMSTERDAM_TZ = 'Europe/Amsterdam';

// Schema will be defined inside the component to access translations

type FormInputs = {
    CompanyId: string;                      // Required - backend: companyId
    UsedByCompanyIds?: string[];            // Optional - backend: usedByCompanyIds
    Email: string;                          // Required - backend: email
    FirstName: string;                      // Required - backend: firstName
    LastName: string;                       // Required - backend: lastName
    DateOfBirth: string;                    // Required - backend: dateOfBirth
    PhoneNumber?: string;                   // Optional - backend: phoneNumber
    Address: string;                        // Required - backend: address
    Postcode: string;                       // Required - backend: postcode
    City: string;                           // Required - backend: city
    Country?: string;                       // Optional - backend: country
    BSN: string;                            // Required - backend: bsn
    IBAN?: string;                          // Optional - backend: iban
    EmploymentStartDate: string;            // Required - backend: employmentStartDate
    PermanentContract?: boolean;            // Optional - backend: permanentContract
    ContractDuration?: number;              // Optional - backend: contractDuration (in months)
    LastWorkingDay?: string;                // Optional - backend: lastWorkingDay (calculated from EmploymentStartDate + ContractDuration, but editable)
    ProbationPeriod?: string | null;        // Optional - backend: probationPeriod
    NoticePeriod?: string | null;           // Optional - backend: noticePeriod
    Function: string;                       // Required - backend: function
    WorkweekDuration: number;               // Required - backend: workweekDuration
    WorkweekDurationPercentage?: number;    // Calculated - backend: workweekDurationPercentage
    WeeklySchedule: string;                 // Required - backend: weeklySchedule
    WorkingHours: string;                   // Required - backend: workingHours
    PayScale: string;                       // Required - backend: payScale
    PayScaleStep: number;                   // Required - backend: payScaleStep
    HourlyWage?: number;                    // Optional - backend: hourlyWage (editable, prefilled from CAO)
    CommuteKilometers?: number;             // Optional - backend: commuteKilometers
    KilometersAllowanceAllowed?: boolean;   // Optional - backend: kilometersAllowanceAllowed
    ATV: number;                            // Required - backend: atv (default 3.5)
    Remark?: string;                        // Optional - backend: remark

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

// Map old camelCase or translated values to new Dutch labels for backward compatibility
const mapOldFunctionValue = (value: string | undefined, functionOptions: Array<{value: string, label: string}>): string => {
    if (!value) return '';
    
    // Check if it's already a valid Dutch value
    const exists = functionOptions.find(opt => opt.value === value);
    if (exists) return value;
    
    // Map old camelCase values to new Dutch values
    const mapping: Record<string, string> = {
        'chauffeur': 'Chauffeur',
        'administrativeMedewerker': 'Administratieve Medewerker',
        'vervoermanager': 'Vervoermanager',
        'planner': 'Planner',
        'supportMedewerker': 'Support Medewerker',
        'transportManager': 'Transport Manager',
        // Also map any English values that might exist
        'Chauffeur': 'Chauffeur',
        'Administrative Employee': 'Administratieve Medewerker',
        'Transport Manager': 'Transport Manager',
        'Planner': 'Planner',
        'Support Employee': 'Support Medewerker',
    };
    
    return mapping[value] || value; // Return mapped value or original if not found
};

export default function EditDriverPage() {
    const { id } = useParams();
    const router = useRouter();
    const driverId = id as string;
    const t = useTranslations();
    const locale = useLocale();
    
    const periodOptions = getPeriodOptions(t);
    const probationPeriodOptions = getProbationPeriodOptions();
    const noticePeriodOptions = getNoticePeriodOptions();
    const functionOptions = getFunctionOptions();
    const countryOptions = getCountryOptions(locale);
    
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
        UsedByCompanyIds: yup.array().of(yup.string().required()).optional(),
        Email: yup.string().email(t('drivers.create.fields.email.invalid')).required(t('drivers.create.fields.email.required')),
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
        // Contract type
        ContractType: yup.string().required(),
        ZzpBtwNumber: yup.string().optional(),
        ZzpKvkNumber: yup.string().optional(),
        ZzpHourlyRateExclBtw: yup.number().optional().min(0),
        ZzpBtwPercentage: yup.number().optional().min(0),
        ZzpMediationFeePerWeek: yup.number().optional().min(0),
        ZzpContractNumber: yup.string().optional(),
        ZzpWorkDescription: yup.string().optional(),
        ZzpLocation: yup.string().optional(),
        InleenLendingCompanyId: yup.string().optional(),
        InleenBorrowingCompanyId: yup.string().optional(),
        InleenStartDate: yup.string().optional(),
        InleenEndDate: yup.string().optional(),
        InleenHourlyRate: yup.number().optional().min(0),
        InleenWorkDescription: yup.string().optional(),
        InleenLocation: yup.string().optional(),
        BriefMonthlySalary: yup.number().optional().min(0),
        BriefGrade: yup.string().optional(),
        BriefExpectedMonthlyHours: yup.number().optional().min(0),
    });

    // File management state
    const [newUploads, setNewUploads] = useState<{ fileId: string; originalFileName: string }[]>([]);
    const [fileIdsToDelete, setFileIdsToDelete] = useState<string[]>([]);
    
    // Local display value for contract duration (to handle empty states during editing)
    const [contractDurationDisplay, setContractDurationDisplay] = useState<string>('');

    const {
        handleSubmit,
        control,
        reset,
        watch,
        setValue,
        setError,
        formState: { errors },
    } = useForm<FormInputs>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: yupResolver(schema) as any,
        defaultValues: {
            CompanyId: '',
            UsedByCompanyIds: [],
            ContractType: 'CAO' as ContractTypeValue,
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
                IBAN: '',
            EmploymentStartDate: '',
            PermanentContract: false,
            ContractDuration: undefined,
            ProbationPeriod: undefined,
            NoticePeriod: undefined,
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
    const caoHourlyWage = getHourlyWage(payScale || '', payScaleStep || 0);
    const availableSteps = getAvailableSteps(payScale || '');
    const hourlyWage = watch('HourlyWage');

    // Auto-fill HourlyWage when CAO hourly wage is calculated (only if not already set from driverData)
    // This should only run after driverData is loaded and form is reset
    useEffect(() => {
        // Only auto-fill if:
        // 1. Driver data is loaded
        // 2. Form has been reset (we can check if hourlyWage is still undefined after reset)
        // 3. Driver doesn't have a saved hourlyWage
        if (driverData && caoHourlyWage) {
            const savedHourlyWage = driverData.hourlyWage100Percent;
            // Only auto-fill if there's no saved hourlyWage100Percent and form field is empty
            if ((savedHourlyWage === undefined || savedHourlyWage === null) && hourlyWage === undefined) {
                setValue('HourlyWage', caoHourlyWage);
            }
        }
    }, [driverData, caoHourlyWage, hourlyWage, setValue]);

    // Watch permanent contract to show/hide duration field
    const watchedPermanentContract = watch('PermanentContract');
    const watchedContractDuration = watch('ContractDuration');
    const watchedEmploymentStartDate = watch('EmploymentStartDate');

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


    // Pre-fill form when driver data is loaded
    useEffect(() => {
        if (driverData) {
            // Set contract duration display value
            const duration = !(driverData as any).permanentContract && driverData.dateOfEmployment && driverData.lastWorkingDay ? 
                calculateContractDuration(driverData.dateOfEmployment, driverData.lastWorkingDay) : 
                ((driverData as any).contractDuration ? Number((driverData as any).contractDuration) : undefined);
            setContractDurationDisplay(duration ? String(duration) : '');
            
            reset({
                CompanyId: driverData.companyId || '',
                UsedByCompanyIds: driverData.usedByCompanies?.map(c => c.id) || [],
                Email: driverData.email || '',
                FirstName: driverData.firstName || '',
                LastName: driverData.lastName || '',
                DateOfBirth: driverData.dateOfBirth ? dayjs(driverData.dateOfBirth).format('YYYY-MM-DD') : '',
                PhoneNumber: driverData.phoneNumber || '',
                Address: driverData.address || '',
                Postcode: driverData.postcode || '',
                City: driverData.city || '',
                Country: driverData.country || '',
                BSN: driverData.bsn || '',
                IBAN: (driverData as any).iban || '',
                EmploymentStartDate: driverData.dateOfEmployment ? dayjs(driverData.dateOfEmployment).format('YYYY-MM-DD') : '',
                PermanentContract: (driverData as any).permanentContract || false,
                ContractDuration: duration,
                LastWorkingDay: driverData.lastWorkingDay ? 
                    dayjs(driverData.lastWorkingDay).format('YYYY-MM-DD') : '',
                ProbationPeriod: driverData.probationPeriod || undefined,
                NoticePeriod: driverData.noticePeriod || undefined,
                Function: mapOldFunctionValue(driverData.function, functionOptions),
                WorkweekDuration: driverData.workweekDuration ? Number(driverData.workweekDuration) : undefined,
                WeeklySchedule: driverData.weeklySchedule || '',
                WorkingHours: driverData.workingHours || '',
                PayScale: driverData.payScale || '',
                PayScaleStep: driverData.payScaleStep ? Number(driverData.payScaleStep) : undefined,
                HourlyWage: driverData.hourlyWage100Percent !== undefined ? Number(driverData.hourlyWage100Percent) : undefined,
                CommuteKilometers: driverData.commuteKilometers ? Number(driverData.commuteKilometers) : undefined,
                KilometersAllowanceAllowed: (driverData as any).kilometersAllowanceAllowed || false,
                ATV: (driverData as any).atv !== undefined ? Number((driverData as any).atv) : 3.5,
                Remark: driverData.remark || '',
                // Contract type
                ContractType: (driverData.contractType as ContractTypeValue) || 'CAO',
                // ZZP
                ZzpBtwNumber: driverData.zzpBtwNumber || '',
                ZzpKvkNumber: driverData.zzpKvkNumber || '',
                ZzpHourlyRateExclBtw: driverData.zzpHourlyRateExclBtw !== undefined ? Number(driverData.zzpHourlyRateExclBtw) : undefined,
                ZzpBtwPercentage: driverData.zzpBtwPercentage !== undefined ? Number(driverData.zzpBtwPercentage) : undefined,
                ZzpMediationFeePerWeek: driverData.zzpMediationFeePerWeek !== undefined ? Number(driverData.zzpMediationFeePerWeek) : undefined,
                ZzpContractNumber: driverData.zzpContractNumber || '',
                ZzpWorkDescription: driverData.zzpWorkDescription || '',
                ZzpLocation: driverData.zzpLocation || '',
                // Inleen
                InleenLendingCompanyId: driverData.inleenLendingCompanyId || '',
                InleenBorrowingCompanyId: driverData.inleenBorrowingCompanyId || '',
                InleenStartDate: driverData.inleenStartDate ? dayjs(driverData.inleenStartDate).format('YYYY-MM-DD') : '',
                InleenEndDate: driverData.inleenEndDate ? dayjs(driverData.inleenEndDate).format('YYYY-MM-DD') : '',
                InleenHourlyRate: driverData.inleenHourlyRate !== undefined ? Number(driverData.inleenHourlyRate) : undefined,
                InleenWorkDescription: driverData.inleenWorkDescription || '',
                InleenLocation: driverData.inleenLocation || '',
                // BriefLoonschaal
                BriefMonthlySalary: driverData.briefMonthlySalary !== undefined ? Number(driverData.briefMonthlySalary) : undefined,
                BriefGrade: driverData.briefGrade || '',
                BriefExpectedMonthlyHours: driverData.briefExpectedMonthlyHours !== undefined ? Number(driverData.briefExpectedMonthlyHours) : undefined,
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
            // Format last working day to ISO 8601 format if it exists
            if (cleanedData.LastWorkingDay) {
                cleanedData.lastWorkingDay = new Date(cleanedData.LastWorkingDay).toISOString();
                delete cleanedData.LastWorkingDay; // Remove the form field name, use backend field name
            }

            // Prepare data for backend
            console.log('🔍 [DRIVER EDIT] Form data.UsedByCompanyIds:', data.UsedByCompanyIds);
            console.log('🔍 [DRIVER EDIT] cleanedData.UsedByCompanyIds:', cleanedData.UsedByCompanyIds);
            
            // Format Inleen dates to UTC ISO strings
            const inleenStartDate = cleanedData.InleenStartDate
                ? new Date(cleanedData.InleenStartDate).toISOString()
                : undefined;
            const inleenEndDate = cleanedData.InleenEndDate
                ? new Date(cleanedData.InleenEndDate).toISOString()
                : undefined;

            const backendData = {
                companyId: cleanedData.CompanyId,
                usedByCompanyIds: data.UsedByCompanyIds || [],
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
                iban: cleanedData.IBAN,
                dateOfEmployment: cleanedData.EmploymentStartDate ? new Date(cleanedData.EmploymentStartDate).toISOString() : undefined,
                permanentContract: cleanedData.PermanentContract,
                contractDuration: cleanedData.ContractDuration,
                lastWorkingDay: cleanedData.lastWorkingDay,
                probationPeriod: cleanedData.ProbationPeriod,
                noticePeriod: cleanedData.NoticePeriod,
                function: cleanedData.Function,
                workweekDuration: cleanedData.WorkweekDuration,
                workweekDurationPercentage: cleanedData.WorkweekDurationPercentage,
                weeklySchedule: cleanedData.WeeklySchedule,
                workingHours: cleanedData.WorkingHours,
                payScale: cleanedData.PayScale,
                payScaleStep: cleanedData.PayScaleStep,
                // Use editable hourly wage if provided, otherwise calculate from CAO
                hourlyWage100Percent: cleanedData.HourlyWage !== undefined 
                    ? Number(cleanedData.HourlyWage) 
                    : (cleanedData.PayScale && cleanedData.PayScaleStep ? getHourlyWage(cleanedData.PayScale, cleanedData.PayScaleStep) || undefined : undefined),
                commuteKilometers: cleanedData.CommuteKilometers,
                kilometersAllowanceAllowed: cleanedData.KilometersAllowanceAllowed,
                atv: cleanedData.ATV !== undefined ? Number(cleanedData.ATV) : undefined,
                remark: cleanedData.Remark,
                // Contract type
                contractType: cleanedData.ContractType || 'CAO',
                // ZZP fields
                zzpBtwNumber: cleanedData.ZzpBtwNumber,
                zzpKvkNumber: cleanedData.ZzpKvkNumber,
                zzpHourlyRateExclBtw: cleanedData.ZzpHourlyRateExclBtw,
                zzpBtwPercentage: cleanedData.ZzpBtwPercentage,
                zzpMediationFeePerWeek: cleanedData.ZzpMediationFeePerWeek,
                zzpContractNumber: cleanedData.ZzpContractNumber,
                zzpWorkDescription: cleanedData.ZzpWorkDescription,
                zzpLocation: cleanedData.ZzpLocation,
                // Inleen fields
                inleenLendingCompanyId: cleanedData.InleenLendingCompanyId,
                inleenBorrowingCompanyId: cleanedData.InleenBorrowingCompanyId,
                inleenStartDate,
                inleenEndDate,
                inleenHourlyRate: cleanedData.InleenHourlyRate,
                inleenWorkDescription: cleanedData.InleenWorkDescription,
                inleenLocation: cleanedData.InleenLocation,
                // BriefLoonschaal fields
                briefMonthlySalary: cleanedData.BriefMonthlySalary,
                briefGrade: cleanedData.BriefGrade,
                briefExpectedMonthlyHours: cleanedData.BriefExpectedMonthlyHours,
                // Include file operations
                newUploads: newUploads,
                fileIdsToDelete: fileIdsToDelete,
            };

            console.log('📤 [DRIVER EDIT] Sending backendData:', JSON.stringify(backendData, null, 2));
            console.log('📤 [DRIVER EDIT] backendData.usedByCompanyIds:', backendData.usedByCompanyIds);

            await mutateAsync({ driverId, data: backendData });
            router.push('/drivers');
        } catch (error: any) {
            console.error('Driver update error:', error);
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
                    message: t('drivers.edit.errors.bsnAlreadyExists')
                });
            }
            // Error will also be shown in the Alert component via isError & error
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
                                                    label={t('drivers.edit.fields.usedByCompanies.label')}
                                                    variant="outlined"
                                                    margin="normal"
                                                    fullWidth
                                                    error={!!errors.UsedByCompanyIds}
                                                    helperText={errors.UsedByCompanyIds?.message || t('drivers.edit.fields.usedByCompanies.helperText')}
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
                                            label={t('drivers.edit.fields.dateOfBirth.label')}
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
                                    name="Address"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.edit.fields.address.label')}
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

                            {/* PostCode & City */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="Postcode"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.edit.fields.postcode.label')}
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
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="City"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={t('drivers.edit.fields.city.label')}
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

                            {/* Country & BSN */}
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
                                                    label={t('drivers.edit.fields.country.label')}
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
                                            label={t('drivers.edit.fields.iban.label')}
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
                                <>
                                <Grid item xs={12} sm={6}>
                                    <Controller
                                        name="ContractDuration"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                label={t('drivers.edit.fields.contractDuration.label')}
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
                                                    label={t('drivers.edit.fields.lastWorkingDay.label')}
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
                                            onChange={(_, value) => field.onChange(value?.value || null)}
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
                                            options={noticePeriodOptions}
                                            getOptionLabel={(option) => option.label}
                                            onChange={(_, value) => field.onChange(value?.value || null)}
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
                                            label={t('drivers.edit.fields.function.label')}
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
                                            label={t('drivers.edit.fields.workingHours.label')}
                                            placeholder={t('drivers.edit.fields.workingHours.placeholder')}
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
                                                    label={t('drivers.edit.fields.payScaleStep.label')}
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
                                    label={t('drivers.edit.fields.caoHourlyWage.label')}
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
                                            label={t('drivers.edit.fields.hourlyWage.label')}
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

                    {/* Contract Type Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('drivers.create.contractType.label')}
                        </Typography>
                        <ContractTypeSection
                            control={control}
                            watch={watch}
                            errors={errors}
                        />
                    </Box>

                    {/* Vacation & Allowances Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('drivers.edit.sections.vacation')}
                        </Typography>
                        <Grid container columnSpacing={2} rowSpacing={0}>
                            <Grid item xs={12}>
                                <Controller
                                    name="ATV"
                                    control={control}
                                    render={({ field }) => (
                                <TextField
                                            {...field}
                                    label={t('drivers.edit.fields.atv.label')}
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