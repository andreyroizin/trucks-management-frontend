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
import {useAuth} from '@/hooks/useAuth';
import {useDeleteClient} from '@/hooks/useDeleteClient';
import ConfirmModal from '@/components/ConfirmModal';

export default function ClientsOverviewPage() {
    const router = useRouter();
    const {user} = useAuth();
    
    // Role checks for UI visibility
    const isGlobalAdmin = user?.roles.includes('globalAdmin');
    const isCustomerAdmin = user?.roles.includes('customerAdmin');
    
    // Debounced search state
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    
    // Delete confirmation modal state
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<string | null>(null);

    const {
      data: clientsData,
      isLoading,
      isError
    } = useClients(page, pageSize, debouncedSearch);

    const queryClient = useQueryClient();
    const { mutateAsync: deleteClient } = useDeleteClient();

    const handleRefetch = () => {
        queryClient.invalidateQueries({ queryKey: ['clients'] });
    }

    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

    const handleMenuClose = () => {
        setSelectedClientId(null);
    };

    const handleEdit = (id?: string) => {
        const clientId = id || selectedClientId;
        if (clientId) {
            router.push(`/clients/edit?id=${clientId}`);
        }
        handleMenuClose();
    };

    const handleDelete = (id: string) => {
        setClientToDelete(id);
        setOpenDeleteModal(true);
        handleMenuClose();
    };

    const confirmDelete = async () => {
        if (clientToDelete) {
            try {
                await deleteClient(clientToDelete);
                queryClient.invalidateQueries({ queryKey: ['clients'] });
                setOpenDeleteModal(false);
                setClientToDelete(null);
            } catch (error) {
                console.error('Failed to delete client:', error);
                setOpenDeleteModal(false);
                setClientToDelete(null);
            }
        }
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
                    {(isGlobalAdmin || isCustomerAdmin) && (
                        <Button 
                            variant="contained" 
                            onClick={() => router.push('/clients/create')}
                        >
                            Create Client
                        </Button>
                    )}
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
                            address={c.address}
                            postcode={c.postcode}
                            city={c.city}
                            country={c.country}
                            phoneNumber={c.phoneNumber}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
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
            
            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={openDeleteModal}
                title="Delete Client?"
                message="Are you sure you want to delete this client? This action cannot be undone."
                onClose={() => {
                    setOpenDeleteModal(false);
                    setClientToDelete(null);
                }}
                onConfirm={confirmDelete}
            />
        </Box>
    );
}