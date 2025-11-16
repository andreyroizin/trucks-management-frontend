import React from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import { getIso8601WeekOfYear } from '@/utils/Iso8601WeekOfYear';

/* ---------- helper to get Monday of ISO week --------------------- */
const getIsoWeekMonday = (year: number, weekNumber: number): Date => {
    // Start with January 4th of the given year (always in week 1)
    const jan4 = new Date(year, 0, 4);
    
    // Find the Monday of week 1
    const jan4Day = jan4.getDay();
    const daysToMonday = jan4Day === 0 ? -6 : 1 - jan4Day; // Sunday = 0, Monday = 1
    const week1Monday = new Date(jan4);
    week1Monday.setDate(jan4.getDate() + daysToMonday);
    
    // Add weeks to get to the target week
    const targetMonday = new Date(week1Monday);
    targetMonday.setDate(week1Monday.getDate() + (weekNumber - 1) * 7);
    
    return targetMonday;
};

type Execution = {
    rideId: string;
    date: string;
    clientName: string;
    actualStartTime: string;
    actualEndTime: string;
    actualRestTime: string;
    totalHours: number;
    compensation: number; // Total compensation (hourly + additional)
    hourlyCompensation: number; // Base wage (hours × hourly rate)
    additionalCompensation: number; // All allowances (NOT including hourly)
    exceedingContainerWaitingTime: number; // Container overtime hours (0 if none)
};

type WeekSummaryProps = {
    week?: number;
    year?: number;
    executions: Execution[];
    totalHours: number;
    totalCompensation: number;
    adminAllowedAt?: string;
};

const WeekSummary: React.FC<WeekSummaryProps> = ({
    week,
    year,
    executions,
    totalHours,
    totalCompensation,
    adminAllowedAt,
}) => {
    const t = useTranslations('weeks.driver.common');

    // Calculate week start and end dates
    const weekStartDate = getIsoWeekMonday(year || dayjs().year(), week || 1);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6); // Add 6 days to get Sunday
    
    const weekStart = dayjs(weekStartDate);
    const weekEnd = dayjs(weekEndDate);

    return (
        <>
            {week && year && (
                <Typography variant="h5" sx={{ fontWeight: 500 }}>
                    {t('week')} {week} ({year})
                </Typography>
            )}
            <Typography variant="body2" color="text.secondary" mb={1}>
                {weekStart.format('DD.MM.YYYY')} — {weekEnd.format('DD.MM.YYYY')}
            </Typography>

            {adminAllowedAt && (
                <Typography variant="body2" color="text.secondary" mb={2}>
                    Submitted by admin: {dayjs(adminAllowedAt).format('DD.MM.YYYY HH:mm')}
                </Typography>
            )}

            <Box display="flex" gap={2} mb={3}>
                <Box flex={1} component={Paper} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Total Hours
                    </Typography>
                    <Typography variant="h5" fontWeight={500}>
                        {totalHours.toFixed(1)}h
                    </Typography>
                </Box>
                <Box flex={1} component={Paper} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Total Compensation
                    </Typography>
                    <Typography variant="h5" fontWeight={500}>
                        €{totalCompensation.toFixed(2)}
                    </Typography>
                </Box>
            </Box>

            <Table size="small" sx={{ mb: 2 }}>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 500, py: 2 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 500, py: 2 }}>Client</TableCell>
                        <TableCell sx={{ fontWeight: 500, py: 2 }}>Time</TableCell>
                        <TableCell sx={{ fontWeight: 500, py: 2 }}>Hours</TableCell>
                        <TableCell sx={{ fontWeight: 500, py: 2 }}>Hourly Compensation</TableCell>
                        <TableCell sx={{ fontWeight: 500, py: 2 }}>Additional Compensation</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {executions.map((execution) => (
                        <TableRow key={execution.rideId}>
                            <TableCell sx={{ py: 2 }}>{dayjs(execution.date).format('DD.MM.YYYY')}</TableCell>
                            <TableCell sx={{ py: 2 }}>{execution.clientName}</TableCell>
                            <TableCell sx={{ py: 2 }}>
                                {execution.actualStartTime} - {execution.actualEndTime}
                                <br />
                                <Typography variant="caption" color="text.secondary">
                                    Rest: {execution.actualRestTime}
                                </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 2 }}>{execution.totalHours.toFixed(1)}h</TableCell>
                            <TableCell sx={{ py: 2 }}>
                                <Typography variant="body2" fontWeight={600}>
                                    €{execution.hourlyCompensation.toFixed(2)}
                                </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 2 }}>
                                <Typography variant="body2" fontWeight={600}>
                                    €{execution.additionalCompensation.toFixed(2)}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell sx={{ fontWeight: 500, py: 2 }} colSpan={3}>Total</TableCell>
                        <TableCell sx={{ fontWeight: 500, py: 2 }}>{totalHours.toFixed(1)}h</TableCell>
                        <TableCell sx={{ fontWeight: 500, py: 2 }}>
                            €{executions.reduce((sum, exec) => sum + exec.hourlyCompensation, 0).toFixed(2)}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500, py: 2 }}>
                            €{executions.reduce((sum, exec) => sum + exec.additionalCompensation, 0).toFixed(2)}
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </>
    );
};

export default WeekSummary;
