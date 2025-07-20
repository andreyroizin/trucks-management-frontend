import React from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import {useWeekToSubmitDetail} from '@/hooks/useWeekToSubmitDetail';
import {useAllowDriverForWeek} from '@/hooks/useAllowDriverForWeek';
import {useSnack} from '@/providers/SnackProvider';
import dayjs from 'dayjs';
import {WEEKEND_HOLIDAY_BG} from "@/utils/constants/styles";
import {isHolidayDayjs} from "@/utils/constants/dutchHolidays";

type Props = {
    open: boolean;
    weekApprovalId: string;
    onClose: () => void;
};

export default function WeekApprovalOverviewModal({
                                                      open,
                                                      weekApprovalId,
                                                      onClose,
                                                  }: Props) {
    const showSnack = useSnack();
    const {data, isLoading, error} = useWeekToSubmitDetail(weekApprovalId, open);
    const {mutateAsync: allowDriver, isPending} = useAllowDriverForWeek();

    const handleSend = async () => {
        try {
            await allowDriver(weekApprovalId);
            showSnack({text: 'Week submitted for signature', severity: 'success'});
            onClose();
        } catch (e: any) {
            showSnack({
                text: e?.response?.data?.errors?.[0] ?? 'Submit failed',
                severity: 'error',
            });
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '24px',
                    },
                }}>
            <DialogContent sx={{pt: 4, px: 4}}>
                {isLoading ? (
                    <Box py={8} textAlign="center">
                        <CircularProgress/>
                    </Box>
                ) : error ? (
                    <Typography color="error">
                        {(error as any).message ?? 'Failed to load data'}
                    </Typography>
                ) : data ? (
                    <>
                        {/* Header */}
                        <Typography variant="h4" fontWeight={500} gutterBottom>
                            Week {data.weekNr} / {data.driver.firstName} {data.driver.lastName}
                        </Typography>
                        <Typography variant="body1">
                            Check the overview for the week period for driver. When you click
                            &quot;Send For Signature&quot;, it will be sent to driver
                            immediately.
                        </Typography>

                        <Divider sx={{my: 3}}/>

                        {/* Workdays Overview */}
                        <Typography variant="h5" fontWeight={500} mb={2}>
                            Workdays Overview
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Hours</TableCell>
                                        <TableCell>Day Type</TableCell>
                                        <TableCell align="right">Forecasted</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.partRides.map((p) => {
                                        const d = dayjs(p.date);
                                        const isWeekendOrHoliday = d.day() === 0 || d.day() === 6 || isHolidayDayjs(d);
                                        return (
                                            <TableRow
                                                key={p.id}
                                                sx={isWeekendOrHoliday ? {backgroundColor: WEEKEND_HOLIDAY_BG} : {}}
                                            >
                                                <TableCell sx={{py: 2.6}}>{d.format('DD.MM.YY')}</TableCell>
                                                <TableCell sx={{py: 2.6}}>{p.hours} h.</TableCell>
                                                <TableCell sx={{py: 2.6}}>{p.hoursCode.name}</TableCell>
                                                <TableCell align="right" sx={{py: 2.6}}>
                                                    €{p.forecastedEarnings.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {/* Footer total */}
                                    <TableRow sx={{backgroundColor: '#f5f5f5'}}>
                                        <TableCell sx={{py: 2.6}}>
                                            <strong>Total</strong>
                                        </TableCell>
                                        <TableCell sx={{py: 2.6}}>
                                            <strong>{data.totalHours}</strong>
                                        </TableCell>
                                        <TableCell/>
                                        <TableCell align="right">
                                            <strong>€{data.totalForecasted.toFixed(2)}</strong>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Vacation hours - (dummy values, replace if you have them) */}
                        <Divider sx={{my: 3}}/>
                        <Typography variant="h5" fontWeight={500} mb={2}>
                            Driver’s Vacation Hours
                        </Typography>
                        <TableContainer>
                            <Table size="small" sx={{ border: 'none' }}>
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ py: 1, pl:0, width: '50%', borderBottom: 'none' }}>
                                            Vacation Hours Used
                                        </TableCell>
                                        <TableCell sx={{ py: 1, width: '50%', borderBottom: 'none' }}>
                                            —
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ py: 1, pl:0, width: '50%', borderBottom: 'none' }}>
                                            Vacation Hours Left
                                        </TableCell>
                                        <TableCell sx={{ py: 1, width: '50%', borderBottom: 'none' }}>
                                            —
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                ) : null}
            </DialogContent>

            {/* Actions */}
            <DialogActions sx={{pb: 4, px: 4}}>
                <Button
                    fullWidth
                    variant="contained"
                    disabled={isPending}
                    onClick={handleSend}
                >
                    {isPending ? 'Sending…' : 'Send For Signature'}
                </Button>
                <Button fullWidth onClick={onClose} color="inherit">
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}
