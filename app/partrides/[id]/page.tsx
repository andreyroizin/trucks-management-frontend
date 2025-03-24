'use client';

import React, {useEffect, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    Button, TableContainer, Table,
    TableBody, Paper, TableRow, TableCell,
} from '@mui/material';
import Link from 'next/link';

import {useAuth} from '@/hooks/useAuth';
import {usePartRideDetail} from '@/hooks/usePartRideDetail';
import {useDeletePartRide} from '@/hooks/useDeletePartRide';
import ConfirmModal from '@/components/ConfirmModal';
import {partRideApprovalStatusMap} from "@/utils/constants/approvalStatusMap";
import ApprovalActions from "@/components/ApprovalActions";
import dayjs from "dayjs"; // A reusable modal for confirmations

export default function PartRideDetailPage() {
    const router = useRouter();
    const {id} = useParams();
    const {user, isAuthenticated, loading: authLoading} = useAuth();
    const isDriver = user?.roles.includes('driver');

    // Ensure only logged-in users can view
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Fetch Part Ride Detail
    const {data: partRide, isLoading, isError, error} = usePartRideDetail(id as string);

    // Delete Hook
    const {mutateAsync: deletePartRide, isPending: isDeleting} = useDeletePartRide();
    const [openModal, setOpenModal] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Handle Deletion
    const handleDelete = async () => {
        setDeleteError(null);
        try {
            await deletePartRide(id as string);
            setOpenModal(false);
            router.push('/partrides'); // Go back to listing or anywhere you prefer
        } catch (err: any) {
            setDeleteError(err.message || 'Failed to delete part ride');
            setOpenModal(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress/>
            </Box>
        );
    }

    if (isError || !partRide) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error?.message || 'Failed to load part ride detail.'}</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="600px" mx="auto" p={2}>
            {/* Show delete error if any */}
            {deleteError && (
                <Alert severity="error" sx={{mb: 2}}>
                    {deleteError}
                </Alert>
            )}

            <Card>
                <CardContent>
                    {/* Title + Delete Button */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h5">Part Ride Detail</Typography>
                        <Box display="flex" gap={2}>
                            {/* For example, show delete only if not a driver or if all can do it */}
                            {!isDriver && (
                                <>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        disabled={isDeleting}
                                        onClick={() => setOpenModal(true)}
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </Button>
                                    <Link href={`/partrides/edit?id=${partRide.id}`} passHref>
                                        <Button variant="contained" color="primary" sx={{mr: 1}}>
                                            Edit
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </Box>
                    </Box>

                    {/* Basic Fields */}
                    <Typography variant="body1" gutterBottom>
                        <strong>Date:</strong>{' '}
                        { partRide.date ? dayjs(partRide.date).format('DD.MM.YYYY') : 'N/A'}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        <strong>Start:</strong> {partRide.start}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        <strong>End:</strong> {partRide.end}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        <strong>Rest:</strong> {partRide.rest || 'N/A'}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        <strong>Kilometers:</strong> {partRide.kilometers ?? 'N/A'}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        <strong>Costs:</strong> {partRide.costs ?? 'N/A'}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        <strong>Employer:</strong> {partRide.employer || 'N/A'}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        <strong>Week Number:</strong> {partRide.weekNumber}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        <strong>Costs Description:</strong> {partRide.costsDescription || 'N/A'}
                    </Typography>

                    {/* Turnover (Hidden for drivers) */}
                    {!isDriver && (
                        <Typography variant="body1" gutterBottom>
                            <strong>Turnover:</strong> {partRide.turnover ?? 'N/A'}
                        </Typography>
                    )}

                    <Typography variant="body1" gutterBottom>
                        <strong>Remark:</strong> {partRide.remark || 'N/A'}
                    </Typography>

                    {/* Company Link */}
                    <Typography variant="body1" gutterBottom>
                        <strong>Company:</strong>{' '}
                        {partRide.company ? (
                            <Link href={`/companies/${partRide.company.id}`} passHref>
                                <Button variant="text" size="small">
                                    {partRide.company.name}
                                </Button>
                            </Link>
                        ) : (
                            'N/A'
                        )}
                    </Typography>

                    {/* Client Link */}
                    <Typography variant="body1" gutterBottom>
                        <strong>Client:</strong>{' '}
                        {partRide.client ? (
                            <Link href={`/clients/${partRide.client.id}`} passHref>
                                <Button variant="text" size="small">
                                    {partRide.client.name}
                                </Button>
                            </Link>
                        ) : (
                            'N/A'
                        )}
                    </Typography>

                    {/* Driver Link */}
                    <Typography variant="body1" gutterBottom>
                        <strong>Driver:</strong>{' '}
                        {partRide.driver ? (
                            <Link href={`/drivers/${partRide.driver.aspNetUserId}`} passHref>
                                <Button variant="text" size="small">
                                    {partRide.driver.firstName} {partRide.driver.lastName}
                                </Button>
                            </Link>
                        ) : (
                            'N/A'
                        )}
                    </Typography>

                    {/* Car Link */}
                    <Typography variant="body1" gutterBottom>
                        <strong>Car:</strong>{' '}
                        {partRide.car ? (
                            <Link href={`/cars/${partRide.car.id}`} passHref>
                                <Button variant="text" size="small">
                                    {partRide.car.licensePlate}
                                </Button>
                            </Link>
                        ) : (
                            'N/A'
                        )}
                    </Typography>

                    {/* Rate Link */}
                    <Typography variant="body1" gutterBottom>
                        <strong>Rate:</strong>{' '}
                        {partRide.rate ? (
                            <Link href={`/rates/detail/${partRide.rate.id}`} passHref>
                                <Button variant="text" size="small">
                                    {partRide.rate.name}
                                </Button>
                            </Link>
                        ) : (
                            'N/A'
                        )}
                    </Typography>

                    {/* Surcharge Link */}
                    <Typography variant="body1" gutterBottom>
                        <strong>Surcharge:</strong>{' '}
                        {partRide.surcharge ? (
                            <Link href={`/surcharges/${partRide.surcharge.id}`} passHref>
                                <Button variant="text" size="small">
                                    {partRide.surcharge.value}
                                </Button>
                            </Link>
                        ) : (
                            'N/A'
                        )}
                    </Typography>

                    {/* Charter Link */}
                    <Typography variant="body1" gutterBottom>
                        <strong>Charter:</strong>{' '}
                        {partRide.charter ? (
                            <Link href={`/charters/${partRide.charter.id}`} passHref>
                                <Button variant="text" size="small">
                                    {partRide.charter.name}
                                </Button>
                            </Link>
                        ) : (
                            'N/A'
                        )}
                    </Typography>

                    {/* Unit Link */}
                    <Typography variant="body1" gutterBottom>
                        <strong>Unit:</strong> {partRide.unit?.value}
                    </Typography>

                    {/* Ride Link */}
                    <Typography variant="body1" gutterBottom>
                        <strong>Ride:</strong>{' '}
                        {partRide.ride ? (
                            <Link href={`/rides/${partRide.ride.id}`} passHref>
                                <Button variant="text" size="small">
                                    {partRide.ride.name}
                                </Button>
                            </Link>
                        ) : (
                            'N/A'
                        )}
                    </Typography>
                </CardContent>
            </Card>
            <Box mt={2}>
                <Typography variant="h6" gutterBottom>Additional Fields</Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableBody>
                            {/* hoursOption */}
                            {partRide.hoursOption && (
                                <TableRow>
                                    <TableCell><strong>Hours Option</strong></TableCell>
                                    <TableCell>
                                        <Link href={`/hoursoption/${partRide.hoursOption.id}`} passHref>
                                            <Button variant="text" size="small">
                                                {partRide.hoursOption.name}
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            )}

                            {/* hoursCode */}
                            {partRide.hoursCode && (
                                <TableRow>
                                    <TableCell><strong>Hours Code</strong></TableCell>
                                    <TableCell>
                                        <Link href={`/hourscode/${partRide.hoursCode.id}`} passHref>
                                            <Button variant="text" size="small">
                                                {partRide.hoursCode.name}
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            )}

                            {/* correctionTotalHours */}
                            {partRide.correctionTotalHours !== undefined && (
                                <TableRow>
                                    <TableCell><strong>Correction Total Hours</strong></TableCell>
                                    <TableCell>{partRide.correctionTotalHours}</TableCell>
                                </TableRow>
                            )}

                            {/* taxFreeCompensation */}
                            {partRide.taxFreeCompensation !== undefined && (
                                <TableRow>
                                    <TableCell><strong>Tax Free Compensation</strong></TableCell>
                                    <TableCell>€ {partRide.taxFreeCompensation}</TableCell>
                                </TableRow>
                            )}

                            {/* standOver */}
                            {partRide.standOver !== undefined && (
                                <TableRow>
                                    <TableCell><strong>Stand Over</strong></TableCell>
                                    <TableCell>{partRide.standOver}</TableCell>
                                </TableRow>
                            )}

                            {/* nightAllowance */}
                            {partRide.nightAllowance !== undefined && (
                                <TableRow>
                                    <TableCell><strong>Night Allowance</strong></TableCell>
                                    <TableCell>€ {partRide.nightAllowance}</TableCell>
                                </TableRow>
                            )}

                            {/* kilometerReimbursement */}
                            {partRide.kilometerReimbursement !== undefined && (
                                <TableRow>
                                    <TableCell><strong>Kilometer Reimbursement</strong></TableCell>
                                    <TableCell>{partRide.kilometerReimbursement}</TableCell>
                                </TableRow>
                            )}

                            {/* extraKilometers */}
                            {partRide.extraKilometers !== undefined && (
                                <TableRow>
                                    <TableCell><strong>Extra Kilometers</strong></TableCell>
                                    <TableCell>{partRide.extraKilometers}</TableCell>
                                </TableRow>
                            )}

                            {/* consignmentFee */}
                            {partRide.consignmentFee !== undefined && (
                                <TableRow>
                                    <TableCell><strong>Consignment Fee</strong></TableCell>
                                    <TableCell>{partRide.consignmentFee}</TableCell>
                                </TableRow>
                            )}

                            {/* saturdayHours */}
                            {partRide.saturdayHours !== undefined && (
                                <TableRow>
                                    <TableCell><strong>Saturday Hours</strong></TableCell>
                                    <TableCell>{partRide.saturdayHours}</TableCell>
                                </TableRow>
                            )}

                            {/* sundayHolidayHours */}
                            {partRide.sundayHolidayHours !== undefined && (
                                <TableRow>
                                    <TableCell><strong>Sunday/Holiday Hours</strong></TableCell>
                                    <TableCell>{partRide.sundayHolidayHours}</TableCell>
                                </TableRow>
                            )}

                            {/* variousCompensation */}
                            {partRide.variousCompensation !== undefined && (
                                <TableRow>
                                    <TableCell><strong>Various Compensation</strong></TableCell>
                                    <TableCell>{partRide.variousCompensation}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
            <ApprovalActions
                userRoles={user?.roles || []}
                approvals={partRide.approvals}
                partRideId={partRide.id}
            />
            {partRide.approvals && partRide.approvals.length > 0 && (
                <Box mt={2}>
                    <Typography variant="h6" gutterBottom>
                        Approvals
                    </Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableBody>
                                {partRide.approvals.map((approval) => {

                                    return (
                                        <TableRow key={approval.id}>
                                            <TableCell>
                                                <strong>Status:</strong> {partRideApprovalStatusMap[approval.status]}
                                            </TableCell>
                                            <TableCell>
                                                <strong>Updated At:</strong> {dayjs(approval.updatedAt).format('DD.MM.YYYY HH:mm')}
                                            </TableCell>
                                            <TableCell>
                                                <strong>Comments:</strong> {approval.comments ?? 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <strong>Role:</strong> {approval.role?.name}
                                            </TableCell>
                                            <TableCell>
                                                <strong>Approved By:</strong>{' '}
                                                {approval.approvedByUser
                                                    ? `${approval.approvedByUser.firstName} ${approval.approvedByUser.lastName}`
                                                    : 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* Confirm Deletion Modal */}
            <ConfirmModal
                open={openModal}
                title="Delete Part Ride?"
                message="Are you sure you want to delete this part ride?"
                onClose={() => setOpenModal(false)}
                onConfirm={handleDelete}
            />
        </Box>
    );
}
