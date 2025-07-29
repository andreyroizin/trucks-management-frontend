'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography} from '@mui/material';

type ConfirmModalProps = {
    open: boolean;
    title?: string;
    message?: string;
    onClose: () => void;
    onConfirm: () => void;
};

export default function ConfirmModal({
                                         open,
                                         title = 'Confirm',
                                         message = 'Are you sure?',
                                         onClose,
                                         onConfirm,
                                     }: ConfirmModalProps) {
    const t = useTranslations();
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogContent sx={{pt: 3, pl: 3, pr: 3}}>
                <Typography variant="h5" gutterBottom>{title}</Typography>
                <Typography variant="subtitle1">{message}</Typography>
            </DialogContent>
            <DialogActions sx={{pb: 3, pl: 3, pr: 3}}>
                <Button fullWidth onClick={onConfirm} color="error" variant="contained">
                    {t('common.buttons.delete')}
                </Button>
                <Button fullWidth onClick={onClose} color="inherit">
                    {t('common.buttons.cancel')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
