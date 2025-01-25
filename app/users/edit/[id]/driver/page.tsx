'use client';

import {useParams} from 'next/navigation';
import {Controller, SubmitHandler, useForm} from 'react-hook-form';
import {Alert, Button, CircularProgress, FormControl, TextField, Typography,} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import {yupResolver} from '@hookform/resolvers/yup';
import {useEffect, useState} from 'react';
import {useCompanies} from '@/hooks/useCompanies';
import {useUpdateUserDriver, useUserDetails} from '@/hooks/useUser'; // Import the new hook
import * as yup from 'yup';

// *** Validation Schema ***
const editDriverSchema = yup.object().shape({
    companyId: yup.string().required('Company is required'),
});

// *** Type for Form Inputs ***
type EditDriverFormInputs = {
    companyId: string;
};

export default function EditDriverPage() {
    const params = useParams();
    const userId = params?.id as string;

    // Fetch user details
    const { data: userDetails, isLoading: isLoadingUser, isError: isErrorUser } = useUserDetails(userId);

    // Fetch companies
    const { data: companies, isLoading: isLoadingCompanies, isError: isErrorCompanies } = useCompanies();

    // Initialize the update hook
    const { mutateAsync: mutateUpdateDriver, isPending: isUpdatingDriver } = useUpdateUserDriver();

    // Form setup
    const {
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = useForm<EditDriverFormInputs>({
        resolver: yupResolver(editDriverSchema),
        defaultValues: {
            companyId: '',
        },
    });

    // State for API feedback
    const [apiError, setApiError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Populate form with existing driverInfo
    useEffect(() => {
        if (userDetails?.driverInfo?.companyId) {
            setValue('companyId', userDetails.driverInfo.companyId);
        }
    }, [userDetails, setValue]);

    // Handle form submission
    const onSubmit: SubmitHandler<EditDriverFormInputs> = async (data) => {
        setApiError(null);
        setSuccessMessage(null);

        try {
            await mutateUpdateDriver({ id: userId, ...data });
            setSuccessMessage('Driver data updated successfully!');
        } catch (error: any) {
            setApiError(error.message || 'An unexpected error occurred');
        }
    };

    // Handle loading and error states
    if (isLoadingUser || isLoadingCompanies) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <CircularProgress />
            </div>
        );
    }

    if (isErrorUser || isErrorCompanies) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Alert severity="error">Failed to load data. Please try again later.</Alert>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
            <Typography variant="h4" gutterBottom>
                Edit Driver Data
            </Typography>

            {apiError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {apiError}
                </Alert>
            )}

            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {successMessage}
                </Alert>
            )}

            <form
                onSubmit={handleSubmit(onSubmit)}
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    backgroundColor: '#fff',
                    padding: '24px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
            >
                {/* Company Selection with Autocomplete */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <Controller
                        name="companyId"
                        control={control}
                        render={({ field }) => (
                            <Autocomplete
                                {...field}
                                options={companies?.data || []}
                                getOptionLabel={(option) => option.name}
                                onChange={(event, value) => {
                                    field.onChange(value?.id || '');
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Company"
                                        variant="outlined"
                                        error={!!errors.companyId}
                                        helperText={errors.companyId?.message}
                                    />
                                )}
                                value={
                                    companies?.data.find((company) => company.id === field.value) || null
                                }
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                            />
                        )}
                    />
                </FormControl>

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={isUpdatingDriver}
                    sx={{ mt: 2 }}
                >
                    {isUpdatingDriver ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                </Button>
            </form>
        </div>
    );
}
