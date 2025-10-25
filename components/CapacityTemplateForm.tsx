'use client';

import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Box,
    Typography,
    FormControlLabel,
    Switch,
    Autocomplete,
    CircularProgress,
    Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
    useCreateCapacityTemplate, 
    useUpdateCapacityTemplate, 
    CapacityTemplate,
    CreateCapacityTemplateInput,
    UpdateCapacityTemplateInput
} from '@/hooks/useCapacityTemplates';
import { useClients } from '@/hooks/useClients';
import { useCompanies } from '@/hooks/useCompanies';
import { useAuth } from '@/hooks/useAuth';

type Props = {
    open: boolean;
    onClose: () => void;
    template?: CapacityTemplate | null;
};

const schema = yup.object({
    companyId: yup.string().required('Company is required'),
    clientId: yup.string().required('Client is required'),
    startDate: yup.string().required('Start date is required'),
    endDate: yup.string().required('End date is required'),
    mondayTrucks: yup.number().min(0, 'Must be 0 or greater').required(),
    tuesdayTrucks: yup.number().min(0, 'Must be 0 or greater').required(),
    wednesdayTrucks: yup.number().min(0, 'Must be 0 or greater').required(),
    thursdayTrucks: yup.number().min(0, 'Must be 0 or greater').required(),
    fridayTrucks: yup.number().min(0, 'Must be 0 or greater').required(),
    saturdayTrucks: yup.number().min(0, 'Must be 0 or greater').required(),
    sundayTrucks: yup.number().min(0, 'Must be 0 or greater').required(),
    notes: yup.string().optional(),
    isActive: yup.boolean().optional(),
}).test('at-least-one-truck', 'At least one day must have trucks assigned', function(values) {
    const total = (values.mondayTrucks || 0) + (values.tuesdayTrucks || 0) + 
                  (values.wednesdayTrucks || 0) + (values.thursdayTrucks || 0) + 
                  (values.fridayTrucks || 0) + (values.saturdayTrucks || 0) + 
                  (values.sundayTrucks || 0);
    return total > 0;
}).test('date-range', 'End date must be after start date', function(values) {
    if (values.startDate && values.endDate) {
        return new Date(values.startDate) < new Date(values.endDate);
    }
    return true;
});

type FormData = {
    companyId: string;
    clientId: string;
    startDate: string;
    endDate: string;
    mondayTrucks: number;
    tuesdayTrucks: number;
    wednesdayTrucks: number;
    thursdayTrucks: number;
    fridayTrucks: number;
    saturdayTrucks: number;
    sundayTrucks: number;
    notes?: string;
    isActive?: boolean;
};

