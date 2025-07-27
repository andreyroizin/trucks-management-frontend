'use client';

import React, { useEffect, useState } from 'react';
import {
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDrivers } from '@/hooks/useDrivers';
import { useWeekStatus, WeekDetail } from '@/hooks/useWeekStatus';
import { usePeriodStatus } from '@/hooks/usePeriodStatus';
import { usePeriodStatusByWeeks } from '@/hooks/usePeriodStatusByWeeks';
import { useDownloadWeekReport, useDownloadPeriodReport } from '@/hooks/useDownloadReports';
import LanguageSelectDesktop from '@/components/LanguageSelectDesktop';

// Period options for the filter
const periodOptions = [
    { label: '2025-P-01', value: { year: 2025, periodNr: 1 } },
    { label: '2025-P-02', value: { year: 2025, periodNr: 2 } },
    { label: '2025-P-03', value: { year: 2025, periodNr: 3 } },
    { label: '2025-P-04', value: { year: 2025, periodNr: 4 } },
    { label: '2025-P-05', value: { year: 2025, periodNr: 5 } },
    { label: '2025-P-06', value: { year: 2025, periodNr: 6 } },
    { label: '2025-P-07', value: { year: 2025, periodNr: 7 } },
    { label: '2025-P-08', value: { year: 2025, periodNr: 8 } },
    { label: '2025-P-09', value: { year: 2025, periodNr: 9 } },
    { label: '2025-P-10', value: { year: 2025, periodNr: 10 } },
    { label: '2025-P-11', value: { year: 2025, periodNr: 11 } },
    { label: '2025-P-12', value: { year: 2025, periodNr: 12 } },
    { label: '2025-P-13', value: { year: 2025, periodNr: 13 } },
];

// Component for individual week row with status checking
function WeekReportRow({ 
    weekNumber, 
    driverId, 
    driverName, 
    year 
}: { 
    weekNumber: number; 
    driverId: string; 
    driverName: string; 
    year: number; 
}) {
    console.log(`🎯 WeekReportRow - Component props:`, { 
        weekNumber, 
        driverId, 
        driverName, 
        year 
    });
    
    const { data: weekData, isLoading, error } = useWeekStatus(year, weekNumber, driverId);
    const downloadWeekReport = useDownloadWeekReport();
    
    // Backend uses numeric status: 2 = Signed
    const weekDetail = weekData as WeekDetail | undefined;
    
    console.log(`📊 WeekReportRow - Hook results for week ${weekNumber}:`, {
        isLoading,
        hasData: !!weekData,
        weekData,
        weekStatus: weekDetail?.status,
        error: error?.message
    });
    const isWeekSigned = weekDetail?.status === 2;
    const signedDate = weekDetail?.driverSignedAt;
    
    const handleDownload = () => {
        downloadWeekReport.mutate({
            driverId,
            year,
            weekNumber
        });
    };

    return (
        <TableRow hover>
            <TableCell sx={{ py: 2.6 }}>
                Week {weekNumber}
            </TableCell>
            <TableCell sx={{ py: 2.6 }}>
                {driverName}
            </TableCell>
            <TableCell sx={{ py: 2.6 }}>
                {isLoading ? (
                    <Typography variant="body2" color="text.secondary">
                        Checking...
                    </Typography>
                ) : isWeekSigned ? (
                    <Typography variant="body2" color="success.main">
                        {signedDate ? new Date(signedDate).toLocaleDateString() : 'Signed'}
                    </Typography>
                ) : weekData ? (
                    <Typography variant="body2" color="warning.main">
                        {weekDetail?.status === 1 ? 'Pending signature' : 
                         weekDetail?.status === 0 ? 'Pending admin' : 
                         weekDetail?.status === 3 ? 'Invalidated' : 'Not signed'}
                    </Typography>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        Week not found
                    </Typography>
                )}
            </TableCell>
            <TableCell sx={{ py: 2.6 }}>
                <Button 
                    variant="outlined" 
                    size="small"
                    sx={{ minWidth: 'auto' }}
                    disabled={!isWeekSigned || isLoading || downloadWeekReport.isPending}
                    onClick={handleDownload}
                >
                    {downloadWeekReport.isPending 
                        ? 'Downloading...' 
                        : isLoading 
                            ? 'Checking...'
                            : isWeekSigned 
                                ? 'Download Week Report'
                                : weekDetail?.status === 1
                                    ? 'Pending Signature'
                                    : weekDetail?.status === 0
                                        ? 'Pending Admin'
                                        : weekDetail?.status === 3
                                            ? 'Invalidated'
                                            : 'Not Available'
                    }
                </Button>
            </TableCell>
        </TableRow>
    );
}

