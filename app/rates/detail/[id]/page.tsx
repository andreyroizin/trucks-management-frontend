'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Typography, Card, CardContent, CircularProgress, Alert, Button } from '@mui/material';
import { useRateDetail } from '@/hooks/useRateDetail';
import { useDeleteRate } from '@/hooks/useDeleteRate';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function RateDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    // Fetch rate details
    const { data: rate, isLoading, isError, error } = useRateDetail(id as string);

    // Delete hook
    const { mutateAsync: deleteRate, isPending: isDeleting } = useDeleteRate();
    const [openModal, setOpenModal] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Access control
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'employer', 'customerAccountant', 'customer'];
        const hasAccess = user?.roles.some(r => allowedRoles.includes(r));
        if (!authLoading && (!isAuthenticated || !hasAccess)) router.push('/auth/login');
    }, [authLoading, isAuthenticated, router, user?.roles]);

    // Handle Deletion
    const handleDelete = async () => {
        setDeleteError(null);
        try {
            await deleteRate(id as string);
            setOpenModal(false);
            router.push('/clients');
        } catch (err: any) {
            setDeleteError(err.message || 'Failed to delete rate');
            setOpenModal(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isError || !rate) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error?.message || 'Failed to load rate details.'}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="600px" mx="auto" p={4}>
            {deleteError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {deleteError}
                </Alert>
            )}

            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h5">Rate Detail</Typography>
                        {isGlobalAdmin && (
                            <Box>
                                <Link href={`/rates/edit/${rate.id}`} passHref>
                                    <Button variant="contained" color="primary" sx={{ mr: 1 }}>
                                        Edit
                                    </Button>
                                </Link>
                                <Button
                                    variant="contained"
                                    color="error"
                                    disabled={isDeleting}
                                    onClick={() => setOpenModal(true)}
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </Button>
                            </Box>
                        )}
                    </Box>
                    <Typography variant="body1" gutterBottom>
                        <strong>Name:</strong> {rate.name}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        <strong>Value:</strong> {rate.value?.toFixed(2)}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Receiver:</strong>{' '}
                        <Link href={`/clients/${rate.clientId}`} passHref>
                            <Button variant="text" size="small">
                                {rate.clientName}
                            </Button>
                        </Link>
                    </Typography>

                    <Typography variant="body1">
                        <strong>Transporter:</strong>{' '}
                        <Link href={`/companies/${rate.companyId}`} passHref>
                            <Button variant="text" size="small">
                                {rate.companyName}
                            </Button>
                        </Link>
                    </Typography>
                </CardContent>
            </Card>

            <ConfirmModal
                open={openModal}
                title="Delete Rate?"
                message="Are you sure you want to delete this rate?"
                onClose={() => setOpenModal(false)}
                onConfirm={handleDelete}
            />
        </Box>
    );
}
