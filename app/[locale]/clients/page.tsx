'use client';

import React, {useState} from 'react';
import {Box, Grid, IconButton, TextField, Typography, Menu, MenuItem} from '@mui/material';
import ClientCard from '@/components/ClientCard';
import LanguageSelectDesktop from "@/components/LanguageSelectDesktop";
import SyncIcon from "@mui/icons-material/Sync";
// import {useClients} from '@/hooks/useClients'; // ← your real data hook

/* ------------------------------------------------------------------ */
/* Fake data while wiring – replace with real hook                     */
/* ------------------------------------------------------------------ */
const DUMMY = Array.from({length: 15}).map((_, i) => ({
    id: `client-${i}`,
    name: ['Simon Loos Winkeldistributie Zuid BV', 'E.T.E. Transport B.V.', 'ABC Logistics'][i % 3],
    tav: 'Administration',
    lastWorkday: '02.02.2025',
    lastDriver: 'John Doe'
}));
/* ------------------------------------------------------------------ */

export default function ClientsOverviewPage() {
    /* example local state for filters */
    const [search, setSearch] = useState('');
    const [sort1, setSort1] = useState('TAV');
    const [sort2, setSort2] = useState('Last Workday');
    const [sort3, setSort3] = useState('Last Driver');

    // const {data, isLoading, refetch} = useClients({ ...filters });
    const data = DUMMY; // stand-in

    const handleRefetch = () => {
        console.log('Refetching data...');
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
                <IconButton onClick={handleRefetch}>
                    <SyncIcon sx={{transform: 'rotate(90deg)'}}/>
                </IconButton>
            </Box>


            <TextField
                size="small"
                placeholder="Client Name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{mb: 4, maxWidth: 260}}
            />

            <Grid container spacing={2}>
                {data.map((c) => (
                    <Grid item xs={12} sm={6} md={4} key={c.id}>
                        <ClientCard
                            {...c}
                            onDelete={handleDelete}
                            onEdit={(id) => {
                                setSelectedClientId(id);
                                handleEdit()
                            }}
                        />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}