export default function ReportsPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    
    // Filter states
    const [selectedDriver, setSelectedDriver] = useState<any>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
    
    // Data hooks
    const { data: driversData, isLoading: isLoadingDrivers } = useDrivers();
    
    // Report hooks
    const downloadWeekReport = useDownloadWeekReport();
    const downloadPeriodReport = useDownloadPeriodReport();
    
    // Period status check by individual weeks (works for admin roles)
    const { isPeriodSigned, isLoading: isPeriodLoading } = usePeriodStatusByWeeks(
        selectedPeriod?.value?.year || 0,
        selectedPeriod?.value?.periodNr || 0,
        (selectedDriver && selectedPeriod) ? selectedDriver.id : ''
    );
    
    console.log(`🔍 Reports Page - Period Status Check (by weeks):`, {
        selectedYear: selectedPeriod?.value?.year,
        selectedPeriodNr: selectedPeriod?.value?.periodNr,
        isPeriodSigned,
        isPeriodLoading,
        selectedDriver: selectedDriver?.id
    });

    // Access control
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'employer', 'customerAccountant', 'customer'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, authLoading, router, user?.roles]);

    // Show loading while authenticating
    if (authLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h3" fontWeight={500}>
                    Reports
                </Typography>
                <LanguageSelectDesktop />
            </Box>

            {/* Filters */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {/* Driver Filter */}
                    <Autocomplete
                        size="small"
                        options={driversData || []}
                        getOptionLabel={(driver) => 
                            driver?.user?.firstName && driver?.user?.lastName 
                                ? `${driver.user.firstName} ${driver.user.lastName}`
                                : 'Unknown Driver'
                        }
                        loading={isLoadingDrivers}
                        value={selectedDriver}
                        onChange={(_, newValue) => {
                            setSelectedDriver(newValue);
                        }}
                        sx={{ minWidth: 200, maxWidth: 200 }}
                        renderInput={(params) => <TextField {...params} label="Driver" />}
                        isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    />

                    {/* Period Filter */}
                    <Autocomplete
                        size="small"
                        options={periodOptions}
                        getOptionLabel={(option) => option.label}
                        value={selectedPeriod}
                        onChange={(_, newValue) => {
                            setSelectedPeriod(newValue);
                        }}
                        sx={{ minWidth: 200, maxWidth: 200 }}
                        renderInput={(params) => <TextField {...params} label="Period" />}
                        isOptionEqualToValue={(option, value) => 
                            option?.value?.year === value?.value?.year && 
                            option?.value?.periodNr === value?.value?.periodNr
                        }
                    />
                </Box>
            </Box>

            {/* Table Section */}
            <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3
            }}>
                <Typography variant="h4" fontWeight={500}>
                    Periods Reports List
                </Typography>
            </Box>

            {/* Content Area */}
            {!selectedDriver || !selectedPeriod ? (
                <Box sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                        Choose Driver and Period first, to find the report.
                    </Typography>
                </Box>
            ) : (
                <>
                    {/* Period Header */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 4,
                        flexWrap: 'wrap',
                        gap: 2
                    }}>
                        <Box>
                            <Typography variant="h4" fontWeight={500} sx={{ mb: 1 }}>
                                {selectedPeriod.value.year}–{String(selectedPeriod.value.periodNr).padStart(2, '0')} Period
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Here's a breakdown of your work and earnings for this period.
                            </Typography>
                        </Box>
                        <Button 
                            variant="contained" 
                            color="primary"
                            disabled={!isPeriodSigned || isPeriodLoading || downloadPeriodReport.isPending}
                            onClick={() => downloadPeriodReport.mutate({
                                driverId: selectedDriver.id,
                                year: selectedPeriod.value.year,
                                periodNumber: selectedPeriod.value.periodNr
                            })}
                        >
                            {downloadPeriodReport.isPending 
                                ? 'Downloading...' 
                                : isPeriodLoading 
                                    ? 'Checking Status...'
                                    : isPeriodSigned 
                                        ? 'Download Period Report'
                                        : 'Period Not Fully Signed'
                            }
                        </Button>
                    </Box>

                    {/* Table Container */}
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Week</TableCell>
                                    <TableCell>Driver</TableCell>
                                    <TableCell>Signed on</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                                                         <TableBody>
                                {/* Generate 4 weeks for each period - using ISO week numbers */}
                                {(() => {
                                    // Calculate approximate ISO week numbers based on period
                                    // This is a simplified calculation for display purposes
                                    const baseWeek = (selectedPeriod.value.periodNr - 1) * 4 + 1;
                                    const weeks = [baseWeek, baseWeek + 1, baseWeek + 2, baseWeek + 3];
                                    
                                    console.log(`🗓️ ReportsPage - Generating weeks for period:`, {
                                        selectedPeriod: selectedPeriod.value,
                                        selectedDriver: {
                                            id: selectedDriver.id,
                                            name: selectedDriver?.user?.firstName + ' ' + selectedDriver?.user?.lastName
                                        },
                                        baseWeek,
                                        weeks
                                    });
                                    
                                    return weeks;
                                })().map((weekNumber) => (
                                    <WeekReportRow
                                        key={weekNumber}
                                        weekNumber={weekNumber}
                                        driverId={selectedDriver.id}
                                        driverName={
                                            selectedDriver?.user?.firstName && selectedDriver?.user?.lastName 
                                                ? `${selectedDriver.user.firstName} ${selectedDriver.user.lastName}`
                                                : 'Unknown Driver'
                                        }
                                        year={selectedPeriod.value.year}
                                    />
                                ))}
                             </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
        </Box>
    );
} 