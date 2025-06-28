import React, {useEffect} from 'react';
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

import {usePartRideDetail} from '@/hooks/usePartRideDetail';
import {useCreatePartRideDispute} from '@/hooks/useCreatePartRideDispute';

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
    comment: yup.string(),
});

export default function DisputeCreateDialog({ open, onClose, partRideId }: Props) {
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const errorRef = React.useRef<HTMLDivElement>(null);
    const { data: partRide, isLoading } = usePartRideDetail(partRideId!);
    const { mutateAsync: createDispute, isPending } =
        useCreatePartRideDispute(partRideId!);

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
            await createDispute(values); // hook expects { correctionHours, comment }
            reset(); // clear form
            onClose();
        } catch (e: any) {
            console.error(e);
            setSubmitError(e?.response?.data?.errors?.[0] ?? 'Failed to create dispute. Please try again.');
            setTimeout(() => {
                errorRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    return (
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
                    {partRide ? `${new Date(partRide.date).toLocaleDateString('nl-NL')} Dispute` : 'Dispute'}
                </Typography>
                <Typography variant="body1">
                    Use this form to adjust the workday details and explain the correction to the driver. All fields must be completed accurately.
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
                                Driver & Vehicle Info
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                <Box sx={{ width: '170px' }}>
                                    <Typography variant="body1" gutterBottom>
                                        Assigned Driver:
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
                                        Auto:
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
                                            'N/A'
                                        )}
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="h5" fontWeight={500} gutterBottom>
                                Logged Time
                            </Typography>
                            <Box sx={{ display: 'flex' }}>
                                <Box sx={{ width: '170px' }}>
                                    <Typography variant="body1" gutterBottom>
                                        Total Hours
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
                                        Date
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
                                        Start
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
                                        End
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
                                        Rest Time
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
                        What do you want to dispute?
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
                                label="Hours Correction"
                                margin="normal"
                                error={!!errors.correctionHours}
                                helperText={
                                    errors.correctionHours?.message ||
                                    'Correct the final work hours using decimal + or – values. Start and end times remain unchanged.'
                                }
                            />
                        )}
                    />
                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h5" fontWeight={500} gutterBottom>
                        Your commentary?
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        Provide a clear reason for this adjustment to help the driver understand the change.
                    </Typography>

                    {/* Comment */}
                    <Controller
                        name="comment"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Explain the issue"
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
                    {isPending ? <CircularProgress size={20} /> : 'Submit'}
                </Button>
                <Button
                    variant="text"
                    onClick={onClose}
                    sx={{ flex: 1 }}
                >
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}
