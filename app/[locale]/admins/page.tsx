'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Box, Button, CircularProgress, Grid, IconButton, TablePagination, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import CustomerAdminCard from '@/components/CustomerAdminCard';
import LanguageSelectDesktop from "@/components/LanguageSelectDesktop";
import SyncIcon from "@mui/icons-material/Sync";
import { useCustomerAdmins } from '@/hooks/useCustomerAdmins';
import { DebouncedSearchInput } from "@/components/DebouncedSearchInput";
import { useAuth } from '@/hooks/useAuth';
import { useDeleteCustomerAdmin } from '@/hooks/useDeleteCustomerAdmin';
import ConfirmModal from '@/components/ConfirmModal';

export default function CustomerAdminsOverviewPage() {
    const router = useRouter();
    const t = useTranslations();
    const { user } = useAuth();

    // Role check - only globalAdmin can access
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    // Debounced search state
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    // Delete confirmation modal state
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [adminToDelete, setAdminToDelete] = useState<string | null>(null);

    const {
        data: adminsData,
        isLoading,
        isError
    } = useCustomerAdmins(page, pageSize, debouncedSearch);

    const queryClient = useQueryClient();
    const { mutateAsync: deleteAdmin } = useDeleteCustomerAdmin();

    const handleRefetch = () => {
        queryClient.invalidateQueries({ queryKey: ['customerAdmins'] });
    }

    const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);

    const handleMenuClose = () => {
        setSelectedAdminId(null);
    };

    const handleEdit = (id?: string) => {
        const adminId = id || selectedAdminId;
        if (adminId) {
            router.push(`/admins/edit/${adminId}`);
        }
        handleMenuClose();
    };

    const handleDelete = (id: string) => {
        setAdminToDelete(id);
        setOpenDeleteModal(true);
        handleMenuClose();
    };

    const confirmDelete = async () => {
        if (adminToDelete) {
            try {
                await deleteAdmin(adminToDelete);
                queryClient.invalidateQueries({ queryKey: ['customerAdmins'] });
                setOpenDeleteModal(false);
                setAdminToDelete(null);
            } catch (error) {
                console.error('Failed to delete customer admin:', error);
                setOpenDeleteModal(false);
                setAdminToDelete(null);
            }
        }
    };

    // Access control - redirect if not globalAdmin
    if (!isGlobalAdmin && !isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{t('admins.overview.errors.noPermission')}</Alert>
            </Box>
        );
    }

    // Loading & error states
    if (isLoading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
    if (isError) return <Alert severity="error" sx={{ mt: 4 }}>{t('admins.overview.errors.loadFailed')}</Alert>;

    return (
        <Box sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h3" fontWeight={500}>
                    {t('admins.title')}
                </Typography>
                <LanguageSelectDesktop />
            </Box>

            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h4" fontWeight={500}>
                    {t('admins.overview.title')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {isGlobalAdmin && (
                        <Button
                            variant="contained"
                            onClick={() => router.push('/admins/create')}
                        >
                            {t('admins.overview.buttons.create')}
                        </Button>
                    )}
                    <IconButton onClick={handleRefetch}>
                        <SyncIcon sx={{ transform: 'rotate(90deg)' }} />
                    </IconButton>
                </Box>
            </Box>

            <DebouncedSearchInput
                value={debouncedSearch}
                onDebouncedChange={setDebouncedSearch}
                placeholder={t('admins.overview.search.placeholder')}
                size={"small"}
                sx={{ mb: 4, maxWidth: 260 }}
            />

            <Grid container spacing={2}>
                {(adminsData?.data || []).map((admin) => (
                    <Grid item xs={12} sm={6} md={4} key={admin.id}>
                        <CustomerAdminCard
                            id={admin.id}
                            email={admin.email}
                            firstName={admin.firstName}
                            lastName={admin.lastName}
                            phoneNumber={admin.phoneNumber}
                            associatedCompanies={admin.contactPersonInfo?.associatedCompanies}
                            onDelete={isGlobalAdmin ? handleDelete : undefined}
                            onEdit={isGlobalAdmin ? handleEdit : undefined}
                        />
                    </Grid>
                ))}
            </Grid>

            <TablePagination
                sx={{ mt: 4 }}
                component="div"
                count={adminsData?.totalCount || 0}
                page={page - 1}
                onPageChange={(event, newPage) => setPage(newPage + 1)}
                rowsPerPage={pageSize}
                onRowsPerPageChange={(event) => {
                    setPage(1);
                    setPageSize(parseInt(event.target.value, 10));
                }}
                rowsPerPageOptions={[6, 9, 12, 15]}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={openDeleteModal}
                title={t('admins.detail.deleteConfirm.title')}
                message={t('admins.detail.deleteConfirm.message')}
                onClose={() => {
                    setOpenDeleteModal(false);
                    setAdminToDelete(null);
                }}
                onConfirm={confirmDelete}
            />
        </Box>
    );
}

