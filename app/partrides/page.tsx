// app/trips/page.tsx
'use client';

import React, {useEffect, useState} from 'react';
import {
    Box,
    Checkbox,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    Paper,
    Stack,
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
import { useQueryClient } from '@tanstack/react-query';
import Autocomplete from '@mui/material/Autocomplete';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import {PartRide, usePartRides} from '@/hooks/usePartRides';
import dayjs from 'dayjs';

import {useRouter, useSearchParams} from 'next/navigation';
import {useAuth} from '@/hooks/useAuth';
// import { useCompanies } from '@/hooks/useCompanies';
import {useClients} from '@/hooks/useClients';
import {useDrivers} from '@/hooks/useDrivers';
import {useCars} from '@/hooks/useCars';
import LanguageSelectDesktop from "@/components/LanguageSelectDesktop";
import DateInputField from '@/components/DateInputField';

export default function TripsManagementPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, loading: authLoading } = useAuth();

    const queryClient = useQueryClient();

    const handleRefetch = async () => {
      await queryClient.invalidateQueries({ queryKey: ['partRides'] });
    };

    // Ensure only authenticated users can access
    useEffect(() => {
      if (!authLoading && !isAuthenticated) {
        router.push('/auth/login');
      }
    }, [authLoading, isAuthenticated, router]);

    // Local states for filters (prefilled from URL)
    // const [companyId, setCompanyId] = useState(searchParams.get('companyId') || '');
    const [clientId, setClientId] = useState(searchParams.get('clientId') || '');
    const [driverId, setDriverId] = useState(searchParams.get('driverId') || '');
    const [carId, setCarId] = useState(searchParams.get('carId') || '');
    const [status, setStatus] = useState<string | undefined>();
    const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
    const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);

    // Hooks for filter dropdown data
    // const { data: companiesData, isLoading: isLoadingCompanies } = useCompanies();
    const { data: clientsData, isLoading: isLoadingClients } = useClients(1, 1000);
    const { data: driversData, isLoading: isLoadingDrivers } = useDrivers();
    const { data: carsData, isLoading: isLoadingCars } = useCars('', 1, 1000);

    // Pagination
    const [pageNumber, setPageNumber] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const { data: rides, isLoading, isRefetching } = usePartRides({
      // companyId,
      clientId,
      driverId,
      carId,
      pageNumber,
      pageSize: rowsPerPage,
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

    /** ────────────────────────────────────────────────────────────────
     * Helpers
     * ───────────────────────────────────────────────────────────── */
    const statusChip = (r: PartRide) => {
        // Placeholder – infer status from hours/remark until real field exists
        const value = (r as any).status ?? 'pending';
        const map: Record<string, { label: string; color: 'success' | 'warning' | 'info' }> = {
            approved: { label: 'Approved', color: 'success' },
            changes: { label: 'Changes', color: 'warning' },
            pending: { label: 'Pending', color: 'info' },
        };
        const conf = map[value] || map.pending;
        return <Chip size="small" label={conf.label} color={conf.color} variant="outlined" />;
    };

    /** ────────────────────────────────────────────────────────────────
     * Render
     * ───────────────────────────────────────────────────────────── */
    return (
        <Box sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h2" fontWeight={500}>
                    Trips Management
                </Typography>
                <LanguageSelectDesktop/>
            </Box>

            {/* Filters */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4, justifyContent: 'space-between' }} >
                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center'}}>
                    <Autocomplete
                        size="small"
                        options={['Pending', 'Approved', 'Changes']}
                        value={status ? status[0].toUpperCase() + status.slice(1) : null}
                        onChange={(_, newValue) =>
                            setStatus(newValue ? newValue.toLowerCase() : undefined)
                        }
                        sx={{ minWidth: 160, maxWidth: 160 }}
                        renderInput={(params) => <TextField {...params} label="Status" />}
                        freeSolo={false}
                    />

                    <Autocomplete
                        size="small"
                        options={carsData?.cars || []}
                        getOptionLabel={(o)=> o.licensePlate}
                        loading={isLoadingCars}
                        value={carsData?.cars?.find((c)=>c.id===carId) || null}
                        onChange={(_,v)=> setCarId(v?.id || '')}
                        sx={{ minWidth: 160, maxWidth: 160 }}
                        renderInput={(p)=><TextField {...p} label="Vehicle" />}
                    />

                    <Autocomplete
                        size="small"
                        options={driversData || []}
                        getOptionLabel={(o)=> (o.user?.firstName + ' ' + o.user?.lastName)}
                        loading={isLoadingDrivers}
                        value={driversData?.find((d)=>d.id===driverId) || null}
                        onChange={(_,v)=> setDriverId(v?.id || '')}
                        sx={{ minWidth: 160, maxWidth: 160 }}
                        renderInput={(p)=><TextField {...p} label="Driver" />}
                    />

                    <Autocomplete
                        size="small"
                        options={clientsData?.data || []}
                        getOptionLabel={(o)=>o.name}
                        loading={isLoadingClients}
                        value={clientsData?.data.find((c)=>c.id===clientId) || null}
                        onChange={(_,v)=> setClientId(v?.id || '')}
                        sx={{ minWidth: 160, maxWidth: 160 }}
                        renderInput={(p)=><TextField {...p} label="Client" />}
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

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center'}}>
                    <DateInputField
                        label="Start date"
                        name="startDate"
                        value={startDate}
                        sx={{ maxWidth: 160 }}
                        onDateChange={setStartDate}
                        slotProps={{ textField: { size: 'small' } }}
                    />
                    -
                    <DateInputField
                        label="End date"
                        name="endDate"
                        value={endDate}
                        sx={{ maxWidth: 160 }}
                        onDateChange={setEndDate}
                        slotProps={{ textField: { size: 'small' } }}
                    />
                </Box>
            </Box>

            {/* Table */}
            <Paper variant="outlined" sx={{p: 3}}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h4" fontWeight={500}>
                        Resent records
                    </Typography>
                    {(isLoading || isRefetching) ? (
                        <CircularProgress size={20} />
                    ) : (
                        <IconButton onClick={handleRefetch}>
                            <SyncIcon sx={{ transform: 'rotate(90deg)' }} />
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
                                <TableCell>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(isLoading || isRefetching) ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={24} />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rides?.data.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        hover
                                        selected={selectedIds.includes(row.id)}
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => toggleRow(row.id)}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox size="small" checked={selectedIds.includes(row.id)} />
                                        </TableCell>
                                        <TableCell>{dayjs(row.date).format('DD.MM.YY')}</TableCell>
                                        <TableCell>John M.</TableCell>
                                        <TableCell>{row.carId ?? 'N/A'}</TableCell>
                                        <TableCell>{row.client?.name ?? 'N/A'}</TableCell>
                                        <TableCell align="right">{row.decimalHours.toFixed(2)}</TableCell>
                                        <TableCell>N/A</TableCell>
                                        <TableCell align="right">€{row.turnover.toFixed(2)}</TableCell>
                                        <TableCell>{statusChip(row)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    rowsPerPageOptions={[5, 10, 25]}
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
                        left: 80,
                        top: 120,
                        backgroundColor: 'background.paper',
                        boxShadow: 3,
                        borderRadius: 1,
                        px: 2,
                        py: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    <Typography variant="body2" fontWeight={600}>{selectedIds.length} selected</Typography>
                    <Divider orientation="vertical" flexItem />
                    <IconButton size="small" color="success">
                        <CheckCircleOutlineIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="info">
                        <ReportProblemOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                        <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                </Box>
            )}
        </Box>
    );
}
