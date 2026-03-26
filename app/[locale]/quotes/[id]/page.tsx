'use client';

import React, { useState } from 'react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuoteDetail } from '@/hooks/useQuoteDetail';
import { useUpdateQuoteStatus } from '@/hooks/useUpdateQuoteStatus';
import { useDeleteQuote } from '@/hooks/useDeleteQuote';
import { useDownloadQuotePdf } from '@/hooks/useDownloadQuotePdf';
import LanguageSelectDesktop from '@/components/LanguageSelectDesktop';
import ConfirmModal from '@/components/ConfirmModal';
import EditIcon from '@mui/icons-material/EditRounded';
import DownloadIcon from '@mui/icons-material/DownloadRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import SendIcon from '@mui/icons-material/SendRounded';
import CheckIcon from '@mui/icons-material/CheckCircleRounded';
import CloseIcon from '@mui/icons-material/CancelRounded';
import UndoIcon from '@mui/icons-material/UndoRounded';
import ArrowBackIcon from '@mui/icons-material/ArrowBackRounded';
import dayjs from 'dayjs';
import { QuoteStatus } from '@/types/quote';

function StatusChip({ status, t }: { status: QuoteStatus; t: any }) {
    const map: Record<QuoteStatus, { color: 'default' | 'info' | 'success' | 'error' | 'warning'; label: string }> = {
        Draft: { color: 'default', label: t('quotes.status.draft') },
        Sent: { color: 'info', label: t('quotes.status.sent') },
        Accepted: { color: 'success', label: t('quotes.status.accepted') },
        Rejected: { color: 'error', label: t('quotes.status.rejected') },
        Expired: { color: 'warning', label: t('quotes.status.expired') },
    };
    const cfg = map[status] ?? { color: 'default' as const, label: status };
    return <Chip label={cfg.label} color={cfg.color} size="small" />;
}

const formatCurrency = (value: number) => `€${value.toFixed(2)}`;

