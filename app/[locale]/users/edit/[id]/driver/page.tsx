'use client';

import {useParams, useRouter} from 'next/navigation';
import {Controller, SubmitHandler, useForm} from 'react-hook-form';
import {Alert, Button, CircularProgress, FormControl, TextField, Typography,} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import {yupResolver} from '@hookform/resolvers/yup';
import {useEffect, useState} from 'react';
import {useCompanies} from '@/hooks/useCompanies';
import {useUpdateUserDriver, useUserDetails} from '@/hooks/useUser'; // Import the new hook
import * as yup from 'yup';
import {useAuth} from "@/hooks/useAuth";
import { useDeleteDriver } from '@/hooks/useDeleteDriver';
import ConfirmModal from "@/components/ConfirmModal";
import Link from "next/link";

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
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const [openModal, setOpenModal] = useState(false);
    const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);
    const isGlobalAdmin = user?.roles.includes('globalAdmin');
    const isCustomerAdmin = user?.roles.includes('customerAdmin');

    const { mutateAsync: deleteDriver, isPending: isDeleting } = useDeleteDriver();
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

    useEffect(() => {
        const allowedRoles = [
            'globalAdmin',
            'customerAdmin',
        ];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router, user?.roles]);

    // Populate form with existing driverInfo
    useEffect(() => {
        if (userDetails?.driverInfo?.companyId) {
            setValue('companyId', userDetails.driverInfo.companyId);
        }
    }, [userDetails, setValue]);

    const handleDelete = async () => {
        setDeleteErrorMsg(null);
        try {
            await deleteDriver(userDetails?.driverInfo?.driverId || '');
            setOpenModal(false);
            router.push('/drivers'); // Redirect after deletion
        } catch (err: any) {
            setDeleteErrorMsg(err.message || 'Failed to delete driver.');
            setOpenModal(false);
        }
    };

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

                <Link href={`/app/%5Blocale%5D/users/edit/${userId}/driver/compensations`} passHref>
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        component="a"
                        sx={{ mt: 2 }}
                    >
                        Driver Rates & Allowances
                    </Button>
                </Link>

                {(isGlobalAdmin || isCustomerAdmin) && (
                    <Button
                        variant="contained"
                        color="error"
                        fullWidth
                        sx={{ mt: 2 }}
                        disabled={isDeleting}
                        onClick={() => setOpenModal(true)}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Driver'}
                    </Button>
                )}
                {deleteErrorMsg && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {deleteErrorMsg}
                    </Alert>
                )}
            </form>
            <ConfirmModal
                open={openModal}
                title="Delete Driver?"
                message="Are you sure you want to delete this driver?"
                onClose={() => setOpenModal(false)}
                onConfirm={handleDelete}
            />
        </div>
    );
}
