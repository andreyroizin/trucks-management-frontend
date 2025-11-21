'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Divider,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableRow,
    IconButton,
    Chip,
    Stack,
    Button,
} from '@mui/material';
import DriveFileRenameOutlineRoundedIcon from '@mui/icons-material/DriveFileRenameOutlineRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useCustomerAdminDetail } from '@/hooks/useCustomerAdminDetail';
import { useDeleteCustomerAdmin } from '@/hooks/useDeleteCustomerAdmin';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/hooks/useAuth';

export default function CustomerAdminDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const t = useTranslations();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { data: admin, isLoading, isError, error } = useCustomerAdminDetail(id as string);
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    // Delete Hook
    const {
        mutateAsync: deleteAdmin,
        isPending,
        isError: isDeleteError,
        error: deleteError,
    } = useDeleteCustomerAdmin();

    // Confirm modal state
    const [openModal, setOpenModal] = useState(false);
    const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

    // Check roles
    useEffect(() => {
        if (!authLoading && (!isAuthenticated || !isGlobalAdmin)) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, isGlobalAdmin, router]);

    // Handle Delete Confirm
    const handleDelete = async () => {
        setDeleteErrorMsg(null);
        try {
            await deleteAdmin(id as string);
            setOpenModal(false);
            router.push('/admins'); // Navigate away after successful deletion
        } catch (err: any) {
            setDeleteErrorMsg(err.message || t('admins.detail.errors.deleteFailed'));
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

    if (isError || !admin) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error?.message || t('admins.detail.errors.loadFailed')}</Alert>
            </Box>
        );
    }

    // Extract companies and clients from clientsCompanies array
    const companies = admin.contactPersonInfo?.clientsCompanies
        ?.filter(cc => cc.companyId && cc.companyName)
        .map(cc => ({ id: cc.companyId!, name: cc.companyName! })) || [];

    const clients = admin.contactPersonInfo?.clientsCompanies
        ?.filter(cc => cc.clientId && cc.clientName)
        .map(cc => ({ id: cc.clientId!, name: cc.clientName! })) || [];

    return (
        <Box sx={{ py: 4 }}>
            {/* Header Section */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h3" fontWeight={500}>
                    {t('admins.detail.title')}
                </Typography>
            </Box>

            <Paper variant="outlined" sx={{ p: 3, mx: 'auto' }}>
                {/* Show deletion error if any */}
                {deleteErrorMsg && (
                    <Alert severity="error" sx={{ mb: 2 }}>
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
                        {admin.firstName} {admin.lastName}
                    </Typography>
                    {isGlobalAdmin && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {/* Edit Button */}
                            <IconButton
                                onClick={() => router.push(`/admins/edit/${admin.id}`)}
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

                            {/* Delete Button */}
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
                <Typography variant="h6" fontWeight={500} sx={{ mb: 2 }}>
                    {t('admins.detail.sections.general')}
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{ pl: 0, border: 'none', width: 160 }}>
                                {t('admins.detail.fields.email')}
                            </TableCell>
                            <TableCell sx={{ border: 'none' }}>{admin.email || t('admins.detail.notAvailable')}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ pl: 0, border: 'none' }}>{t('admins.detail.fields.phoneNumber')}</TableCell>
                            <TableCell sx={{ border: 'none' }}>{admin.phoneNumber || t('admins.detail.notAvailable')}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ pl: 0, border: 'none' }}>{t('admins.detail.fields.address')}</TableCell>
                            <TableCell sx={{ border: 'none' }}>{admin.address || t('admins.detail.notAvailable')}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ pl: 0, border: 'none' }}>{t('admins.detail.fields.postcode')}</TableCell>
                            <TableCell sx={{ border: 'none' }}>{admin.postcode || t('admins.detail.notAvailable')}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ pl: 0, border: 'none' }}>{t('admins.detail.fields.city')}</TableCell>
                            <TableCell sx={{ border: 'none' }}>{admin.city || t('admins.detail.notAvailable')}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ pl: 0, border: 'none' }}>{t('admins.detail.fields.country')}</TableCell>
                            <TableCell sx={{ border: 'none' }}>{admin.country || t('admins.detail.notAvailable')}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Divider sx={{ my: 3 }} />

                {/* Associated Companies */}
                <Typography variant="h6" fontWeight={500} sx={{ mb: 2 }}>
                    {t('admins.detail.sections.companies')}
                </Typography>
                {companies.length > 0 ? (
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {companies.map((company) => (
                            <Chip
                                key={company.id}
                                label={company.name}
                                color="primary"
                                variant="outlined"
                            />
                        ))}
                    </Stack>
                ) : (
                    <Typography variant="body1" color="text.secondary">
                        {t('admins.detail.noCompanies')}
                    </Typography>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Associated Clients */}
                <Typography variant="h6" fontWeight={500} sx={{ mb: 2 }}>
                    {t('admins.detail.sections.clients')}
                </Typography>
                {clients.length > 0 ? (
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {clients.map((client) => (
                            <Chip
                                key={client.id}
                                label={client.name}
                                color="secondary"
                                variant="outlined"
                            />
                        ))}
                    </Stack>
                ) : (
                    <Typography variant="body1" color="text.secondary">
                        {t('admins.detail.noClients')}
                    </Typography>
                )}

                <Divider sx={{ my: 3 }} />

                {/* Remark */}
                <Typography variant="h6" fontWeight={500} sx={{ mb: 1 }}>
                    {t('admins.detail.sections.remark')}
                </Typography>
                <Typography variant="body1">
                    {admin.remark || t('admins.detail.noRemark')}
                </Typography>
            </Paper>

            {/* Confirm Deletion Modal */}
            <ConfirmModal
                open={openModal}
                title={t('admins.detail.deleteConfirm.title')}
                message={t('admins.detail.deleteConfirm.message')}
                onClose={() => setOpenModal(false)}
                onConfirm={handleDelete}
            />

            {/* Display error for deletion if needed */}
            {isDeleteError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {deleteError?.message || t('admins.detail.errors.deleteFailed')}
                </Alert>
            )}
        </Box>
    );
}

