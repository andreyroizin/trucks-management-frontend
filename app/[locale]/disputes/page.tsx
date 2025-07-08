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
           Hello there
        </Box>
    );
}
