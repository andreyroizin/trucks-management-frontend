'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useAnnualStatements } from '@/hooks/useAnnualStatements';
import { usePendingDepartures } from '@/hooks/usePendingDepartures';
import { useOverdueStatements } from '@/hooks/useOverdueStatements';
import { useGenerateAnnualStatement } from '@/hooks/useGenerateAnnualStatement';
import { useGenerateDepartureStatement } from '@/hooks/useGenerateDepartureStatement';
import { useGenerateYearEndBatch } from '@/hooks/useGenerateYearEndBatch';
import { useDownloadAnnualStatement } from '@/hooks/useDownloadAnnualStatement';
import LanguageSelectDesktop from '@/components/LanguageSelectDesktop';
import BatchProgressModal from '@/components/BatchProgressModal';
import DownloadIcon from '@mui/icons-material/DownloadRounded';
import PlayArrowIcon from '@mui/icons-material/PlayArrowRounded';
import WarningIcon from '@mui/icons-material/WarningAmberRounded';
import SyncIcon from '@mui/icons-material/Sync';
import dayjs from 'dayjs';

const formatCurrency = (value: number) => `\u20AC${value.toFixed(2)}`;
const formatHours = (value: number) => value.toFixed(1);

function StatusChip({ status, t }: { status: string; t: any }) {
    switch (status) {
        case 'Generated':
            return <Chip label={t('annualStatements.active.statusGenerated')} color="success" size="small" />;
        case 'Sent':
            return <Chip label={t('annualStatements.active.statusSent')} color="info" size="small" />;
        default:
            return <Chip label={t('annualStatements.active.statusPending')} color="warning" size="small" />;
    }
}

