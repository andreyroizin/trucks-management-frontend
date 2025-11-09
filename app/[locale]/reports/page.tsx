'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    MenuItem,
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
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useDrivers } from '@/hooks/useDrivers';
import { useWeekStatus, WeekDetail } from '@/hooks/useWeekStatus';
import { usePeriodStatusByWeeks } from '@/hooks/usePeriodStatusByWeeks';
import { useDownloadWeekReport, useDownloadPeriodReport } from '@/hooks/useDownloadReports';
import LanguageSelectDesktop from '@/components/LanguageSelectDesktop';
import { useRideExecutionReport } from '@/hooks/useRideExecutionReport';
import dayjs from 'dayjs';

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

const getIsoWeekMonday = (year: number, weekNumber: number): Date => {
    const jan4 = new Date(year, 0, 4);
    const jan4Day = jan4.getDay();
    const daysToMonday = jan4Day === 0 ? -6 : 1 - jan4Day;
    const week1Monday = new Date(jan4);
    week1Monday.setDate(jan4.getDate() + daysToMonday);

    const targetMonday = new Date(week1Monday);
    targetMonday.setDate(week1Monday.getDate() + (weekNumber - 1) * 7);

    return targetMonday;
};

const formatCurrency = (value?: number) => `€${((value ?? 0)).toFixed(2)}`;
const formatHours = (value?: number) => (value ?? 0).toFixed(2);

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
    const t = useTranslations();
    const { data: weekData, isLoading, error } = useWeekStatus(year, weekNumber, driverId);
    const downloadWeekReport = useDownloadWeekReport();
    
    // Backend uses numeric status: 2 = Signed
    const weekDetail = weekData as WeekDetail | undefined;
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
                {t('reports.table.columns.week')} {weekNumber}
            </TableCell>
            <TableCell sx={{ py: 2.6 }}>
                {driverName}
            </TableCell>
            <TableCell sx={{ py: 2.6 }}>
                {isLoading ? (
                    <Typography variant="body2" color="text.secondary">
                        {t('reports.status.checking')}
                    </Typography>
                ) : isWeekSigned ? (
                    <Typography variant="body2" color="success.main">
                        {signedDate ? new Date(signedDate).toLocaleDateString() : t('reports.status.signed')}
                    </Typography>
                ) : weekData ? (
                    <Typography variant="body2" color="warning.main">
                        {weekDetail?.status === 1 ? t('reports.status.pendingSignature') : 
                         weekDetail?.status === 0 ? t('reports.status.pendingAdmin') : 
                         weekDetail?.status === 3 ? t('reports.status.invalidated') : t('reports.status.notSigned')}
                    </Typography>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        {t('reports.status.weekNotFound')}
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
                        ? t('reports.status.downloading')
                        : isLoading 
                            ? t('reports.status.checking')
                            : isWeekSigned 
                                ? t('reports.buttons.downloadWeek')
                                : weekDetail?.status === 1
                                    ? t('reports.status.pendingSignature')
                                    : weekDetail?.status === 0
                                        ? t('reports.status.pendingAdmin')
                                        : weekDetail?.status === 3
                                            ? t('reports.status.invalidated')
                                            : t('reports.status.notAvailable')
                    }
                </Button>
            </TableCell>
        </TableRow>
    );
}

