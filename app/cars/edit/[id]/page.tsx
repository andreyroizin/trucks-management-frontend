'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    Box,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Typography,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { useEditCar } from '@/hooks/useEditCar';
import { useCompanies } from '@/hooks/useCompanies';
import { useAuth } from '@/hooks/useAuth';
import {useCarDetail} from "@/hooks/useCarDetail";

type EditCarFormInputs = {
    licensePlate: string;
    remark?: string;
    companyId: string;
};

// Validation Schema
const editCarSchema = yup.object().shape({
    licensePlate: yup.string().required('License plate is required'),
    companyId: yup.string().required('Company is required'),
});

export default function EditCarPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const isCustomerAdmin = user?.roles.includes('customerAdmin');
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    // Fetch Car & Companies
    const { data: car, isLoading: isLoadingCar, isError: isErrorCar } = useCarDetail(id as string);
    const { data: companiesData, isLoading: isLoadingCompanies } = useCompanies();

    // Hook to edit car
    const { mutateAsync: editCar, isPending } = useEditCar();

    // Form setup
    const {
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = useForm<EditCarFormInputs>({
        resolver: yupResolver(editCarSchema),
        defaultValues: {
            licensePlate: '',
            remark: '',
            companyId: '',
        },
    });

    // Prefill form when data loads
    useEffect(() => {
        if (car) {
            setValue('licensePlate', car.licensePlate);
            setValue('remark', car.remark || '');
            setValue('companyId', car.company.id);
        }
    }, [car, setValue]);

    // Authorization Check
    useEffect(() => {
        if (!authLoading && (!isAuthenticated || !(isCustomerAdmin || isGlobalAdmin))) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, isCustomerAdmin, isGlobalAdmin, router, user?.roles]);

    // Submit Handler
    const onSubmit: SubmitHandler<EditCarFormInputs> = async (data) => {
        try {
            await editCar({ id: id as string, ...data });
            router.push(`/cars/${car?.id}`);
        } catch (error: any) {
            console.error('Failed to update car', error.message);
        }
    };

    if (isLoadingCar || isLoadingCompanies) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isErrorCar) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">Failed to load car details.</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="600px" mx="auto" p={4}>
            <Typography variant="h4" gutterBottom>
                Edit Car
            </Typography>

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* License Plate Input */}
                <Controller
                    name="licensePlate"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="License Plate"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            error={!!errors.licensePlate}
                            helperText={errors.licensePlate?.message}
                            required
                        />
                    )}
                />

                {/* Remark Input */}
                <Controller
                    name="remark"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Remark"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            error={!!errors.remark}
                            helperText={errors.remark?.message}
                        />
                    )}
                />

                {/* Company Selection */}
                <Controller
                    name="companyId"
                    control={control}
                    render={({ field }) => (
                        <Autocomplete
                            options={companiesData?.data || []}
                            getOptionLabel={(option) => option.name}
                            value={companiesData?.data.find((company) => company.id === field.value) || null}
                            onChange={(_, value) => setValue('companyId', value?.id || '')}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Select Company"
                                    variant="outlined"
                                    fullWidth
                                    margin="normal"
                                    error={!!errors.companyId}
                                    helperText={errors.companyId?.message}
                                    required
                                />
                            )}
                        />
                    )}
                />

                {/* Submit Button */}
                <Box mt={3}>
                    <Button type="submit" variant="contained" color="primary" fullWidth disabled={isPending}>
                        {isPending ? <CircularProgress size={20} /> : 'Save Changes'}
                    </Button>
                </Box>
            </form>
        </Box>
    );
}
