'use client';

import ConfirmModal from '@/components/ConfirmModal';
import React, {useEffect, useState} from 'react';
import {
    Box,
    CircularProgress,
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
import {Dispute, useDisputes} from '@/hooks/useDisputes';
import dayjs from 'dayjs';

import {useRouter} from 'next/navigation';
import {useAuth} from '@/hooks/useAuth';
import {useClients} from '@/hooks/useClients';
import {useDrivers} from '@/hooks/useDrivers';
import {useCars} from '@/hooks/useCars';
import LanguageSelectDesktop from "@/components/LanguageSelectDesktop";
import DateInputField from '@/components/DateInputField';
import DisputeCreateDialog from "@/components/DisputeCreateDialog";
import StatusChip from "@/components/StatusChip";
import DisputesActionsMenu from "@/components/DisputesActionsMenu";
import {useSnack} from "@/providers/SnackProvider";

export default function TripsManagementPage() {
    const router = useRouter();
    const snack = useSnack();
    const {isAuthenticated, loading: authLoading, user} = useAuth();

    const queryClient = useQueryClient();

    const handleRefetch = async () => {
        await queryClient.invalidateQueries({queryKey: ['disputes']});
    };

    // Ensure only authenticated users can access
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'customerAccountant', 'employer', 'customer'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));

        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login'); // Redirect to login if not authorized
        }
    }, [authLoading, isAuthenticated, router, user?.roles]);

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

    // Hooks for filter dropdown data
    // const { data: companiesData, isLoading: isLoadingCompanies } = useCompanies();
    const {data: clientsData, isLoading: isLoadingClients} = useClients(1, 1000);
    const {data: driversData, isLoading: isLoadingDrivers} = useDrivers();
    const {data: carsData, isLoading: isLoadingCars} = useCars([], 1, 1000);

    // Pagination
    const [pageNumber, setPageNumber] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Confirm delete modal state
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const {
        data: disputes,
        isLoading,
        isRefetching,
        error,
    } = useDisputes({
        driverIds,
        clientIds,
        carIds,
        statuses: statusIds,
        date: undefined, // single‑day filter (optional)
        dateFrom: startDate?.isValid() ? startDate.format('YYYY-MM-DD') : undefined,
        dateTo: endDate?.isValid() ? endDate.format('YYYY-MM-DD') : undefined,
        pageNumber,
        pageSize: rowsPerPage,
    });

    /** ────────────────────────────────────────────────────────────────
     * Helpers
     * ───────────────────────────────────────────────────────────── */
    const statusChip = (d: Dispute) => {
        const map: Record<number, {label: string; color: 'info'|'success'|'warning' | 'default'}> = {
            0: { label: 'Pending Driver', color: 'warning' },
            1: { label: 'Pending Admin',  color: 'info'    },
            2: { label: 'Accepted',       color: 'success' },
            3: { label: 'Accepted',       color: 'success' },
            4: { label: 'Closed',         color: 'default' },
        };
        const conf = map[d.status] ?? map[1];
        return <StatusChip label={conf.label} variant={conf.color} />;
    };

    /** ────────────────────────────────────────────────────────────────
     * Row-level actions
     * ───────────────────────────────────────────────────────────── */
    const handleApprove = (row: Dispute) => {
        console.log('Approving row:', row);
        // TODO: Implement actual API call or logic
    };

    const handleDelete = (row: Dispute) => {
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
                        options={['Pending Driver', 'Pending Admin', 'Accepted By Driver', 'Accepted By Admin', 'Closed']}
                        value={statusIds.map(
                            s => s[0].toUpperCase() + s.slice(1)
                        )}
                        onChange={(_, newValues) =>
                            setStatusIds(
                                newValues.map((v) =>
                                    v.replace(/\s+/g, '').toLowerCase()   //  ← remove all spaces
                                )
                            )
                        }
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
                <Box sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'error.main', borderRadius: 1 }}>
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
                        Dipsutes List
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
                                <TableCell>Date</TableCell>
                                <TableCell>Driver</TableCell>
                                <TableCell>Vehicle</TableCell>
                                <TableCell>Client</TableCell>
                                <TableCell>Total Hours</TableCell>
                                <TableCell>Hours Correction</TableCell>
                                <TableCell>Statuses</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(isLoading || isRefetching) ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{py: 6}}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : disputes?.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{py: 6}}>
                                        <Typography variant="body1">
                                            No records found.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                disputes?.data?.map((row: Dispute) => (
                                    <TableRow
                                        key={row.id}
                                        hover
                                        sx={{cursor: 'pointer'}}
                                        onClick={() => router.push(`/disputes/${row.id}`)}
                                    >
                                        <TableCell sx={{py: 2.6}}>
                                            {dayjs(row.partRide?.date).format('DD.MM.YY')}
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
                                        <TableCell sx={{py: 2.6}}>
                                            {row.partRide?.decimalHours}
                                        </TableCell>
                                        <TableCell sx={{py: 2.6}}>
                                            {row.correctionHours > 0 ? '+' : ''}{row.correctionHours}h
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{display: 'flex', alignItems: 'center', gap: .5}}>
                                                {statusChip(row)}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{display: 'flex', alignItems: 'center', gap: .5}}>
                                                <Box onClick={(e) => e.stopPropagation()}>
                                                    <DisputesActionsMenu
                                                        onEdit={() => router.push(`/partrides/edit?id=${row.id}`)}
                                                        onDelete={() => handleDelete(row)}
                                                        onCloseDispute={() => {
                                                            console.log('onCloseDispute', row.id)
                                                            snack({ text: 'Closed successfully!', severity: 'success' })
                                                        }}
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
                    count={disputes?.totalCount || 0}
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
            <ConfirmModal
                open={!!confirmDeleteId}
                title="Confirm Deletion"
                message="Are you sure you want to delete this dispute?"
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => {
                    // TODO: Implement actual deletion logic
                }}
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
