'use client';

import React, {useEffect, useState} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    Divider,
    TextField,
    Typography,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {Controller, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs from 'dayjs';

import {usePartRideDetail} from '@/hooks/usePartRideDetail';
import {useCreatePartRideDispute} from '@/hooks/useCreatePartRideDispute';
import SuccessDisputeDialog from '@/components/SuccessDisputeDialog';
import { useTranslations } from 'next-intl';

type Props = {
    open: boolean;
    onClose: () => void;
    partRideId: string | null;
};

const schema = yup.object({
    correctionHours: yup
        .number()
        .min(-10)
        .max(10)
        .required(),
    comment: yup.string().optional()
});

export default function DisputeCreateDialog({ open, onClose, partRideId }: Props) {
    const t = useTranslations('partrides.components.disputeDialog');
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const [successInfo, setSuccessInfo] = useState<
      | { id: string; dateLabel: string }
      | null
    >(null);
    const errorRef = React.useRef<HTMLDivElement>(null);
    const { data: partRide, isLoading } = usePartRideDetail(partRideId!);
    const { mutateAsync: createDispute, isPending } =
        useCreatePartRideDispute(partRideId!);

    const queryClient = useQueryClient();

    /* RHF setup */
    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: { correctionHours: 0, comment: '' },
    });

    useEffect(() => {
        if (open) {
            setSubmitError(null);
            reset(); // also reset form fields
        }
    }, [open, reset]);

    const onSubmit = async (values: { correctionHours: number; comment?: string }) => {
        try {
            setSubmitError(null);
            const result = await createDispute(values); // result has .id, .createdAtUtc
            setSuccessInfo({
                id: result.id,
                dateLabel: dayjs(partRide?.date).format('DD.MM.YY'),
            });
            reset();
            await queryClient.invalidateQueries({ queryKey: ['partRideDetail', partRideId ?? ''] });
            await queryClient.invalidateQueries({ queryKey: ['partRides'] });
            await queryClient.invalidateQueries({ queryKey: ['disputes'] });
            onClose();
        } catch (e: any) {
            console.error(e);
            setSubmitError(e?.response?.data?.errors?.[0] ?? t('messages.submitError'));
            setTimeout(() => {
                errorRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    return (
        <>
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            sx={{
                '& .MuiPaper-root': {
                    borderRadius: 4,
                },
            }}
        >
            <DialogContent  sx={{ pt: 4 }}>
                <Typography variant="h4" fontWeight={500} gutterBottom>
                    {partRide ? `${new Date(partRide.date).toLocaleDateString('nl-NL')} ${t('title')}` : t('title')}
                </Typography>
                <Typography variant="body1">
                    {t('description')}
                </Typography>
                <Divider sx={{ my: 3 }} />

                {/* Work-day quick facts – show while loading */}
                {isLoading ? (
                    <Box display="flex" justifyContent="center" my={2}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    partRide && (
                        <>
                            <Typography variant="h5" fontWeight={500} gutterBottom>
                                {t('sections.driverVehicleInfo')}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                <Box sx={{ width: '170px' }}>
                                    <Typography variant="body1" gutterBottom>
                                        {t('fields.assignedDriver')}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body1" gutterBottom>
                                        <Link
                                            href={`/drivers/${partRide.driver?.aspNetUserId}`}
                                            passHref
                                            style={{ textDecoration: 'underline' }}
                                        >
                                            {partRide.driver?.firstName} {partRide.driver?.lastName}
                                        </Link>
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex' }}>
                                <Box sx={{ width: '170px' }}>
                                    <Typography variant="body1" gutterBottom>
                                        {t('fields.auto')}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body1" gutterBottom>
                                        {partRide.car?.id ? (
                                            <Link
                                                href={`/cars/${partRide.car.id}`}
                                                passHref
                                                style={{ textDecoration: 'underline' }}
                                            >
                                                {partRide.car.licensePlate}
                                            </Link>
                                        ) : (
                                            t('messages.notAvailable')
                                        )}
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="h5" fontWeight={500} gutterBottom>
                                {t('sections.loggedTime')}
                            </Typography>
                            <Box sx={{ display: 'flex' }}>
                                <Box sx={{ width: '170px' }}>
                                    <Typography variant="body1" gutterBottom>
                                        {t('fields.totalHours')}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body1" gutterBottom>
                                        {partRide.decimalHours} h
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex' }}>
                                <Box sx={{ width: '170px' }}>
                                    <Typography variant="body1" gutterBottom>
                                        {t('fields.date')}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body1" gutterBottom>
                                        {new Date(partRide.date).toLocaleDateString('nl-NL')}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex' }}>
                                <Box sx={{ width: '170px' }}>
                                    <Typography variant="body1" gutterBottom>
                                        {t('fields.start')}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body1" gutterBottom>
                                        {partRide.start}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex' }}>
                                <Box sx={{ width: '170px' }}>
                                    <Typography variant="body1" gutterBottom>
                                        {t('fields.end')}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body1" gutterBottom>
                                        {partRide.end}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex' }}>
                                <Box sx={{ width: '170px' }}>
                                    <Typography variant="body1" gutterBottom>
                                        {t('fields.restTime')}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body1" gutterBottom>
                                        {partRide.rest}
                                    </Typography>
                                </Box>
                            </Box>
                            <Divider sx={{ my: 3 }} />
                        </>
                    )
                )}

                {/* ------------------ FORM FIELDS ------------------ */}
                <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
                    <Typography variant="h5" fontWeight={500} gutterBottom>
                        {t('sections.disputeQuestion')}
                    </Typography>
                    {/* Hours Correction - allow decimal input */}
                    <Controller
                        name="correctionHours"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                type="number"
                                inputProps={{ step: 0.05 }}
                                label={t('fields.hoursCorrection')}
                                margin="normal"
                                error={!!errors.correctionHours}
                                helperText={
                                    errors.correctionHours?.message ||
                                    t('fields.hoursCorrectionHelper')
                                }
                            />
                        )}
                    />
                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h5" fontWeight={500} gutterBottom>
                        {t('sections.commentary')}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        {t('fields.commentaryDescription')}
                    </Typography>

                    {/* Comment */}
                    <Controller
                        name="comment"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label={t('fields.explainIssue')}
                                multiline
                                rows={4}
                                fullWidth
                                margin="normal"
                                error={!!errors.comment}
                                helperText={errors.comment?.message}
                            />
                        )}
                    />

                    {/* Hidden submit button so <Enter> key works */}
                    <button type="submit" style={{ display: 'none' }} />
                </Box>
            {submitError && (
                <Box ref={errorRef} sx={{ mb: 2, mt: 2 }}>
                    <Alert severity="error" icon={<InfoOutlinedIcon fontSize="small" />}>
                        {submitError}
                    </Alert>
                </Box>
            )}
            </DialogContent>



            {/* ACTIONS */}
            <DialogActions sx={{ px: 3, pb: 3, display: 'flex', gap: 2 }}>
                <Button
                    variant="contained"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isPending}
                    sx={{ flex: 1 }}
                >
                    {isPending ? <CircularProgress size={20} /> : t('buttons.submit')}
                </Button>
                <Button
                    variant="text"
                    onClick={onClose}
                    sx={{ flex: 1 }}
                >
                    {t('buttons.cancel')}
                </Button>
            </DialogActions>
        </Dialog>
        {successInfo && (
            <SuccessDisputeDialog
                open={true}
                onClose={() => setSuccessInfo(null)}
                disputeId={successInfo.id}
                dateLabel={successInfo.dateLabel}
            />
        )}
        </>
    );
}
