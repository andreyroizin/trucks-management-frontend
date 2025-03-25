'use client';

import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Alert, Box, Button, CircularProgress, FormLabel, TextField, Typography,} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import {Controller, SubmitHandler, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import {CreatePartRideInput, useCreatePartRide} from '@/hooks/useCreatePartRide';
import {useAuth} from '@/hooks/useAuth';
import {useCompanies} from '@/hooks/useCompanies';
import {useClients} from '@/hooks/useClients';
import {useDrivers} from '@/hooks/useDrivers';
import {useCars} from '@/hooks/useCars';
import {useRides} from '@/hooks/useRides';
import {useUnits} from '@/hooks/useUnits';
import {useRates} from '@/hooks/useRates';
import {useSurcharges} from '@/hooks/useSurcharges';
import {useCharters} from '@/hooks/useCharters';
import {useHoursCodes} from "@/hooks/useHoursCodes";

// --- VALIDATION SCHEMA ---
const createPartRideSchema = yup.object().shape({
    date: yup.string().required('Date is required (e.g. "2024-03-06T00:00:00Z")'),
    start: yup.string().required('Start time is required (e.g. "20:00:00")'),
    end: yup.string().required('End time is required (e.g. "05:00:00")'),
    // If driver => hide or not required
    rideId: yup.string().optional(),
    kilometers: yup.number().optional(),
    carId: yup.string().optional(),
    driverId: yup.string().optional(),
    costs: yup.number().optional(),
    employer: yup.string().optional(),
    hoursCodeId: yup.string().optional(),
    clientId: yup.string().optional(),
    weekNumber: yup.number().optional(),
    unitId: yup.string().optional(),
    rateId: yup.string().optional(),
    costsDescription: yup.string().optional(),
    surchargeId: yup.string().optional(),
    turnover: yup.number().optional(),
    remark: yup.string().optional(),
    companyId: yup.string().optional(),
    charterId: yup.string().optional(),
});

export default function CreatePartRidePage() {
    dayjs.extend(utc);
    dayjs.extend(timezone);

    const AMSTERDAM_TZ = "Europe/Amsterdam";
    const router = useRouter();
    const {user, isAuthenticated, loading: authLoading} = useAuth();

    // Ensure user is logged in
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router]);


    // If user is a driver => hide certain fields
    const isDriverRole = user?.roles.includes('driver');

    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);


    // Data hooks for Autocomplete:
    const {data: companiesData, isLoading: isLoadingCompanies} = useCompanies(/* e.g. pass companyId if needed */);
    const {data: clientsData, isLoading: isLoadingClients} = useClients(1, 1000);
    const {data: driversData, isLoading: isLoadingDrivers} = useDrivers();
    const {data: carsData, isLoading: isLoadingCars} = useCars(selectedCompanyId || '', 1, 1000);
    const {data: ridesData, isLoading: isLoadingRides} = useRides(1, 1000);
    const {data: unitsData, isLoading: isLoadingUnits} = useUnits(1, 1000);
    const {data: ratesData, isLoading: isLoadingRates} = useRates(selectedClientId || '', 1, 1000);
    const {
        data: surchargesData,
        isLoading: isLoadingSurcharges
    } = useSurcharges(selectedClientId || '', 1, 1000);
    const {data: chartersData, isLoading: isLoadingCharters} = useCharters(selectedCompanyId || '', selectedClientId || '', 1, 1000);
    const { data: hoursCodesData, isLoading: isLoadingHoursCodes } = useHoursCodes();

    console.log(hoursCodesData)
    // Create Hook
    const {mutateAsync: createPartRide, isPending} = useCreatePartRide();

    // Local error
    const [apiError, setApiError] = useState<string | null>(null);

    // React Hook Form
    const {
        handleSubmit,
        control,
        formState: {errors},
    } = useForm<CreatePartRideInput>({
        resolver: yupResolver(createPartRideSchema),
        defaultValues: {
            date: '',
            start: '',
            end: '',
            kilometers: 0,
            costs: 0,
            employer: '',
            hoursCodeId: '', // or null
            weekNumber: 0,
            costsDescription: '',
            turnover: 0,
            remark: '',
            // If user is driver => prefill companyId
            companyId: isDriverRole ? (user?.driverInfo?.companyId || '') : '',
        },
    });

    // On Submit
    const onSubmit: SubmitHandler<CreatePartRideInput> = async (data) => {
        if(isDriverRole) {
            data = prefillDriversDataInTheForm(data, user?.driverInfo?.companyId, user?.driverInfo?.driverId);
        }

        setApiError(null);
        try {
            await createPartRide(data);
            router.push('/partrides'); // Go to list page or any route you prefer
        } catch (err: any) {
            console.error(err)
            setApiError(err.response?.data?.errors?.[0] || err.message);
        }
    };

    const prefillDriversDataInTheForm = (initialDataObject: CreatePartRideInput, companyId?: string, driverId?: string): CreatePartRideInput => {
        initialDataObject.companyId = companyId;
        initialDataObject.driverId = driverId;
        return initialDataObject;
    }

    // If any data for the filters is still loading
    if (authLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress/>
            </Box>
        );
    }

    return (
        <Box maxWidth="700px" mx="auto" p={4}>
            <Typography variant="h4" gutterBottom>
                Create Part Ride
            </Typography>

            {apiError && (
                <Alert severity="error" sx={{mb: 2}}>
                    {apiError}
                </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Date */}
                <FormLabel>Date (Example: 2024-03-06)</FormLabel>
                <Box width="100%" mb={2}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Controller
                            name="date"
                            control={control}
                            render={({ field }) => (
                                <DatePicker
                                    {...field}
                                    // Convert the stored UTC date to Amsterdam time for display
                                    value={field.value ? dayjs.utc(field.value).tz(AMSTERDAM_TZ) : null}
                                    onChange={(newDate) => {
                                        if (newDate) {
                                            // Convert user-selected date to UTC midnight (00:00:00Z)
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

                {/* Start */}
                <FormLabel>Start Time (Example: 20:00:00)</FormLabel>
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

                {/* End */}
                <FormLabel>End Time (Example: 05:00:00)</FormLabel>
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
                {/* HOURS CODE FIELD */}
                <FormLabel>Hours Code</FormLabel>
                <Controller
                    name="hoursCodeId"
                    control={control}
                    render={({ field }) => (
                        <Autocomplete
                            options={hoursCodesData || []}
                            loading={isLoadingHoursCodes}
                            getOptionLabel={(option) => option.name}
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

                {/* kilometers */}
                {!isDriverRole && (
                    <>
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
                                    error={!!errors.kilometers}
                                    helperText={errors.kilometers?.message}
                                />
                            )}
                        />
                    </>
                )}

                {/* costs */}
                {!isDriverRole && (
                    <>
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
                                    error={!!errors.costs}
                                    helperText={errors.costs?.message}
                                />
                            )}
                        />
                    </>
                )}

                {/* employer */}
                {!isDriverRole && (
                    <>
                        <FormLabel>Employer</FormLabel>
                        <Controller
                            name="employer"
                            control={control}
                            render={({field}) => (
                                <TextField
                                    {...field}
                                    variant="outlined"
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.employer}
                                    helperText={errors.employer?.message}
                                />
                            )}
                        />
                    </>
                )}

                {/* weekNumber */}
                {!isDriverRole && (
                    <>
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
                    </>
                )}

                {/* costsDescription */}
                {!isDriverRole && (
                    <>
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
                                    error={!!errors.costsDescription}
                                    helperText={errors.costsDescription?.message}
                                />
                            )}
                        />
                    </>
                )}

                {/* turnover */}
                {!isDriverRole && (
                    <>
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
                                    error={!!errors.turnover}
                                    helperText={errors.turnover?.message}
                                />
                            )}
                        />
                    </>
                )}

                {/* remark */}
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
                            error={!!errors.remark}
                            helperText={errors.remark?.message}
                        />
                    )}
                />

                {/* If user is a driver => prefill or hide. Otherwise show. */}
                {!isDriverRole && (
                    <>
                        {/* companyId as MUI Autocomplete */}
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
                                        const newCompanyId = newValue?.id || '';
                                        field.onChange(newCompanyId); // Update form state
                                        setSelectedCompanyId(newCompanyId); // Update local state for fetching cars
                                    }}                                    value={companiesData?.data.find((co) => co.id === field.value) || null}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            variant="outlined"
                                            margin="normal"
                                            error={!!errors.companyId}
                                            helperText={errors.companyId?.message}
                                        />
                                    )}
                                />
                            )}
                        />

                        {/* clientId as MUI Autocomplete */}
                        <FormLabel>Client</FormLabel>
                        <Controller
                            name="clientId"
                            control={control}
                            render={({field}) => (
                                <Autocomplete
                                    options={clientsData?.data || []}
                                    loading={isLoadingClients}
                                    getOptionLabel={(option) => option.name}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    onChange={(_, newValue) => {
                                        const newClientId = newValue?.id || '';
                                        field.onChange(newClientId); // Update form state
                                        setSelectedClientId(newClientId); // Update local state for fetching related data
                                    }}                                    value={clientsData?.data.find((cl) => cl.id === field.value) || null}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            variant="outlined"
                                            margin="normal"
                                            error={!!errors.clientId}
                                            helperText={errors.clientId?.message}
                                        />
                                    )}
                                />
                            )}
                        />

                        {/* driverId as MUI Autocomplete */}
                        <FormLabel>Driver</FormLabel>
                        <Controller
                            name="driverId"
                            control={control}
                            render={({field}) => (
                                <Autocomplete
                                    options={driversData || []}
                                    loading={isLoadingDrivers}
                                    getOptionLabel={(option) => `${option.user.firstName} ${option.user.lastName}`}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                                    value={driversData?.find((dr) => dr.id === field.value) || null}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            variant="outlined"
                                            margin="normal"
                                            error={!!errors.driverId}
                                            helperText={errors.driverId?.message}
                                        />
                                    )}
                                />
                            )}
                        />

                        {/* carId as MUI Autocomplete */}
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
                                    value={carsData?.cars.find((ca) => ca.id === field.value) || null}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            variant="outlined"
                                            margin="normal"
                                            error={!!errors.carId}
                                            helperText={errors.carId?.message}
                                        />
                                    )}
                                />
                            )}
                        />

                        {/* rideId as MUI Autocomplete */}
                        <FormLabel>Ride</FormLabel>
                        <Controller
                            name="rideId"
                            control={control}
                            render={({field}) => (
                                <Autocomplete
                                    options={ridesData?.data || []}
                                    loading={isLoadingRides}
                                    getOptionLabel={(option) => option.name}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                                    value={ridesData?.data.find((ri) => ri.id === field.value) || null}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            variant="outlined"
                                            margin="normal"
                                            error={!!errors.rideId}
                                            helperText={errors.rideId?.message}
                                        />
                                    )}
                                />
                            )}
                        />

                        {/* unitId as MUI Autocomplete */}
                        <FormLabel>Unit</FormLabel>
                        <Controller
                            name="unitId"
                            control={control}
                            render={({field}) => (
                                <Autocomplete
                                    options={unitsData?.units || []}
                                    getOptionLabel={(option) => option.value}
                                    loading={isLoadingUnits}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                                    value={unitsData?.units.find((un) => un.id === field.value) || null}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            variant="outlined"
                                            margin="normal"
                                            error={!!errors.unitId}
                                            helperText={errors.unitId?.message}
                                        />
                                    )}
                                />
                            )}
                        />

                        {/* rateId as MUI Autocomplete */}
                        <FormLabel>Rate</FormLabel>
                        <Controller
                            name="rateId"
                            control={control}
                            render={({field}) => (
                                <Autocomplete
                                    options={ratesData?.rates || []}
                                    loading={isLoadingRates}
                                    getOptionLabel={(option) => option.name}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                                    value={ratesData?.rates.find((ra) => ra.id === field.value) || null}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            variant="outlined"
                                            margin="normal"
                                            error={!!errors.rateId}
                                            helperText={errors.rateId?.message}
                                        />
                                    )}
                                />
                            )}
                        />

                        {/* surchargeId as MUI Autocomplete */}
                        <FormLabel>Surcharge</FormLabel>
                        <Controller
                            name="surchargeId"
                            control={control}
                            render={({field}) => (
                                <Autocomplete
                                    options={surchargesData?.data || []}
                                    loading={isLoadingSurcharges}
                                    getOptionLabel={(option) => `${option.value || ''}`}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                                    value={surchargesData?.data.find((su) => su.id === field.value) || null}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            variant="outlined"
                                            margin="normal"
                                            error={!!errors.surchargeId}
                                            helperText={errors.surchargeId?.message}
                                        />
                                    )}
                                />
                            )}
                        />

                        {/* charterId as MUI Autocomplete */}
                        <FormLabel>Charter</FormLabel>
                        <Controller
                            name="charterId"
                            control={control}
                            render={({field}) => (
                                <Autocomplete
                                    options={chartersData?.data || []}
                                    loading={isLoadingCharters}
                                    getOptionLabel={(option) => option.name}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                                    value={chartersData?.data.find((ch) => ch.id === field.value) || null}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            variant="outlined"
                                            margin="normal"
                                            error={!!errors.charterId}
                                            helperText={errors.charterId?.message}
                                        />
                                    )}
                                />
                            )}
                        />
                    </>
                )}

                <Box mt={3}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={isPending}
                    >
                        {isPending ? <CircularProgress size={20} color="inherit"/> : 'Create Part Ride'}
                    </Button>
                </Box>
            </form>
        </Box>
    );
}
