'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Card, CardContent, Typography, CircularProgress, Alert, Button } from '@mui/material';
import Link from 'next/link';
import { useCharterDetail } from '@/hooks/useCharterDetail';
import { useDeleteCharter } from '@/hooks/useDeleteCharter';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/hooks/useAuth';

export default function CharterDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    // Check roles for edit/delete
    const isGlobalAdmin = user?.roles.includes('globalAdmin');
    const isCustomerAdmin = user?.roles.includes('customerAdmin');

    // Fetch detail
    const { data: charter, isLoading, isError, error } = useCharterDetail(id as string);

    // Delete Hook
    const { mutateAsync: deleteCharter, isPending: isDeleting } = useDeleteCharter();
    const [openModal, setOpenModal] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        const allowedRoles = ['globalAdmin','customerAdmin','employer','customerAccountant','customer'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
          router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router, user?.roles]);

    // Handle Deletion
    const handleDelete = async () => {
        setDeleteError(null);
        try {
            await deleteCharter(id as string);
            setOpenModal(false);
            router.push('/charters');
        } catch (err: any) {
            setDeleteError(err.message || 'Failed to delete charter');
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

    if (isError || !charter) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error?.message || 'Failed to load charter detail.'}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="600px" mx="auto" p={4}>
            {/* Delete error if any */}
            {deleteError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {deleteError}
                </Alert>
            )}

            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h5">Charter Detail</Typography>
                        {/* Edit / Delete for admins */}
                        {(isGlobalAdmin || isCustomerAdmin) && (
                            <Box>
                                <Link href={`/app/%5Blocale%5D/charters/edit/${charter.id}`} passHref>
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

                    <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
                        <strong>Name:</strong> {charter.name}
                    </Typography>

                    <Typography variant="body1" gutterBottom>
                        <strong>Remark:</strong> {charter.remark || 'N/A'}
                    </Typography>

                    {/* Client link */}
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        <strong>Client:</strong>{' '}
                        <Link href={`/app/%5Blocale%5D/clients/${charter.clientId}`} passHref>
                            <Button variant="text" size="small">
                                {charter.clientName}
                            </Button>
                        </Link>
                    </Typography>

                    {/* Company link */}
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        <strong>Company:</strong>{' '}
                        <Link href={`/app/%5Blocale%5D/companies/${charter.companyId}`} passHref>
                            <Button variant="text" size="small">
                                {charter.companyName}
                            </Button>
                        </Link>
                    </Typography>
                </CardContent>
            </Card>

            {/* Confirm Deletion Modal */}
            <ConfirmModal
                open={openModal}
                title="Delete Charter?"
                message="Are you sure you want to delete this charter?"
                onClose={() => setOpenModal(false)}
                onConfirm={handleDelete}
            />
        </Box>
    );
}
