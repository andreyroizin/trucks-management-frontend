'use client';

import React, {useState, useEffect} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';
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
    TableHead,
    IconButton,
    Button,
} from '@mui/material';
import DriveFileRenameOutlineRoundedIcon from '@mui/icons-material/DriveFileRenameOutlineRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {useAuth} from '@/hooks/useAuth';
import {useCompanyDetails} from '@/hooks/useCompanyDetails';
import {useDeleteCompany} from '@/hooks/useDeleteCompany';
import ConfirmModal from '@/components/ConfirmModal';
import {useApproveCompany} from "@/hooks/useApproveCompany";

export default function CompanyDetailPage() {
    const {id} = useParams();
    const t = useTranslations();
    const router = useRouter();
    const {user, isAuthenticated, loading: authLoading} = useAuth();
    const {data: company, isLoading, isError, error} = useCompanyDetails(id as string);
    const isCustomerAdmin = user?.roles.includes('customerAdmin');
    const isGlobalAdmin = user?.roles.includes('globalAdmin');
    
    // Debug logging
    React.useEffect(() => {
        if (company) {
            console.log('🏢 [CompanyDetailPage] Company data received:', company);
            console.log('📋 [CompanyDetailPage] KVK value:', company.kvk);
            console.log('📋 [CompanyDetailPage] BTW value:', company.btw);
        }
    }, [company]);
    // Delete Company Hook
    const {
        mutateAsync: deleteCompany,
        isPending,
        isError: isDeleteError,
        error: deleteError,
    } = useDeleteCompany();
    const {mutateAsync: approveCompany, isPending: isApproving} = useApproveCompany();

    // Confirm modal state
    const [openModal, setOpenModal] = useState(false);
    const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

    // Check roles
    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin', 'driver', 'customerAccountant', 'employer', 'customer'];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router, user?.roles]);

    // Handle Delete Confirm
    const handleDelete = async () => {
        setDeleteErrorMsg(null);
        try {
            await deleteCompany(id as string);
            setOpenModal(false);
            router.push('/companies'); // Navigate away after successful deletion
        } catch (err: any) {
            setDeleteErrorMsg(err.message || 'Failed to delete company.');
            setOpenModal(false);
        }
    };

    const handleApprove = async () => {
        try {
            await approveCompany(id as string);
            router.push('/companies'); // Redirect after approval
        } catch (err) {
            console.error('Failed to approve company:', err);
        }
    };

    if (authLoading || isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress/>
            </Box>
        );
    }

    if (isError || !company) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error?.message || t('companies.detail.errors.loadFailed')}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{py: 4}}>
            {/* Header Section */}
            <Box sx={{mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h3" fontWeight={500}>
                    {t('companies.detail.title')}
                </Typography>
            </Box>

            <Paper variant="outlined" sx={{p: 3, mx: 'auto'}}>
                {/* Show deletion error if any */}
                {deleteErrorMsg && (
                    <Alert severity="error" sx={{mb: 2}}>
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
                        {company.name}
                    </Typography>
                    {isGlobalAdmin && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {!company.isApproved && (
                                <Button
                                    variant="contained"
                                    color="success"
                                    disabled={isApproving}
                                    onClick={handleApprove}
                                    sx={{ textTransform: 'none', fontWeight: 600, px: 3, py: 1 }}
                                >
                                    {isApproving ? t('companies.detail.buttons.approving') : t('companies.detail.buttons.approve')}
                                </Button>
                            )}
                            
                            {/* Edit / Delete - matching partride styling exactly */}
                            <IconButton
                                onClick={() => router.push(`/companies/edit?id=${company.id}`)}
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
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    {t('companies.detail.sections.general')}
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                 {t('companies.detail.fields.drivers')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{company.drivers?.length || 0}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                 {t('companies.detail.fields.kvk')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{company.kvk || t('companies.detail.notAvailable')}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                 {t('companies.detail.fields.btw')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{company.btw || t('companies.detail.notAvailable')}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                    <Divider sx={{ my: 3 }} />

                {/* Company Address */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    {t('companies.detail.sections.address')}
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                {t('companies.detail.fields.address')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{company.address || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('companies.detail.fields.postcode')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{company.postcode || t('companies.detail.notAvailable')}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('companies.detail.fields.city')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{company.city || t('companies.detail.notAvailable')}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('companies.detail.fields.country')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{company.country || t('companies.detail.notAvailable')}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                    <Divider sx={{ my: 3 }} />

                {/* Contact Information */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    {t('companies.detail.sections.contact')}
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                {t('companies.detail.fields.phone')}
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{company.phoneNumber || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>{t('companies.detail.fields.email')}</TableCell>
                            <TableCell sx={{border: 'none'}}>{company.email || t('companies.detail.notAvailable')}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                    <Divider sx={{ my: 3 }} />

                {/* Company's Drivers */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    {t('companies.detail.sections.drivers')}
                </Typography>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{pl: 0, fontWeight: 600}}>{t('companies.detail.driversTable.columns.name')}</TableCell>
                            <TableCell sx={{fontWeight: 600}}>{t('companies.detail.driversTable.columns.phone')}</TableCell>
                            <TableCell sx={{fontWeight: 600}}>{t('companies.detail.driversTable.columns.email')}</TableCell>
                            <TableCell sx={{fontWeight: 600}}>{t('companies.detail.driversTable.columns.schedule')}</TableCell>
                            <TableCell sx={{fontWeight: 600}}>{t('companies.detail.driversTable.columns.hours')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {company.drivers && company.drivers.length > 0 ? (
                            company.drivers.map((driver, index) => (
                                <TableRow key={driver.driverId || index}>
                                    <TableCell sx={{pl: 0, border: 'none'}}>
                                        {driver.user?.firstName} {driver.user?.lastName}
                                    </TableCell>
                                    <TableCell sx={{border: 'none'}}>
                                        {driver.user?.phone || 'N/A'}
                                    </TableCell>
                                    <TableCell sx={{border: 'none'}}>
                                        {driver.user?.email || 'N/A'}
                                    </TableCell>
                                    <TableCell sx={{border: 'none'}}>
                                        -
                                    </TableCell>
                                    <TableCell sx={{border: 'none'}}>
                                        -
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} sx={{pl: 0, border: 'none', textAlign: 'center', fontStyle: 'italic', color: 'text.secondary'}}>
                                    {t('companies.detail.driversTable.noDrivers')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                    <Divider sx={{ my: 3 }} />

                {/* Remark */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 1}}>
                    {t('companies.detail.sections.remark')}
                </Typography>
                <Typography variant="body1">
                    {company.remark || t('companies.detail.noRemark')}
                </Typography>

            </Paper>

            {/* Confirm Deletion Modal */}
            <ConfirmModal
                open={openModal}
                title={t('companies.detail.deleteConfirm.title')}
                message={t('companies.detail.deleteConfirm.message')}
                onClose={() => setOpenModal(false)}
                onConfirm={handleDelete}
            />

            {/* Display error for deletion if needed */}
            {isDeleteError && (
                <Alert severity="error" sx={{mt: 2}}>
                    {deleteError?.message || t('companies.detail.errors.deleteFailed')}
                </Alert>
            )}
        </Box>
    );
}