export default function QuoteDetailPage() {
    const router = useRouter();
    const t = useTranslations();
    const { id } = useParams<{ id: string }>();
    const { data: quote, isLoading } = useQuoteDetail(id);
    const updateStatus = useUpdateQuoteStatus();
    const deleteQuote = useDeleteQuote();
    const downloadPdf = useDownloadQuotePdf();

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const handleStatusChange = async (newStatus: string) => {
        try {
            await updateStatus.mutateAsync({ id, status: newStatus });
        } catch {
            alert(t('quotes.errors.statusUpdateFailed'));
        }
    };

    const handleDelete = async () => {
        try {
            await deleteQuote.mutateAsync(id);
            router.push('/quotes');
        } catch {
            alert(t('quotes.errors.deleteFailed'));
        }
    };

    if (isLoading || !quote) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    const isDraft = quote.status === 'Draft';
    const isSent = quote.status === 'Sent';
    const isAccepted = quote.status === 'Accepted';
    const isRejected = quote.status === 'Rejected';

    return (
        <Box sx={{ py: 4, maxWidth: 900 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            variant="text"
                            startIcon={<ArrowBackIcon />}
                            onClick={() => router.push('/quotes')}
                            sx={{ mr: 1 }}
                        >
                            {t('quotes.detail.backToList')}
                        </Button>
                    </Box>
                    <LanguageSelectDesktop />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                    <Typography variant="h3" fontWeight={500}>
                        {quote.quoteNumber}
                    </Typography>
                    <StatusChip status={quote.status} t={t} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {t('quotes.detail.createdOn', { date: dayjs(quote.createdAt).format('DD-MM-YYYY') })}
                    {quote.sentAt && ` · ${t('quotes.detail.sentOn', { date: dayjs(quote.sentAt).format('DD-MM-YYYY') })}`}
                    {quote.acceptedAt && ` · ${t('quotes.detail.acceptedOn', { date: dayjs(quote.acceptedAt).format('DD-MM-YYYY') })}`}
                    {quote.rejectedAt && ` · ${t('quotes.detail.rejectedOn', { date: dayjs(quote.rejectedAt).format('DD-MM-YYYY') })}`}
                </Typography>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadPdf.mutate({ id: quote.id, fileName: `${quote.quoteNumber}.pdf` })}
                    disabled={downloadPdf.isPending}
                >
                    {t('quotes.actions.downloadPdf')}
                </Button>
                {isDraft && (
                    <>
                        <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => router.push(`/quotes/edit/${id}`)}
                        >
                            {t('quotes.actions.edit')}
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SendIcon />}
                            onClick={() => handleStatusChange('Sent')}
                            disabled={updateStatus.isPending}
                        >
                            {t('quotes.actions.markSent')}
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => setDeleteModalOpen(true)}
                        >
                            {t('quotes.actions.delete')}
                        </Button>
                    </>
                )}
                {isSent && (
                    <>
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<CheckIcon />}
                            onClick={() => handleStatusChange('Accepted')}
                            disabled={updateStatus.isPending}
                        >
                            {t('quotes.actions.markAccepted')}
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<CloseIcon />}
                            onClick={() => handleStatusChange('Rejected')}
                            disabled={updateStatus.isPending}
                        >
                            {t('quotes.actions.markRejected')}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<UndoIcon />}
                            onClick={() => handleStatusChange('Draft')}
                            disabled={updateStatus.isPending}
                        >
                            {t('quotes.actions.revertToDraft')}
                        </Button>
                    </>
                )}
                {(isAccepted || isRejected) && (
                    <Button
                        variant="outlined"
                        startIcon={<UndoIcon />}
                        onClick={() => handleStatusChange('Draft')}
                        disabled={updateStatus.isPending}
                    >
                        {t('quotes.actions.revertToDraft')}
                    </Button>
                )}
            </Box>

            {/* Customer & Company Info */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={4}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {t('quotes.detail.from')}
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>{quote.companyName}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {t('quotes.detail.to')}
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>{quote.clientName}</Typography>
                        {quote.clientAddress && <Typography variant="body2">{quote.clientAddress}</Typography>}
                        {(quote.clientPostcode || quote.clientCity) && (
                            <Typography variant="body2">
                                {[quote.clientPostcode, quote.clientCity].filter(Boolean).join(' ')}
                            </Typography>
                        )}
                        {quote.clientCountry && <Typography variant="body2">{quote.clientCountry}</Typography>}
                        {quote.clientEmail && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {quote.clientEmail}
                            </Typography>
                        )}
                        {quote.clientKvk && (
                            <Typography variant="body2" color="text.secondary">KVK: {quote.clientKvk}</Typography>
                        )}
                        {quote.clientBtw && (
                            <Typography variant="body2" color="text.secondary">BTW: {quote.clientBtw}</Typography>
                        )}
                    </Grid>
                </Grid>
            </Paper>

            {/* Subject */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('quotes.detail.subject')}
                </Typography>
                <Typography variant="h6" fontWeight={500}>{quote.subject}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {t('quotes.detail.validUntil')}: {dayjs(quote.validUntilDate).format('DD-MM-YYYY')}
                </Typography>
            </Paper>

            {/* Line Items */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight={500} sx={{ mb: 2 }}>
                    {t('quotes.detail.lineItems')}
                </Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('quotes.form.lineDescription')}</TableCell>
                                <TableCell align="right">{t('quotes.form.lineQuantity')}</TableCell>
                                <TableCell>{t('quotes.form.lineUnit')}</TableCell>
                                <TableCell align="right">{t('quotes.form.lineUnitPrice')}</TableCell>
                                <TableCell align="right">{t('quotes.detail.lineTotal')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {quote.lineItems
                                .sort((a, b) => a.sortOrder - b.sortOrder)
                                .map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell align="right">{item.quantity}</TableCell>
                                        <TableCell>
                                            {item.unitLabel ? t(`quotes.units.${item.unitLabel}`) : '-'}
                                        </TableCell>
                                        <TableCell align="right">{formatCurrency(item.unitPriceExclVat)}</TableCell>
                                        <TableCell align="right">{formatCurrency(item.totalExclVat)}</TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                    <Typography variant="body2">
                        {t('quotes.form.subtotal')}: {formatCurrency(quote.totalExclVat)}
                    </Typography>
                    <Typography variant="body2">
                        {t('quotes.form.vatAmount', { percentage: quote.vatPercentage })}: {formatCurrency(quote.totalVat)}
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                        {t('quotes.form.totalInclVat')}: {formatCurrency(quote.totalInclVat)}
                    </Typography>
                </Box>
            </Paper>

            {/* Notes */}
            {quote.notes && (
                <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {t('quotes.detail.notes')}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {quote.notes}
                    </Typography>
                </Paper>
            )}

            <ConfirmModal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title={t('quotes.deleteConfirm.title')}
                message={t('quotes.deleteConfirm.message')}
            />
        </Box>
    );
}
