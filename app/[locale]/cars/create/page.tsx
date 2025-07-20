'use client';

import React, { useEffect, useState, useCallback } from 'react';
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

const schema = yup.object().shape({
    companyId: yup.string().required('Company is required'),
    licensePlate: yup.string().required('License plate is required'),
    vehicleYear: yup.string().optional(),
    registrationDate: yup.string().optional(),
    remark: yup.string().optional(),
});

type FormInputs = {
    companyId: string;          // Required
    licensePlate: string;       // Required
    vehicleYear?: string;       // Optional
    registrationDate?: string;  // Optional
    remark?: string;            // Optional
    newUploads?: {              // Optional - file uploads
        fileId: string;
        originalFileName: string;
    }[];
};

export default function CreateVehiclePage() {
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
            remark: '',
        },
    });

    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin'];
        const hasAccess = user?.roles.some(r => allowedRoles.includes(r));
        if (!authLoading && (!isAuthenticated || !hasAccess)) router.push('/auth/login');
    }, [authLoading, isAuthenticated, router, user?.roles]);

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

    return (
        <Box maxWidth="800px" p={4}>
            {/* Header Block */}
            <Box mb={4}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                    New Vehicle Creation Form
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Use this form to create a new vehicle in vehicle list. Please ensure all fields are filled out accurately.
                </Typography>
            </Box>

            {/* Form Block */}
            <Box>
                {isError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error?.message || 'Failed to create vehicle.'}
                    </Alert>
                )}

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* General Information Block */}
                <Box mb={4}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        General Information
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
                                        label="License Plate"
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
                        {/* Company Selection */}
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
                                                label="Company"
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
                        {/* Vehicle Year */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="vehicleYear"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Vehicle Year"
                                        placeholder="When the vehicle was purchased?"
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
                                        label="Registration Date"
                                        type="date"
                                        placeholder="When the vehicle was registered?"
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
                    </Grid>
                </Box>

                {/* Remark Block */}
                <Box mb={4}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        Remark
                    </Typography>
                    <Controller
                        name="remark"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Remark"
                                fullWidth
                                margin="normal"
                                variant="outlined"
                                multiline
                                rows={4}
                                placeholder="Enter any additional remarks or comments about the vehicle..."
                                error={!!errors.remark}
                                helperText={errors.remark?.message}
                            />
                        )}
                    />
                </Box>

                {/* Vehicle Documents Block */}
                <Box mb={4}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        Vehicle Documents
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Upload vehicle-related documents such as registration, insurance, inspection certificates, etc. 
                        Supported formats: PDF, JPG, PNG (max 10MB per file).
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
                        {isPending ? 'Creating...' : 'Create Vehicle'}
                    </Button>
                </Box>
            </form>
            </Box>
        </Box>
    );
}
