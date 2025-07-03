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

export default function TripsManagementPage() {
    const router = useRouter();
    const {isAuthenticated, loading: authLoading} = useAuth();
    const showSnack = useSnack();

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
        // companyId,
        clientIds,
        driverIds,
        carIds,
        statusIds,
        pageNumber,
        pageSize: rowsPerPage,
        startDate: startDate?.isValid() ? startDate.format('YYYY-MM-DD') : undefined,
        endDate: endDate?.isValid() ? endDate.format('YYYY-MM-DD') : undefined,
    });

    // useEffect(() => {
    //     const params = new URLSearchParams();
    //     // if (companyId) params.set('companyId', companyId);
    //     if (clientId) params.set('clientId', clientId);
    //     if (driverId) params.set('driverId', driverId);
    //     if (carId) params.set('carId', carId);
    //     if (startDate) params.set('startDate', startDate.toISOString());
    //     if (endDate) params.set('endDate', endDate.toISOString());
    //     router.replace(`/partrides?${params.toString()}`);
    //   }, [clientId, driverId, carId, startDate, endDate, router]);

    /** ────────────────────────────────────────────────────────────────
     * Bulk delete handler
     * ───────────────────────────────────────────────────────────── */
    const handleConfirmBulkDelete = async () => {
        try {
            for (const id of selectedIds) {
                await new Promise<void>((resolve, reject) => {
                    deletePartRide(id, {
                        onSuccess: resolve,
                        onError: (err: any) => {
                            console.error('Deletion failed:', err);
                            showSnack({
                                text: err?.response?.data?.errors?.[0] ?? 'Failed to delete one or more workdays',
                                severity: 'error'
                            });
                            reject(err);
                        },
                    });
                });
            }

            showSnack({text: 'Deleted workdays', severity: 'success'});

            setSelectedIds([]);
            setConfirmBulkDeleteOpen(false);
        } catch (err) {
            console.error('One or more deletions failed', err);
        } finally {
            setIsBulkDeleting(false);
        }
    };

    /** ────────────────────────────────────────────────────────────────
     * Row selection handling
     * ───────────────────────────────────────────────────────────── */
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const toggleRow = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };
    const toggleAll = () => {
        if (!rides?.data) return;
        if (selectedIds.length === rides.data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(rides.data.map((r) => r.id));
        }
    };

    const handleApproveSelected = async () => {
        if (!selectedIds.length) return;
        try {
            for (const id of selectedIds) {
                await approveRide(id);               // <-- mutation hook (await!)
            }
            showSnack({text: 'Approved selected workdays', severity: 'success'});
            setSelectedIds([]);
        } catch (e: any) {
            showSnack({
                text: e?.response?.data?.errors?.[0] ?? 'Failed to approve one or more workdays',
                severity: 'error',
            });
        } finally {
            await handleRefetch();                 // refresh list
        }
    };

    const handleRejectSelected = async () => {
        if (!selectedIds.length) return;

        try {
            for (const id of selectedIds) {
                await rejectRide(id);                // <-- mutation hook (await!)
            }
            showSnack({text: 'Rejected selected workdays', severity: 'success'});
            setSelectedIds([]);
        } catch (e: any) {
            showSnack({
                text: e?.response?.data?.errors?.[0] ?? 'Failed to reject one or more workdays',
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
            showSnack({text: 'Workday approved', severity: 'success'});
        } catch (e: any) {
            showSnack({
                text: e?.response?.data?.errors?.[0] ?? 'Approve failed',
                severity: 'error',
            });
        } finally {
            await handleRefetch();           // refresh list
        }
    };

    const handleDispute = (row: PartRide) => {
        setDisputePartRideId(row.id);     // remember which ride we’re disputing
        setOpenCreateDispute(true);
    };

    const handleReject = async (row: PartRide) => {
        try {
            await rejectRide(row.id);
            showSnack({text: 'Workday rejected', severity: 'success'});
        } catch (e: any) {
            showSnack({
                text: e?.response?.data?.errors?.[0] ?? 'Reject failed',
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
                    Workdays Management
                </Typography>
                <LanguageSelectDesktop/>
            </Box>

            {/* Filters */}
            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4, justifyContent: 'space-between'}}>
                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1}}>
                    <Autocomplete
                        multiple
                        size="small"
                        options={[
                            {label: 'Pending Admin', value: '0'},
                            {label: 'Dispute', value: '1'},
                            {label: 'Accepted', value: '2'},
                            {label: 'Rejected', value: '3'},
                        ]}
                        value={statusIds.map((id) => ({
                            label:
                                id === '0'
                                    ? 'Pending Admin'
                                    : id === '1'
                                        ? 'Dispute'
                                        : id === '2'
                                            ? 'Accepted'
                                            : id === '3'
                                                ? 'Rejected'
                                                : id,
                            value: id,
                        }))}
                        onChange={(_, newValues) => {
                            setStatusIds(newValues.map((v) => v.value));
                        }}
                        getOptionLabel={(option) => option.label}
                        isOptionEqualToValue={(option, value) => option.value === value.value}
                        sx={{minWidth: 200, maxWidth: 200}}
                        renderInput={(params) => <TextField {...params} label="Statuses"/>}
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
                        renderInput={(p) => <TextField {...p} label="Vehicles"/>}
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
                        renderInput={(p) => <TextField {...p} label="Drivers"/>}
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
                        renderInput={(p) => <TextField {...p} label="Clients"/>}
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
                        label="Start date"
                        name="startDate"
                        value={startDate}
                        sx={{maxWidth: 200}}
                        onDateChange={setStartDate}
                        slotProps={{textField: {size: 'small'}}}
                    />
                    -
                    <DateInputField
                        label="End date"
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
                            {(error as any)?.message || 'An error occurred while fetching data.'}
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
                        Overview List
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
                                <TableCell>Date</TableCell>
                                <TableCell>Driver</TableCell>
                                <TableCell>Vehicle</TableCell>
                                <TableCell>Client</TableCell>
                                <TableCell align="right">Hours</TableCell>
                                <TableCell>Deviation</TableCell>
                                <TableCell align="right">Forecasted (€)</TableCell>
                                <TableCell>Statuses</TableCell>
                                <TableCell>Actions</TableCell>
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
                                            No records found.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rides?.data?.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        hover
                                        selected={selectedIds.includes(row.id)}
                                        sx={{cursor: 'pointer'}}
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
                                            {dayjs(row.date).format('DD.MM.YY')}
                                        </TableCell>
                                        <TableCell sx={{py: 2.6}}>
                                            {(row.driver?.firstName && row.driver?.lastName) ? row.driver?.firstName + ' ' + row.driver?.lastName : 'N/A'}
                                        </TableCell>
                                        <TableCell sx={{py: 2.6}}>
                                            {row.car?.licensePlate ?? 'N/A'}
                                        </TableCell>
                                        <TableCell sx={{py: 2.6}}>
                                            {row.client?.name ?? 'N/A'}
                                        </TableCell>
                                        <TableCell align="right" sx={{py: 2.6}}>
                                            {row.decimalHours}
                                        </TableCell>
                                        <TableCell sx={{py: 2.6}}>
                                            N/A
                                        </TableCell>
                                        <TableCell align="right" sx={{py: 2.6}}>
                                            €{row.earnings}
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                {PartRideStatusChip(row.status)}
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
                            {selectedIds.length} selected
                        </Typography>
                        <Divider orientation="vertical" flexItem sx={{mx: 2}}/>
                        <Box
                            sx={{display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer'}}
                            onClick={() => handleApproveSelected()}
                        >
                            <TaskAltRoundedIcon fontSize="small"/>
                            <Typography variant="body2">Approve</Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{mx: 2}}/>
                        <Box
                            sx={{display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer'}}
                            onClick={() => handleRejectSelected()}
                        >
                            <CloseIcon fontSize="small"/>
                            <Typography variant="body2">Reject</Typography>
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
                            <Typography variant="body2">Delete</Typography>
                        </Box>
                    </Box>
                </Box>
            )}
            <ConfirmModal
                open={!!confirmDeleteId}
                title="Confirm Deletion"
                message="Are you sure you want to delete this ride?"
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => {
                    if (!confirmDeleteId) return;
                    deletePartRide(confirmDeleteId, {
                        onSettled: () => {
                            setConfirmDeleteId(null);
                        },
                        onSuccess: () => {
                            showSnack({text: 'Deleted the workday', severity: 'success'});
                            setSelectedIds([]);
                        },
                        onError: (error: any) => {
                            showSnack({
                                text: error?.response?.data?.errors?.[0] ?? 'Failed to delete the workday',
                                severity: 'error'
                            });
                        },
                    });
                }}
            />
            <ConfirmModal
                open={confirmBulkDeleteOpen}
                title="Confirm Bulk Deletion"
                message={`Are you sure you want to delete ${bulkDeleteCount} workdays?`}
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
