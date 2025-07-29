'use client';

import ConfirmModal from '@/components/ConfirmModal';
import {useDeletePartRide} from '@/hooks/useDeletePartRide';
import React, {useEffect, useState} from 'react';
import {
    Box,
    Checkbox,
    CircularProgress,
    Divider,
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
import Autocomplete from '@mui/material/Autocomplete';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import {PartRide, usePartRides} from '@/hooks/usePartRides';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);
import {PartRideStatusChip} from '@/components/PartRideStatusChip'; // or from '@/utils/statusChip'
import {useRouter} from 'next/navigation';
import {useAuth} from '@/hooks/useAuth';
// import { useCompanies } from '@/hooks/useCompanies';
import {useClients} from '@/hooks/useClients';
import {useDrivers} from '@/hooks/useDrivers';
import {useCars} from '@/hooks/useCars';
import LanguageSelectDesktop from "@/components/LanguageSelectDesktop";
import DateInputField from '@/components/DateInputField';
import PartRideActionsMenu from "@/components/PartRideActionsMenu";
import DisputeCreateDialog from "@/components/DisputeCreateDialog";
import {useSnack} from "@/providers/SnackProvider";
import {useApprovePartRide} from "@/hooks/useApprovePartRide";
import {useRejectPartRide} from "@/hooks/useRejectPartRide";
import {WEEKEND_HOLIDAY_BG} from "@/utils/constants/styles";
import {isHolidayDayjs} from "@/utils/constants/dutchHolidays";
import {useTranslations} from 'next-intl';

