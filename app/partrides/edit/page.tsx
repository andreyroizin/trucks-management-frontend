'use client';

import React, {Suspense, useEffect, useMemo, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {Alert, Box, Button, CircularProgress, FormLabel, TextField, Typography,} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import {Controller, SubmitHandler, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import {useAuth} from '@/hooks/useAuth';
import {usePartRideDetail} from '@/hooks/usePartRideDetail'; // To fetch existing data
import {EditPartRideInput, useEditPartRide} from '@/hooks/useEditPartRide';

import {useCompanies} from '@/hooks/useCompanies';
import {useClients} from '@/hooks/useClients';
import {useDrivers} from '@/hooks/useDrivers';
import {useCars} from '@/hooks/useCars';
import {useRides} from '@/hooks/useRides';
import {useUnits} from '@/hooks/useUnits';
import {useRates} from '@/hooks/useRates';
import {useSurcharges} from '@/hooks/useSurcharges';
import {useCharters} from '@/hooks/useCharters';
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

// --- VALIDATION SCHEMA ---
const editPartRideSchema = yup.object().shape({
    id: yup.string().required("ID is required"),
    date: yup.string().required("Date is required"),
    start: yup.string().required("Start time is required"),
    end: yup.string().required("End time is required"),
    kilometers: yup.number().optional(),
    costs: yup.number().optional(),
    employer: yup.string().optional(),
    clientId: yup.string().optional(),
    companyId: yup.string().optional(),
    driverId: yup.string().optional(),
    carId: yup.string().optional(),
    rateId: yup.string().optional(),
    surchargeId: yup.string().optional(),
    charterId: yup.string().optional(),
    unitId: yup.string().optional(),
    rideId: yup.string().optional(),
    weekNumber: yup
        .number()
        .transform((value, originalValue) => originalValue === '' ? undefined : value)
        .nullable()
        .optional(),
    costsDescription: yup.string().optional(),
    turnover: yup.number().optional(),
    remark: yup.string().optional(),
});

export default function EditPartRidePage() {
    dayjs.extend(utc);
    dayjs.extend(timezone);

    const AMSTERDAM_TZ = "Europe/Amsterdam";

    const router = useRouter();
    const searchParams = useSearchParams();
    const partRideId = searchParams.get('id') || '';
    const {user, isAuthenticated, loading: authLoading} = useAuth();
    const isDriverRole = user?.roles.includes('driver');

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

    // Additional data for Autocomplete
    const {data: companiesData, isLoading: isLoadingCompanies} = useCompanies();
    const {data: clientsData, isLoading: isLoadingClients} = useClients(1, 1000);
    const {data: driversData, isLoading: isLoadingDrivers} = useDrivers();
    const {data: carsData, isLoading: isLoadingCars} = useCars(companyId, 1, 1000);
    const {data: ridesData, isLoading: isLoadingRides} = useRides(1, 1000);
    const {data: unitsData, isLoading: isLoadingUnits} = useUnits(1, 1000);
    const {data: ratesData, isLoading: isLoadingRates} = useRates(clientId, 1, 1000);
    const {data: surchargesData, isLoading: isLoadingSurcharges} = useSurcharges(clientId, 1, 1000);
    const {data: chartersData, isLoading: isLoadingCharters} = useCharters(companyId, clientId, 1, 1000);

    const someDataIsLoading = useMemo(() => {
        return isLoading || isLoadingCompanies || isLoadingClients || isLoadingDrivers
            || isLoadingCars || isLoadingRides || isLoadingRates || isLoadingSurcharges || isLoadingCharters;
    }, [isLoading, isLoadingCars, isLoadingCharters, isLoadingClients, isLoadingCompanies, isLoadingDrivers, isLoadingRates, isLoadingRides, isLoadingSurcharges]);

    // Local error
    const [apiError, setApiError] = useState<string | null>(null);

    // React Hook Form
    const {
        handleSubmit,
        control,
        setValue,
        formState: {errors},
    } = useForm<EditPartRideInput>({
        resolver: yupResolver(editPartRideSchema),
        defaultValues: {
            id: partRideId,
            date: '',
            start: '',
            end: '',
            rideId: '',
            rest: '00:00:00',
            kilometers: 0,
            costs: 0,
            weekNumber: 0,
            costsDescription: '',
            turnover: 0,
            remark: '',
            companyId: '',
            clientId: '',
            driverId: '',
            carId: '',
            rateId: '',
            surchargeId: '',
            charterId: '',
            unitId: '',
        },
    });

    // Pre-fill form with existing data
    useEffect(() => {
        if (partRide) {
            setValue('id', partRideId);
            setValue('date', partRide.date);
            setValue('start', partRide.start);
            setValue('end', partRide.end);
            setValue('rest', partRide.rest || '00:00:00');
            setValue('kilometers', partRide.kilometers || 0);
            setValue('costs', partRide.costs || 0);
            setValue('weekNumber', partRide.weekNumber || 0);
            setValue('costsDescription', partRide.costsDescription || '');
            setValue('turnover', partRide.turnover || 0);
            setValue('remark', partRide.remark || '');
            setValue('companyId', partRide.company?.id || '');
            setValue('clientId', partRide.client?.id || '');
            setValue('driverId', partRide.driver?.id || '');
            setValue('carId', partRide.car?.id || '');
            setValue('rateId', partRide.rate?.id || '');
            setValue('surchargeId', partRide.surcharge?.id || '');
            setValue('charterId', partRide.charter?.id || '');
            setValue('unitId', partRide.unit?.id || '');
            setValue('rideId', partRide.ride?.id || '');
            setCompanyId(partRide.company?.id || '');
            setClientId(partRide.client?.id || '');
        }
    }, [partRide, partRideId, setValue]);

    // On Submit
    const onSubmit: SubmitHandler<EditPartRideInput> = async (data) => {
        setApiError(null);
        // Force required ID
        data.id = partRideId;
        try {
            await editPartRide(data);
            router.push(`/partrides/${partRideId}`); // Go back to detail or list
        } catch (err: any) {
            setApiError(err.response?.data?.errors?.[0] || err.message);
        }
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

                    {/* If user is driver => hide some fields */}
                    {!isDriverRole && (
                        <>
                            <FormLabel>Rest</FormLabel>
                            <Controller
                                name="rest"
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

                            {/* Kilometers */}
                            <FormLabel>Kilometers</FormLabel>
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
                                        }} value={companiesData?.data.find((co) => co.id === field.value) || null}
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
                                        onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                                        value={driversData?.find((dr) => dr.id === field.value) || null}
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

                            {/* Unit */}
                            <FormLabel>Unit</FormLabel>
                            <Controller
                                name="unitId"
                                control={control}
                                render={({field}) => (
                                    <Autocomplete
                                        options={unitsData?.units || []}
                                        getOptionLabel={(option) => option.value}
                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                        loading={isLoadingUnits}
                                        onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                                        value={unitsData?.units?.find((un) => un.id === field.value) || null}
                                        renderInput={(params) => <TextField {...params} variant="outlined"
                                                                            margin="normal"/>}
                                    />
                                )}
                            />

                            {/* Rate */}
                            <FormLabel>Rate</FormLabel>
                            <Controller
                                name="rateId"
                                control={control}
                                render={({field}) => (
                                    <Autocomplete
                                        options={ratesData?.rates || []}
                                        getOptionLabel={(option) => option.name}
                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                        loading={isLoadingRates}
                                        onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                                        value={ratesData?.rates?.find((ra) => ra.id === field.value) || null}
                                        renderInput={(params) => <TextField {...params} variant="outlined"
                                                                            margin="normal"/>}
                                    />
                                )}
                            />

                            {/* Surcharge */}
                            <FormLabel>Surcharge</FormLabel>
                            <Controller
                                name="surchargeId"
                                control={control}
                                render={({field}) => (
                                    <Autocomplete
                                        options={surchargesData?.data || []}
                                        getOptionLabel={(option) => `${option.value}`}
                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                        loading={isLoadingSurcharges}
                                        onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                                        value={surchargesData?.data.find((su) => su.id === field.value) || null}
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
                        </>
                    )}

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
