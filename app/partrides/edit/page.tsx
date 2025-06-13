'use client';

import React, {Suspense, useEffect, useMemo, useState} from 'react';
import FileUploadBox from '@/components/FileUploadBox';
import {useRouter, useSearchParams} from 'next/navigation';
import {Alert, Box, Button, CircularProgress, Divider, FormLabel, TextField, Typography,} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import {Controller, SubmitHandler, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
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
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import {useHoursCodes} from "@/hooks/useHoursCodes";
import {useHoursOptions} from "@/hooks/useHoursOptions";

function EditPartRidePageWrapper() {
    dayjs.extend(utc);
    dayjs.extend(timezone);

    const AMSTERDAM_TZ = "Europe/Amsterdam";

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
            newUploadIds: yup.array().optional(),
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
    const [tempFileIds, setTempFileIds] = useState<string[]>([]);

    // Additional data for Autocomplete
    const {data: hoursCodesData, isLoading: isLoadingHoursCodes} = useHoursCodes();
    const {data: hoursOptionsData, isLoading: isLoadingHoursOptions} = useHoursOptions();
    const {data: companiesData, isLoading: isLoadingCompanies} = useCompanies();
    const {data: clientsData, isLoading: isLoadingClients} = useClients(1, 1000);
    const {data: driversData, isLoading: isLoadingDrivers} = useDrivers();
    const {data: carsData, isLoading: isLoadingCars} = useCars(companyId, 1, 1000);
    const {data: ridesData, isLoading: isLoadingRides} = useRides(1, 1000);
    const {data: chartersData, isLoading: isLoadingCharters} = useCharters(companyId, clientId, 1, 1000);

    const someDataIsLoading = useMemo(() => {
        return isLoading || isLoadingCompanies || isLoadingClients || isLoadingDrivers
            || isLoadingCars || isLoadingRides || isLoadingCharters;
    }, [isLoading, isLoadingCars, isLoadingCharters, isLoadingClients, isLoadingCompanies, isLoadingDrivers, isLoadingRides]);
    const [showSpecialHoursAccordion, setShowSpecialHoursAccordion] = useState(false);
    const [showAdditionalFieldsAccordion, setShowAdditionalFieldsAccordion] = useState(false);

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
            newUploadIds: [],
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
        console.log(data)
        setApiError(null);
        // Force required ID
        data.id = partRideId;
        data.newUploadIds = tempFileIds;
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
            <Box maxWidth="700px" mx="auto" p={4}>
                <Typography variant="h4" gutterBottom>
                    Edit Part Ride
                </Typography>

                {apiError && (
                    <Alert severity="error" sx={{mb: 2}}>
                        {apiError}
                    </Alert>
                )}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Box width="100%" mb={2}>
                        <FormLabel>Date</FormLabel>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <Controller
                                name="date"
                                control={control}
                                render={({field}) => (
                                    <DatePicker
                                        {...field}
                                        // Convert stored UTC date to Amsterdam time for display
                                        value={field.value ? dayjs.utc(field.value).tz(AMSTERDAM_TZ) : null}
                                        onChange={(newDate) => {
                                            if (newDate) {
                                                // Convert user-selected date to UTC midnight before saving
                                                const utcMidnight = dayjs.utc(newDate).startOf("day").toISOString();
                                                field.onChange(utcMidnight);
                                            } else {
                                                field.onChange('');
                                            }
                                        }}
                                        format="DD-MM-YYYY"
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                margin: "normal",
                                                error: !!errors.date,
                                                helperText: errors.date?.message,
                                            },
                                        }}
                                    />
                                )}
                            />
                        </LocalizationProvider>
                    </Box>

                    <FormLabel>Start</FormLabel>
                    <Controller
                        name="start"
                        control={control}
                        render={({field}) => (
                            <TextField
                                {...field}
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                error={!!errors.start}
                                helperText={errors.start?.message}
                            />
                        )}
                    />

                    <FormLabel>End</FormLabel>
                    <Controller
                        name="end"
                        control={control}
                        render={({field}) => (
                            <TextField
                                {...field}
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                error={!!errors.end}
                                helperText={errors.end?.message}
                            />
                        )}
                    />
                    {!isDriverRole && (
                        <>
                            {/* Driver */}
                            <FormLabel>Driver</FormLabel>
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
                                                       error={!!errors.driverId}
                                                       helperText={errors.driverId?.message}
                                            />}
                                    />
                                )}
                            />
                        </>)}
                    {!isDriverRole && (
                        <>
                            <Accordion expanded={showSpecialHoursAccordion}
                                       onChange={() => setShowSpecialHoursAccordion(!showSpecialHoursAccordion)}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                                    <Typography>Special hours</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    {/* Hours Code */}
                                    <FormLabel>Hours Code</FormLabel>
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
                                                        error={!!errors.hoursCodeId}
                                                        helperText={errors.hoursCodeId?.message}
                                                    />
                                                )}
                                            />
                                        )}
                                    />
                                    {/* Hours Option */}
                                    <FormLabel>Hours Option</FormLabel>
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
                               onChange={() => setShowAdditionalFieldsAccordion(!showAdditionalFieldsAccordion)}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon/>}
                            aria-controls="panel1-content"
                            id="panel1-header"
                        >
                            <Typography component="span">Additional inputs</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            {!isDriverRole && (
                                <>
                                    <FormLabel>Correction time</FormLabel>
                                    <Controller
                                        name="hoursCorrection"
                                        control={control}
                                        render={({field}) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                variant="outlined"
                                                fullWidth
                                                margin="normal"
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
                                    <FormLabel>Week Number</FormLabel>
                                    <Controller
                                        name="weekNumber"
                                        control={control}
                                        render={({field}) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                variant="outlined"
                                                fullWidth
                                                margin="normal"
                                                error={!!errors.weekNumber}
                                                helperText={errors.weekNumber?.message}
                                            />
                                        )}
                                    />

                                    {/* turnover */}
                                    <FormLabel>Turnover</FormLabel>
                                    <Controller
                                        name="turnover"
                                        control={control}
                                        render={({field}) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                variant="outlined"
                                                fullWidth
                                                margin="normal"
                                            />
                                        )}
                                    />

                                    {/* Autocomplete Fields for non-driver */}
                                    {/* Company */}
                                    <FormLabel>Company</FormLabel>
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
                                                                                    margin="normal"/>}
                                            />
                                        )}
                                    />

                                    {/* Client */}
                                    <FormLabel>Client</FormLabel>
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
                                                                                    margin="normal"/>}
                                            />
                                        )}
                                    />

                                    {/* Car */}
                                    <FormLabel>Car</FormLabel>
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
                                                                                    margin="normal"/>}
                                            />
                                        )}
                                    />

                                    {/* Ride */}
                                    <FormLabel>Ride</FormLabel>
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
                                                                                    margin="normal"/>}
                                            />
                                        )}
                                    />

                                    {/* Charter */}
                                    <FormLabel>Charter</FormLabel>
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
                                                                                    margin="normal"/>}
                                            />
                                        )}
                                    />
                                    <FormLabel>Various Compensation</FormLabel>
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
                                                error={!!errors.variousCompensation}
                                                helperText={errors.variousCompensation?.message}
                                            />
                                        )}
                                    />
                                </>
                            )}
                            {/* Kilometers */}
                            <FormLabel>Extra Kilometers</FormLabel>
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
                                    />
                                )}
                            />

                            {/* Costs */}
                            <FormLabel>Costs</FormLabel>
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
                                    />
                                )}
                            />
                            {/* costsDescription */}
                            <FormLabel>Costs Description</FormLabel>
                            <Controller
                                name="costsDescription"
                                control={control}
                                render={({field}) => (
                                    <TextField
                                        {...field}
                                        variant="outlined"
                                        fullWidth
                                        margin="normal"
                                    />
                                )}
                            />

                            {/* Upload Receipts (modular) */}
                            <Box mb={2}>
                                <Typography variant="h6">Upload Receipts</Typography>
                                <Typography variant="body1" mb={1}>
                                    Add any files related to the trip (fuel, toll, hotel, etc.)
                                </Typography>
                                <FileUploadBox uploadUrl="/temporary-uploads" onIdsChange={setTempFileIds} />                        </Box>

                            <Divider sx={{my: 2}} />

                            {/* remark (visible for all) */}
                            <FormLabel>Remark</FormLabel>
                            <Controller
                                name="remark"
                                control={control}
                                render={({field}) => (
                                    <TextField
                                        {...field}
                                        variant="outlined"
                                        fullWidth
                                        margin="normal"
                                    />
                                )}
                            />
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