export default function TripsManagementPage() {
    const router = useRouter();
    const {isAuthenticated, loading: authLoading} = useAuth();
    const showSnack = useSnack();
    const t = useTranslations('partrides.page');

    const queryClient = useQueryClient();

    const handleRefetch = async () => {
        await queryClient.invalidateQueries({queryKey: ['partRides']});
    };

    // Ensure only authenticated users can access
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Local states for filters (prefilled from URL)
    // const [companyId, setCompanyId] = useState(searchParams.get('companyId') || '');
    const [clientIds, setClientIds] = useState<string[]>([]);
    const [driverIds, setDriverIds] = useState<string[]>([]);
    const [carIds, setCarIds] = useState<string[]>([]);
    const [statusIds, setStatusIds] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
    const [weekNumbers, setWeekNumbers] = useState<string[]>([]);
    const [weekDays, setWeekDays] = useState<string[]>([]); // Mon = 1, … Sun = 0
    const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
    const [openCreateDispute, setOpenCreateDispute] = useState(false);
    const [disputePartRideId, setDisputePartRideId] = useState<string | null>(null);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
    const [bulkDeleteCount, setBulkDeleteCount] = useState(0);

    // Hooks for filter dropdown data
    // const { data: companiesData, isLoading: isLoadingCompanies } = useCompanies();
    const {data: clientsData, isLoading: isLoadingClients} = useClients(1, 1000);
    const {data: driversData, isLoading: isLoadingDrivers} = useDrivers();
    const {data: carsData, isLoading: isLoadingCars} = useCars([], 1, 1000);
    const {mutateAsync: approveRide} = useApprovePartRide();
    const {mutateAsync: rejectRide} = useRejectPartRide();
    const {mutate: deletePartRide} = useDeletePartRide();

    // Pagination
    const [pageNumber, setPageNumber] = useState(1);

    const [rowsPerPage, setRowsPerPage] = useState(10);
    // Confirm delete modal state
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const {data: rides, isLoading, isRefetching, error} = usePartRides({
        clientIds,
        driverIds,
        carIds,
        statusIds,
        startDate: startDate?.format('YYYY-MM-DD'),
        endDate: endDate?.format('YYYY-MM-DD'),
        weekNumbers,
        weekDays,
        pageNumber,
        pageSize: rowsPerPage,
    });

    // Selection
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const toggleRow = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (!rides?.data.length) return;
        if (selectedIds.length === rides.data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(rides.data.map(r => r.id));
        }
    };

    /** ────────────────────────────────────────────────────────────────
     * Bulk actions
     * ───────────────────────────────────────────────────────────── */
    const handleConfirmBulkDelete = async () => {
        setIsBulkDeleting(true);
        setConfirmBulkDeleteOpen(false);

        // Delete one by one
        for (const id of selectedIds) {
            try {
                await new Promise<void>((resolve, reject) => {
                    deletePartRide(id, {
                        onSuccess: () => resolve(),
                        onError: (err) => reject(err),
                    });
                });
            } catch (e) {
                console.error('Failed to delete part ride:', e);
                // Continue with others
            }
        }

        setIsBulkDeleting(false);
        setSelectedIds([]);
        await handleRefetch();
    };

    const handleApproveSelected = async () => {
        try {
            // Approve all selected
            await Promise.all(selectedIds.map(id => approveRide(id)));
            showSnack({text: t('messages.approvedSelected'), severity: 'success'});
            setSelectedIds([]);
        } catch (e: any) {
            showSnack({
                text: e?.response?.data?.errors?.[0] ?? t('messages.approveSelectedFailed'),
                severity: 'error',
            });
        } finally {
            await handleRefetch();
        }
    };

    const handleRejectSelected = async () => {
        try {
            // Reject all selected
            await Promise.all(selectedIds.map(id => rejectRide(id)));
            showSnack({text: t('messages.rejectedSelected'), severity: 'success'});
            setSelectedIds([]);
        } catch (e: any) {
            showSnack({
                text: e?.response?.data?.errors?.[0] ?? t('messages.rejectSelectedFailed'),
                severity: 'error',
            });
        } finally {
            await handleRefetch();
        }
    };

    const handleDeleteSelected = () => {
        if (selectedIds.length === 0) return;
        setBulkDeleteCount(selectedIds.length);
        setConfirmBulkDeleteOpen(true);
    };

    /** ────────────────────────────────────────────────────────────────
     * Row-level actions
     * ───────────────────────────────────────────────────────────── */
    const handleApprove = async (row: PartRide) => {
        try {
            await approveRide(row.id);
            showSnack({text: t('messages.approveSuccess'), severity: 'success'});
        } catch (e: any) {
            showSnack({
                text: e?.response?.data?.errors?.[0] ?? t('messages.approveFailed'),
                severity: 'error',
            });
        } finally {
            await handleRefetch();           // refresh list
        }
    };

    const handleDispute = (row: PartRide) => {
        setDisputePartRideId(row.id);     // remember which ride we're disputing
        setOpenCreateDispute(true);
    };

    const handleReject = async (row: PartRide) => {
        try {
            await rejectRide(row.id);
            showSnack({text: t('messages.rejectSuccess'), severity: 'success'});
        } catch (e: any) {
            showSnack({
                text: e?.response?.data?.errors?.[0] ?? t('messages.rejectFailed'),
                severity: 'error',
            });
        } finally {
            await handleRefetch();
        }
    };

    const handleDelete = (row: PartRide) => {
        setConfirmDeleteId(row.id);
    };

    /** ────────────────────────────────────────────────────────────────
     * Render
     * ───────────────────────────────────────────────────────────── */
    return (
        <Box sx={{py: 4}}>
            <Box sx={{mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h3" fontWeight={500}>
                    {t('title')}
                </Typography>
                <LanguageSelectDesktop/>
            </Box>

            {/* Filters */}
            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4, justifyContent: 'space-between'}}>
                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1}}>
                    <Autocomplete
                        multiple
                        size="small"
                        options={Array.from({ length: 53 }, (_, i) => ({ label: `${i + 1}`, value: String(i + 1) }))}
                        value={weekNumbers.map((v) => ({ label: v, value: v }))}
                        onChange={(_, selected) => setWeekNumbers(selected.map((d) => d.value))}
                        sx={{minWidth: 200, maxWidth: 200}}
                        renderInput={(p) => <TextField {...p} label={t('filters.weeks')} />}
                    />
                    <Autocomplete
                        multiple
                        size="small"
                        options={[
                            { label: t('filters.weekdayOptions.monday'),    value: '1' },
                            { label: t('filters.weekdayOptions.tuesday'),   value: '2' },
                            { label: t('filters.weekdayOptions.wednesday'), value: '3' },
                            { label: t('filters.weekdayOptions.thursday'),  value: '4' },
                            { label: t('filters.weekdayOptions.friday'),    value: '5' },
                            { label: t('filters.weekdayOptions.saturday'),  value: '6' },
                            { label: t('filters.weekdayOptions.sunday'),    value: '0' },
                        ]}
                        value={weekDays.map((v) => ({
                            label: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][Number(v)],
                            value: v,
                        }))}
                        onChange={(_, selected) => setWeekDays(selected.map((d) => d.value))}
                        getOptionLabel={(o) => o.label}
                        isOptionEqualToValue={(a, b) => a.value === b.value}
                        sx={{ minWidth: 200, maxWidth: 200 }}
                        renderInput={(params) => <TextField {...params} label={t('filters.weekdays')} />}
                    />
                    <Autocomplete
                        multiple
                        size="small"
                        options={[
                            {label: t('filters.statusOptions.pendingAdmin'), value: '0'},
                            {label: t('filters.statusOptions.dispute'), value: '1'},
                            {label: t('filters.statusOptions.accepted'), value: '2'},
                            {label: t('filters.statusOptions.rejected'), value: '3'},
                        ]}
                        value={statusIds.map((id) => ({
                            label:
                                id === '0'
                                    ? t('filters.statusOptions.pendingAdmin')
                                    : id === '1'
                                        ? t('filters.statusOptions.dispute')
                                        : id === '2'
                                            ? t('filters.statusOptions.accepted')
                                            : id === '3'
                                                ? t('filters.statusOptions.rejected')
                                                : id,
                            value: id,
                        }))}
                        onChange={(_, newValues) => {
                            setStatusIds(newValues.map((v) => v.value));
                        }}
                        getOptionLabel={(option) => option.label}
                        isOptionEqualToValue={(option, value) => option.value === value.value}
                        sx={{minWidth: 200, maxWidth: 200}}
                        renderInput={(params) => <TextField {...params} label={t('filters.statuses')}/>}
                        freeSolo={false}
                    />

                    <Autocomplete
                        multiple
                        size="small"
                        options={carsData?.cars || []}
                        getOptionLabel={(o) => o.licensePlate}
                        loading={isLoadingCars}
                        value={carsData?.cars?.filter((c) => carIds.includes(c.id)) || []}
                        onChange={(_, selected) => {
                            setCarIds(selected.map((c) => c.id));
                        }}
                        sx={{minWidth: 200, maxWidth: 200}}
                        renderInput={(p) => <TextField {...p} label={t('filters.vehicles')}/>}
                    />

                    <Autocomplete
                        multiple
                        size="small"
                        options={driversData || []}
                        getOptionLabel={(o) => (o.user?.firstName + ' ' + o.user?.lastName)}
                        loading={isLoadingDrivers}
                        value={driversData?.filter((d) => driverIds.includes(d.id)) || []}
                        onChange={(_, selected) => {
                            const ids = selected.map((d) => d.id);
                            setDriverIds(ids);
                        }}
                        sx={{minWidth: 200, maxWidth: 200}}
                        renderInput={(p) => <TextField {...p} label={t('filters.drivers')}/>}
                    />

                    <Autocomplete
                        multiple
                        size="small"
                        options={clientsData?.data || []}
                        getOptionLabel={(o) => o.name}
                        loading={isLoadingClients}
                        value={clientsData?.data?.filter((c) => clientIds.includes(c.id)) || []}
                        onChange={(_, selected) => {
                            setClientIds(selected.map((c) => c.id));
                        }}
                        sx={{minWidth: 200, maxWidth: 200}}
                        renderInput={(p) => <TextField {...p} label={t('filters.clients')}/>}
                    />

                    {/* Company */}
                    {/*<Autocomplete*/}
                    {/*  size="small"*/}
                    {/*  options={companiesData?.data || []}*/}
                    {/*  getOptionLabel={(o) => o.name}*/}
                    {/*  loading={isLoadingCompanies}*/}
                    {/*  value={companiesData?.data.find((c)=>c.id===companyId) || null}*/}
                    {/*  onChange={(_, v) => {*/}
                    {/*    setCompanyId(v?.id || '');*/}
                    {/*    setCarId(''); // reset dependent*/}
                    {/*  }}*/}
                    {/*  sx={{ minWidth: 160 }}*/}
                    {/*  renderInput={(p)=> <TextField {...p} label="Company" />}*/}
                    {/*/>*/}
                </Box>

                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center'}}>
                    <DateInputField
                        label={t('filters.startDate')}
                        name="startDate"
                        value={startDate}
                        sx={{maxWidth: 200}}
                        onDateChange={setStartDate}
                        slotProps={{textField: {size: 'small'}}}
                    />
                    <DateInputField
                        label={t('filters.endDate')}
                        name="endDate"
                        value={endDate}
                        sx={{maxWidth: 200}}
                        onDateChange={setEndDate}
                        slotProps={{textField: {size: 'small'}}}
                    />
                </Box>
            </Box>

            {/* Error display */}
            {error && (
                <Box sx={{mb: 2, p: 2, border: '1px solid', borderColor: 'error.main', borderRadius: 1}}>
                    {(error as any).response?.data?.errors?.length ? (
                        (error as any).response.data.errors.map((msg: string, i: number) => (
                            <Typography key={i} variant="body2" color="error">
                                {msg}
                            </Typography>
                        ))
                    ) : (
                        <Typography variant="body2" color="error">
                            {(error as any)?.message || t('messages.errorOccurred')}
                        </Typography>
                    )}
                </Box>
            )}

            {/* Table */}
            <Paper variant="outlined" sx={{p: 3}}>
                <Box sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 3
                }}>
                    <Typography variant="h4" fontWeight={500}>
                        {t('table.title')}
                    </Typography>
                    {(isLoading || isRefetching) ? (
                        <CircularProgress size={20}/>
                    ) : (
                        <IconButton onClick={handleRefetch}>
                            <SyncIcon sx={{transform: 'rotate(90deg)'}}/>
                        </IconButton>
                    )}
                </Box>

                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        size="small"
                                        indeterminate={selectedIds.length > 0 && selectedIds.length < (rides?.data.length || 0)}
                                        checked={!!rides?.data.length && selectedIds.length === rides.data.length}
                                        onChange={toggleAll}
                                    />
                                </TableCell>
                                <TableCell>{t('table.headers.date')}</TableCell>
                                <TableCell>{t('table.headers.week')}</TableCell>
                                <TableCell>{t('table.headers.hoursCode')}</TableCell>
                                <TableCell>{t('table.headers.driver')}</TableCell>
                                <TableCell align="right">{t('table.headers.hours')}</TableCell>
                                <TableCell>{t('table.headers.statuses')}</TableCell>
                                <TableCell>{t('table.headers.actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(isLoading || isRefetching) ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{py: 6}}>
                                        <CircularProgress size={24}/>
                                    </TableCell>
                                </TableRow>
                            ) : rides?.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{py: 6}}>
                                        <Typography variant="body1">
                                            {t('table.noData')}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rides?.data?.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        hover
                                        selected={selectedIds.includes(row.id)}
                                        sx={{
                                            cursor: 'pointer',
                                            backgroundColor: (() => {
                                                const d = dayjs(row.date);
                                                const isWeekendOrHoliday = d.day() === 0 || d.day() === 6 || isHolidayDayjs(d);
                                                return isWeekendOrHoliday ? WEEKEND_HOLIDAY_BG : undefined;
                                            })()
                                        }}
                                        onClick={() => router.push(`/partrides/${row.id}`)}
                                    >
                                        <TableCell padding="checkbox" sx={{py: 2.6}}>
                                            <Checkbox
                                                size="small"
                                                checked={selectedIds.includes(row.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={() => toggleRow(row.id)}
                                            />
                                        </TableCell>
                                        <TableCell sx={{py: 2.6}}>
                                            {dayjs(row.date).format('dd DD.MM.YY')}
                                        </TableCell>
                                        <TableCell sx={{py: 2.6}}>
                                            {row?.weekNumber ?? t('table.notAvailable')}
                                        </TableCell>
                                        <TableCell sx={{py: 2.6}}>
                                            {row?.hoursCode?.name ?? t('table.notAvailable')}
                                        </TableCell>
                                        <TableCell sx={{py: 2.6}}>
                                            {(row.driver?.firstName && row.driver?.lastName) ? row.driver?.firstName + ' ' + row.driver?.lastName : t('table.notAvailable')}
                                        </TableCell>
                                        <TableCell align="right" sx={{py: 2.6}}>
                                            {row.decimalHours}
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                <PartRideStatusChip status={row.status} />
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                <Box onClick={(e) => e.stopPropagation()}>
                                                    <PartRideActionsMenu
                                                        onApprove={() => handleApprove(row)}
                                                        onOpenDispute={() => handleDispute(row)}
                                                        onReject={() => handleReject(row)}
                                                        onEdit={() => router.push(`/partrides/edit?id=${row.id}`)}
                                                        onDelete={() => handleDelete(row)}
                                                    />
                                                </Box>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    rowsPerPageOptions={[5, 10, 25, 50, 100, 200]}
                    count={rides?.totalCount || 0}
                    rowsPerPage={rowsPerPage}
                    page={pageNumber - 1}
                    onPageChange={(_, newPage) => setPageNumber(newPage + 1)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPageNumber(1);
                    }}
                />
            </Paper>

            {/* Selection action bar */}
            {selectedIds.length > 0 && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 16,
                        right: 16,
                        zIndex: 1100,
                        backgroundColor: 'background.paper',
                        boxShadow: 3,
                        borderRadius: 1,
                        px: 2,
                        py: 1,
                        display: 'inline-flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 3,
                        maxWidth: 'calc(100% - 32px)',
                    }}
                >
                    <Box sx={{display: 'flex', alignItems: 'center', gap: .5, flexWrap: 'wrap'}}>
                        <Typography variant="body2" fontWeight={500} sx={{color: 'primary.main'}}>
                            {selectedIds.length} {t('bulkActions.selected')}
                        </Typography>
                        <Divider orientation="vertical" flexItem sx={{mx: 2}}/>
                        <Box
                            sx={{display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer'}}
                            onClick={() => handleApproveSelected()}
                        >
                            <TaskAltRoundedIcon fontSize="small"/>
                            <Typography variant="body2">{t('bulkActions.approve')}</Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{mx: 2}}/>
                        <Box
                            sx={{display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer'}}
                            onClick={() => handleRejectSelected()}
                        >
                            <CloseIcon fontSize="small"/>
                            <Typography variant="body2">{t('bulkActions.reject')}</Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{mx: 2}}/>
                        <Box
                            sx={{display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer'}}
                            onClick={handleDeleteSelected}
                        >
                            {isBulkDeleting ? (
                                <CircularProgress size={16}/>
                            ) : (
                                <DeleteOutlineIcon fontSize="small"/>
                            )}
                            <Typography variant="body2">{t('bulkActions.delete')}</Typography>
                        </Box>
                    </Box>
                </Box>
            )}
            <ConfirmModal
                open={!!confirmDeleteId}
                title={t('confirmDelete.title')}
                message={t('confirmDelete.message')}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => {
                    if (!confirmDeleteId) return;
                    deletePartRide(confirmDeleteId, {
                        onSettled: () => {
                            setConfirmDeleteId(null);
                        },
                        onSuccess: () => {
                            showSnack({text: t('messages.deletedWorkday'), severity: 'success'});
                            setSelectedIds([]);
                        },
                        onError: (error: any) => {
                            showSnack({
                                text: error?.response?.data?.errors?.[0] ?? t('messages.deleteFailed'),
                                severity: 'error'
                            });
                        },
                    });
                }}
            />
            <ConfirmModal
                open={confirmBulkDeleteOpen}
                title={t('confirmBulkDelete.title')}
                message={t('confirmBulkDelete.message', { count: bulkDeleteCount })}
                onClose={() => setConfirmBulkDeleteOpen(false)}
                onConfirm={handleConfirmBulkDelete}
            />
            <DisputeCreateDialog
                open={openCreateDispute}
                onClose={() => {
                    setOpenCreateDispute(false);
                    setDisputePartRideId(null);
                }}
                partRideId={disputePartRideId}
            />
        </Box>
    );
}
