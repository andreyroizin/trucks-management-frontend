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
import {useWeeksToSubmit, WeekToSubmit} from '@/hooks/useWeeksToSubmit';
import {useAllowDriverForWeek} from '@/hooks/useAllowDriverForWeek';
import {useDrivers} from '@/hooks/useDrivers';
import LanguageSelectDesktop from '@/components/LanguageSelectDesktop';
import {useSnack} from "@/providers/SnackProvider";
import Link from "next/link";
import WeekApprovalOverviewModal from "@/components/WeekApprovalOverviewModal";
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
        { label: t('statusOptions.hasDisputes'), value: 'hasDisputes' },
        { label: t('statusOptions.allApproved'), value: 'allApprovedOrRejected' },
        { label: t('statusOptions.hasPending'), value: 'hasPending' },
        { label: t('statusOptions.hasRejected'), value: 'hasRejected' },
    ], [t]);

    // Dutch ISO weeks 1-53
    const WEEK_OPTIONS = Array.from({ length: 53 }, (_, i) => ({
        label: `${i + 1}`,
        value: i + 1,
    }));

    /* ------------------------------ Filters ------------------------- */
    const [driverId, setDriverId] = useState<string | undefined>();
    const [weekNr, setWeekNr] = useState<number | undefined>();
    const [status, setStatus] = useState<
        'hasDisputes' | 'allApproved' | 'hasPending' | 'hasRejected' | undefined
    >();
    const [weekApprovalId, setWeekApprovalId] = useState<string | null>(null);
    const [weekApprovalOverviewOpen, setWeekApprovalOverviewOpen] = useState(false);

    /* ------------------------------ Pagination ---------------------- */
    const [pageNumber, setPageNumber] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    /* ------------------------------ Selection ----------------------- */
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const toggleRow = (id: string) =>
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    const toggleAll = (rows?: WeekToSubmit[]) =>
        setSelectedIds((prev) =>
            rows && prev.length !== rows.length ? rows.map((r) => r.id) : [],
        );

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [successOpen, setSuccessOpen] = useState(false);

    /* ------------------------------ Data hooks ---------------------- */
    const { data: drivers } = useDrivers();
    const {
        data,
        isLoading,
        isRefetching,
        error,
    } = useWeeksToSubmit({
        driverId,
        weekNr,
        status,
        pageNumber,
        pageSize: rowsPerPage,
    });

    /* ------------------------------ Mutations ----------------------- */
    const { mutateAsync: allowDriver, isPending } = useAllowDriverForWeek();

    const handleSendSelected = async () => {
        try {
            for (const id of selectedIds) {
                await allowDriver(id);
            }
            setSuccessOpen(true);
        } catch (e: any) {
            showSnack({
                text: e?.response?.data?.errors?.[0] ?? t('error.submitFailed'),
                severity: 'error',
            });
        } finally {
            setSelectedIds([]);
            await qc.invalidateQueries({ queryKey: ['weeksToSubmit'] });
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
                        <IconButton onClick={() => qc.invalidateQueries({ queryKey: ['weeksToSubmit']})}>
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
                                setStatus(v?.value as typeof status | undefined)
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
                                        checked={
                                            !!data?.data &&
                                            selectedIds.length === data.data.length
                                        }
                                        indeterminate={
                                            !!data?.data &&
                                            selectedIds.length > 0 &&
                                            selectedIds.length < data.data.length
                                        }
                                        onChange={() => toggleAll(data?.data)}
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
                                data?.data?.map((w) => {
                                    const disabled =
                                        w.summaryStatus === 'Has Pending' ||
                                        w.summaryStatus === 'Has Disputes' ||
                                        w.summaryStatus === 'Has Rejected';

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
                                                />
                                            </TableCell>
                                            <TableCell sx={{ py: 2.6 }}>
                                                {w.driver.firstName} {w.driver.lastName}
                                            </TableCell>
                                            <TableCell sx={{ py: 2.6 }}>{t('table.weekNumber', { number: w.weekNr })}</TableCell>
                                            <TableCell align="right" sx={{ py: 2.6 }}>
                                                {t('table.hours', { hours: w.totalHours.toFixed(1) })}
                                            </TableCell>
                                            <TableCell sx={{ py: 2.6 }}>
                                               {w.rejectedCount > 0 ? (
                                                    <Link
                                                        href={`/partrides?weekNumbers=${w.weekNr}&driverIds=${w.driver.driverId}&statusIds=3`}
                                                        style={{ textDecoration: 'underline' }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {w.rejectedCount} {w.rejectedCount === 1 ? t('table.rejected') : t('table.rejects')}
                                                    </Link>
                                                ) : w.disputeCount > 0 ? (
                                                    <Link
                                                        href={`/partrides?weekNumbers=${w.weekNr}&driverIds=${w.driver.driverId}&statusIds=1`}
                                                        style={{ textDecoration: 'underline' }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {w.disputeCount} {w.disputeCount === 1 ? t('table.dispute') : t('table.disputes')}
                                                    </Link>
                                                ) : w.pendingAdminCount > 0 ? (
                                                    <Link
                                                        href={`/partrides?weekNumbers=${w.weekNr}&driverIds=${w.driver.driverId}&statusIds=0`}
                                                        style={{ textDecoration: 'underline' }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {w.pendingAdminCount} {t('table.pending')}
                                                    </Link>
                                                ) : (
                                                    w.summaryStatus
                                                )}
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 2.6 }}>
                                                €{w.forecastedEarning.toFixed(2)}
                                            </TableCell>
                                            <TableCell sx={{ py: 2.6 }}>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    disabled={disabled}
                                                    onClick={() => {
                                                        setWeekApprovalId(w.id)
                                                        setWeekApprovalOverviewOpen(true)
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
                    count={data?.totalCount ?? 0}
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
                  href="/partrides"
                  sx={{ backgroundColor: '#0070f3' }}
                >
                  {t('successDialog.goToOverview')}
                </Button>
              </DialogContent>
            </Dialog>
            {weekApprovalId && (
                <WeekApprovalOverviewModal
                    open={weekApprovalOverviewOpen}
                    weekApprovalId={weekApprovalId}
                    onClose={() => {
                        setWeekApprovalOverviewOpen(false)
                        setWeekApprovalId(null);
                    }}
                />
            )}
        </Box>
    );
}
