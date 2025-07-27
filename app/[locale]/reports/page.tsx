'use client';

import React, { useEffect, useState } from 'react';
import {
    Autocomplete,
    Box,
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

export default function ReportsPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    
    // Filter states
    const [selectedDriver, setSelectedDriver] = useState<any>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
    
    // Data hooks
    const { data: driversData, isLoading: isLoadingDrivers } = useDrivers();

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

            {/* Table Container */}
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Period</TableCell>
                            <TableCell>Driver</TableCell>
                            <TableCell>Total Hours</TableCell>
                            <TableCell>Total Earnings</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!selectedDriver || !selectedPeriod ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        Choose Driver and Period first, to find the report.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        Table data will be implemented next.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
} 