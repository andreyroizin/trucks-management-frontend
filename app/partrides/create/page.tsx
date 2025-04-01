'use client';

import React, {useEffect, useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Alert, Box, Button, CircularProgress, FormLabel, TextField, Typography,} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import {Controller, SubmitHandler, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {CreatePartRideInput, useCreatePartRide} from '@/hooks/useCreatePartRide';
import {useAuth} from '@/hooks/useAuth';
import {useCompanies} from '@/hooks/useCompanies';
import {useClients} from '@/hooks/useClients';
import {useDrivers} from '@/hooks/useDrivers';
import {useCars} from '@/hooks/useCars';
import {useRides} from '@/hooks/useRides';
import {useCharters} from '@/hooks/useCharters';
import {useHoursCodes} from "@/hooks/useHoursCodes";
import {useHoursOptions} from "@/hooks/useHoursOptions";

export default function CreatePartRidePage() {
    dayjs.extend(utc);
    dayjs.extend(timezone);

    const AMSTERDAM_TZ = "Europe/Amsterdam";
    const router = useRouter();
    const {user, isAuthenticated, loading: authLoading} = useAuth();
    const isDriverRole = user?.roles.includes('driver');

    // --- VALIDATION SCHEMA ---
    const schema = useMemo(() => {
        return yup.object().shape({
            date: yup.string().required('Date is required (e.g. "24-06-2025")'),
            start: yup.string().required('Start time is required (e.g. "20:00")'),
            end: yup.string().required('End time is required (e.g. "05:00")'),
            // If driver => hide or not required
            rideId: yup.string().optional(),
            kilometers: yup.number().optional(),
            carId: yup.string().optional(),
            driverId: yup.string().when([], {
                is: () => !isDriverRole,
                then: (schema) => schema.required("Driver is required"),
                otherwise: (schema) => schema.optional(),
            }),
            costs: yup.number().optional(),
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
            clientId: yup.string().optional(),
            weekNumber: yup.number().optional(),
            hoursCorrection: yup.number().optional(),
            variousCompensation: yup.number().optional(),
            costsDescription: yup.string().optional(),
            turnover: yup.number().optional(),
            remark: yup.string().optional(),
            companyId: yup.string().optional(),
            charterId: yup.string().optional(),
        });
    }, [isDriverRole]);

    // Ensure user is logged in
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router]);

    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

    // Data hooks for Autocomplete:
    const {data: hoursOptionsData, isLoading: isLoadingHoursOptions} = useHoursOptions();
    const {data: companiesData, isLoading: isLoadingCompanies} = useCompanies(/* e.g. pass companyId if needed */);
    const {data: clientsData, isLoading: isLoadingClients} = useClients(1, 1000);
    const {data: driversData, isLoading: isLoadingDrivers} = useDrivers();
    const {data: carsData, isLoading: isLoadingCars} = useCars(selectedCompanyId || '', 1, 1000);
    const {data: ridesData, isLoading: isLoadingRides} = useRides(1, 1000);
    const {
        data: chartersData,
        isLoading: isLoadingCharters
    } = useCharters(selectedCompanyId || '', selectedClientId || '', 1, 1000);
    const {data: hoursCodesData, isLoading: isLoadingHoursCodes} = useHoursCodes();

    // Create Hook
    const {mutateAsync: createPartRide, isPending} = useCreatePartRide();

    // Local error
    const [apiError, setApiError] = useState<string | null>(null);
    const [showSpecialHoursAccordion, setShowSpecialHoursAccordion] = useState(false);
    const [showAdditionalFieldsAccordion, setShowAdditionalFieldsAccordion] = useState(false);

    // React Hook Form
    const {
        handleSubmit,
        control,
        watch,
        setValue,
        formState: {errors},
    } = useForm<CreatePartRideInput>({
        resolver: yupResolver(schema),
        defaultValues: {
            date: '',
            start: '',
            end: '',
            kilometers: 0,
            costs: 0,
            driverId: '',
            hoursCodeId: '',
            hoursOptionId: '',
            weekNumber: 0,
            hoursCorrection: 0,
            variousCompensation: 0,
            costsDescription: '',
            turnover: 0,
            remark: '',
            // If user is driver => prefill companyId
            companyId: isDriverRole ? (user?.driverInfo?.companyId || '') : '',
        },
    });

    // On Submit
    const onSubmit: SubmitHandler<CreatePartRideInput> = async (data) => {
        if (isDriverRole) {
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
        initialDataObject.driverId = driverId ?? '';
        return initialDataObject;
    }

    useEffect(() => {
        const subscription = watch((value) => {
            const shouldExpand =
                value.start === '00:00:00' ||
                value.start === '00:00' ||
                value.end === '24:00:00' ||
                value.end === '24:00' ||
                value.end === '1.00:00:00' ||
                value.end === '1.00:00:';

            setShowSpecialHoursAccordion(shouldExpand);
        });

        return () => subscription.unsubscribe();
    }, [watch]);

    useEffect(() => {
        if (!authLoading && user?.roles.includes('driver')) {
            setShowAdditionalFieldsAccordion(true);
        }
    }, [authLoading, user]);

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
                <FormLabel>Date (Example: 24-12-2025)</FormLabel>
                <Box width="100%" mb={2}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Controller
                            name="date"
                            control={control}
                            render={({field}) => (
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
                <FormLabel>Start Time (Example: 09:00)</FormLabel>
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
                <FormLabel>End Time (Example: 21:00)</FormLabel>
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
                                    onChange={(_, newValue) => {
                                        const driverId = newValue?.id || '';
                                        const driverCompanyId = newValue?.companyId || '';

                                        field.onChange(driverId);         // set driverId
                                        setValue('companyId', driverCompanyId); // set companyId
                                        setSelectedCompanyId(driverCompanyId);  // also update cars/charters
                                    }}                                    value={driversData?.find((dr) => dr.id === field.value) || null}
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
                    </>
                )}

                {!isDriverRole && (
                    <>
                        <Accordion expanded={showSpecialHoursAccordion}
                                   onChange={() => setShowSpecialHoursAccordion(!showSpecialHoursAccordion)}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                                <Typography>Special hours</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                {/* HOURS CODE FIELD */}
                                <FormLabel>Hours Code</FormLabel>
                                <Controller
                                    name="hoursCodeId"
                                    control={control}
                                    render={({field}) => (
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
                                {/* Hours Option */}
                                <FormLabel>Hours Option</FormLabel>
                                <Controller
                                    name="hoursOptionId"
                                    control={control}
                                    render={({field}) => (
                                        <Autocomplete
                                            options={hoursOptionsData || []}
                                            loading={isLoadingHoursOptions}
                                            getOptionLabel={(option) => option.name}
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
                                            }} value={companiesData?.data.find((co) => co.id === field.value) || null}
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
                                            }} value={clientsData?.data.find((cl) => cl.id === field.value) || null}
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
                            </>
                        )}
                        {/* kilometers */}
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
                                    error={!!errors.kilometers}
                                    helperText={errors.kilometers?.message}
                                />
                            )}
                        />

                        {/* costs */}
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
                                    error={!!errors.costsDescription}
                                    helperText={errors.costsDescription?.message}
                                />
                            )}
                        />
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
                    </AccordionDetails>
                </Accordion>


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
    )
        ;
}
