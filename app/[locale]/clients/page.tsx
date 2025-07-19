'use client';

import React, {useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {Alert, Box, Button, CircularProgress, Grid, IconButton, TablePagination, Typography} from '@mui/material';
import {useRouter} from 'next/navigation';
import ClientCard from '@/components/ClientCard';
import LanguageSelectDesktop from "@/components/LanguageSelectDesktop";
import SyncIcon from "@mui/icons-material/Sync";
import {useClients} from '@/hooks/useClients';
import {DebouncedSearchInput} from "@/components/DebouncedSearchInput";

export default function ClientsOverviewPage() {
    const router = useRouter();
    
    // Debounced search state
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    const {
      data: clientsData,
      isLoading,
      isError
    } = useClients(page, pageSize, debouncedSearch);

    const queryClient = useQueryClient();

    const handleRefetch = () => {
        queryClient.invalidateQueries({ queryKey: ['clients'] });
    }

    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

    const handleMenuClose = () => {
        setSelectedClientId(null);
    };

    const handleEdit = () => {
        console.log(`Edit client ${selectedClientId}`);
        handleMenuClose();
    };

    const handleDelete = (id: string) => {
        console.log(`Delete client ${id}`);
        handleMenuClose();
    };

    // Loading & error states
    if (isLoading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
    if (isError)   return <Alert severity="error" sx={{mt:4}}>Failed to load clients</Alert>;

    return (
        <Box sx={{py: 4}}>
            <Box sx={{mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h3" fontWeight={500}>
                    Clients management
                </Typography>
                <LanguageSelectDesktop/>
            </Box>

            <Box sx={{mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h4" fontWeight={500}>
                    Clients overview
                </Typography>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                    <Button 
                        variant="contained" 
                        onClick={() => router.push('/clients/create')}
                    >
                        Create Client
                    </Button>
                    <IconButton onClick={handleRefetch}>
                        <SyncIcon sx={{transform: 'rotate(90deg)'}}/>
                    </IconButton>
                </Box>
            </Box>

            <DebouncedSearchInput value={debouncedSearch} onDebouncedChange={setDebouncedSearch} placeholder={"Client Name"} size={"small"} sx={{ mb: 4, maxWidth: 260 }} />

            <Grid container spacing={2}>
                {(clientsData?.data || []).map((c) => (
                    <Grid item xs={12} sm={6} md={4} key={c.id}>
                        <ClientCard
                            id={c.id}
                            name={c.name}
                            tav={c.tav}
                            lastDriver={
                                c.lastDriver
                                    ? `${c.lastDriver.firstName ?? ''} ${c.lastDriver.lastName ?? ''}`.trim()
                                    : undefined
                            }
                            onDelete={handleDelete}
                            onEdit={(id) => {
                                setSelectedClientId(id);
                                handleEdit()
                            }}
                        />
                    </Grid>
                ))}
            </Grid>

            <TablePagination
                sx={{mt: 4}}
                component="div"
                count={clientsData?.totalClients || 0}
                page={page - 1}
                onPageChange={(event, newPage) => setPage(newPage + 1)}
                rowsPerPage={pageSize}
                onRowsPerPageChange={(event) => {
                  setPage(1);
                  setPageSize(parseInt(event.target.value, 10));
                }}
                rowsPerPageOptions={[6, 9, 12, 15]}
            />
        </Box>
    );
}