export default function CapacityTemplateForm({ open, onClose, template }: Props) {
    const { user } = useAuth();
    
    // Company selection logic
    const isGlobalAdmin = user?.roles.includes('globalAdmin');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    
    // Fetch companies (backend automatically filters by user's access)
    const { data: companiesData, isLoading: isLoadingCompanies } = useCompanies(1, 1000);
    
    const { data: clients, isLoading: isLoadingClients } = useClients(1, 1000);
    const { mutateAsync: createTemplate, isPending: isCreating } = useCreateCapacityTemplate();
    const { mutateAsync: updateTemplate, isPending: isUpdating } = useUpdateCapacityTemplate();

    const isEditing = !!template;
    const isSubmitting = isCreating || isUpdating;

    const {
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
        watch,
    } = useForm<FormData>({
        resolver: yupResolver(schema),
        defaultValues: {
            companyId: '',
            clientId: '',
            startDate: '',
            endDate: '',
            mondayTrucks: 0,
            tuesdayTrucks: 0,
            wednesdayTrucks: 0,
            thursdayTrucks: 0,
            fridayTrucks: 0,
            saturdayTrucks: 0,
            sundayTrucks: 0,
            notes: '',
            isActive: true,
        },
    });

    // Watch all truck values to show total
    const truckValues = watch(['mondayTrucks', 'tuesdayTrucks', 'wednesdayTrucks', 'thursdayTrucks', 'fridayTrucks', 'saturdayTrucks', 'sundayTrucks']);
    const totalTrucks = truckValues.reduce((sum, value) => sum + (value || 0), 0);

    // Reset form when template changes
    useEffect(() => {
        if (template) {
            reset({
                companyId: template.companyId,
                clientId: template.clientId,
                startDate: template.startDate.split('T')[0], // Convert to YYYY-MM-DD format
                endDate: template.endDate.split('T')[0],
                mondayTrucks: template.mondayTrucks,
                tuesdayTrucks: template.tuesdayTrucks,
                wednesdayTrucks: template.wednesdayTrucks,
                thursdayTrucks: template.thursdayTrucks,
                fridayTrucks: template.fridayTrucks,
                saturdayTrucks: template.saturdayTrucks,
                sundayTrucks: template.sundayTrucks,
                notes: template.notes || '',
                isActive: template.isActive,
            });
            // Set selected company ID when editing
            setSelectedCompanyId(template.companyId);
        } else {
            reset({
                companyId: '',
                clientId: '',
                startDate: '',
                endDate: '',
                mondayTrucks: 0,
                tuesdayTrucks: 0,
                wednesdayTrucks: 0,
                thursdayTrucks: 0,
                fridayTrucks: 0,
                saturdayTrucks: 0,
                sundayTrucks: 0,
                notes: '',
                isActive: true,
            });
            // Reset selected company ID when creating new
            setSelectedCompanyId('');
        }
    }, [template, reset]);

    // Auto-select company for non-global admins when companies load
    useEffect(() => {
        if (!isGlobalAdmin && companiesData?.data && companiesData.data.length > 0 && !template) {
            const firstCompany = companiesData.data[0];
            setValue('companyId', firstCompany.id);
            setSelectedCompanyId(firstCompany.id);
        }
    }, [isGlobalAdmin, companiesData, template, setValue]);

    const onSubmit = async (data: FormData) => {
        try {
            if (isEditing && template) {
                const updateData: UpdateCapacityTemplateInput = {
                    startDate: data.startDate,
                    endDate: data.endDate,
                    mondayTrucks: data.mondayTrucks,
                    tuesdayTrucks: data.tuesdayTrucks,
                    wednesdayTrucks: data.wednesdayTrucks,
                    thursdayTrucks: data.thursdayTrucks,
                    fridayTrucks: data.fridayTrucks,
                    saturdayTrucks: data.saturdayTrucks,
                    sundayTrucks: data.sundayTrucks,
                    notes: data.notes,
                    isActive: data.isActive ?? true,
                };
                console.log('Updating template with data:', updateData);
                await updateTemplate({ id: template.id, data: updateData });
            } else {
                // Validate company ID before sending
                if (!data.companyId) {
                    alert('Error: Please select a company.');
                    return;
                }

                const createData: CreateCapacityTemplateInput = {
                    companyId: data.companyId,
                    clientId: data.clientId,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    mondayTrucks: data.mondayTrucks,
                    tuesdayTrucks: data.tuesdayTrucks,
                    wednesdayTrucks: data.wednesdayTrucks,
                    thursdayTrucks: data.thursdayTrucks,
                    fridayTrucks: data.fridayTrucks,
                    saturdayTrucks: data.saturdayTrucks,
                    sundayTrucks: data.sundayTrucks,
                    notes: data.notes,
                };
                console.log('Creating template with data:', createData);
                console.log('Form company ID:', data.companyId);
                console.log('User company ID:', user?.companyId);
                console.log('Is global admin:', isGlobalAdmin);
                console.log('Full user object:', user);
                console.log('Selected client ID:', data.clientId);
                await createTemplate(createData);
            }
            onClose();
        } catch (error: any) {
            console.error('Failed to save template - Full error:', error);
            console.error('Error response:', error.response);
            console.error('Error response data:', error.response?.data);
            console.error('Error status:', error.response?.status);
            console.error('Error headers:', error.response?.headers);
            console.error('Backend errors array:', error.response?.data?.errors);
            
            // Show more detailed error message
            const backendErrors = error.response?.data?.errors;
            const errorMessage = backendErrors && backendErrors.length > 0 
                               ? backendErrors.join(', ')
                               : error.response?.data?.data || 
                                 error.response?.data?.message || 
                                 error.message || 
                                 'Failed to save template. Please try again.';
            alert(`Error: ${errorMessage}`);
        }
    };

    const dayLabels = [
        { key: 'mondayTrucks', label: 'Monday' },
        { key: 'tuesdayTrucks', label: 'Tuesday' },
        { key: 'wednesdayTrucks', label: 'Wednesday' },
        { key: 'thursdayTrucks', label: 'Thursday' },
        { key: 'fridayTrucks', label: 'Friday' },
        { key: 'saturdayTrucks', label: 'Saturday' },
        { key: 'sundayTrucks', label: 'Sunday' },
    ];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {isEditing ? 'Edit Capacity Template' : 'Create Capacity Template'}
            </DialogTitle>
            <DialogContent>
                <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
                    <Grid container spacing={3}>
                        {/* Company Selection - Show for all users, but different behavior */}
                        <Grid item xs={12}>
                                <Controller
                                    name="companyId"
                                    control={control}
                                    render={({ field }) => (
                                        <Autocomplete
                                            {...field}
                                            options={companiesData?.data || []}
                                            getOptionLabel={(option) => option.name}
                                            isOptionEqualToValue={(option, value) => option.id === value.id}
                                            loading={isLoadingCompanies}
                                            disabled={isEditing || !isGlobalAdmin} // Cannot change company when editing, or if not global admin
                                            onChange={(_, newValue) => {
                                                field.onChange(newValue?.id || '');
                                                setSelectedCompanyId(newValue?.id || '');
                                            }}
                                            value={companiesData?.data.find((company) => company.id === field.value) || null}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={isGlobalAdmin ? "Company" : "Company (Auto-selected)"}
                                                    error={!!errors.companyId}
                                                    helperText={errors.companyId?.message}
                                                    InputProps={{
                                                        ...params.InputProps,
                                                        endAdornment: (
                                                            <>
                                                                {isLoadingCompanies ? <CircularProgress color="inherit" size={20} /> : null}
                                                                {params.InputProps.endAdornment}
                                                            </>
                                                        ),
                                                    }}
                                                />
                                            )}
                                        />
                                    )}
                                />
                            </Grid>

                        {/* Client Selection */}
                        <Grid item xs={12}>
                            <Controller
                                name="clientId"
                                control={control}
                                render={({ field }) => (
                                    <Autocomplete
                                        {...field}
                                        options={clients?.data || []}
                                        getOptionLabel={(option) => option.name}
                                        isOptionEqualToValue={(option, value) => option.id === value.id}
                                        loading={isLoadingClients}
                                        disabled={isEditing} // Cannot change client when editing
                                        onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                                        value={clients?.data.find((client) => client.id === field.value) || null}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Client"
                                                error={!!errors.clientId}
                                                helperText={errors.clientId?.message}
                                                InputProps={{
                                                    ...params.InputProps,
                                                    endAdornment: (
                                                        <>
                                                            {isLoadingClients ? <CircularProgress color="inherit" size={20} /> : null}
                                                            {params.InputProps.endAdornment}
                                                        </>
                                                    ),
                                                }}
                                            />
                                        )}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Date Range */}
                        <Grid item xs={6}>
                            <Controller
                                name="startDate"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Start Date"
                                        type="date"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        error={!!errors.startDate}
                                        helperText={errors.startDate?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Controller
                                name="endDate"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="End Date"
                                        type="date"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        error={!!errors.endDate}
                                        helperText={errors.endDate?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Weekly Pattern */}
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Weekly Truck Pattern
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Define how many trucks are needed for each day of the week
                            </Typography>
                        </Grid>

                        {dayLabels.map(({ key, label }) => (
                            <Grid item xs={12} sm={6} md={3} key={key}>
                                <Controller
                                    name={key as keyof FormData}
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label={label}
                                            type="number"
                                            fullWidth
                                            inputProps={{ min: 0, max: 50 }}
                                            error={!!errors[key as keyof FormData]}
                                            helperText={errors[key as keyof FormData]?.message}
                                        />
                                    )}
                                />
                            </Grid>
                        ))}

                        {/* Total Display */}
                        <Grid item xs={12}>
                            <Alert severity={totalTrucks > 0 ? 'success' : 'warning'}>
                                Total trucks per week: <strong>{totalTrucks}</strong>
                                {totalTrucks === 0 && ' - At least one day must have trucks assigned'}
                            </Alert>
                        </Grid>

                        {/* Notes */}
                        <Grid item xs={12}>
                            <Controller
                                name="notes"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label="Notes"
                                        multiline
                                        rows={3}
                                        fullWidth
                                        placeholder="Optional notes about this capacity template..."
                                    />
                                )}
                            />
                        </Grid>

                        {/* Active Toggle (only when editing) */}
                        {isEditing && (
                            <Grid item xs={12}>
                                <Controller
                                    name="isActive"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                />
                                            }
                                            label="Template is active"
                                        />
                                    )}
                                />
                            </Grid>
                        )}
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit(onSubmit)}
                    variant="contained"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            {isEditing ? 'Updating...' : 'Creating...'}
                        </>
                    ) : (
                        isEditing ? 'Update Template' : 'Create Template'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
