/* app/(dashboard)/weeks-to-submit/page.tsx */
'use client';

import React, {useState, useMemo} from 'react';
import {
    Autocomplete,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import {useQueryClient} from '@tanstack/react-query';
import {useRideWeeksToSubmit, useAllowDriverForWeek, DriverWeekSummary} from '@/hooks/useRideWeeksToSubmit';
import {useDrivers} from '@/hooks/useDrivers';
import LanguageSelectDesktop from '@/components/LanguageSelectDesktop';
import {useSnack} from "@/providers/SnackProvider";
import { useTranslations } from 'next-intl';

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function WeeksToSubmitPage() {
    const qc = useQueryClient();
    const showSnack = useSnack();
    const t = useTranslations('weeksToSubmit');

    // status filter options
    const STATUS_OPTIONS = useMemo(() => [
        { label: t('statusOptions.allApproved'), value: 'All Approved' },
        { label: t('statusOptions.hasPending'), value: 'Has Pending' },
        { label: t('statusOptions.hasDisputes'), value: 'Has Disputes' },
        { label: t('statusOptions.hasRejected'), value: 'Has Rejected' },
    ], [t]);

    // Dutch ISO weeks 1-53
    const WEEK_OPTIONS = Array.from({ length: 53 }, (_, i) => ({
        label: `${i + 1}`,
        value: i + 1,
    }));

    /* ------------------------------ Filters ------------------------- */
    const [driverId, setDriverId] = useState<string | undefined>();
    const [weekNr, setWeekNr] = useState<number | undefined>();
    const [summaryStatus, setSummaryStatus] = useState<
        'All Approved' | 'Has Pending' | 'Has Disputes' | 'Has Rejected' | undefined
    >();
    const [selectedWeek, setSelectedWeek] = useState<DriverWeekSummary | null>(null);
    const [weekDetailsOpen, setWeekDetailsOpen] = useState(false);

    /* ------------------------------ Pagination ---------------------- */
    const [pageNumber, setPageNumber] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    /* ------------------------------ Selection ----------------------- */
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const toggleRow = (id: string) =>
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    const toggleAll = (rows?: DriverWeekSummary[]) => {
        if (!rows) return;
        
        // Only select weeks that can be submitted (All Approved + PendingAdmin)
        const submittableWeeks = rows.filter(w => 
            w.summaryStatus === 'All Approved' && w.status === 'PendingAdmin'
        );
        
        setSelectedIds((prev) =>
            prev.length !== submittableWeeks.length ? submittableWeeks.map((r) => r.id) : [],
        );
    };

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [successOpen, setSuccessOpen] = useState(false);

    /* ------------------------------ Data hooks ---------------------- */
    const { data: drivers } = useDrivers();
    const {
        data: allWeeks,
        isLoading,
        isRefetching,
        error,
    } = useRideWeeksToSubmit(); // No driverId - admin sees all weeks

    /* ------------------------------ Mutations ----------------------- */
    const { mutateAsync: allowDriver, isPending } = useAllowDriverForWeek();

    // Filter and paginate data on frontend
    const filteredWeeks = useMemo(() => {
        if (!allWeeks) return [];
        
        // Debug: Log all weeks to see their status
        console.log('All weeks from API:', allWeeks.map(w => ({
            id: w.id,
            driver: `${w.driver.firstName} ${w.driver.lastName}`,
            week: w.weekNumber,
            status: w.status,
            summaryStatus: w.summaryStatus,
            pendingCount: w.pendingCount,
            disputeCount: w.disputeCount,
            rejectedCount: w.rejectedCount
        })));
        
        return allWeeks.filter(week => {
            // Only show weeks that are in PendingAdmin status (ready for admin action)
            if (week.status !== 'PendingAdmin') return false;
            
            // Apply user filters
            if (driverId && week.driverId !== driverId) return false;
            if (weekNr && week.weekNumber !== weekNr) return false;
            if (summaryStatus && week.summaryStatus !== summaryStatus) return false;
            return true;
        });
    }, [allWeeks, driverId, weekNr, summaryStatus]);

    // Paginate filtered results
    const paginatedWeeks = useMemo(() => {
        const startIndex = (pageNumber - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredWeeks.slice(startIndex, endIndex);
    }, [filteredWeeks, pageNumber, rowsPerPage]);

    const totalCount = filteredWeeks.length;

    const handleSendSelected = async () => {
        try {
            console.log('Submitting weeks with IDs:', selectedIds);
            
            // Debug: Show details of selected weeks
            const selectedWeeksDetails = paginatedWeeks?.filter(w => selectedIds.includes(w.id));
            console.log('Selected weeks details:', selectedWeeksDetails?.map(w => ({
                id: w.id,
                driver: `${w.driver.firstName} ${w.driver.lastName}`,
                week: w.weekNumber,
                status: w.status,
                summaryStatus: w.summaryStatus
            })));
            
            for (const id of selectedIds) {
                console.log(`Calling allowDriver for week ID: ${id}`);
                await allowDriver(id);
            }
            setSuccessOpen(true);
        } catch (e: any) {
            console.error('Error submitting weeks:', e);
            showSnack({
                text: e?.response?.data?.errors?.[0] ?? t('error.submitFailed'),
                severity: 'error',
            });
        } finally {
            setSelectedIds([]);
            await qc.invalidateQueries({ queryKey: ['rideWeeksToSubmit'] });
        }
    };

    /* ---------------------------------------------------------------- */

    return (
        <Box py={4}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h3" fontWeight={500}>
                    {t('title')}
                </Typography>
                <LanguageSelectDesktop />
            </Box>

            <Paper variant="outlined" sx={{p: 3}}>
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 3,
                    }}
                >
                    <Typography variant="h4" fontWeight={500}>
                        {t('subtitle')}
                    </Typography>

                    {(isLoading || isRefetching) ? (
                        <CircularProgress size={20} />
                    ) : (
                        <IconButton onClick={() => qc.invalidateQueries({ queryKey: ['rideWeeksToSubmit']})}>
                            <SyncIcon sx={{ transform: 'rotate(90deg)' }} />
                        </IconButton>
                    )}
                </Box>
                <Typography variant="body1" sx={{mb:3}}>
                    {t('description')}
                </Typography>

                {/* Filters + bulk send */}
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        gap: 1,
                        mb: 3,
                        alignItems: 'center',
                    }}
                >
                    {/* Filters group */}
                    <Box display="flex" gap={1} flexWrap="wrap">
                        <Autocomplete
                            size="small"
                            options={drivers || []}
                            getOptionLabel={(d) =>
                                `${d.user?.firstName ?? ''} ${d.user?.lastName ?? ''}`
                            }
                            sx={{ minWidth: 180 }}
                            onChange={(_, v) => setDriverId(v?.id)}
                            renderInput={(p) => <TextField {...p} label={t('filters.driver')} />}
                        />

                        <Autocomplete
                            size="small"
                            options={WEEK_OPTIONS}
                            sx={{ minWidth: 150 }}
                            onChange={(_, v) => setWeekNr(v?.value)}
                            renderInput={(p) => <TextField {...p} label={t('filters.week')} />}
                        />

                        <Autocomplete
                            size="small"
                            options={STATUS_OPTIONS}
                            sx={{ minWidth: 180 }}
                            onChange={(_, v) =>
                                setSummaryStatus(v?.value as typeof summaryStatus | undefined)
                            }
                            renderInput={(p) => <TextField {...p} label={t('filters.status')} />}
                        />
                    </Box>

                    {/* Bulk send button */}
                    <Button
                        variant="contained"
                        disabled={selectedIds.length === 0 || isPending}
                        onClick={() => setConfirmOpen(true)}
                        sx={{ whiteSpace: 'nowrap' }}
                    >
                        {isPending ? t('actions.sending') : t('actions.sendAllSelected')}
                    </Button>
                </Box>

                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        size="small"
                                        checked={(() => {
                                            if (!paginatedWeeks) return false;
                                            const submittableWeeks = paginatedWeeks.filter(w => 
                                                w.summaryStatus === 'All Approved' && w.status === 'PendingAdmin'
                                            );
                                            return submittableWeeks.length > 0 && selectedIds.length === submittableWeeks.length;
                                        })()}
                                        indeterminate={(() => {
                                            if (!paginatedWeeks) return false;
                                            const submittableWeeks = paginatedWeeks.filter(w => 
                                                w.summaryStatus === 'All Approved' && w.status === 'PendingAdmin'
                                            );
                                            return selectedIds.length > 0 && selectedIds.length < submittableWeeks.length;
                                        })()}
                                        onChange={() => toggleAll(paginatedWeeks)}
                                    />
                                </TableCell>
                                <TableCell>{t('table.headers.driver')}</TableCell>
                                <TableCell>{t('table.headers.week')}</TableCell>
                                <TableCell align="right">{t('table.headers.totalHours')}</TableCell>
                                <TableCell>{t('table.headers.status')}</TableCell>
                                <TableCell align="right">{t('table.headers.forecasted')}</TableCell>
                                <TableCell>{t('table.headers.actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(isLoading || isRefetching) && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            )}

                            {!isLoading &&
                                paginatedWeeks?.map((w) => {
                                    const disabled =
                                        w.summaryStatus === 'Has Pending' ||
                                        w.summaryStatus === 'Has Disputes' ||
                                        w.summaryStatus === 'Has Rejected';
                                    
                                    const canSubmit = w.summaryStatus === 'All Approved' && w.status === 'PendingAdmin';

                                    return (
                                        <TableRow
                                            key={w.id}
                                            hover
                                            selected={selectedIds.includes(w.id)}
                                        >
                                            <TableCell padding="checkbox" sx={{ py: 2.6 }}>
                                                <Checkbox
                                                    size="small"
                                                    checked={selectedIds.includes(w.id)}
                                                    onChange={() => toggleRow(w.id)}
                                                    disabled={!canSubmit}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ py: 2.6 }}>
                                                {w.driver.firstName} {w.driver.lastName}
                                            </TableCell>
                                            <TableCell sx={{ py: 2.6 }}>{t('table.weekNumber', { number: w.weekNumber })}</TableCell>
                                            <TableCell align="right" sx={{ py: 2.6 }}>
                                                {t('table.hours', { hours: w.totalHours.toFixed(1) })}
                                            </TableCell>
                                            <TableCell sx={{ py: 2.6 }}>
                                               {w.rejectedCount > 0 ? (
                                                    `${w.rejectedCount} ${w.rejectedCount === 1 ? t('table.rejected') : t('table.rejects')}`
                                                ) : w.disputeCount > 0 ? (
                                                    `${w.disputeCount} ${w.disputeCount === 1 ? t('table.dispute') : t('table.disputes')}`
                                                ) : w.pendingCount > 0 ? (
                                                    `${w.pendingCount} ${t('table.pending')}`
                                                ) : (
                                                    w.summaryStatus
                                                )}
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 2.6 }}>
                                                €{w.totalCompensation.toFixed(2)}
                                            </TableCell>
                                            <TableCell sx={{ py: 2.6 }}>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    disabled={disabled}
                                                    onClick={() => {
                                                        setSelectedWeek(w);
                                                        setWeekDetailsOpen(true);
                                                    }}
                                                >
                                                    {t('actions.seeOverview')}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    count={totalCount}
                    rowsPerPage={rowsPerPage}
                    page={pageNumber - 1}
                    onPageChange={(_, p) => setPageNumber(p + 1)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPageNumber(1);
                    }}
                />
            </Paper>

            {/* Error display */}
            {error && (
                <Box mt={2} color="error.main">
                    {(error as any).message}
                </Box>
            )}

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs">
              <DialogContent sx={{ pt: 3, pl: 3, pr: 3 }}>
                <Typography variant="h5" gutterBottom>
                  {t('confirmDialog.title')}
                </Typography>
                <Typography variant="subtitle1">
                  {t('confirmDialog.subtitle')}
                </Typography>
              </DialogContent>
              <DialogActions sx={{ pb: 3, pl: 3, pr: 3 }}>
                <Button
                  fullWidth
                  color="success"
                  variant="contained"
                  onClick={async () => {
                    setConfirmOpen(false);
                    await handleSendSelected();
                  }}
                >
                  {t('confirmDialog.submit')}
                </Button>
                <Button fullWidth onClick={() => setConfirmOpen(false)} >
                  {t('confirmDialog.cancel')}
                </Button>
              </DialogActions>
            </Dialog>

            <Dialog open={successOpen} onClose={() => setSuccessOpen(false)} maxWidth="md">
              <DialogContent sx={{ pt: 8, pl: 4, pr: 4, pb:8, textAlign: 'center' }}>
                <Box display="flex" justifyContent="center" mb={2}>
                  <Box
                    sx={{
                      backgroundColor: 'success.main',
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h4" color="white">✓</Typography>
                  </Box>
                </Box>
                <Typography variant="h5" gutterBottom>
                  {t('successDialog.title')}
                </Typography>
                <Typography variant="subtitle1" mb={3}>
                  {t('successDialog.subtitle')}
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  href="/rides/executions"
                  sx={{ backgroundColor: '#0070f3' }}
                >
                  {t('successDialog.goToOverview')}
                </Button>
              </DialogContent>
            </Dialog>

            {/* Week Overview Dialog */}
            <Dialog 
              open={weekDetailsOpen} 
              onClose={() => setWeekDetailsOpen(false)} 
              maxWidth="md"
              fullWidth
            >
              <DialogContent sx={{ p: 3 }}>
                {selectedWeek && (
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {t('weekOverviewDialog.title', {
                        week: selectedWeek.weekNumber,
                        year: selectedWeek.year,
                        driverName: `${selectedWeek.driver.firstName} ${selectedWeek.driver.lastName}`
                      })}
                    </Typography>
                    
                    <Box sx={{ mb: 3, display: 'flex', gap: 3 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">{t('weekOverviewDialog.fields.executions')}</Typography>
                        <Typography variant="h6">{selectedWeek.executionCount}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">{t('weekOverviewDialog.fields.totalHours')}</Typography>
                        <Typography variant="h6">{selectedWeek.totalHours.toFixed(1)}h</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">{t('weekOverviewDialog.fields.totalCompensation')}</Typography>
                        <Typography variant="h6">€{selectedWeek.totalCompensation.toFixed(2)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">{t('weekOverviewDialog.fields.status')}</Typography>
                        <Typography variant="h6">{selectedWeek.summaryStatus}</Typography>
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      {t('weekOverviewDialog.fields.weekPeriod', {
                        startDate: selectedWeek.weekStartDate,
                        periodNumber: selectedWeek.periodNumber
                      })}
                    </Typography>
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setWeekDetailsOpen(false)}>{t('weekOverviewDialog.buttons.close')}</Button>
              </DialogActions>
            </Dialog>
        </Box>
    );
}
