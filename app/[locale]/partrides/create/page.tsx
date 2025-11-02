'use client';

import {useTranslations} from 'next-intl';

import React, {useEffect, useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Alert, Box, Button, CircularProgress, Divider, TextField, Typography,} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import {Controller, SubmitHandler, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
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
import {useHoursCodes} from "@/hooks/useHoursCodes";
import {useHoursOptions} from "@/hooks/useHoursOptions";
import FileUploadBox from '@/components/FileUploadBox';
import DateInputField from "@/components/DateInputField";
import {getIso8601WeekOfYear} from "@/utils/Iso8601WeekOfYear";

export default function CreatePartRidePage() {
    const t = useTranslations('partrides.create');
    // For validation messages, use translations from partrides.common
    const tValidation = useTranslations('partrides.common');
    const router = useRouter();
    const {user, isAuthenticated, loading: authLoading} = useAuth();
    const isDriverRole = user?.roles.includes('driver');

    // --- VALIDATION SCHEMA ---
    const schema = useMemo(() => {
        return yup.object().shape({
            date: yup.string().required(tValidation('formValidation.date')),
            start: yup.string().required(tValidation('formValidation.start')),
            rest: yup.string().required(tValidation('formValidation.rest')),
            end: yup.string().required(tValidation('formValidation.end')),
            // If driver => hide or not required
            totalKilometers: yup.number().optional(),
            extraKilometers: yup.number().optional(),
            carId: yup.string().optional(),
            driverId: yup.string().when([], {
                is: () => !isDriverRole,
                then: (schema) => schema.required(tValidation('formValidation.driver')),
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
                then: (schema) => schema.required(tValidation('formValidation.hoursCode')),
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
            newUploads: yup.array().optional(),
        });
    }, [isDriverRole, tValidation]);

    // Ensure user is logged in
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router]);

    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [tempFiles, setTempFiles] = useState<{ fileId: string; originalFileName: string }[]>([]);
    // Data hooks for Autocomplete:
    const {data: hoursOptionsData, isLoading: isLoadingHoursOptions} = useHoursOptions();
    const {data: companiesData, isLoading: isLoadingCompanies} = useCompanies(1, 1000);
    const {data: clientsData, isLoading: isLoadingClients} = useClients(1, 1000);
    const {data: driversData, isLoading: isLoadingDrivers} = useDrivers();
    const {data: carsData, isLoading: isLoadingCars} = useCars(selectedCompanyId ? [selectedCompanyId] : [], 1, 1000);
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
            rest: '',
            totalKilometers: 0,
            extraKilometers: 0,
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
            newUploads: [],
        },
    });

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
    const onSubmit: SubmitHandler<CreatePartRideInput> = async (data) => {
        if (isDriverRole) {
            data = prefillDriversDataInTheForm(data, user?.driverInfo?.companyId, user?.driverInfo?.driverId);
        }

        data.newUploads = tempFiles;

        setApiError(null);
        try {
            const createdPartRide = await createPartRide(data);
            const createdPartRideId = createdPartRide?.data?.id;
            router.push(`/partrides/${createdPartRideId}`); // Go to list page or any route you prefer
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
                {t('submitTitle')}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
                {t('subtitle')}
            </Typography>
            {apiError && (
                <Alert severity="error" sx={{mb: 2}}>
                    {apiError}
                </Alert>
            )}
            <Divider sx={{my: 2}} />

            <Box>
                <Typography variant="h5">{t('form.section.dateTime')}</Typography>
            </Box>

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Date */}
                <Box width="100%">
                    <DateInputField
                        name="date"
                        control={control}
                        label={t('form.date.label')}
                        placeholder={t('form.date.placeholder')}
                        helperText={t('form.date.helperText')}
                        error={!!errors.date}
                        errorMessage={errors.date?.message}
                    />
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
                            label={t('form.startTime.label')}
                            placeholder={t('form.startTime.placeholder')}
                            error={!!errors.start}
                            helperText={errors.start?.message || t('form.startTime.helperText')}
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
                            label={t('form.endTime.label')}
                            placeholder={t('form.endTime.placeholder')}
                            error={!!errors.end}
                            helperText={errors.end?.message || t('form.endTime.helperText')}
                        />
                    )}
                />
                {/* Break Duration */}
                <Controller
                    name="rest"
                    control={control}
                    render={({field}) => (
                        <TextField
                            {...field}
                            variant="outlined"
                            sx={{mt: 2}}
                            fullWidth
                            margin="normal"
                            label={t('form.rest.label')}
                            placeholder={t('form.rest.placeholder')}
                            error={!!errors.rest}
                            helperText={errors.rest?.message || t('form.rest.helperText')}
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
                                            label={t('form.driver.label')}
                                            placeholder={t('form.driver.placeholder')}
                                            error={!!errors.driverId}
                                            helperText={errors.driverId?.message || t('form.driver.helperText')}
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
                                <Typography>{t('form.section.specialHours')}</Typography>
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
                                                    label={t('form.hoursCode.label')}
                                                    placeholder={t('form.hoursCode.placeholder')}
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
                                                    label={t('form.hoursOption.label')}
                                                    placeholder={t('form.hoursOption.placeholder')}
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
                        <Typography component="span">{t('form.section.additionalFields')}</Typography>
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
                                            label={t('form.hoursCorrection.label')}
                                            placeholder={t('form.hoursCorrection.placeholder')}
                                            error={!!errors.hoursCorrection}
                                            helperText={errors.hoursCorrection?.message || t('form.hoursCorrection.helperText')}
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
                                                    label={t('form.company.label')}
                                                    placeholder={t('form.company.placeholder')}
                                                    error={!!errors.companyId}
                                                    helperText={errors.companyId?.message || t('form.company.helperText')}
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
                                                    label={t('form.weekNumber.label')}
                                                    placeholder={t('form.weekNumber.placeholder')}
                                                    error={!!errors.weekNumber}
                                                    helperText={errors.weekNumber?.message || t('form.weekNumber.helperText')}
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
                                            }}
                                            value={clientsData?.data.find((cl) => cl.id === field.value) || null}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    variant="outlined"
                                                    margin="normal"
                                                    sx={{mt: 2}}
                                                    label={t('form.client.label')}
                                                    placeholder={t('form.client.placeholder')}
                                                    error={!!errors.clientId}
                                                    helperText={errors.clientId?.message || t('form.client.helperText')}
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
                                                    label={t('form.car.label')}
                                                    placeholder={t('form.car.placeholder')}
                                                    error={!!errors.carId}
                                                    helperText={errors.carId?.message || t('form.car.helperText')}
                                                />
                                            )}
                                        />
                                    )}
                                />

                                {/* Various Compensation - Admin only */}
                                {!isDriverRole && (
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
                                                label={t('form.variousCompensation.label')}
                                                placeholder={t('form.variousCompensation.placeholder')}
                                                error={!!errors.variousCompensation}
                                                helperText={errors.variousCompensation?.message || t('form.variousCompensation.helperText')}
                                            />
                                        )}
                                    />
                                )}
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
                        <Box>
                            <Typography variant="h6">{t('form.section.distance')}</Typography>
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
                                        label={t('form.totalKilometers.label')}
                                        placeholder={t('form.totalKilometers.placeholder')}
                                        error={!!errors.totalKilometers}
                                        helperText={errors.totalKilometers?.message || t('form.totalKilometers.helperText')}
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
                                        label={t('form.extraKilometers.label')}
                                        placeholder={t('form.extraKilometers.placeholder')}
                                        error={!!errors.extraKilometers}
                                        helperText={errors.extraKilometers?.message || t('form.extraKilometers.helperText')}
                                    />
                                )}
                            />
                        </Box>
                        <Divider sx={{my: 2}} />
                        {/* Expenses */}
                        <Box mb={2}>
                        <Typography variant="h6">{t('form.section.expenses')}</Typography>
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
                                        label={t('form.costs.label')}
                                        placeholder={t('form.costs.placeholder')}
                                        error={!!errors.costs}
                                        helperText={errors.costs?.message || t('form.costs.helperText')}
                                    />
                                )}
                            />
                        </Box>
                        {/* Upload Receipts (modular) */}
                        <Box mb={2}>
                            <Typography variant="h6">{t('form.section.uploadReceipts')}</Typography>
                            <Typography variant="body1" mb={1}>
                                {t('form.uploadReceipts.helperText')}
                            </Typography>
                            <FileUploadBox uploadUrl="/temporary-uploads" onFilesChange={setTempFiles} />
                        </Box>

                        <Divider sx={{my: 2}} />

                        {/* Comments */}
                        <Box mb={0}>
                            <Typography variant="h6">{t('form.section.comments')}</Typography>
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
                                        label={t('form.remark.label')}
                                        placeholder={t('form.remark.placeholder')}
                                        error={!!errors.remark}
                                        helperText={errors.remark?.message || t('form.remark.helperText')}
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
                        {isPending ? <CircularProgress size={20} color="inherit"/> : t('submitButton')}
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
