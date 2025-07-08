'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Card, CardContent, Typography, CircularProgress, Alert, Button } from '@mui/material';
import Link from 'next/link';
import { useCarDetail } from '@/hooks/useCarDetail';
import { useDeleteCar } from '@/hooks/useDeleteCar';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/hooks/useAuth';

export default function CarDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const isCustomerAdmin = user?.roles.includes('customerAdmin');
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    // Fetch car details
    const { data: car, isLoading, isError, error } = useCarDetail(id as string);

    // Delete hook
    const { mutateAsync: deleteCar, isPending: isDeleting } = useDeleteCar();
    const [openModal, setOpenModal] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Access control
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'customer', 'customerAccountant'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));

        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login'); // Redirect to login if not authorized
        }
    }, [isAuthenticated, authLoading, user, router]);


    // Handle delete
    const handleDelete = async () => {
        setDeleteError(null);
        try {
            await deleteCar(id as string);
            setOpenModal(false);
            router.push('/companies');
        } catch (err: any) {
            setDeleteError(err.message || 'Failed to delete car');
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

    if (isError || !car) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error?.message || 'Failed to load car details.'}</Alert>
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
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h5">Car Detail</Typography>
                        {(isCustomerAdmin || isGlobalAdmin) && (
                            <Box>
                                <Link href={`/cars/edit/${car.id}`} passHref>
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
                        <strong>License Plate:</strong> {car.licensePlate}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        <strong>Remark:</strong> {car.remark}
                    </Typography>

                    {/* Company Link */}
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        <strong>Company:</strong>{' '}
                        <Link href={`/companies/${car.company.id}`} passHref>
                            <Button variant="text" size="small">
                                {car.company.name}
                            </Button>
                        </Link>
                    </Typography>
                </CardContent>
            </Card>

            {/* Confirm Modal */}
            <ConfirmModal
                open={openModal}
                title="Delete Car?"
                message="Are you sure you want to delete this car?"
                onClose={() => setOpenModal(false)}
                onConfirm={handleDelete}
            />
        </Box>
    );
}
