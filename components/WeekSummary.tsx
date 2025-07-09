import React from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

type Ride = {
    id: string;
    date: string;
    decimalHours: number;
};

type WeekSummaryProps = {
    week?: number;
    startDate: string;
    endDate: string;
    vacationHoursTaken: number;
    vacationHoursLeft: number;
    rides: Ride[];
    totalHoursWorked: number;
};

const WeekSummary: React.FC<WeekSummaryProps> = ({
    week,
    startDate,
    endDate,
    vacationHoursTaken,
    vacationHoursLeft,
    rides,
    totalHoursWorked,
}) => {
    const t = useTranslations('weeks.driver.common');
    const start = dayjs(startDate).format('DD.MM.YYYY');
    const end = dayjs(endDate).format('DD.MM.YYYY');

    return (
        <>
            {week && (
                <Typography variant="h5" sx={{ fontWeight: 500 }}>
                    {t('week')} {week}
                </Typography>
            )}
            <Typography variant="body2" color="text.secondary" mb={1}>
                {start} — {end}
            </Typography>

            <Box display="flex" gap={2} mb={3}>
                <Box flex={1} component={Paper} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        {t('vacationTaken')}
                    </Typography>
                    <Typography variant="h5" fontWeight={500}>
                        {vacationHoursTaken}
                    </Typography>
                </Box>
                <Box flex={1} component={Paper} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        {t('vacationLeft')}
                    </Typography>
                    <Typography variant="h5" fontWeight={500}>
                        {vacationHoursLeft}
                    </Typography>
                </Box>
            </Box>

            <Table size="small" sx={{ mb: 2 }}>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 500, py: 2 }}>{t('date')}</TableCell>
                        <TableCell sx={{ fontWeight: 500, py: 2 }}>{t('hours')}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rides.map((r) => (
                        <TableRow key={r.id}>
                            <TableCell sx={{ py: 2 }}>{dayjs(r.date).format('DD.MM.YYYY')}</TableCell>
                            <TableCell sx={{ py: 2 }}>{r.decimalHours.toString().replace('.', ',')} h.</TableCell>
                        </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 500, py: 2 }}>{t('total')}</TableCell>
                        <TableCell sx={{ fontWeight: 500, py: 2 }}>{totalHoursWorked}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </>
    );
};

export default WeekSummary;
