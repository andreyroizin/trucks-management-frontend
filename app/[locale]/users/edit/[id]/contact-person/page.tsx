'use client';

import {useParams, useRouter} from 'next/navigation';
import {Controller, SubmitHandler, useForm} from 'react-hook-form';
import {Alert, Button, CircularProgress, FormControl, TextField, Typography,} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import {yupResolver} from '@hookform/resolvers/yup';
import {useEffect, useMemo, useState} from 'react';
import {Company, useCompanies} from '@/hooks/useCompanies';
import {Client, useClients} from '@/hooks/useClients';
import {useUpdateUserContactPerson, useUserDetails} from '@/hooks/useUser';
import * as yup from 'yup';
import {useDeleteContactPerson} from "@/hooks/useDeleteContactPerson";
import ConfirmModal from "@/components/ConfirmModal";
import {useAuth} from "@/hooks/useAuth";

// *** Validation Schema ***
const editContactPersonSchema = yup.object().shape({});

// *** Type for Form Inputs ***
type EditContactPersonFormInputs = {
    clientIds?: string[];
    companyIds?: string[];
};

export default function EditContactPersonPage() {
    const {user, isAuthenticated, loading: authLoading} = useAuth();
    const params = useParams();
    const userId = params?.id as string;
    const router = useRouter();
    const [openModal, setOpenModal] = useState(false);
    const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);
    const isGlobalAdmin = user?.roles.includes('globalAdmin');
    // Fetch user details
    const {data: userDetails, isLoading: isLoadingUser, isError: isErrorUser} = useUserDetails(userId);
    const contactPersonIsGlobalAdmin = useMemo(
        () => {
            return userDetails?.roles.includes('globalAdmin');
        },
        [userDetails]);

    const {
        mutateAsync: deleteContactPerson,
        isPending: isDeleting,
        isError: isDeleteError,
        error: deleteError,
    } = useDeleteContactPerson();

    // Fetch companies
    const {
        data: companiesData,
        isLoading: isLoadingCompanies,
        isError: isErrorCompanies,
    } = useCompanies();

    // Fetch clients
    const {
        data: clientsData,
        isLoading: isLoadingClients,
        isError: isErrorClients,
    } = useClients(1, 1000);

    // Initialize the update hook
    const {mutateAsync: mutateUpdateContactPerson, isPending: isUpdatingContactPerson} =
        useUpdateUserContactPerson();

    // Form setup
    const {
        handleSubmit,
        control,
        setValue,
        formState: {errors},
    } = useForm<EditContactPersonFormInputs>({
        resolver: yupResolver(editContactPersonSchema),
        defaultValues: {
            clientIds: [],
            companyIds: [],
        },
    });

    // State for API feedback
    const [apiError, setApiError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Separate states for selected clients and companies
    const [selectedClients, setSelectedClients] = useState<Client[]>([]);
    const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);

    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, authLoading, router, user?.roles]);

    // Populate form with existing contactPersonInfo
    useEffect(() => {
        if (userDetails?.contactPersonInfo?.clientsCompanies) {
            const clientIds = userDetails.contactPersonInfo.clientsCompanies
                .filter(cc => cc.clientId)
                .map(cc => cc.clientId!) as string[];
            const companyIds = userDetails.contactPersonInfo.clientsCompanies
                .filter(cc => cc.companyId)
                .map(cc => cc.companyId!) as string[];

            setValue('clientIds', clientIds);
            setValue('companyIds', companyIds);

            // Set selected clients and companies based on IDs
            const clients = clientsData?.data.filter(client => clientIds.includes(client.id)) || [];
            const companies = companiesData?.data.filter(company => companyIds.includes(company.id)) || [];

            setSelectedClients(clients);
            setSelectedCompanies(companies);
        }
    }, [userDetails, setValue, clientsData, companiesData]);

    const handleDelete = async () => {
        setDeleteErrorMsg(null);
        try {
            await deleteContactPerson(userDetails?.contactPersonInfo?.contactPersonId || ''); // pass the contact person's ID
            setOpenModal(false);
            router.push('/users'); // or wherever you list contact persons
        } catch (err: any) {
            setDeleteErrorMsg(err.message || 'Failed to delete contact person.');
            setOpenModal(false);
        }
    };

    // Handle form submission
    const onSubmit: SubmitHandler<EditContactPersonFormInputs> = async (data) => {
        setApiError(null);
        setSuccessMessage(null);

        try {
            await mutateUpdateContactPerson({
                id: userId,
                ...data
            });
            setSuccessMessage('Contact person data updated successfully!');
        } catch (error: any) {
            setApiError(error.message || 'An unexpected error occurred');
        }
    };

    // Handle loading and error states
    if (isLoadingUser || isLoadingCompanies || isLoadingClients) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <CircularProgress/>
            </div>
        );
    }

    if (isErrorUser || isErrorCompanies || isErrorClients) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Alert severity="error">Failed to load data. Please try again later.</Alert>
            </div>
        );
    }

    // Extract clients and companies
    const clients = clientsData?.data || [];
    const companies = companiesData?.data || [];

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
            <Typography variant="h4" gutterBottom>
                Edit Contact Person Data
            </Typography>

            {apiError && (
                <Alert severity="error" sx={{mb: 2}}>
                    {apiError}
                </Alert>
            )}

            {successMessage && (
                <Alert severity="success" sx={{mb: 2}}>
                    {successMessage}
                </Alert>
            )}

            <form
                onSubmit={handleSubmit(onSubmit)}
                style={{
                    width: '100%',
                    maxWidth: '600px',
                    backgroundColor: '#fff',
                    padding: '24px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
            >
                {/* Clients Selection with Autocomplete */}
                <FormControl fullWidth sx={{mb: 4}}>
                    <Controller
                        name="clientIds"
                        control={control}
                        render={({field}) => (
                            <Autocomplete
                                {...field}
                                multiple
                                options={clients}
                                getOptionLabel={(option) => option.name}
                                onChange={(event, value) => {
                                    // Update form state
                                    field.onChange(value.map(client => client.id));
                                    // Update selected clients state
                                    setSelectedClients(value);
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Clients"
                                        variant="outlined"
                                        error={!!errors.clientIds}
                                        helperText={errors.clientIds?.message}
                                    />
                                )}
                                value={selectedClients}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                            />
                        )}
                    />
                </FormControl>

                {/* Companies Selection with Autocomplete */}
                <FormControl fullWidth sx={{mb: 4}}>
                    <Controller
                        name="companyIds"
                        control={control}
                        render={({field}) => (
                            <Autocomplete
                                {...field}
                                multiple
                                options={companies}
                                getOptionLabel={(option) => option.name}
                                onChange={(event, value) => {
                                    // Update form state
                                    field.onChange(value.map(company => company.id));
                                    // Update selected companies state
                                    setSelectedCompanies(value);
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Companies"
                                        variant="outlined"
                                        error={!!errors.companyIds}
                                        helperText={errors.companyIds?.message}
                                    />
                                )}
                                value={selectedCompanies}
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
                    disabled={isUpdatingContactPerson}
                    sx={{mt: 2}}
                >
                    {isUpdatingContactPerson ? <CircularProgress size={24} color="inherit"/> : 'Save Changes'}
                </Button>
                {(!contactPersonIsGlobalAdmin || isGlobalAdmin) && (
                    <Button
                        variant="contained"
                        color="error"
                        fullWidth
                        sx={{mt: 2}}
                        disabled={isDeleting}
                        onClick={() => setOpenModal(true)}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                )}
            </form>
            <ConfirmModal
                open={openModal}
                title="Delete Contact Person?"
                message="Are you sure you want to delete this contact person?"
                onClose={() => setOpenModal(false)}
                onConfirm={handleDelete}
            />

            {(isDeleteError || deleteErrorMsg) && (
                <Alert severity="error" sx={{mt: 2}}>
                    {deleteErrorMsg || deleteError?.message}
                </Alert>
            )}
        </div>
    );
}
