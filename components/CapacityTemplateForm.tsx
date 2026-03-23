'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import { useTranslations } from 'next-intl';

type Props = {
    open: boolean;
    onClose: () => void;
    template?: CapacityTemplate | null;
};

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
    const t = useTranslations('planning.longTerm.form');
    
    const schema = useMemo(() => {
        const truckField = yup
            .number()
            .typeError(t('validation.truckNumber'))
            .min(0, t('validation.truckMin'))
            .required(t('validation.truckRequired'));

        return yup
            .object({
                companyId: yup.string().required(t('validation.companyRequired')),
                clientId: yup.string().required(t('validation.clientRequired')),
                startDate: yup.string().required(t('validation.startDateRequired')),
                endDate: yup.string().required(t('validation.endDateRequired')),
                mondayTrucks: truckField,
                tuesdayTrucks: truckField,
                wednesdayTrucks: truckField,
                thursdayTrucks: truckField,
                fridayTrucks: truckField,
                saturdayTrucks: truckField,
                sundayTrucks: truckField,
                notes: yup.string().optional(),
                isActive: yup.boolean().optional(),
            })
            .test('at-least-one-truck', t('validation.atLeastOne'), function (values) {
                const total =
                    (values.mondayTrucks || 0) +
                    (values.tuesdayTrucks || 0) +
                    (values.wednesdayTrucks || 0) +
                    (values.thursdayTrucks || 0) +
                    (values.fridayTrucks || 0) +
                    (values.saturdayTrucks || 0) +
                    (values.sundayTrucks || 0);
                return total > 0;
            })
            .test('date-range', t('validation.dateRange'), function (values) {
                if (values.startDate && values.endDate) {
                    return new Date(values.startDate) < new Date(values.endDate);
                }
                return true;
            });
    }, [t]);

    const dayFields = useMemo(
        () => [
            { key: 'mondayTrucks', label: t('fields.days.monday') },
            { key: 'tuesdayTrucks', label: t('fields.days.tuesday') },
            { key: 'wednesdayTrucks', label: t('fields.days.wednesday') },
            { key: 'thursdayTrucks', label: t('fields.days.thursday') },
            { key: 'fridayTrucks', label: t('fields.days.friday') },
            { key: 'saturdayTrucks', label: t('fields.days.saturday') },
            { key: 'sundayTrucks', label: t('fields.days.sunday') },
        ],
        [t]
    );
    
    // Company selection logic
    const isGlobalAdmin = user?.roles.includes('globalAdmin');
    
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
    const totalTrucks = truckValues.reduce((sum, value) => sum + (Number(value) || 0), 0);

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
        }
    }, [template, reset]);

    // Auto-select company for non-global admins when companies load
    useEffect(() => {
        if (!isGlobalAdmin && companiesData?.data && companiesData.data.length > 0 && !template) {
            const firstCompany = companiesData.data[0];
            setValue('companyId', firstCompany.id);
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
                    alert(t('errors.selectCompany'));
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
                                 t('errors.saveFallback');
            alert(t('errors.generic', { message: errorMessage }));
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {isEditing ? t('titles.edit') : t('titles.create')}
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
                                            disabled={isEditing} // Cannot change company when editing
                                            onChange={(_, newValue) => {
                                                field.onChange(newValue?.id || '');
                                            }}
                                            value={companiesData?.data.find((company) => company.id === field.value) || null}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={isGlobalAdmin ? t('fields.company') : t('fields.companyAuto')}
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
                                                label={t('fields.client')}
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
                                        label={t('fields.startDate')}
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
                                        label={t('fields.endDate')}
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
                                {t('sections.weeklyPatternTitle')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {t('sections.weeklyPatternDescription')}
                            </Typography>
                        </Grid>

                        {dayFields.map(({ key, label }) => (
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
                                {t('summary.totalTrucks', { count: totalTrucks })}
                                {totalTrucks === 0 && (
                                    <span> - {t('summary.noneWarning')}</span>
                                )}
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
                                        label={t('fields.notes')}
                                        multiline
                                        rows={3}
                                        fullWidth
                                        placeholder={t('placeholders.notes')}
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
                                            label={t('toggles.active')}
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
                    {t('actions.cancel')}
                </Button>
                <Button
                    onClick={handleSubmit(onSubmit)}
                    variant="contained"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            {isEditing ? t('actions.updating') : t('actions.creating')}
                        </>
                    ) : (
                        isEditing ? t('actions.update') : t('actions.create')
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
