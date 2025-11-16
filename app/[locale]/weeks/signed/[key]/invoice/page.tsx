'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Typography,
    TextField,
    Paper,
    Grid,
    Alert,
    Divider,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useDriverWeekDetails } from '@/hooks/useDriverWeekDetails';
import { useGenerateInvoice } from '@/hooks/useGenerateInvoice';
import { useAuth } from '@/hooks/useAuth';
import { useSnack } from '@/providers/SnackProvider';
import { useTranslations } from 'next-intl';
import DescriptionIcon from '@mui/icons-material/Description';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function GenerateInvoicePage() {
    const t = useTranslations('weeks.driver.invoice');
    const params = useParams<{ key: string }>();
    const router = useRouter();
    const showSnack = useSnack();
    const { user } = useAuth();
    
    const [yearStr, weekStr] = params.key.split('-');
    const year = parseInt(yearStr, 10);
    const weekNumber = parseInt(weekStr, 10);

    const { data: weekData, isLoading, error } = useDriverWeekDetails(year, weekNumber);
    const { mutateAsync: generateInvoice, isPending: isGenerating } = useGenerateInvoice();

    // Editable fields
    const [hoursWorked, setHoursWorked] = useState<string>('0');
    const [hourlyCompensation, setHourlyCompensation] = useState<string>('0');
    const [additionalCompensation, setAdditionalCompensation] = useState<string>('0');

    // Initialize fields when data loads
    useEffect(() => {
        if (weekData) {
            setHoursWorked(weekData.totalHours.toFixed(1));
            
            // Calculate hourly and additional compensation from executions
            const totalHourly = weekData.executions.reduce((sum, exec) => sum + exec.hourlyCompensation, 0);
            const totalAdditional = weekData.executions.reduce((sum, exec) => sum + exec.additionalCompensation, 0);
            
            setHourlyCompensation(totalHourly.toFixed(2));
            setAdditionalCompensation(totalAdditional.toFixed(2));
        }
    }, [weekData]);

    // Calculate total
    const totalAmount = (
        parseFloat(hourlyCompensation || '0') + 
        parseFloat(additionalCompensation || '0')
    );

    // Calculate exceeding container waiting time
    const exceedingContainerWaitingTime = weekData?.executions.reduce(
        (sum, exec) => sum + exec.exceedingContainerWaitingTime, 
        0
    ) || 0;

    const handleGenerate = async () => {
        if (!weekData || !user?.driverInfo?.driverId) {
            console.error('❌ [handleGenerate] Missing required data');
            console.error('  weekData:', weekData);
            console.error('  user.driverInfo:', user?.driverInfo);
            showSnack({ text: t('errors.noDriver'), severity: 'error' });
            return;
        }

        console.log('🎯 [handleGenerate] Preparing invoice generation');
        console.log('  Driver ID:', user.driverInfo.driverId);
        console.log('  Year:', year);
        console.log('  Week Number:', weekNumber);
        console.log('  Raw Input Values:');
        console.log('    hoursWorked (string):', hoursWorked);
        console.log('    hourlyCompensation (string):', hourlyCompensation);
        console.log('    additionalCompensation (string):', additionalCompensation);
        
        const parsedHours = parseFloat(hoursWorked);
        const parsedHourly = parseFloat(hourlyCompensation);
        const parsedAdditional = parseFloat(additionalCompensation);
        
        console.log('  Parsed Values:');
        console.log('    hoursWorked (number):', parsedHours);
        console.log('    hourlyCompensation (number):', parsedHourly);
        console.log('    additionalCompensation (number):', parsedAdditional);
        console.log('  Is Valid:', !isNaN(parsedHours) && !isNaN(parsedHourly) && !isNaN(parsedAdditional));

        try {
            const blob = await generateInvoice({
                driverId: user.driverInfo.driverId,
                request: {
                    year,
                    weekNumber,
                    hoursWorked: parsedHours,
                    hourlyCompensation: parsedHourly,
                    additionalCompensation: parsedAdditional,
                },
            });

            // Trigger download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice_Week_${weekNumber}_${year}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            showSnack({ text: t('success.generated'), severity: 'success' });
        } catch (error: any) {
            showSnack({ 
                text: error.message || t('errors.generateFailed'), 
                severity: 'error' 
            });
        }
    };

    // Loading / Error states
    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" mt={6}>
                <CircularProgress />
            </Box>
        );
    }

    if (!weekData || error) {
        return (
            <Box maxWidth="600px" mx="auto" py={4}>
                <Typography color="error" textAlign="center">
                    {error instanceof Error ? error.message : t('errors.loadFailed')}
                </Typography>
                <Box display="flex" justifyContent="center" mt={2}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => router.back()}
                    >
                        {t('actions.back')}
                    </Button>
                </Box>
            </Box>
        );
    }

    // Check if week is signed
    if (weekData.status !== 2) {
        return (
            <Box maxWidth="600px" mx="auto" py={4}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {t('errors.notSigned')}
                </Alert>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.back()}
                >
                    {t('actions.back')}
                </Button>
            </Box>
        );
    }

    return (
        <Box maxWidth="700px" mx="auto" py={4}>
            {/* Header */}
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.back()}
                    size="small"
                >
                    {t('actions.back')}
                </Button>
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 500, mb: 1 }}>
                {t('title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('subtitle', { week: weekNumber, year })}
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
                {t('info')}
            </Alert>

            {/* Editable Fields */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                    {t('sections.editable')}
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label={t('fields.hoursWorked.label')}
                            type="number"
                            fullWidth
                            value={hoursWorked}
                            onChange={(e) => setHoursWorked(e.target.value)}
                            inputProps={{ step: 0.1, min: 0 }}
                            helperText={t('fields.hoursWorked.helper')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label={t('fields.hourlyCompensation.label')}
                            type="number"
                            fullWidth
                            value={hourlyCompensation}
                            onChange={(e) => setHourlyCompensation(e.target.value)}
                            inputProps={{ step: 0.01, min: 0 }}
                            helperText={t('fields.hourlyCompensation.helper')}
                            InputProps={{
                                startAdornment: <Box component="span" sx={{ mr: 0.5 }}>€</Box>,
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label={t('fields.additionalCompensation.label')}
                            type="number"
                            fullWidth
                            value={additionalCompensation}
                            onChange={(e) => setAdditionalCompensation(e.target.value)}
                            inputProps={{ step: 0.01, min: 0 }}
                            helperText={t('fields.additionalCompensation.helper')}
                            InputProps={{
                                startAdornment: <Box component="span" sx={{ mr: 0.5 }}>€</Box>,
                            }}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Read-only Fields */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                    {t('sections.readonly')}
                </Typography>

                <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary" display="block">
                            {t('fields.weekNumber')}
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                            {t('weekLabel', { week: weekNumber })}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary" display="block">
                            {t('fields.year')}
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                            {year}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary" display="block">
                            {t('fields.containerOvertime')}
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                            {exceedingContainerWaitingTime.toFixed(1)}h
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary" display="block">
                            {t('fields.totalAmount')}
                        </Typography>
                        <Typography variant="body1" fontWeight={600} color="success.main">
                            €{totalAmount.toFixed(2)}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Generate Button */}
            <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                    variant="outlined"
                    onClick={() => router.back()}
                    disabled={isGenerating}
                >
                    {t('actions.cancel')}
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={isGenerating ? <CircularProgress size={20} /> : <DescriptionIcon />}
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    size="large"
                >
                    {isGenerating ? t('actions.generating') : t('actions.generate')}
                </Button>
            </Box>
        </Box>
    );
}

