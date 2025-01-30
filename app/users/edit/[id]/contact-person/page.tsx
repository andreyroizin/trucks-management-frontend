'use client';

import {useParams} from 'next/navigation';
import {Controller, SubmitHandler, useForm} from 'react-hook-form';
import {Alert, Button, CircularProgress, FormControl, TextField, Typography,} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import {yupResolver} from '@hookform/resolvers/yup';
import {useEffect, useState} from 'react';
import {Company, useCompanies} from '@/hooks/useCompanies';
import {Client, useClients} from '@/hooks/useClients';
import {useUpdateUserContactPerson, useUserDetails} from '@/hooks/useUser';
import * as yup from 'yup';

// *** Validation Schema ***
const editContactPersonSchema = yup.object().shape({

});

// *** Type for Form Inputs ***
type EditContactPersonFormInputs = {
    clientIds?: string[];
    companyIds?: string[];
};

export default function EditContactPersonPage() {
    const params = useParams();
    const userId = params?.id as string;

    // Fetch user details
    const { data: userDetails, isLoading: isLoadingUser, isError: isErrorUser } = useUserDetails(userId);

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
    const { mutateAsync: mutateUpdateContactPerson, isPending: isUpdatingContactPerson } =
        useUpdateUserContactPerson();

    // Form setup
    const {
        handleSubmit,
        control,
        setValue,
        formState: { errors },
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
                <CircularProgress />
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
                    maxWidth: '600px',
                    backgroundColor: '#fff',
                    padding: '24px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
            >
                {/* Clients Selection with Autocomplete */}
                <FormControl fullWidth sx={{ mb: 4 }}>
                    <Controller
                        name="clientIds"
                        control={control}
                        render={({ field }) => (
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
                <FormControl fullWidth sx={{ mb: 4 }}>
                    <Controller
                        name="companyIds"
                        control={control}
                        render={({ field }) => (
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
                    sx={{ mt: 2 }}
                >
                    {isUpdatingContactPerson ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                </Button>
            </form>
        </div>
    );
}
