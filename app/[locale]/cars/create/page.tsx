'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCompanies } from '@/hooks/useCompanies';
import { useCreateCar } from '@/hooks/useCreateCar';
import FileUploadBox from '@/components/FileUploadBox';

type FormInputs = {
    companyId: string;          // Required
    licensePlate: string;       // Required
    vehicleYear?: string;       // Optional
    registrationDate?: string;  // Optional
    leasingStartDate?: string;  // Optional
    leasingEndDate?: string;    // Optional
    usedByCompanyIds?: string[]; // Optional - companies that can use this car
    remark?: string;            // Optional
    newUploads?: {              // Optional - file uploads
        fileId: string;
        originalFileName: string;
    }[];
};

export default function CreateVehiclePage() {
    const t = useTranslations();
    
    const schema = yup.object().shape({
        companyId: yup.string().required(t('cars.create.fields.company.required')),
        licensePlate: yup.string().required(t('cars.create.fields.licensePlate.required')),
        vehicleYear: yup.string().optional(),
        registrationDate: yup.string().optional(),
        leasingStartDate: yup.string().optional(),
        leasingEndDate: yup.string().optional(),
        usedByCompanyIds: yup.array().of(yup.string().required()).optional(),
        remark: yup.string().optional(),
    });
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { data: companiesData, isLoading: isCompaniesLoading } = useCompanies(1, 100);
    const { mutateAsync, isPending, isError, error } = useCreateCar();

    // File upload state
    const [tempFiles, setTempFiles] = useState<{ fileId: string; originalFileName: string }[]>([]);

    // Handle file upload changes with useCallback to prevent re-renders
    const handleFilesChange = useCallback((files: { fileId: string; originalFileName: string }[]) => {
        setTempFiles(files);
    }, []);

    const {
        handleSubmit,
        control,
        reset,
        setValue,
        formState: { errors },
    } = useForm<FormInputs>({
        resolver: yupResolver(schema),
        defaultValues: {
            companyId: '',
            licensePlate: '',
            vehicleYear: '',
            registrationDate: '',
            leasingStartDate: '',
            leasingEndDate: '',
            usedByCompanyIds: [],
            remark: '',
        },
    });

    // Check access permissions
    const allowedRoles = ['globalAdmin', 'customerAdmin'];
    const hasAccess = user?.roles.some(r => allowedRoles.includes(r));

    // Extract companyId from search params (if provided)
    const companyIdFromUrl = searchParams.get('companyId');

    // Pre-fill company if provided in the URL
    useEffect(() => {
        if (companyIdFromUrl && companiesData?.data) {
            const matchedCompany = companiesData.data.find((c) => c.id === companyIdFromUrl);
            if (matchedCompany) {
                setValue('companyId', matchedCompany.id);
            }
        }
    }, [companyIdFromUrl, companiesData, setValue]);

    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        try {
            // Clean data by removing empty strings and null values
            const cleanedData = Object.fromEntries(
                Object.entries(data).filter(([key, value]) => 
                    value !== undefined && value !== null && value !== ''
                )
            ) as FormInputs;
            
            // Add uploaded files to the request
            cleanedData.newUploads = tempFiles;
            
            // Add usedByCompanyIds to the request (can be empty array)
            cleanedData.usedByCompanyIds = data.usedByCompanyIds || [];
            
            await mutateAsync(cleanedData);
            reset();
            setTempFiles([]); // Clear uploaded files
            router.push('/cars');
        } catch {
            /* Error handled by isError & error */
        }
    };

    if (authLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated || !hasAccess) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{t('cars.create.errors.noPermission')}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="800px" p={4}>
            {/* Header Block */}
            <Box mb={4}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                    {t('cars.create.title')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {t('cars.create.subtitle')}
                </Typography>
            </Box>

            {/* Form Block */}
            <Box>
                {isError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error?.message || t('cars.create.errors.createFailed')}
                    </Alert>
                )}

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* General Information Block */}
                <Box mb={4}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {t('cars.create.sections.general')}
                    </Typography>
                    <Grid container columnSpacing={2} rowSpacing={0}>
                        {/* License Plate */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="licensePlate"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label={t('cars.create.fields.licensePlate.label')}
                                        fullWidth
                                        margin="normal"
                                        variant="outlined"
                                        error={!!errors.licensePlate}
                                        helperText={errors.licensePlate?.message}
                                        required
                                    />
                                )}
                            />
                        </Grid>
                        {/* Company Selection (Owner) */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="companyId"
                                control={control}
                                render={({ field }) => (
                                    <Autocomplete
                                        options={companiesData?.data || []}
                                        getOptionLabel={(option) => option.name}
                                        onChange={(_, value) => field.onChange(value?.id || '')}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label={t('cars.create.fields.company.label')}
                                                variant="outlined"
                                                margin="normal"
                                                fullWidth
                                                error={!!errors.companyId}
                                                helperText={errors.companyId?.message}
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
                                name="usedByCompanyIds"
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
                                                label={t('cars.create.fields.usedByCompanies.label')}
                                                variant="outlined"
                                                margin="normal"
                                                fullWidth
                                                error={!!errors.usedByCompanyIds}
                                                helperText={errors.usedByCompanyIds?.message || t('cars.create.fields.usedByCompanies.helperText')}
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
                        {/* Vehicle Year */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="vehicleYear"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label={t('cars.create.fields.vehicleYear.label')}
                                        placeholder={t('cars.create.fields.vehicleYear.placeholder')}
                                        fullWidth
                                        margin="normal"
                                        variant="outlined"
                                        error={!!errors.vehicleYear}
                                        helperText={errors.vehicleYear?.message}
                                    />
                                )}
                            />
                        </Grid>
                        {/* Registration Date */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="registrationDate"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label={t('cars.create.fields.registrationDate.label')}
                                        type="date"
                                        placeholder={t('cars.create.fields.registrationDate.placeholder')}
                                        fullWidth
                                        margin="normal"
                                        variant="outlined"
                                        error={!!errors.registrationDate}
                                        helperText={errors.registrationDate?.message}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                    />
                                )}
                            />
                        </Grid>
                        {/* Leasing Start Date */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="leasingStartDate"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label={t('cars.create.fields.leasingStartDate.label')}
                                        type="date"
                                        placeholder={t('cars.create.fields.leasingStartDate.placeholder')}
                                        fullWidth
                                        margin="normal"
                                        variant="outlined"
                                        error={!!errors.leasingStartDate}
                                        helperText={errors.leasingStartDate?.message}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                    />
                                )}
                            />
                        </Grid>
                        {/* Leasing End Date */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="leasingEndDate"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label={t('cars.create.fields.leasingEndDate.label')}
                                        type="date"
                                        placeholder={t('cars.create.fields.leasingEndDate.placeholder')}
                                        fullWidth
                                        margin="normal"
                                        variant="outlined"
                                        error={!!errors.leasingEndDate}
                                        helperText={errors.leasingEndDate?.message}
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* Remark Block */}
                <Box mb={4}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {t('cars.create.sections.remark')}
                    </Typography>
                    <Controller
                        name="remark"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label={t('cars.create.fields.remark.label')}
                                fullWidth
                                margin="normal"
                                variant="outlined"
                                multiline
                                rows={4}
                                placeholder={t('cars.create.fields.remark.placeholder')}
                                error={!!errors.remark}
                                helperText={errors.remark?.message}
                            />
                        )}
                    />
                </Box>

                {/* Vehicle Documents Block */}
                <Box mb={4}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {t('cars.create.sections.documents')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {t('cars.create.documents.description')}
                    </Typography>
                    <FileUploadBox 
                        uploadUrl="/temporary-uploads" 
                        onFilesChange={handleFilesChange}
                        accept="image/png,image/jpeg,image/jpg,image/heic,application/pdf"
                        maxSizeMB={10}
                    />
                </Box>

                <Box mt={3}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={isPending}
                        startIcon={isPending ? <CircularProgress size={20} /> : null}
                    >
                        {isPending ? t('cars.create.buttons.submitting') : t('cars.create.buttons.submit')}
                    </Button>
                </Box>
            </form>
            </Box>
        </Box>
    );
}
