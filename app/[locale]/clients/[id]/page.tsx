'use client';

import React, {useState, useEffect} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    Button,
    Divider,
} from '@mui/material';
import Link from 'next/link';
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
        <Box sx={{ backgroundColor: 'grey.100', minHeight: '100vh' }}>
            {/* Header Section */}
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                py: 4,
                px: 6
            }}>
                <Typography variant="h3" fontWeight={500}>
                    Client Management
                </Typography>
            </Box>

            <Box sx={{ px: 6, pb: 4 }}>
                {/* Show deletion error if any */}
                {deleteErrorMsg && (
                    <Alert severity="error" sx={{mb: 2}}>
                        {deleteErrorMsg}
                    </Alert>
                )}

                <Card elevation={0} sx={{ backgroundColor: 'white' }}>
                <CardContent>
                    {(isCustomerAdmin || isGlobalAdmin) && (
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h5">{client.name}</Typography>
                            <Box>
                                {(isGlobalAdmin && !client.isApproved) && (
                                    <Button
                                        variant="contained"
                                        color="success"
                                        sx={{mr: 1}}
                                        disabled={isApproving}
                                        onClick={handleApprove}
                                    >
                                        {isApproving ? 'Approving...' : 'Approve'}
                                    </Button>
                                )}
                                <Link href={`/clients/edit?id=${client.id}`} passHref>
                                    <Button variant="contained" color="primary" sx={{mr: 1}}>
                                        Edit
                                    </Button>
                                </Link>
                                <Button
                                    variant="contained"
                                    color="error"
                                    disabled={isPending}
                                    onClick={() => setOpenModal(true)}
                                >
                                    {isPending ? 'Deleting...' : 'Delete'}
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {/* General Information Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            General Information
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>Client Name:</strong> {client.name}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>TAV:</strong> {client.tav || 'N/A'}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>Company:</strong> {client.company.name}
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Client Address Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Client Address
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>Street Address:</strong> {client.address || 'N/A'}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>Postcode:</strong> {client.postcode || 'N/A'}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>City:</strong> {client.city || 'N/A'}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>Country:</strong> {client.country || 'N/A'}
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Contact Information Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Contact Information
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>Phone Number:</strong> {client.phoneNumber || 'N/A'}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <strong>Email:</strong> {client.email || 'N/A'}
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Remark Block */}
                    <Box mb={4}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Remark
                        </Typography>
                        <Typography variant="body1">
                            {client.remark || 'No remark provided'}
                        </Typography>
                    </Box>


                </CardContent>
            </Card>



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
        </Box>
    );
}
