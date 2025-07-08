'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    Button,
} from '@mui/material';
import Link from 'next/link';
import { useSurchargeDetails } from '@/hooks/useSurchargeDetails';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteSurcharge } from '@/hooks/useDeleteSurcharge';
import ConfirmModal from '@/components/ConfirmModal';

export default function SurchargeDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { data: surcharge, isLoading, isError, error } = useSurchargeDetails(id as string);

    // Delete Mutation
    const { mutateAsync: deleteSurcharge } = useDeleteSurcharge();

    // States for modal and errors
    const [openModal, setOpenModal] = useState(false);
    const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

    const isCustomerAdmin = user?.roles.includes('customerAdmin');
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'customerAccountant', 'employer', 'customer'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, authLoading, router, user?.roles]);

    const handleDelete = async () => {
        setDeleteErrorMsg(null);
        try {
            await deleteSurcharge(id as string);
            setOpenModal(false);
            router.push('/clients'); // Redirect after deletion
        } catch (err: any) {
            setDeleteErrorMsg(err.message || 'Failed to delete surcharge.');
            setOpenModal(false);
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isError || !surcharge) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error?.message || 'Failed to load surcharge details.'}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="600px" mx="auto" p={2}>
            <Card>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        Surcharge Details
                    </Typography>

                    {(isCustomerAdmin || isGlobalAdmin) && (
                        <Box display="flex" justifyContent="flex-end" mb={2} gap={2}>
                            <Link href={`/surcharges/edit/${surcharge.id}`} passHref>
                                <Button variant="contained" color="primary">Edit</Button>
                            </Link>
                            <Button variant="contained" color="error" onClick={() => setOpenModal(true)}>
                                Delete
                            </Button>
                        </Box>
                    )}

                    <Typography variant="body1">
                        <strong>Value:</strong> {surcharge.value.toFixed(2)}
                    </Typography>

                    {/* Client Information */}
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        <strong>Client:</strong>{' '}
                        <Link href={`/clients/${surcharge.client.id}`} passHref>
                            <Button variant="text" size="small">
                                {surcharge.client.name}
                            </Button>
                        </Link>
                    </Typography>

                    {/* Company Information */}
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        <strong>Company:</strong>{' '}
                        <Link href={`/companies/${surcharge.company.id}`} passHref>
                            <Button variant="text" size="small">
                                {surcharge.company.name}
                            </Button>
                        </Link>
                    </Typography>
                </CardContent>
            </Card>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={openModal}
                title="Delete Surcharge?"
                message="Are you sure you want to delete this surcharge?"
                onClose={() => setOpenModal(false)}
                onConfirm={handleDelete}
            />

            {/* Delete Error Message */}
            {deleteErrorMsg && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {deleteErrorMsg}
                </Alert>
            )}
        </Box>
    );
}
