'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCompanyDetails } from '@/hooks/useCompanyDetails';
import { useAuth } from '@/hooks/useAuth';
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Card,
    CardContent,
} from '@mui/material';
import Link from 'next/link';
import ContactPersonsSection from '@/components/ContactPersons';
import ConfirmModal from '@/components/ConfirmModal';
import { useDeleteCompany } from '@/hooks/useDeleteCompany';

export default function CompanyDetailPage() {
    const router = useRouter();
    const params = useParams();
    const companyId = params?.id as string;
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const isCustomerAdmin = user?.roles.includes('customerAdmin');
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    // Fetch company details
    const { data: company, isLoading, isError, error } = useCompanyDetails(companyId);

    // Delete Company Hook
    const { mutateAsync, isPending, isError: isDeleteError, error: deleteError } = useDeleteCompany();

    // State for confirmation modal
    const [openModal, setOpenModal] = useState(false);
    const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

    // Access control
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'driver', 'customerAccountant', 'employer', 'customer'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, authLoading, router, user?.roles]);

    // Handle Delete Company
    const handleDelete = async () => {
        setDeleteErrorMessage(null); // Reset any previous error
        try {
            await mutateAsync(companyId);
            setOpenModal(false); // Close modal after successful deletion
            router.push('/companies'); // Redirect after deletion
        } catch (error: any) {
            setDeleteErrorMessage(error.message || 'Failed to delete company.');
            setOpenModal(false); // Close modal even if error happens
        }
    };

    if (authLoading || isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error.message || 'Failed to load company details.'}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="600px" mx="auto" p={2}>
            {/* Show delete error */}
            {deleteErrorMessage && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {deleteErrorMessage}
                </Alert>
            )}

            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h5">Company Details</Typography>
                        <Box>
                            {(isCustomerAdmin || isGlobalAdmin) && (
                                <>
                                    <Link href={`/companies/edit?id=${company?.id}`} passHref>
                                        <Button variant="contained" color="primary" sx={{ mr: 1 }}>
                                            Edit Company
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
                                </>
                            )}
                        </Box>
                    </Box>
                    <Typography variant="subtitle1" color="textSecondary">
                        Name:
                    </Typography>
                    <Typography variant="body1">{company?.name}</Typography>
                </CardContent>
            </Card>

            {/* Additional Content, e.g., ContactPersonsSection */}
            <ContactPersonsSection companyId={company?.id} />

            {/* Confirm Modal */}
            <ConfirmModal
                open={openModal}
                title="Delete Company?"
                message="Are you sure you want to delete this company?"
                onClose={() => setOpenModal(false)}
                onConfirm={handleDelete}
            />
        </Box>
    );
}