export default function ReportsPage() {
    const router = useRouter();
    const t = useTranslations();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    
    // Filter states
    const [selectedDriver, setSelectedDriver] = useState<any>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected' | 'Dispute'>('all');
    
    // Data hooks
    const { data: driversData, isLoading: isLoadingDrivers } = useDrivers();
    
    // Report hooks
    const downloadWeekReport = useDownloadWeekReport();
    const downloadPeriodReport = useDownloadPeriodReport();
    const statusOptions = useMemo(() => ([
        { value: 'all', label: t('reports.analytics.filters.statusAll') },
        { value: 'Pending', label: t('reports.analytics.filters.statusPending') },
        { value: 'Approved', label: t('reports.analytics.filters.statusApproved') },
        { value: 'Rejected', label: t('reports.analytics.filters.statusRejected') },
        { value: 'Dispute', label: t('reports.analytics.filters.statusDispute') },
    ]), [t]);
    
    const periodRange = useMemo(() => {
        if (!selectedPeriod?.value?.year || !selectedPeriod?.value?.periodNr) {
            return null;
        }

        const { year, periodNr } = selectedPeriod.value;
        const baseWeek = (periodNr - 1) * 4 + 1;
        const firstMonday = getIsoWeekMonday(year, baseWeek);
        const lastMonday = getIsoWeekMonday(year, baseWeek + 3);
        const lastSunday = new Date(lastMonday);
        lastSunday.setDate(lastMonday.getDate() + 6);

        return {
            startDate: dayjs(firstMonday).format('YYYY-MM-DD'),
            endDate: dayjs(lastSunday).format('YYYY-MM-DD'),
        };
    }, [selectedPeriod]);

    const reportFilters = useMemo(() => {
        if (!selectedDriver?.id || !periodRange) {
            return null;
        }

        return {
            startDate: periodRange.startDate,
            endDate: periodRange.endDate,
            driverId: selectedDriver.id as string,
            status: statusFilter,
        };
    }, [periodRange, selectedDriver, statusFilter]);

    const { data: reportData, isLoading: isReportLoading } = useRideExecutionReport(reportFilters);

    const statusLabels: Record<string, string> = {
        Pending: t('reports.analytics.status.pending'),
        Approved: t('reports.analytics.status.approved'),
        Rejected: t('reports.analytics.status.rejected'),
        Dispute: t('reports.analytics.status.dispute'),
    };
    
    // Period status check by individual weeks (works for admin roles)
    const { isPeriodSigned, isLoading: isPeriodLoading } = usePeriodStatusByWeeks(
        selectedPeriod?.value?.year || 0,
        selectedPeriod?.value?.periodNr || 0,
        (selectedDriver && selectedPeriod) ? selectedDriver.id : ''
    );
    


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
                    {t('reports.title')}
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
                        renderInput={(params) => <TextField {...params} label={t('reports.filters.driver')} />}
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
                        renderInput={(params) => <TextField {...params} label={t('reports.filters.period')} />}
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
                    {t('reports.table.title')}
                </Typography>
            </Box>

            {/* Content Area */}
            {!selectedDriver || !selectedPeriod ? (
                <Box sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                        {t('reports.table.noSelection')}
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
                                {t('reports.periodHeader.title', {
                                    year: selectedPeriod.value.year,
                                    periodNr: String(selectedPeriod.value.periodNr).padStart(2, '0')
                                })}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                {t('reports.periodHeader.description')}
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
                                ? t('reports.status.downloading')
                                : isPeriodLoading 
                                    ? t('reports.status.checkingStatus')
                                    : isPeriodSigned 
                                        ? t('reports.buttons.downloadPeriod')
                                        : t('reports.status.periodNotSigned')
                            }
                        </Button>
                    </Box>

                    {/* Table Container */}
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('reports.table.columns.week')}</TableCell>
                                    <TableCell>{t('reports.table.columns.driver')}</TableCell>
                                    <TableCell>{t('reports.table.columns.signedOn')}</TableCell>
                                    <TableCell>{t('reports.table.columns.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(() => {
                                    const baseWeek = (selectedPeriod.value.periodNr - 1) * 4 + 1;
                                    return [baseWeek, baseWeek + 1, baseWeek + 2, baseWeek + 3];
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

                    <Box sx={{ mt: 6 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 2,
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 3,
                            }}
                        >
                            <Box>
                                <Typography variant="h4" fontWeight={500}>
                                    {t('reports.analytics.title')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {t('reports.analytics.description')}
                                </Typography>
                            </Box>
                            <TextField
                                select
                                size="small"
                                label={t('reports.analytics.filters.status')}
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                                sx={{ minWidth: 200 }}
                            >
                                {statusOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>

                        {isReportLoading ? (
                            <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                                <CircularProgress size={28} />
                            </Box>
                        ) : !reportData || reportData.items.length === 0 ? (
                            <Typography variant="body1" color="text.secondary" sx={{ py: 2 }}>
                                {t('reports.analytics.noData')}
                            </Typography>
                        ) : (
                            <>
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                        gap: 2,
                                        mb: 3,
                                    }}
                                >
                                    <Box sx={{ p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('reports.analytics.summary.totalHours')}
                                        </Typography>
                                        <Typography variant="h6">
                                            {formatHours(reportData?.totals?.decimalHours)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('reports.analytics.summary.totalCompensation')}
                                        </Typography>
                                        <Typography variant="h6">
                                            {formatCurrency(reportData?.totals?.totalCompensation)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('reports.analytics.summary.nightAllowance')}
                                        </Typography>
                                        <Typography variant="h6">
                                            {formatCurrency(reportData?.totals?.nightAllowance)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('reports.analytics.summary.kilometerReimbursement')}
                                        </Typography>
                                        <Typography variant="h6">
                                            {formatCurrency(reportData?.totals?.kilometerReimbursement)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('reports.analytics.summary.taxFreeCompensation')}
                                        </Typography>
                                        <Typography variant="h6">
                                            {formatCurrency(reportData?.totals?.taxFreeCompensation)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('reports.analytics.summary.variousCompensation')}
                                        </Typography>
                                        <Typography variant="h6">
                                            {formatCurrency(reportData?.totals?.variousCompensation)}
                                        </Typography>
                                    </Box>
                                </Box>

                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>{t('reports.analytics.columns.date')}</TableCell>
                                                <TableCell>{t('reports.analytics.columns.ride')}</TableCell>
                                                <TableCell>{t('reports.analytics.columns.client')}</TableCell>
                                                <TableCell>{t('reports.analytics.columns.status')}</TableCell>
                                                <TableCell align="right">{t('reports.analytics.columns.hours')}</TableCell>
                                                <TableCell align="right">{t('reports.analytics.columns.totalCompensation')}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {reportData.items.map((item) => {
                                                const formattedDate = item.rideDate ? dayjs(item.rideDate).format('YYYY-MM-DD') : '—';
                                                const rowKey = `${item.rideId}-${item.driverId}-${item.rideDate || ''}`;
                                                return (
                                                    <TableRow key={rowKey}>
                                                        <TableCell sx={{ py: 2.2 }}>
                                                            {formattedDate}
                                                        </TableCell>
                                                        <TableCell sx={{ py: 2.2 }}>
                                                            {item.rideId}
                                                        </TableCell>
                                                        <TableCell sx={{ py: 2.2 }}>
                                                            {item.clientName || t('reports.analytics.columns.unknownClient')}
                                                        </TableCell>
                                                        <TableCell sx={{ py: 2.2 }}>
                                                            {statusLabels[item.status] || item.status}
                                                        </TableCell>
                                                        <TableCell sx={{ py: 2.2 }} align="right">
                                                            {formatHours(item.decimalHours)}
                                                        </TableCell>
                                                        <TableCell sx={{ py: 2.2 }} align="right">
                                                            {formatCurrency(item.totalCompensation)}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        )}
                    </Box>
                </>
            )}
        </Box>
    );
} 