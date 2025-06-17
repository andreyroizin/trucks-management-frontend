'use client';

import React, {Suspense, useEffect, useMemo, useState} from 'react';
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

function EditPartRidePageWrapper() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const partRideId = searchParams.get('id') || '';
    const {user, isAuthenticated, loading: authLoading} = useAuth();
    const isDriverRole = user?.roles.includes('driver');

    // --- VALIDATION SCHEMA ---
    const schema = useMemo(() => {
        return yup.object().shape({
            id: yup.string().required("ID is required"),
            date: yup.string().required("Date is required"),
            start: yup.string().required("Start time is required"),
            end: yup.string().required("End time is required"),
            kilometers: yup.number().optional(),
            costs: yup.number().optional(),
            clientId: yup.string().optional(),
            companyId: yup.string().optional(),
            driverId: yup.string().when([], {
                is: () => !isDriverRole,
                then: (schema) => schema.required("Driver is required"),
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
                then: (schema) => schema.required('Hours Code is required for this time range'),
                otherwise: (schema) => schema.optional(),
            }),
            hoursOptionId: yup.string().optional(),
            hoursCorrection: yup.number().optional(),
            variousCompensation: yup.number().optional(),
            charterId: yup.string().optional(),
            rideId: yup.string().optional(),
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
    }, [isDriverRole]);

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
    const [clientId, setClientId] = useState(partRide?.client?.id || '');
    const [newUploads, setNewUploads] = useState<{ fileId: string; originalFileName: string }[]>([]);
    console.log(newUploads);
    // Additional data for Autocomplete
    const {data: hoursCodesData, isLoading: isLoadingHoursCodes} = useHoursCodes();
    const {data: hoursOptionsData, isLoading: isLoadingHoursOptions} = useHoursOptions();
    const {data: companiesData, isLoading: isLoadingCompanies} = useCompanies();
    const {data: clientsData, isLoading: isLoadingClients} = useClients(1, 1000);
    const {data: driversData, isLoading: isLoadingDrivers} = useDrivers();
    const {data: carsData, isLoading: isLoadingCars} = useCars(companyId, 1, 1000);
    const {data: ridesData, isLoading: isLoadingRides} = useRides(1, 1000);
    const {data: chartersData, isLoading: isLoadingCharters} = useCharters(companyId, clientId, 1, 1000);
    const downloadFile = useDownloadPartRideFile();

    const someDataIsLoading = useMemo(() => {
        return isLoading || isLoadingCompanies || isLoadingClients || isLoadingDrivers
            || isLoadingCars || isLoadingRides || isLoadingCharters;
    }, [isLoading, isLoadingCars, isLoadingCharters, isLoadingClients, isLoadingCompanies, isLoadingDrivers, isLoadingRides]);
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
            rideId: '',
            kilometers: 0,
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
            setValue('kilometers', partRide.kilometers || 0);
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
            setClientId(partRide.client?.id || '');
        }
    }, [partRide, partRideId, setValue]);

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
                <Alert severity="error">{error?.message || 'Failed to load part ride detail'}</Alert>
            </Box>
        );
    }

    return (
        <Suspense fallback={<CircularProgress/>}>
            <Box maxWidth="700px" mx="auto" sx={{ pt: 4, pb: 5}}>
                <Typography variant="h4" gutterBottom>
                    Edit Part Ride
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
                            label="Date (dd-mm-yy)"
                            placeholder="dd-mm-yy"
                            helperText="Select the day you worked"
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
                                label="Start Time (e.g. 07:30)"
                                placeholder="07:30"
                                error={!!errors.start}
                                helperText={errors.start?.message || 'What time did you start work?'}
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
                                label="End Time (e.g. 17:30)"
                                placeholder="17:30"
                                error={!!errors.end}
                                helperText={errors.end?.message || 'What time did you end work?'}
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
                                                       label="Driver"
                                                       placeholder="Select driver"
                                                       error={!!errors.driverId}
                                                       helperText={errors.driverId?.message || 'Select the driver for this workday.'}
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
                                                        placeholder="Select hours code"
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
                                                        placeholder="Select hours option"
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
                                                label="Correction time"
                                                placeholder="00:00"
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
                                                label="Week Number (e.g. 23)"
                                                placeholder="23"
                                                error={!!errors.weekNumber}
                                                helperText={errors.weekNumber?.message || 'Enter the week number for this workday.'}
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
                                                                                    label="Company"
                                                                                    placeholder="Select company"
                                                                                    error={!!errors.companyId}
                                                                                    helperText={errors.companyId?.message || 'Select your company for this workday.'}
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
                                                    setClientId(newValue?.id || '');
                                                    field.onChange(newValue?.id || '');
                                                }}
                                                value={clientsData?.data.find((cl) => cl.id === field.value) || null}
                                                renderInput={(params) => <TextField {...params} variant="outlined"
                                                                                    margin="normal"
                                                                                    sx={{mt: 2}}
                                                                                    label="Client"
                                                                                    placeholder="Select client"
                                                                                    error={!!errors.clientId}
                                                                                    helperText={errors.clientId?.message || 'Select the client for this workday.'}
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
                                                                                    label="Car"
                                                                                    placeholder="Select car"
                                                                                    error={!!errors.carId}
                                                                                    helperText={errors.carId?.message || 'Select the car used for this workday.'}
                                                />}
                                            />
                                        )}
                                    />

                                    {/* Ride */}
                                    <Controller
                                        name="rideId"
                                        control={control}
                                        render={({field}) => (
                                            <Autocomplete
                                                options={ridesData?.data || []}
                                                getOptionLabel={(option) => option.name}
                                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                                loading={isLoadingRides}
                                                onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                                                value={ridesData?.data.find((ri) => ri.id === field.value) || null}
                                                renderInput={(params) => <TextField {...params} variant="outlined"
                                                                                    margin="normal"
                                                                                    sx={{mt: 2}}
                                                                                    label="Ride"
                                                                                    placeholder="Select ride"
                                                                                    error={!!errors.rideId}
                                                                                    helperText={errors.rideId?.message || 'Select the ride for this workday.'}
                                                />}
                                            />
                                        )}
                                    />

                                    {/* Charter */}
                                    <Controller
                                        name="charterId"
                                        control={control}
                                        render={({field}) => (
                                            <Autocomplete
                                                options={chartersData?.data || []}
                                                getOptionLabel={(option) => option.name}
                                                loading={isLoadingCharters}
                                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                                onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                                                value={chartersData?.data.find((ch) => ch.id === field.value) || null}
                                                renderInput={(params) => <TextField {...params} variant="outlined"
                                                                                    margin="normal"
                                                                                    sx={{mt: 2}}
                                                                                    label="Charter"
                                                                                    placeholder="Select charter"
                                                                                    error={!!errors.charterId}
                                                                                    helperText={errors.charterId?.message || 'Select the charter for this workday.'}
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
                                                label="Various Compensation (e.g. 10)"
                                                placeholder="10"
                                                error={!!errors.variousCompensation}
                                                helperText={errors.variousCompensation?.message || 'Enter any additional compensation.'}

                                            />
                                        )}
                                    />
                                </>
                            )}
                            {/* Distance/ Kilometers */}
                            <Box mb={2}>
                                <Typography variant="h6">Distance</Typography>
                                <Controller
                                    name="kilometers"
                                    control={control}
                                    render={({field}) => (
                                        <TextField
                                            {...field}
                                            type="number"
                                            variant="outlined"
                                            fullWidth
                                            margin="normal"
                                            label="Total Distance / km (e.g. 135)"
                                            placeholder="135"
                                            error={!!errors.kilometers}
                                            helperText={errors.kilometers?.message || 'How many kilometers did you drive today?'}
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
                                            label="Total Expenses (€) (e.g. 40)"
                                            placeholder="40"
                                            error={!!errors.costs}
                                            helperText={errors.costs?.message || 'Enter the full amount you spent today (fuel, tolls, meals, tunnels, AdBlue, etc.)'}
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
                                    Add any files related to the trip (fuel, toll, hotel, etc.)
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
                                            label="Your comment"
                                            placeholder="Optional — add any notes for Transport Admin"
                                            error={!!errors.remark}
                                            helperText={errors.remark?.message || "Use if there's something important about this workday."}
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
                                <CircularProgress size={20} color="inherit"/> : 'Save Changes'}
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
