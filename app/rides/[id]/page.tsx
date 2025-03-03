'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    Button,
    Table,
    TableContainer,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
} from '@mui/material';
import Link from 'next/link';
import { useRideDetail } from '@/hooks/useRideDetail';
import { useDeleteRide } from '@/hooks/useDeleteRide'; // The delete hook
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/hooks/useAuth';

export default function RideDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    // We assume only globalAdmins can delete or update
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    // Fetch the ride detail
    const { data: ride, isLoading, isError, error } = useRideDetail(id as string);

    // Deletion
    const { mutateAsync: deleteRide, isPending: isDeleting } = useDeleteRide();
    const [openModal, setOpenModal] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'customer', 'customerAccountant', 'employer'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, authLoading, router, user?.roles]);

    // Handle Delete
    const handleDelete = async () => {
        setDeleteError(null);
        try {
            await deleteRide(id as string);
            setOpenModal(false);
            router.push('/rides'); // or wherever you want to go
        } catch (err: any) {
            setDeleteError(err.message || 'Failed to delete ride');
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

    if (isError || !ride) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error?.message || 'Failed to load ride detail.'}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="800px" mx="auto" p={2}>
            {/* Deletion error */}
            {deleteError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {deleteError}
                </Alert>
            )}

            <Card>
                <CardContent>
                    {/* Title + Buttons */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h5">Ride Detail</Typography>
                        {isGlobalAdmin && (
                            <Box>
                                <Link href={`/rides/edit/${ride.id}`} passHref>
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
                        <strong>Name:</strong> {ride.name}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        <strong>Remark:</strong> {ride.remark || 'N/A'}
                    </Typography>
                    {/* Company Link */}
                    <Typography variant="body1" gutterBottom>
                        <strong>Company:</strong>{' '}
                        <Link href={`/companies/${ride.companyId}`} passHref>
                            <Button variant="text" size="small">
                                {ride.companyName}
                            </Button>
                        </Link>
                    </Typography>
                </CardContent>
            </Card>

            {/* Part Rides Table */}
            <Box mt={4}>
                <Typography variant="h6" gutterBottom>
                    Part Rides
                </Typography>
                {ride.partRides.length === 0 ? (
                    <Alert severity="info">No part rides available.</Alert>
                ) : (
                    <TableContainer component={Paper}>
                        <Table aria-label="part rides table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Start</TableCell>
                                    <TableCell>End</TableCell>
                                    <TableCell>Kilometers</TableCell>
                                    <TableCell>Turnover</TableCell>
                                    <TableCell>Client</TableCell>
                                    <TableCell>Car</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ride.partRides.map((partRide) => (
                                    <TableRow key={partRide.id}>
                                        <TableCell>{partRide.date?.substring(0, 10)}</TableCell>
                                        <TableCell>{partRide.start}</TableCell>
                                        <TableCell>{partRide.end}</TableCell>
                                        <TableCell>{partRide.kilometers}</TableCell>
                                        <TableCell>{partRide.turnover}</TableCell>
                                        <TableCell>
                                            {partRide.client ? (
                                                <Link href={`/clients/${partRide.client.id}`} passHref>
                                                    <Button variant="text" size="small">
                                                        {partRide.client.name}
                                                    </Button>
                                                </Link>
                                            ) : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {partRide.car ? (
                                                <Link href={`/cars/${partRide.car.id}`} passHref>
                                                    <Button variant="text" size="small">
                                                        {partRide.car.licensePlate}
                                                    </Button>
                                                </Link>
                                            ) : 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>

            {/* Confirm Deletion Modal */}
            <ConfirmModal
                open={openModal}
                title="Delete Ride?"
                message="Are you sure you want to delete this ride?"
                onClose={() => setOpenModal(false)}
                onConfirm={handleDelete}
            />
        </Box>
    );
}
