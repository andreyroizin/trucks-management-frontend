'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    TablePagination,
} from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import dayjs from 'dayjs';

import { useDisputes } from '@/hooks/useDisputes';
import StatusChip from '@/components/StatusChip';
import { useRouter } from 'next/navigation';
import { DisputeStatus, getDisputeStatusInfo } from "@/utils/disputeStatus";
import { useTranslations } from 'next-intl';

export default function DisputeHistoryPage() {
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const router = useRouter();
    const t = useTranslations('disputes.driver');

    const params = {
        pageNumber: page,
        pageSize: rowsPerPage,
    };

    const { data, isLoading } = useDisputes(params);

    if (isLoading)
        return (
            <Box display="flex" justifyContent="center" mt={6}>
                <CircularProgress />
            </Box>
        );

    if (!data)
        return (
            <Typography mt={6} textAlign="center" color="error">
                {t('error.load')}
            </Typography>
        );

    return (
        <Box maxWidth="600px" mx="auto" py={4}>
            <Typography variant="h4" fontWeight={500} gutterBottom>
                {t('title')}
            </Typography>
            <Typography variant="body1" mb={2}>
                {t('subtitle')}
            </Typography>

            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 500, py: 2 }}>{t('table.date')}</TableCell>
                            <TableCell sx={{ fontWeight: 500, py: 2 }}>{t('table.hours')}</TableCell>
                            <TableCell sx={{ fontWeight: 500, py: 2 }}>{t('table.status')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.data.map((d) => {
                            const chip = getDisputeStatusInfo(d.status as DisputeStatus);
                            return (
                                <TableRow
                                    key={d.id}
                                    hover
                                    sx={{ cursor: 'pointer' }}
                                    onClick={() => router.push(`/disputes/${d.id}`)}
                                >
                                    <TableCell sx={{ py: 2 }}>{dayjs(d.partRide.date).format('DD.MM.YY')}</TableCell>
                                    <TableCell sx={{ py: 2 }}>{d.partRide.decimalHours.toString().replace('.', ',')} h.</TableCell>
                                    <TableCell sx={{ py: 2 }}>
                                        <StatusChip label={chip.label} variant={chip.variant} />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
                component="div"
                count={data.totalCount}
                page={page - 1}
                onPageChange={(_, newPage) => setPage(newPage + 1)}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                onRowsPerPageChange={(event) => {
                    setRowsPerPage(parseInt(event.target.value, 10));
                    setPage(1);
                }}
            />

            {/* Back button */}
            <Box mt={2} display="flex" justifyContent="center">
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<ArrowBackIosIcon />}
                    onClick={() => router.push(`/dashboard/driver`)}
                >
                    {t('back')}
                </Button>
            </Box>
        </Box>
    );
}
