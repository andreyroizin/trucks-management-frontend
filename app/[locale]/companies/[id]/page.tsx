'use client';

import React, {useState, useEffect} from 'react';
import {useParams, useRouter} from 'next/navigation';
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
    const router = useRouter();
    const {user, isAuthenticated, loading: authLoading} = useAuth();
    const {data: company, isLoading, isError, error} = useCompanyDetails(id as string);
    const isCustomerAdmin = user?.roles.includes('customerAdmin');
    const isGlobalAdmin = user?.roles.includes('globalAdmin');
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
                <Alert severity="error">{error?.message || 'Failed to load company details.'}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{py: 4}}>
            {/* Header Section */}
            <Box sx={{mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <Typography variant="h3" fontWeight={500}>
                    Company Management
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
                    {(isCustomerAdmin || isGlobalAdmin) && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {(isGlobalAdmin && !company.isApproved) && (
                                <Button
                                    variant="contained"
                                    color="success"
                                    disabled={isApproving}
                                    onClick={handleApprove}
                                    sx={{ textTransform: 'none', fontWeight: 600, px: 3, py: 1 }}
                                >
                                    {isApproving ? 'Approving...' : 'Approve'}
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
                    General Information
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                 Company Drivers
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{company.drivers?.length || 0}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                    <Divider sx={{ my: 3 }} />

                {/* Company Address */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    Company Address
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                Street Address
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{company.address || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Postcode</TableCell>
                            <TableCell sx={{border: 'none'}}>{company.postcode || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>City</TableCell>
                            <TableCell sx={{border: 'none'}}>{company.city || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Country</TableCell>
                            <TableCell sx={{border: 'none'}}>{company.country || 'N/A'}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                    <Divider sx={{ my: 3 }} />

                {/* Contact Information */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    Contact Information
                </Typography>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none', width: 160}}>
                                Phone Number
                            </TableCell>
                            <TableCell sx={{border: 'none'}}>{company.phoneNumber || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{pl: 0, border: 'none'}}>Email</TableCell>
                            <TableCell sx={{border: 'none'}}>{company.email || 'N/A'}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                    <Divider sx={{ my: 3 }} />

                {/* Company's Drivers */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 2}}>
                    Company's Drivers
                </Typography>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{pl: 0, fontWeight: 600}}>Name</TableCell>
                            <TableCell sx={{fontWeight: 600}}>Phone</TableCell>
                            <TableCell sx={{fontWeight: 600}}>Email</TableCell>
                            <TableCell sx={{fontWeight: 600}}>Weekly Schedule</TableCell>
                            <TableCell sx={{fontWeight: 600}}>Working Hours</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {company.drivers && company.drivers.length > 0 ? (
                            company.drivers.map((driver, index) => (
                                <TableRow key={driver.driverId || index}>
                                    <TableCell sx={{pl: 0, border: 'none'}}>
                                        {driver.firstName} {driver.lastName}
                                    </TableCell>
                                    <TableCell sx={{border: 'none'}}>
                                        {driver.phone || 'N/A'}
                                    </TableCell>
                                    <TableCell sx={{border: 'none'}}>
                                        {driver.email || 'N/A'}
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
                                    No drivers assigned to this company
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                    <Divider sx={{ my: 3 }} />

                {/* Remark */}
                <Typography variant="h6" fontWeight={500} sx={{mb: 1}}>
                    Remark
                </Typography>
                <Typography variant="body1">
                    {company.remark || 'No remark provided'}
                </Typography>

            </Paper>

            {/* Confirm Deletion Modal */}
            <ConfirmModal
                open={openModal}
                title="Delete Company?"
                message="Are you sure you want to delete this company?"
                onClose={() => setOpenModal(false)}
                onConfirm={handleDelete}
            />

            {/* Display error for deletion if needed */}
            {isDeleteError && (
                <Alert severity="error" sx={{mt: 2}}>
                    {deleteError?.message || 'Failed to delete company.'}
                </Alert>
            )}
        </Box>
    );
}
