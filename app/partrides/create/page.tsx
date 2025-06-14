'use client';

import React, {useEffect, useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Alert, Box, Button, CircularProgress, Divider, FormLabel, TextField, Typography,} from '@mui/material';
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
import FileUploadBox from '@/components/FileUploadBox';

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
            newUploadIds: yup.array().optional(),
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
    const [tempFileIds, setTempFileIds] = useState<string[]>([]);

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
            newUploadIds: [],
        },
    });

    // On Submit
    const onSubmit: SubmitHandler<CreatePartRideInput> = async (data) => {
        if (isDriverRole) {
            data = prefillDriversDataInTheForm(data, user?.driverInfo?.companyId, user?.driverInfo?.driverId);
        }

        data.newUploadIds = tempFileIds;

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

    // If any data for the filters is still loading
    if (authLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress/>
            </Box>
        );
    }

    return (
        <Box maxWidth="700px" mx="auto" sx={{ pt: 4, pb: 5}}>
            <Typography variant="h4" gutterBottom>
                Submit Workday
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
                Fill in your work time and trip details — your entry will be saved and reviewed.
            </Typography>
            {apiError && (
                <Alert severity="error" sx={{mb: 2}}>
                    {apiError}
                </Alert>
            )}
            <Divider sx={{my: 2}} />
        
            <Box>
                <Typography variant="h5">Workday Date & Time</Typography>
            </Box>

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Date */}
                <Box width="100%">
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
                                            label: "Date (dd-mm-yy)",
                                            placeholder: "dd-mm-yy",
                                            error: !!errors.date,
                                            helperText: errors.date?.message || 'Select the day you worked',
                                        },
                                    }}
                                />
                            )}
                        />
                    </LocalizationProvider>
                </Box>
                {/* Start Time */}
                <Controller
                    name="start"
                    control={control}
                    render={({field}) => (
                        <TextField
                            {...field}
                            variant="outlined"
                            sx={{mt: 2}}
                            fullWidth
                            margin="normal"
                            label="Start Time (e.g. 07:30)"
                            placeholder="07:30"
                            error={!!errors.start}
                            helperText={errors.start?.message || 'What time did you start work?'}
                        />
                    )}
                />
                {/* End Time */}
                <Controller
                    name="end"
                    control={control}
                    render={({field}) => (
                        <TextField
                            {...field}
                            variant="outlined"
                            fullWidth
                            sx={{mt: 2}}
                            margin="normal"
                            label="End Time (e.g. 17:45)"
                            placeholder="17:45"
                            error={!!errors.end}
                            helperText={errors.end?.message || 'What time did you finish?'}
                        />
                    )}
                />
                {/* Break Duration */}
                <Controller
                    name="hoursOptionId"
                    control={control}
                    render={({field}) => (
                        <TextField
                            {...field}
                            variant="outlined"
                            fullWidth
                            sx={{mt: 2}}
                            margin="normal"
                            label="Break Duration (e.g. 01:00)"
                            placeholder="01:00"
                            error={!!errors.hoursOptionId}
                            helperText={errors.hoursOptionId?.message || 'Enter total break time (automatically checked by system).'}
                        />
                    )}
                />
                {!isDriverRole && (
                    <>
                        {/* Driver (Autocomplete) */}
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
                                        field.onChange(driverId);
                                        setValue('companyId', driverCompanyId);
                                        setSelectedCompanyId(driverCompanyId);
                                    }}
                                    value={driversData?.find((dr) => dr.id === field.value) || null}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            variant="outlined"
                                            margin="normal"
                                            label="Driver"
                                            placeholder="Select driver"
                                            error={!!errors.driverId}
                                            helperText={errors.driverId?.message || 'Select the driver for this workday.'}
                                        />
                                    )}
                                />
                            )}
                        />
                    </>
                )}

                <Divider sx={{my: 2}} />

                {!isDriverRole && (
                    <>
                        <Accordion
                            expanded={showSpecialHoursAccordion}
                            onChange={() => setShowSpecialHoursAccordion(!showSpecialHoursAccordion)}
                            sx={{ boxShadow: 'none', border: 'none', borderTop: 'none', background: 'none', '&:before': { display: 'none' } }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon/>}
                                sx={{ p: 0, minHeight: 0 }}
                            >
                                <Typography>Special hours</Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 0 }}>
                                {/* HOURS CODE FIELD */}
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
                <Accordion 
                    expanded={showAdditionalFieldsAccordion}
                    onChange={() => setShowAdditionalFieldsAccordion(!showAdditionalFieldsAccordion)}
                    sx={{ boxShadow: 'none', border: 'none', background: 'none', '&:before': { display: 'none' } }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon/>}
                        aria-controls="panel1-content"
                        id="panel1-header"
                        sx={{ p: 0, minHeight: 0 }}
                    >
                        <Typography component="span">Additional Fields</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
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
                                            margin="normal"
                                            sx={{mt: 2}}
                                            label="Correction time (e.g. 0.5)"
                                            placeholder="0.5"
                                            error={!!errors.hoursCorrection}
                                            helperText={errors.hoursCorrection?.message || 'Enter any correction time in hours.'}
                                        />
                                    )}
                                />
                            </>
                        )}
                        {/* If user is a driver => prefill or hide. Otherwise show. */}
                        {!isDriverRole && (
                            <>
                                {/* companyId as MUI Autocomplete */}
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
                                                field.onChange(newCompanyId);
                                                setSelectedCompanyId(newCompanyId);
                                            }}
                                            value={companiesData?.data.find((co) => co.id === field.value) || null}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    variant="outlined"
                                                    margin="normal"
                                                    sx={{mt: 2}}
                                                    label="Company"
                                                    placeholder="Select company"
                                                    error={!!errors.companyId}
                                                    helperText={errors.companyId?.message || 'Select your company for this workday.'}
                                                />
                                            )}
                                        />
                                    )}
                                />

                                {/* weekNumber */}
                                {!isDriverRole && (
                                    <>
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
                                                    sx={{mt: 2}}
                                                    label="Week Number (e.g. 23)"
                                                    placeholder="23"
                                                    error={!!errors.weekNumber}
                                                    helperText={errors.weekNumber?.message || 'Enter the week number for this workday.'}
                                                />
                                            )}
                                        />
                                    </>
                                )}
                                {/* clientId as MUI Autocomplete */}
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
                                                field.onChange(newClientId);
                                                setSelectedClientId(newClientId);
                                            }}
                                            value={clientsData?.data.find((cl) => cl.id === field.value) || null}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    variant="outlined"
                                                    margin="normal"
                                                    sx={{mt: 2}}
                                                    label="Client"
                                                    placeholder="Select client"
                                                    error={!!errors.clientId}
                                                    helperText={errors.clientId?.message || 'Select the client for this workday.'}
                                                />
                                            )}
                                        />
                                    )}
                                />

                                {/* carId as MUI Autocomplete */}
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
                                                    sx={{mt: 2}}
                                                    label="Car"
                                                    placeholder="Select car"
                                                    error={!!errors.carId}
                                                    helperText={errors.carId?.message || 'Select the car used for this workday.'}
                                                />
                                            )}
                                        />
                                    )}
                                />

                                {/* rideId as MUI Autocomplete */}
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
                                                    sx={{mt: 2}}
                                                    label="Ride"
                                                    placeholder="Select ride"
                                                    error={!!errors.rideId}
                                                    helperText={errors.rideId?.message || 'Select the ride for this workday.'}
                                                />
                                            )}
                                        />
                                    )}
                                />

                                {/* charterId as MUI Autocomplete */}
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
                                                    sx={{mt: 2}}
                                                    label="Charter"
                                                    placeholder="Select charter"
                                                    error={!!errors.charterId}
                                                    helperText={errors.charterId?.message || 'Select the charter for this workday.'}
                                                />
                                            )}
                                        />
                                    )}
                                />
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
                                {/*/!* turnover *!/*/}
                                {/*{!isDriverRole && (*/}
                                {/*    <>*/}
                                {/*        <Controller*/}
                                {/*            name="turnover"*/}
                                {/*            control={control}*/}
                                {/*            render={({field}) => (*/}
                                {/*                <TextField*/}
                                {/*                    {...field}*/}
                                {/*                    type="number"*/}
                                {/*                    variant="outlined"*/}
                                {/*                    fullWidth*/}
                                {/*                    margin="normal"*/}
                                {/*                    sx={{mt: 2}}*/}
                                {/*                    label="Turnover (e.g. 100)"*/}
                                {/*                    placeholder="100"*/}
                                {/*                    error={!!errors.turnover}*/}
                                {/*                    helperText={errors.turnover?.message || 'Enter the turnover for this workday.'}*/}
                                {/*                />*/}
                                {/*            )}*/}
                                {/*        />*/}
                                {/*    </>*/}
                                {/*)}*/}
                            </>
                        )}
                        {/* Distance */}
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
                        {/* Upload Receipts (modular) */}
                        <Box mb={2}>
                            <Typography variant="h6">Upload Receipts</Typography>
                            <Typography variant="body1" mb={1}>
                                Add any files related to today's trip (fuel, toll, hotel, etc.)
                            </Typography>
                            <FileUploadBox uploadUrl="/temporary-uploads" onIdsChange={setTempFileIds} />                        </Box>
            
                        <Divider sx={{my: 2}} />

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
                <Box mt={1}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={isPending}
                    >
                        {isPending ? <CircularProgress size={20} color="inherit"/> : 'Submit Workday'}
                    </Button>
                    {apiError && (
                        <Alert severity="error" sx={{mt: 2}}>
                            {apiError}
                        </Alert>
                    )}
                </Box>
            </form>
        </Box>
    )
        ;
}