export default function AnnualStatementsPage() {
    const router = useRouter();
    const t = useTranslations();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    const [activeTab, setActiveTab] = useState(0);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 1);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [batchModalOpen, setBatchModalOpen] = useState(false);

    const currentYear = new Date().getFullYear();
    const yearOptions = useMemo(() => {
        const years = [];
        for (let y = currentYear; y >= currentYear - 5; y--) {
            years.push(y);
        }
        return years;
    }, [currentYear]);

    const {
        data: statementsData,
        isLoading: isLoadingStatements,
        refetch: refetchStatements,
    } = useAnnualStatements({
        year: selectedYear,
        pageNumber: page + 1,
        pageSize,
    });

    const {
        data: pendingDepartures,
        isLoading: isLoadingPending,
        refetch: refetchPending,
    } = usePendingDepartures();

    const {
        data: overdueStatements,
        isLoading: isLoadingOverdue,
    } = useOverdueStatements();

    const generateStatement = useGenerateAnnualStatement();
    const generateDeparture = useGenerateDepartureStatement();
    const generateBatch = useGenerateYearEndBatch();
    const downloadStatement = useDownloadAnnualStatement();

    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'employer', 'customerAccountant'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, authLoading, router, user?.roles]);

    const handleDownload = (id: string, driverName: string, year: number) => {
        downloadStatement.mutate({
            id,
            fileName: `jaaropgave_${driverName.replace(/\s+/g, '_')}_${year}.pdf`,
        });
    };

    const handleGenerateForDeparture = (driverId: string) => {
        generateDeparture.mutate(driverId);
    };

    const handleBatchGenerate = () => {
        setBatchModalOpen(true);
    };

    const handleRefresh = () => {
        refetchStatements();
        refetchPending();
    };

    const overdueCount = overdueStatements?.length ?? 0;

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
                <Box>
                    <Typography variant="h3" fontWeight={500}>
                        {t('annualStatements.title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {t('annualStatements.subtitle')}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={handleRefresh}>
                        <SyncIcon sx={{ transform: 'rotate(90deg)' }} />
                    </IconButton>
                    <LanguageSelectDesktop />
                </Box>
            </Box>

            {/* Overdue warning banner */}
            {overdueCount > 0 && (
                <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
                    {t('annualStatements.departing.overdueWarning', { count: overdueCount })}
                </Alert>
            )}

            {/* Tabs */}
            <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
                <Tab label={t('annualStatements.tabs.active')} />
                <Tab
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {t('annualStatements.tabs.departing')}
                            {overdueCount > 0 && (
                                <Chip label={overdueCount} color="error" size="small" />
                            )}
                        </Box>
                    }
                />
            </Tabs>

            {/* Tab 0: Active Employees - Year-End */}
            {activeTab === 0 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h5" fontWeight={500}>
                                {t('annualStatements.active.title')}
                            </Typography>
                            <TextField
                                select
                                size="small"
                                value={selectedYear}
                                onChange={(e) => {
                                    setSelectedYear(Number(e.target.value));
                                    setPage(0);
                                }}
                                SelectProps={{ native: true }}
                                sx={{ minWidth: 100 }}
                            >
                                {yearOptions.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </TextField>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<PlayArrowIcon />}
                            onClick={handleBatchGenerate}
                            disabled={generateBatch.isPending}
                        >
                            {generateBatch.isPending
                                ? t('annualStatements.active.generating')
                                : t('annualStatements.active.generateAll')}
                        </Button>
                    </Box>

                    {isLoadingStatements ? (
                        <Box display="flex" justifyContent="center" py={6}>
                            <CircularProgress />
                        </Box>
                    ) : !statementsData?.data?.length ? (
                        <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                            {t('annualStatements.active.noData')}
                        </Typography>
                    ) : (
                        <>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>{t('annualStatements.active.table.employee')}</TableCell>
                                            <TableCell align="right">{t('annualStatements.active.table.hours')}</TableCell>
                                            <TableCell align="right">{t('annualStatements.active.table.grossWage')}</TableCell>
                                            <TableCell align="right">{t('annualStatements.active.table.vacation')}</TableCell>
                                            <TableCell>{t('annualStatements.active.table.status')}</TableCell>
                                            <TableCell>{t('annualStatements.active.table.generatedAt')}</TableCell>
                                            <TableCell>{t('annualStatements.active.table.actions')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {statementsData.data.map((stmt) => (
                                            <TableRow key={stmt.id} hover>
                                                <TableCell sx={{ py: 2.2 }}>
                                                    {stmt.driverFirstName} {stmt.driverLastName}
                                                </TableCell>
                                                <TableCell sx={{ py: 2.2 }} align="right">
                                                    {formatHours(stmt.totalHoursWorked)}
                                                </TableCell>
                                                <TableCell sx={{ py: 2.2 }} align="right">
                                                    {formatCurrency(stmt.totalGrossWage)}
                                                </TableCell>
                                                <TableCell sx={{ py: 2.2 }} align="right">
                                                    {stmt.vacationDaysRemaining} / {stmt.vacationDaysEntitled}
                                                </TableCell>
                                                <TableCell sx={{ py: 2.2 }}>
                                                    <StatusChip status={stmt.status} t={t} />
                                                </TableCell>
                                                <TableCell sx={{ py: 2.2 }}>
                                                    {dayjs(stmt.generatedAt).format('DD-MM-YYYY')}
                                                </TableCell>
                                                <TableCell sx={{ py: 2.2 }}>
                                                    <Tooltip title={t('annualStatements.actions.download')}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDownload(
                                                                stmt.id,
                                                                `${stmt.driverFirstName}_${stmt.driverLastName}`,
                                                                stmt.year
                                                            )}
                                                            disabled={downloadStatement.isPending}
                                                        >
                                                            <DownloadIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                component="div"
                                count={statementsData.totalCount}
                                page={page}
                                onPageChange={(_, newPage) => setPage(newPage)}
                                rowsPerPage={pageSize}
                                onRowsPerPageChange={(e) => {
                                    setPageSize(parseInt(e.target.value, 10));
                                    setPage(0);
                                }}
                                rowsPerPageOptions={[5, 10, 25]}
                            />
                        </>
                    )}
                </Box>
            )}

            {/* Tab 1: Departing Employees */}
            {activeTab === 1 && (
                <Box>
                    <Typography variant="h5" fontWeight={500} sx={{ mb: 3 }}>
                        {t('annualStatements.departing.title')}
                    </Typography>

                    {isLoadingPending ? (
                        <Box display="flex" justifyContent="center" py={6}>
                            <CircularProgress />
                        </Box>
                    ) : !pendingDepartures?.length ? (
                        <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                            {t('annualStatements.departing.noData')}
                        </Typography>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('annualStatements.departing.table.employee')}</TableCell>
                                        <TableCell>{t('annualStatements.departing.table.company')}</TableCell>
                                        <TableCell>{t('annualStatements.departing.table.terminationDate')}</TableCell>
                                        <TableCell align="right">{t('annualStatements.departing.table.daysSince')}</TableCell>
                                        <TableCell>{t('annualStatements.departing.table.status')}</TableCell>
                                        <TableCell>{t('annualStatements.departing.table.actions')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pendingDepartures.map((dep) => (
                                        <TableRow key={dep.driverId} hover>
                                            <TableCell sx={{ py: 2.2 }}>
                                                {dep.firstName} {dep.lastName}
                                            </TableCell>
                                            <TableCell sx={{ py: 2.2 }}>
                                                {dep.companyName}
                                            </TableCell>
                                            <TableCell sx={{ py: 2.2 }}>
                                                {dayjs(dep.terminationDate).format('DD-MM-YYYY')}
                                            </TableCell>
                                            <TableCell sx={{ py: 2.2 }} align="right">
                                                {dep.daysSinceTermination}
                                            </TableCell>
                                            <TableCell sx={{ py: 2.2 }}>
                                                {dep.isOverdue ? (
                                                    <Chip
                                                        label={t('annualStatements.departing.statusOverdue')}
                                                        color="error"
                                                        size="small"
                                                    />
                                                ) : (
                                                    <Chip
                                                        label={t('annualStatements.departing.statusPending')}
                                                        color="warning"
                                                        size="small"
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ py: 2.2 }}>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<PlayArrowIcon />}
                                                    onClick={() => handleGenerateForDeparture(dep.driverId)}
                                                    disabled={generateDeparture.isPending}
                                                >
                                                    {t('annualStatements.actions.generateNow')}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            )}

            {/* Batch Generation Modal */}
            <BatchProgressModal
                open={batchModalOpen}
                year={selectedYear}
                onClose={() => {
                    setBatchModalOpen(false);
                    refetchStatements();
                }}
            />
        </Box>
    );
}
