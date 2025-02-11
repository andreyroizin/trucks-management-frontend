'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Card, CardContent, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { useUnitDetail } from '@/hooks/useUnitDetail';
import { useDeleteUnit } from '@/hooks/useDeleteUnit';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/hooks/useAuth';
import Link from "next/link";

export default function UnitDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    // Fetch detail
    const { data: unit, isLoading, isError, error } = useUnitDetail(id as string);

    // Delete hook
    const { mutateAsync: deleteUnit, isPending: isDeleting } = useDeleteUnit();
    const [openModal, setOpenModal] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Access control
    useEffect(() => {
        if (!authLoading && (!isAuthenticated || !isGlobalAdmin)) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, isGlobalAdmin, router]);

    // Handle Deletion
    const handleDelete = async () => {
        setDeleteError(null);
        try {
            await deleteUnit(id as string);
            setOpenModal(false);
            router.push('/units');
        } catch (err: any) {
            setDeleteError(err.message || 'Failed to delete unit');
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

    if (isError || !unit) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error?.message || 'Failed to load unit details.'}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="600px" mx="auto" p={4}>
            {/* Show delete error if any */}
            {deleteError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {deleteError}
                </Alert>
            )}

            <Card>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        Unit Detail
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        <strong>ID:</strong> {unit.id}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        <strong>Value:</strong> {unit.value}
                    </Typography>
                    {isGlobalAdmin && (
                        <Box display="flex" gap={1} mb={2}>
                            <Link href={`/units/edit/${unit.id}`} passHref>
                                <Button variant="contained" color="primary">Edit</Button>
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
                </CardContent>
            </Card>

            {/* Confirm Modal */}
            <ConfirmModal
                open={openModal}
                title="Delete Unit?"
                message="Are you sure you want to delete this unit?"
                onClose={() => setOpenModal(false)}
                onConfirm={handleDelete}
            />
        </Box>
    );
}
