'use client';

import React, {useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {useTranslations} from 'next-intl';
import {Alert, Box, Button, CircularProgress, Grid, IconButton, TablePagination, Typography} from '@mui/material';
import {useRouter} from 'next/navigation';
import CompanyCard from '@/components/CompanyCard';
import LanguageSelectDesktop from "@/components/LanguageSelectDesktop";
import SyncIcon from "@mui/icons-material/Sync";
import {useCompanies} from '@/hooks/useCompanies';
import {DebouncedSearchInput} from "@/components/DebouncedSearchInput";
import {useAuth} from '@/hooks/useAuth';
import {useDeleteCompany} from '@/hooks/useDeleteCompany';
import ConfirmModal from '@/components/ConfirmModal';

export default function CompaniesOverviewPage() {
    const router = useRouter();
    const t = useTranslations();
    const {user} = useAuth();
    
    // Role checks for UI visibility
    const isGlobalAdmin = user?.roles.includes('globalAdmin');
    const isCustomerAdmin = user?.roles.includes('customerAdmin');
    
    // Debounced search state
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    
    // Delete confirmation modal state
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);

    const {
      data: companiesData,
      isLoading,
      isError
    } = useCompanies(page, pageSize, debouncedSearch);

    const queryClient = useQueryClient();
    const { mutateAsync: deleteCompany } = useDeleteCompany();

    const handleRefetch = () => {
        queryClient.invalidateQueries({ queryKey: ['companies'] });
    }

    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

    const handleMenuClose = () => {
        setSelectedCompanyId(null);
    };

    const handleEdit = (id?: string) => {
        const companyId = id || selectedCompanyId;
        if (companyId) {
            router.push(`/companies/edit?id=${companyId}`);
        }
        handleMenuClose();
    };

    const handleDelete = (id: string) => {
        setCompanyToDelete(id);
        setOpenDeleteModal(true);
        handleMenuClose();
    };

    const confirmDelete = async () => {
        if (companyToDelete) {
            try {
                await deleteCompany(companyToDelete);
                queryClient.invalidateQueries({ queryKey: ['companies'] });
                setOpenDeleteModal(false);
                setCompanyToDelete(null);
            } catch (error) {
                console.error('Failed to delete company:', error);
                setOpenDeleteModal(false);
                setCompanyToDelete(null);
            }
        }
    };

    // Loading & error states
    if (isLoading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
    if (isError)   return <Alert severity="error" sx={{mt:4}}>{t('companies.overview.errors.loadFailed')}</Alert>;

    return (
        <Box sx={{py: 4}}>
            <Box sx={{mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h3" fontWeight={500}>
                    {t('companies.title')}
                </Typography>
                <LanguageSelectDesktop/>
            </Box>

            <Box sx={{mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h4" fontWeight={500}>
                    {t('companies.overview.title')}
                </Typography>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                    {isGlobalAdmin && (
                        <Button 
                            variant="contained" 
                            onClick={() => router.push('/companies/create')}
                        >
                            {t('companies.overview.buttons.create')}
                        </Button>
                    )}
                    <IconButton onClick={handleRefetch}>
                        <SyncIcon sx={{transform: 'rotate(90deg)'}}/>
                    </IconButton>
                </Box>
            </Box>

            <DebouncedSearchInput 
                value={debouncedSearch} 
                onDebouncedChange={setDebouncedSearch} 
                placeholder={t('companies.overview.search.placeholder')} 
                size={"small"} 
                sx={{ mb: 4, maxWidth: 260 }} 
            />

            <Grid container spacing={2}>
                {(companiesData?.data || []).map((c) => (
                    <Grid item xs={12} sm={6} md={4} key={c.id}>
                        <CompanyCard
                            id={c.id}
                            name={c.name}
                            drivers={c.drivers}
                            onDelete={isGlobalAdmin ? handleDelete : undefined}
                            onEdit={isGlobalAdmin ? handleEdit : undefined}
                        />
                    </Grid>
                ))}
            </Grid>

            <TablePagination
                sx={{mt: 4}}
                component="div"
                count={companiesData?.totalCompanies || 0}
                page={page - 1}
                onPageChange={(event, newPage) => setPage(newPage + 1)}
                rowsPerPage={pageSize}
                onRowsPerPageChange={(event) => {
                  setPage(1);
                  setPageSize(parseInt(event.target.value, 10));
                }}
                rowsPerPageOptions={[6, 9, 12, 15]}
                labelRowsPerPage={t('companies.overview.pagination.rowsPerPage')}
            />
            
            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={openDeleteModal}
                title={t('companies.detail.deleteConfirm.title')}
                message={t('companies.detail.deleteConfirm.message')}
                onClose={() => {
                    setOpenDeleteModal(false);
                    setCompanyToDelete(null);
                }}
                onConfirm={confirmDelete}
            />
        </Box>
    );
}
