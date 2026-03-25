'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    InputAdornment,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useQuotes } from '@/hooks/useQuotes';
import { useDeleteQuote } from '@/hooks/useDeleteQuote';
import { useDownloadQuotePdf } from '@/hooks/useDownloadQuotePdf';
import LanguageSelectDesktop from '@/components/LanguageSelectDesktop';
import AddIcon from '@mui/icons-material/AddRounded';
import DownloadIcon from '@mui/icons-material/DownloadRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import SearchIcon from '@mui/icons-material/SearchRounded';
import SyncIcon from '@mui/icons-material/Sync';
import dayjs from 'dayjs';
import { QuoteStatus } from '@/types/quote';
import ConfirmModal from '@/components/ConfirmModal';

const STATUS_OPTIONS: (QuoteStatus | '')[] = ['', 'Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'];

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

export default function QuotesPage() {
    const router = useRouter();
    const t = useTranslations();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading, refetch } = useQuotes({
        pageNumber: page + 1,
        pageSize,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
    });

    const deleteQuote = useDeleteQuote();
    const downloadPdf = useDownloadQuotePdf();

    useEffect(() => {
        const allowedRoles = ['globalAdmin', 'customerAdmin'];
        const hasAccess = user?.roles.some((role: string) => allowedRoles.includes(role));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, authLoading, router, user?.roles]);

    const handleDelete = (id: string) => {
        setQuoteToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (quoteToDelete) {
            await deleteQuote.mutateAsync(quoteToDelete);
            setDeleteModalOpen(false);
            setQuoteToDelete(null);
        }
    };

    if (authLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h3" fontWeight={500}>
                        {t('quotes.title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {t('quotes.subtitle')}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => router.push('/quotes/create')}
                    >
                        {t('quotes.createButton')}
                    </Button>
                    <IconButton onClick={() => refetch()}>
                        <SyncIcon sx={{ transform: 'rotate(90deg)' }} />
                    </IconButton>
                    <LanguageSelectDesktop />
                </Box>
            </Box>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                    size="small"
                    placeholder={t('quotes.searchPlaceholder')}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    sx={{ minWidth: 280 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
                <TextField
                    select
                    size="small"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                    sx={{ minWidth: 160 }}
                    label={t('quotes.table.status')}
                >
                    <MenuItem value="">{t('quotes.filter.allStatuses')}</MenuItem>
                    {STATUS_OPTIONS.filter(Boolean).map((s) => (
                        <MenuItem key={s} value={s}>
                            {t(`quotes.status.${s.toLowerCase()}`)}
                        </MenuItem>
                    ))}
                </TextField>
            </Box>

            {/* Table */}
            {isLoading ? (
                <Box display="flex" justifyContent="center" py={6}>
                    <CircularProgress />
                </Box>
            ) : !data?.data?.length ? (
                <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                    {t('quotes.noData')}
                </Typography>
            ) : (
                <>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('quotes.table.quoteNumber')}</TableCell>
                                    <TableCell>{t('quotes.table.client')}</TableCell>
                                    <TableCell>{t('quotes.table.subject')}</TableCell>
                                    <TableCell align="right">{t('quotes.table.total')}</TableCell>
                                    <TableCell>{t('quotes.table.status')}</TableCell>
                                    <TableCell>{t('quotes.table.validUntil')}</TableCell>
                                    <TableCell>{t('quotes.table.created')}</TableCell>
                                    <TableCell>{t('quotes.table.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.data.map((quote) => (
                                    <TableRow
                                        key={quote.id}
                                        hover
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => router.push(`/quotes/${quote.id}`)}
                                    >
                                        <TableCell sx={{ py: 2.2, fontWeight: 500 }}>
                                            {quote.quoteNumber}
                                        </TableCell>
                                        <TableCell sx={{ py: 2.2 }}>{quote.clientName}</TableCell>
                                        <TableCell sx={{ py: 2.2 }}>{quote.subject}</TableCell>
                                        <TableCell sx={{ py: 2.2 }} align="right">
                                            {formatCurrency(quote.totalInclVat)}
                                        </TableCell>
                                        <TableCell sx={{ py: 2.2 }}>
                                            <StatusChip status={quote.status} t={t} />
                                        </TableCell>
                                        <TableCell sx={{ py: 2.2 }}>
                                            {dayjs(quote.validUntilDate).format('DD-MM-YYYY')}
                                        </TableCell>
                                        <TableCell sx={{ py: 2.2 }}>
                                            {dayjs(quote.createdAt).format('DD-MM-YYYY')}
                                        </TableCell>
                                        <TableCell sx={{ py: 2.2 }} onClick={(e) => e.stopPropagation()}>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <Tooltip title={t('quotes.actions.downloadPdf')}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => downloadPdf.mutate({
                                                            id: quote.id,
                                                            fileName: `${quote.quoteNumber}.pdf`,
                                                        })}
                                                    >
                                                        <DownloadIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={t('quotes.actions.delete')}>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDelete(quote.id)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        component="div"
                        count={data.totalQuotes}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        rowsPerPage={pageSize}
                        onRowsPerPageChange={(e) => {
                            setPageSize(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                        rowsPerPageOptions={[5, 10, 25]}
                    />
                </>
            )}

            <ConfirmModal
                open={deleteModalOpen}
                onClose={() => { setDeleteModalOpen(false); setQuoteToDelete(null); }}
                onConfirm={confirmDelete}
                title={t('quotes.deleteConfirm.title')}
                message={t('quotes.deleteConfirm.message')}
            />
        </Box>
    );
}
