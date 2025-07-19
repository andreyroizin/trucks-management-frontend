'use client';

import React, {useState, useEffect} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Button,
    Divider,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableRow,
    IconButton,
} from '@mui/material';
import DriveFileRenameOutlineRoundedIcon from '@mui/icons-material/DriveFileRenameOutlineRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {useAuth} from '@/hooks/useAuth';
import {useClientDetails} from '@/hooks/useClientDetails';
import {useDeleteClient} from '@/hooks/useDeleteClient';
import ConfirmModal from '@/components/ConfirmModal';
import {useApproveClient} from "@/hooks/useApproveClient";

export default function ClientDetailPage() {
    const {id} = useParams();
    const router = useRouter();
    const {user, isAuthenticated, loading: authLoading} = useAuth();
    const {data: client, isLoading, isError, error} = useClientDetails(id as string);
    const isCustomerAdmin = user?.roles.includes('customerAdmin');
    const isGlobalAdmin = user?.roles.includes('globalAdmin');
    const isCustomer = user?.roles.includes('customer');
    const isCustomerAccountant = user?.roles.includes('customerAccountant');
    // Delete Client Hook
    const {
        mutateAsync: deleteClient,
        isPending,
        isError: isDeleteError,
        error: deleteError,
    } = useDeleteClient();
    const {mutateAsync: approveClient, isPending: isApproving} = useApproveClient();

    // Confirm modal state
    const [openModal, setOpenModal] = useState(false);
    const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

    // Check roles
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'employer', 'customer'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router, user?.roles]);

    // Handle Delete Confirm
    const handleDelete = async () => {
        setDeleteErrorMsg(null);
        try {
            await deleteClient(id as string);
            setOpenModal(false);
            router.push('/clients'); // Navigate away after successful deletion
        } catch (err: any) {
            setDeleteErrorMsg(err.message || 'Failed to delete client.');
            setOpenModal(false);
        }
    };

    const handleApprove = async () => {
        try {
            await approveClient(id as string);
            router.push('/clients'); // Redirect after approval
        } catch (err) {
            console.error('Failed to approve client:', err);
        }
    };

    if (authLoading || isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress/>
            </Box>
        );
    }

    if (isError || !client) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error?.message || 'Failed to load client details.'}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{py: 4}}>
            {/* Header Section */}
            <Box sx={{mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h3" fontWeight={500}>
                    Client Management
                </Typography>
            </Box>

            <Paper variant="outlined" sx={{p: 3, mx: 'auto'}}>
                {/* Show deletion error if any */}
                {deleteErrorMsg && (
                    <Alert severity="error" sx={{mb: 2}}>
                        {deleteErrorMsg}
                    </Alert>
                )}

                {/* Header section */}
                <Box
                    sx={{
                        mt: 1,
                        mb: 3,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 2,
                    }}
                >
                    <Typography variant="h4" fontWeight={500}>
                        {client.name}
                    </Typography>
                    {(isCustomerAdmin || isGlobalAdmin) && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {(isGlobalAdmin && !client.isApproved) && (
                                <Button
                                    variant="contained"
                                    color="success"
                                    disabled={isApproving}
                                    onClick={handleApprove}
                                    sx={{ textTransform: 'none', fontWeight: 600, px: 3, py: 1 }}
                                >
                                    {isApproving ? 'Approving...' : 'Approve'}
                                </Button>
                            )}
                            
                            {/* Edit / Delete - matching partride styling exactly */}
                            <IconButton
                                onClick={() => router.push(`/clients/edit?id=${client.id}`)}
                                disabled={isPending}
                                sx={{
                                    bgcolor: 'grey.800',
                                    color: 'common.white',
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: 'grey.700' }
                                }}
                            >
                                <DriveFileRenameOutlineRoundedIcon />
                            </IconButton>

                            <IconButton
                                size="large"
                                onClick={() => setOpenModal(true)}
                                disabled={isPending}
                                sx={{
                                    bgcolor: 'grey.800',
                                    color: 'common.white',
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: 'grey.700' },
                                    px: 1,
                                    py: 0,
                                }}
                            >
                                <DeleteOutlineIcon fontSize="medium" />
                            </IconButton>
                        </Box>
                    )}
                </Box>

                {/* General Information */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    General Information
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                Client Name
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{client.name}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>TAV</TableCell>
                            <TableCell sx={{border: 'none'}}>{client.tav || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Company</TableCell>
                            <TableCell sx={{border: 'none'}}>{client.company.name}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                    <Divider sx={{ my: 3 }} />

                {/* Client Address */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    Client Address
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                Street Address
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{client.address || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Postcode</TableCell>
                            <TableCell sx={{border: 'none'}}>{client.postcode || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>City</TableCell>
                            <TableCell sx={{border: 'none'}}>{client.city || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Country</TableCell>
                            <TableCell sx={{border: 'none'}}>{client.country || 'N/A'}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                    <Divider sx={{ my: 3 }} />

                {/* Contact Information */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    Contact Information
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                Phone Number
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{client.phoneNumber || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Email</TableCell>
                            <TableCell sx={{border: 'none'}}>{client.email || 'N/A'}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                    <Divider sx={{ my: 3 }} />

                {/* Remark */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 1}}>
                    Remark
                </Typography>
                <Typography variant="body1">
                    {client.remark || 'No remark provided'}
                </Typography>


            </Paper>

            {/* Confirm Deletion Modal */}
            <ConfirmModal
                open={openModal}
                title="Delete Client?"
                message="Are you sure you want to delete this client?"
                onClose={() => setOpenModal(false)}
                onConfirm={handleDelete}
            />

            {/* Display error for deletion if needed */}
            {isDeleteError && (
                <Alert severity="error" sx={{mt: 2}}>
                    {deleteError?.message || 'Failed to delete client.'}
                </Alert>
            )}
        </Box>
    );
}
