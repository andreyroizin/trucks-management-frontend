'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableRow,
    CircularProgress,
    Chip,
    Alert,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useDriverContractVersion } from '@/hooks/useDriverContracts';
import { useDownloadContractPdf } from '@/hooks/useDownloadContractPdf';
import { useSnack } from '@/providers/SnackProvider';
import dayjs from 'dayjs';

type Props = {
    open: boolean;
    onClose: () => void;
    versionId: string | null;
    driverId: string;
    driverName: string;
};

export default function ContractVersionDetailsModal({
    open,
    onClose,
    versionId,
    driverId,
    driverName,
}: Props) {
    const t = useTranslations();
    const { data: versionDetail, isLoading, isError } = useDriverContractVersion(
        driverId,
        versionId || ''
    );
    const { mutateAsync: downloadContractPdf, isPending: isDownloading } = useDownloadContractPdf();
    const showSnack = useSnack();

    const formatFileSize = (bytes?: number | null) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const handleDownload = async () => {
        if (!versionId || !versionDetail) return;

        try {
            const versionNumber = versionDetail.versionNumber;
            const fileName = `contract_v${versionNumber}_${driverName}.pdf`;

            await downloadContractPdf({
                driverId,
                versionId,
                fileName,
            });

            showSnack({
                text: t('drivers.detail.contracts.downloadSuccess'),
                severity: 'success',
            });
        } catch (error: any) {
            console.error('Download error:', error);
            showSnack({
                text: error?.message || t('drivers.detail.contracts.downloadError'),
                severity: 'error',
            });
        }
    };

    return (
        <Dialog open={open && !!versionId} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {t('drivers.detail.contracts.viewDetails')} - {t('drivers.detail.contracts.version')}{' '}
                {versionDetail?.versionNumber || '?'}
            </DialogTitle>
            <DialogContent>
                {isLoading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress />
                    </Box>
                ) : isError || !versionDetail ? (
                    <Alert severity="error">
                        {t('drivers.detail.errors.loadFailed')}
                    </Alert>
                ) : (
                    <Box>
                        {/* Version Metadata */}
                        <Typography variant="h6" gutterBottom sx={{mt: 1}}>
                            {t('drivers.detail.contracts.version')} {versionDetail.versionNumber}
                        </Typography>
                        
                        <Table size="small">
                            <TableBody>
                                <TableRow>
                                    <TableCell sx={{pl: 0, border: 'none', width: 150}}>
                                        {t('drivers.detail.contracts.status')}
                                    </TableCell>
                                    <TableCell sx={{border: 'none'}}>
                                        <Chip
                                            label={
                                                versionDetail.status === 'Generated'
                                                    ? t('drivers.detail.contracts.statusGenerated')
                                                    : t('drivers.detail.contracts.statusSuperseded')
                                            }
                                            size="small"
                                            color={versionDetail.status === 'Generated' ? 'success' : 'default'}
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{pl: 0, border: 'none'}}>
                                        {t('drivers.detail.contracts.generatedAt')}
                                    </TableCell>
                                    <TableCell sx={{border: 'none'}}>
                                        {versionDetail.generatedAt
                                            ? dayjs(versionDetail.generatedAt).format('DD MMM YYYY, HH:mm')
                                            : t('drivers.detail.notAvailable')}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{pl: 0, border: 'none'}}>
                                        {t('drivers.detail.contracts.generatedBy')}
                                    </TableCell>
                                    <TableCell sx={{border: 'none'}}>
                                        {versionDetail.generatedByUserName || t('drivers.detail.notAvailable')}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{pl: 0, border: 'none'}}>
                                        {t('drivers.detail.contracts.fileSize')}
                                    </TableCell>
                                    <TableCell sx={{border: 'none'}}>
                                        {formatFileSize(versionDetail.fileSize)}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{pl: 0, border: 'none'}}>
                                        File Name
                                    </TableCell>
                                    <TableCell sx={{border: 'none'}}>
                                        {versionDetail.fileName || t('drivers.detail.notAvailable')}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>

                        {/* Contract Snapshot */}
                        {versionDetail.contractSnapshot && (
                            <>
                                <Divider sx={{my: 3}} />
                                <Typography variant="h6" gutterBottom>
                                    {t('drivers.detail.contracts.contractSnapshot')}
                                </Typography>
                                <Box
                                    component="pre"
                                    sx={{
                                        bgcolor: 'grey.100',
                                        p: 2,
                                        borderRadius: 1,
                                        overflow: 'auto',
                                        fontSize: '0.875rem',
                                        maxHeight: '300px',
                                    }}
                                >
                                    {JSON.stringify(versionDetail.contractSnapshot, null, 2)}
                                </Box>
                            </>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('common.buttons.close')}</Button>
                {versionDetail && (
                    <Button
                        variant="contained"
                        startIcon={<PictureAsPdfIcon />}
                        onClick={handleDownload}
                        disabled={isDownloading}
                    >
                        {isDownloading ? (
                            <>
                                <CircularProgress size={16} sx={{mr: 1}} />
                                {t('drivers.detail.contracts.loadingContract')}
                            </>
                        ) : (
                            t('drivers.detail.contracts.download')
                        )}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

