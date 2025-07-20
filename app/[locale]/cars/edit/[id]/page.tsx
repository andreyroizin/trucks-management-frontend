'use client';

import React, { useEffect } from 'react';
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
import { useParams, useRouter } from 'next/navigation';
import { Controller, useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '@/hooks/useAuth';
import { useCarDetail } from '@/hooks/useCarDetail';
import { useCompanies } from '@/hooks/useCompanies';
import { useEditCar } from '@/hooks/useEditCar';

const schema = yup.object().shape({
    id: yup.string().required(),
    companyId: yup.string().required('Company is required'),
    licensePlate: yup.string().required('License plate is required'),
    vehicleYear: yup.string().optional(),
    registrationDate: yup.string().optional(),
    remark: yup.string().optional(),
});

type FormInputs = {
    id: string;
    companyId: string;
    licensePlate: string;
    vehicleYear?: string;
    registrationDate?: string;
    remark?: string;
};

export default function EditVehiclePage() {
    const { id } = useParams();
    const router = useRouter();
    const carId = id as string;

    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const {
        data: carData,
        isLoading: isCarLoading,
        isError: isCarError,
        error: carError,
    } = useCarDetail(carId);

    const { data: companiesData, isLoading: isCompaniesLoading } = useCompanies(1, 100);
    const { mutateAsync, isPending, isError, error } = useEditCar();

    // Set up form
    const {
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<FormInputs>({
        resolver: yupResolver(schema),
        defaultValues: {
            id: carId,
            companyId: '',
            licensePlate: '',
            vehicleYear: '',
            registrationDate: '',
            remark: '',
        },
    });

    // Access control
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin'];
        const hasAccess = user?.roles.some(r => allowedRoles.includes(r));
        if (!authLoading && (!isAuthenticated || !hasAccess)) router.push('/auth/login');
    }, [authLoading, isAuthenticated, router, user?.roles]);

    // Prefill data once fetched
    useEffect(() => {
        if (carData) {
            reset({
                id: carData.id,
                companyId: carData.company?.id || '',
                licensePlate: carData.licensePlate,
                vehicleYear: carData.vehicleYear || '',
                registrationDate: carData.registrationDate || '',
                remark: carData.remark || '',
            });
        }
    }, [carData, reset]);

    // Submit handler
    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        try {
            // Clean data by removing empty strings and null values, but keep required fields
            const cleanedData = {
                id: data.id,
                companyId: data.companyId,
                licensePlate: data.licensePlate,
                // Only include optional fields if they have values
                ...(data.vehicleYear && data.vehicleYear !== '' && { vehicleYear: data.vehicleYear }),
                ...(data.registrationDate && data.registrationDate !== '' && { registrationDate: data.registrationDate }),
                ...(data.remark && data.remark !== '' && { remark: data.remark }),
            } as FormInputs;
            
            await mutateAsync(cleanedData);
            router.push(`/cars/${carId}`);
        } catch {
            // Error handled by isError / error
        }
    };

    // Loading states
    if (authLoading || isCarLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }
    if (isCarError) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{carError?.message || 'Failed to load vehicle.'}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="800px" p={4}>
            {/* Header Block */}
            <Box mb={4}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                    Edit Vehicle Information
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Update the vehicle information below. Please ensure all fields are filled out accurately.
                </Typography>
            </Box>

            {/* Form Block */}
            <Box>
                {isError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error?.message || 'Failed to edit vehicle.'}
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
                    <Box 
                        sx={{ 
                            p: 3, 
                            border: '1px dashed', 
                            borderColor: 'divider', 
                            borderRadius: 1, 
                            textAlign: 'center',
                            color: 'text.secondary'
                        }}
                    >
                        <Typography variant="body2">
                            Document upload functionality will be available soon.
                        </Typography>
                    </Box>
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
                        {isPending ? 'Updating...' : 'Update Vehicle'}
                    </Button>
                </Box>
            </form>
            </Box>
        </Box>
    );
}
