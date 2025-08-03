'use client';

import React, {Suspense, useEffect, useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import FileUploadBox from '@/components/FileUploadBox';
import {useRouter, useSearchParams} from 'next/navigation';
import {Alert, Box, Button, CircularProgress, Divider, TextField, Typography,} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import {Controller, SubmitHandler, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import {useAuth} from '@/hooks/useAuth';
import {usePartRideDetail} from '@/hooks/usePartRideDetail'; // To fetch existing data
import {EditPartRideInput, useEditPartRide} from '@/hooks/useEditPartRide';

import {useCompanies} from '@/hooks/useCompanies';
import {useClients} from '@/hooks/useClients';
import {useDrivers} from '@/hooks/useDrivers';
import {useCars} from '@/hooks/useCars';
import {useRides} from '@/hooks/useRides';
import {useCharters} from '@/hooks/useCharters';
import DateInputField from '@/components/DateInputField';
import {useHoursCodes} from "@/hooks/useHoursCodes";
import {useHoursOptions} from "@/hooks/useHoursOptions";
import FileTile from "@/components/FileTile";
import {useDownloadPartRideFile} from "@/hooks/useDownloadPartRideFile";
import {ApplicationFile} from "@/types/file";
import {getIso8601WeekOfYear} from "@/utils/Iso8601WeekOfYear";

function EditPartRidePageWrapper() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const partRideId = searchParams.get('id') || '';
    const {user, isAuthenticated, loading: authLoading} = useAuth();
    const isDriverRole = user?.roles.includes('driver');

    const t = useTranslations('partrides.edit');
    const tValidation = useTranslations('partrides.common');

    // --- VALIDATION SCHEMA ---
    const schema = useMemo(() => {
        return yup.object().shape({
            id: yup.string().required(tValidation('formValidation.id')),
            date: yup.string().required(tValidation('formValidation.date')),
            start: yup.string().required(tValidation('formValidation.start')),
            end: yup.string().required(tValidation('formValidation.end')),
            rest: yup.string().required(tValidation('formValidation.rest')),
            totalKilometers: yup.number().optional(),
            extraKilometers: yup.number().optional(),
            costs: yup.number().optional(),
            clientId: yup.string().optional(),
            companyId: yup.string().optional(),
            driverId: yup.string().when([], {
                is: () => !isDriverRole,
                then: (schema) => schema.required(tValidation('formValidation.driver')),
                otherwise: (schema) => schema.optional(),
            }),
            carId: yup.string().optional(),
            hoursCodeId: yup.string().when(['start', 'end'], {
                is: (start: string, end: string) =>
                    (!isDriverRole && (
                        start === '00:00:00' ||
                        start === '00:00' ||
                        end === '24:00:00' ||
                        end === '24:00' ||
                        end === '1.00:00:00' ||
                        end === '1.00:00'
                    )),
                then: (schema) => schema.required(tValidation('formValidation.hoursCode')),
                otherwise: (schema) => schema.optional(),
            }),
            hoursOptionId: yup.string().optional(),
            hoursCorrection: yup.number().optional(),
            variousCompensation: yup.number().optional(),
            weekNumber: yup
                .number()
                .transform((value, originalValue) => (originalValue === '' ? null : value))
                .nullable()
                .optional(),
            costsDescription: yup.string().optional(),
            turnover: yup.number().optional(),
            remark: yup.string().optional(),
            newUploads: yup.array().of(
                yup.object({
                    fileId: yup.string().required(),
                    originalFileName: yup.string().required(),
                })
            ).optional(),
            fileIdsToDelete: yup.array().optional(),
        });
    }, [isDriverRole, tValidation]);

    // Only logged-in users
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Fetch existing part ride detail
    const {data: partRide, isLoading, error} = usePartRideDetail(partRideId);

    // Edit Part Ride Hook
    const {mutateAsync: editPartRide, isPending} = useEditPartRide();

    const [companyId, setCompanyId] = useState(partRide?.company?.id || '');
    const [newUploads, setNewUploads] = useState<{ fileId: string; originalFileName: string }[]>([]);
    // Additional data for Autocomplete
    const {data: hoursCodesData, isLoading: isLoadingHoursCodes} = useHoursCodes();
    const {data: hoursOptionsData, isLoading: isLoadingHoursOptions} = useHoursOptions();
    const {data: companiesData, isLoading: isLoadingCompanies} = useCompanies(1, 1000);
    const {data: clientsData, isLoading: isLoadingClients} = useClients(1, 1000);
    const {data: driversData, isLoading: isLoadingDrivers} = useDrivers();
    const {data: carsData, isLoading: isLoadingCars} = useCars(companyId ? [companyId] : [], 1, 1000);
    const downloadFile = useDownloadPartRideFile();

    const someDataIsLoading = useMemo(() => {
        return isLoading || isLoadingCompanies || isLoadingClients || isLoadingDrivers
            || isLoadingCars;
    }, [isLoading, isLoadingCars, isLoadingClients, isLoadingCompanies, isLoadingDrivers]);
    const [showSpecialHoursAccordion, setShowSpecialHoursAccordion] = useState(false);
    const [showAdditionalFieldsAccordion, setShowAdditionalFieldsAccordion] = useState(false);
    const [fileIdsToDelete, setFileIdsToDelete] = useState<string[]>([]);

    // Local error
    const [apiError, setApiError] = useState<string | null>(null);

    // React Hook Form
    const {
        handleSubmit,
        control,
        setValue,
        watch,
        formState: {errors},
    } = useForm<EditPartRideInput>({
        resolver: yupResolver(schema),
        defaultValues: {
            id: partRideId,
            date: '',
            start: '',
            end: '',
            rest: '',
            rideId: '',
            totalKilometers: 0,
            extraKilometers: 0,
            costs: 0,
            weekNumber: 0,
            costsDescription: '',
            turnover: 0,
            remark: '',
            companyId: '',
            hoursCorrection: 0,
            variousCompensation: 0,
            clientId: '',
            driverId: '',
            carId: '',
            charterId: '',
            newUploads: [],
            fileIdsToDelete: []
        },
    });

    // Pre-fill form with existing data
    useEffect(() => {
        if (partRide) {
            setValue('id', partRideId);
            setValue('date', partRide.date);
            setValue('start', partRide.start);
            setValue('end', partRide.end);
            setValue('rest', partRide.rest);
            setValue('totalKilometers', partRide.totalKilometers || 0);
            setValue('extraKilometers', partRide.extraKilometers || 0);
            setValue('costs', partRide.costs || 0);
            setValue('weekNumber', partRide.weekNumber || 0);
            setValue('hoursCorrection', partRide.correctionTotalHours || 0);
            setValue('variousCompensation', partRide.variousCompensation || 0);
            setValue('hoursOptionId', partRide.hoursOption?.id || '');
            setValue('costsDescription', partRide.costsDescription || '');
            setValue('turnover', partRide.turnover || 0);
            setValue('remark', partRide.remark || '');
            setValue('hoursCodeId', partRide.hoursCode?.id || '');
            setValue('companyId', partRide.company?.id || '');
            setValue('clientId', partRide.client?.id || '');
            setValue('driverId', partRide.driver?.id || '');
            setValue('carId', partRide.car?.id || '');
            setValue('charterId', partRide.charter?.id || '');
            setCompanyId(partRide.company?.id || '');
        }
    }, [partRide, partRideId, setValue]);

    // Update weekNumber when date changes
    useEffect(() => {
        const date = watch('date');
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
            const week = getIso8601WeekOfYear(parsedDate);
            setValue('weekNumber', week);
        }
    }, [watch('date'), setValue]);

    // On Submit
    const onSubmit: SubmitHandler<EditPartRideInput> = async (data) => {
        setApiError(null);
        // Force required ID
        data.id = partRideId;
        data.newUploads = newUploads;
        data.fileIdsToDelete = fileIdsToDelete;
        try {
            await editPartRide(data);
            router.push(`/partrides/${partRideId}`); // Go back to detail or list
        } catch (err: any) {
            setApiError(err.response?.data?.errors?.[0] || err.message);
        }
    };

    useEffect(() => {
        const subscription = watch((value) => {
            const shouldExpand =
                value.start === '00:00:00' ||
                value.start === '00:00' ||
                value.end === '00:00:00' ||
                value.end === '00:00' ||
                value.end === '24:00:00' ||
                value.end === '24:00' ||
                value.end === '1.00:00:00' ||
                value.end === '1.00:00';

            if (shouldExpand) {
                setShowSpecialHoursAccordion(true);
            }
        });

        return () => subscription.unsubscribe();
    }, [watch]);

    useEffect(() => {
        if (!authLoading && user?.roles.includes('driver')) {
            setShowAdditionalFieldsAccordion(true);
        }
    }, [authLoading, user]);

    const handleFileDelete = (file: ApplicationFile) => {
        setFileIdsToDelete((prev) =>
            prev.includes(file.id) ? prev : [...prev, file.id]
        );

        if (partRide?.files) {
            partRide.files = partRide.files.filter((f) => f.id !== file.id);
        }
    };

    const handleFileClick = async (file: ApplicationFile): Promise<void> => {
        await downloadFile(file)
    };

    // If anything is still loading
    if (
        authLoading ||
        isLoading
    ) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress/>
            </Box>
        );
    }

    if (!partRide) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error?.message || t('error')}</Alert>
            </Box>
        );
    }

    return (
        <Suspense fallback={<CircularProgress/>}>
            <Box maxWidth="700px" mx="auto" sx={{ pt: 4, pb: 5}}>
                <Typography variant="h4" gutterBottom>
                    {t('title')}
                </Typography>

                {apiError && (
                    <Alert severity="error" sx={{mb: 2}}>
                        {apiError}
                    </Alert>
                )}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Box width="100%">
                        <DateInputField
                            name="date"
                            control={control}
                            label={t('date.label')}
                            placeholder={t('date.placeholder')}
                            helperText={errors.date?.message || t('date.helperText')}
                            error={!!errors.date}
                            errorMessage={errors.date?.message}
                        />
                    </Box>
                    <Controller
                        name="start"
                        control={control}
                        render={({field}) => (
                            <TextField
                                {...field}
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                sx={{mt: 2}}
                                label={t('start.label')}
                                placeholder={t('start.placeholder')}
                                error={!!errors.start}
                                helperText={errors.start?.message || t('start.helperText')}
                            />
                        )}
                    />
                    <Controller
                        name="end"
                        control={control}
                        render={({field}) => (
                            <TextField
                                {...field}
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                sx={{mt: 2}}
                                label={t('end.label')}
                                placeholder={t('end.placeholder')}
                                error={!!errors.end}
                                helperText={errors.end?.message || t('end.helperText')}
                            />
                        )}
                    />
                    <Controller
                        name="rest"
                        control={control}
                        render={({field}) => (
                            <TextField
                                {...field}
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                sx={{mt: 2}}
                                label={t('rest.label')}
                                placeholder={t('rest.placeholder')}
                                error={!!errors.rest}
                                helperText={errors.rest?.message || t('rest.helperText')}
                            />
                        )}
                    />
                    {!isDriverRole && (
                        <>
                            {/* Driver */}
                            <Controller
                                name="driverId"
                                control={control}
                                render={({field}) => (
                                    <Autocomplete
                                        options={driversData || []}
                                        loading={isLoadingDrivers}
                                        getOptionLabel={(option) => `${option.user?.firstName} ${option.user?.lastName}`}
                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                        onChange={(_, newValue) => {
                                            const driverId = newValue?.id || '';
                                            const driverCompanyId = newValue?.companyId || '';

                                            field.onChange(driverId);              // Set driverId
                                            setValue('companyId', driverCompanyId); // Set companyId in the form
                                            setCompanyId(driverCompanyId);          // Update local state for car/charter filtering
                                        }}
                                        value={driversData?.find((dr) => dr.id === field.value) || null}
                                        renderInput={(params) =>
                                            <TextField {...params}
                                                       variant="outlined"
                                                       margin="normal"
                                                       sx={{mt: 2}}
                                                       label={t('driver.label')}
                                                       placeholder={t('driver.placeholder')}
                                                       error={!!errors.driverId}
                                                       helperText={errors.driverId?.message || t('driver.helperText')}
                                            />}
                                    />
                                )}
                            />
                        </>)}
                    {!isDriverRole && (
                        <>
                            <Accordion
                                expanded={showSpecialHoursAccordion}
                                onChange={() => setShowSpecialHoursAccordion(!showSpecialHoursAccordion)}
                                sx={{
                                    boxShadow: 'none',
                                    border: 'none',
                                    borderTop: 'none',
                                    background: 'none',
                                    '&:before': {display: 'none'}
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon/>}
                                    sx={{p: 0, minHeight: 0}}
                                >
                                    <Typography>Special hours</Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{p: 0}}>
                                    {/* Hours Code */}
                                    <Controller
                                        name="hoursCodeId"
                                        control={control}
                                        render={({field}) => (
                                            <Autocomplete
                                                options={hoursCodesData || []}
                                                getOptionLabel={(option) => option.name}
                                                loading={isLoadingHoursCodes}
                                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                                onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                                                value={hoursCodesData?.find((hc) => hc.id === field.value) || null}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        variant="outlined"
                                                        margin="normal"
                                                        sx={{mt: 2}}
                                                        label="Hours Code"
                                                        placeholder={t('hoursCode.placeholder')}
                                                        error={!!errors.hoursCodeId}
                                                        helperText={errors.hoursCodeId?.message}
                                                    />
                                                )}
                                            />
                                        )}
                                    />
                                    {/* Hours Option */}
                                    <Controller
                                        name="hoursOptionId"
                                        control={control}
                                        render={({field}) => (
                                            <Autocomplete
                                                options={hoursOptionsData || []}
                                                getOptionLabel={(option) => option.name}
                                                loading={isLoadingHoursOptions}
                                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                                onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                                                value={hoursOptionsData?.find((ho) => ho.id === field.value) || null}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        variant="outlined"
                                                        margin="normal"
                                                        sx={{mt: 2}}
                                                        label="Hours Option"
                                                        placeholder={t('hoursOption.placeholder')}
                                                        error={!!errors.hoursOptionId}
                                                        helperText={errors.hoursOptionId?.message}
                                                    />
                                                )}
                                            />
                                        )}
                                    />
                                </AccordionDetails>
                            </Accordion>
                        </>
                    )}

                    <Accordion expanded={showAdditionalFieldsAccordion}
                               onChange={() => setShowAdditionalFieldsAccordion(!showAdditionalFieldsAccordion)}
                               sx={{
                                   boxShadow: 'none',
                                   border: 'none',
                                   borderTop: 'none',
                                   background: 'none',
                                   '&:before': {display: 'none'}
                               }}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon/>}
                            sx={{p: 0, minHeight: 0}}
                        >
                            <Typography component="span">Additional inputs</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{p: 0}}>
                            {!isDriverRole && (
                                <>
                                    <Controller
                                        name="hoursCorrection"
                                        control={control}
                                        render={({field}) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                variant="outlined"
                                                fullWidth
                                                    label={t('correction.label')}
                                                    placeholder={t('correction.placeholder')}
                                                margin="normal"
                                                sx={{mt: 2}}
                                                error={!!errors.hoursCorrection}
                                                helperText={errors.hoursCorrection?.message}
                                            />
                                        )}
                                    />
                                </>
                            )}

                            {/* If user is driver => hide some fields */}
                            {!isDriverRole && (
                                <>
                                    {/* weekNumber */}
                                    <Controller
                                        name="weekNumber"
                                        control={control}
                                        render={({field}) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                variant="outlined"
                                                fullWidth
                                                sx={{mt: 2}}
                                                        label={t('weekNumber.label')}
                                                        placeholder={t('weekNumber.placeholder')}
                                                        error={!!errors.weekNumber}
                                                        helperText={errors.weekNumber?.message || t('weekNumber.helperText')}
                                                        margin="normal"

                                            />
                                        )}
                                    />

                                    {/*/!* turnover *!/*/}
                                    {/*<FormLabel>Turnover</FormLabel>*/}
                                    {/*<Controller*/}
                                    {/*    name="turnover"*/}
                                    {/*    control={control}*/}
                                    {/*    render={({field}) => (*/}
                                    {/*        <TextField*/}
                                    {/*            {...field}*/}
                                    {/*            type="number"*/}
                                    {/*            variant="outlined"*/}
                                    {/*            fullWidth*/}
                                    {/*            margin="normal"*/}
                                    {/*            sx={{mt: 2}}*/}
                                    {/*        />*/}
                                    {/*    )}*/}
                                    {/*/>*/}

                                    {/* Autocomplete Fields for non-driver */}
                                    {/* Company */}
                                    <Controller
                                        name="companyId"
                                        control={control}
                                        render={({field}) => (
                                            <Autocomplete
                                                options={companiesData?.data || []}
                                                getOptionLabel={(option) => option.name}
                                                loading={isLoadingCompanies}
                                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                                onChange={(_, newValue) => {
                                                    setCompanyId(newValue?.id || '');
                                                    field.onChange(newValue?.id || '');
                                                }}
                                                value={companiesData?.data.find((co) => co.id === field.value) || null}
                                                renderInput={(params) => <TextField {...params} variant="outlined"
                                                                                    margin="normal"
                                                                                    sx={{mt: 2}}
                                                                                        label={t('company.label')}
                                                                                        placeholder={t('company.placeholder')}
                                                                                    error={!!errors.companyId}
                                                                                        helperText={errors.companyId?.message || t('company.helperText')}
                                                />}
                                            />
                                        )}
                                    />

                                    {/* Client */}
                                    <Controller
                                        name="clientId"
                                        control={control}
                                        render={({field}) => (
                                            <Autocomplete
                                                options={clientsData?.data || []}
                                                getOptionLabel={(option) => option.name}
                                                loading={isLoadingClients}
                                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                                onChange={(_, newValue) => {
                                                    field.onChange(newValue?.id || '');
                                                }}
                                                value={clientsData?.data.find((cl) => cl.id === field.value) || null}
                                                renderInput={(params) => <TextField {...params} variant="outlined"
                                                                                    margin="normal"
                                                                                    sx={{mt: 2}}
                                                                                        label={t('client.label')}
                                                                                        placeholder={t('client.placeholder')}
                                                                                    error={!!errors.clientId}
                                                                                        helperText={errors.clientId?.message || t('client.helperText')}
                                                />}
                                            />
                                        )}
                                    />

                                    {/* Car */}
                                    <Controller
                                        name="carId"
                                        control={control}
                                        render={({field}) => (
                                            <Autocomplete
                                                options={carsData?.cars || []}
                                                loading={isLoadingCars}
                                                getOptionLabel={(option) => option.licensePlate}
                                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                                onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                                                value={carsData?.cars?.find((ca) => ca.id === field.value) || null}
                                                renderInput={(params) => <TextField {...params} variant="outlined"
                                                                                    margin="normal"
                                                                                    sx={{mt: 2}}
                                                                                        label={t('car.label')}
                                                                                        placeholder={t('car.placeholder')}
                                                                                    error={!!errors.carId}
                                                                                        helperText={errors.carId?.message || t('car.helperText')}
                                                />}
                                            />
                                        )}
                                    />

                                    {/*Various Compensation*/}
                                    <Controller
                                        name="variousCompensation"
                                        control={control}
                                        render={({field}) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                variant="outlined"
                                                fullWidth
                                                margin="normal"
                                                sx={{mt: 2}}
                                                    label={t('variousCompensation.label')}
                                                    placeholder={t('variousCompensation.placeholder')}
                                                    error={!!errors.variousCompensation}
                                                    helperText={errors.variousCompensation?.message || t('variousCompensation.helperText')}

                                            />
                                        )}
                                    />
                                </>
                            )}
                            {/* Distance/ Kilometers */}
                            <Box>
                                <Typography variant="h6">Distance</Typography>
                                <Controller
                                    name="totalKilometers"
                                    control={control}
                                    render={({field}) => (
                                        <TextField
                                            {...field}
                                            type="number"
                                            variant="outlined"
                                            fullWidth
                                            margin="normal"
                                            label={t('totalKilometers.label')}
                                            placeholder={t('totalKilometers.placeholder')}
                                            error={!!errors.totalKilometers}
                                            helperText={errors.totalKilometers?.message || t('totalKilometers.helperText')}
                                        />
                                    )}
                                />
                                <Controller
                                    name="extraKilometers"
                                    control={control}
                                    render={({field}) => (
                                        <TextField
                                            {...field}
                                            type="number"
                                            variant="outlined"
                                            fullWidth
                                            margin="normal"
                                            label={t('extraKilometers.label')}
                                            placeholder={t('extraKilometers.placeholder')}
                                            error={!!errors.extraKilometers}
                                            helperText={errors.extraKilometers?.message || t('extraKilometers.helperText')}
                                        />
                                    )}
                                />
                            </Box>
                            <Divider sx={{my: 2}}/>
                            {/* Expenses */}
                            <Box mb={2}>
                                <Typography variant="h6">Expenses</Typography>
                                <Controller
                                    name="costs"
                                    control={control}
                                    render={({field}) => (
                                        <TextField
                                            {...field}
                                            type="number"
                                            variant="outlined"
                                            fullWidth
                                            margin="normal"
                                        label={t('costs.label')}
                                        placeholder={t('costs.placeholder')}
                                        error={!!errors.costs}
                                        helperText={errors.costs?.message || t('costs.helperText')}
                                        />
                                    )}
                                />
                            </Box>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="h6">Receipts</Typography>
                                {partRide.files?.map((file) => (
                                  <Box key={file.id} mb={1.5}>
                                    <FileTile
                                        file={file}
                                      onDelete={handleFileDelete}
                                      onClick={handleFileClick}
                                    />
                                  </Box>
                                ))}
                            </Box>
                            {/* Upload Receipts (modular) */}

                            <Box mb={2}>
                                <Typography variant="h6">Upload Receipts</Typography>
                                <Typography variant="body1" mb={1}>
                                {t('uploadReceipts.helperText')}
                                </Typography>
                                <FileUploadBox uploadUrl="/temporary-uploads" onFilesChange={setNewUploads} />
                            </Box>

                            <Divider sx={{my: 2}}/>

                            {/* Comments */}
                            <Box mb={0}>
                                <Typography variant="h6">Comments</Typography>
                                <Controller
                                    name="remark"
                                    control={control}
                                    render={({field}) => (
                                        <TextField
                                            {...field}
                                            variant="outlined"
                                            fullWidth
                                            margin="normal"
                                            multiline
                                            minRows={3}
                                        label={t('remark.label')}
                                        placeholder={t('remark.placeholder')}
                                        error={!!errors.remark}
                                        helperText={errors.remark?.message || t('remark.helperText')}
                                        />
                                    )}
                                />
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    <Box mt={3}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={isPending || someDataIsLoading}
                        >
                            {isPending || someDataIsLoading ?
                                <CircularProgress size={20} color="inherit"/> : t('actions.save')}
                        </Button>
                    </Box>
                </form>
            </Box>
        </Suspense>
    );
}

export default function EditPartRidePage() {
    return (
        <Suspense fallback={<CircularProgress/>}>
            <EditPartRidePageWrapper/>
        </Suspense>
    );
}
