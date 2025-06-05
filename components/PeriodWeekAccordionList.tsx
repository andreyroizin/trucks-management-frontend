'use client';

import React from 'react';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Chip,
    Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

// --- Helpers ---
const approvalLabel = (s?: number) =>
    s === 0 ? 'Pending'
        : s === 1 ? 'Changes'
            : s === 2 ? 'Approved'
                : s === 3 ? 'Rejected'
                    : 'Unknown';

const approvalColor = (s?: number) =>
    s === 0 ? 'default'
        : s === 1 ? 'warning'
            : s === 2 ? 'success'
                : s === 3 ? 'error'
                    : 'default';

// --- Types ---
export type Week = {
    weekInPeriod: number;
    weekNumber: number;
    totalDecimalHours: number;
    partRides: {
        id: string;
        date: string;
        start: string;
        end: string;
        kilometers: number;
        decimalHours: number;
        remark: string;
        status?: number;
    }[];
};

export default function PeriodWeekAccordionList({ weeks }: { weeks: Week[] }) {
    const router = useRouter();

    return (
        <>
            {weeks.sort((a, b) => b.weekInPeriod - a.weekInPeriod).map((week, index) => (
                <Box key={week.weekInPeriod}>
                    <Accordion
                        disableGutters
                        elevation={0}
                        square
                        sx={{
                            border: 'none',
                            '&:before': { display: 'none' },
                        }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
                            <Box>
                                <Typography variant="subtitle1">Week {week.weekNumber}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {week.totalDecimalHours} hours worked
                                </Typography>
                            </Box>
                        </AccordionSummary>

                        <AccordionDetails sx={{ px: 0 }}>
                            {week.partRides.length === 0 ? (
                                <Typography color="text.secondary" px={2} pb={1}>
                                    No records for this week.
                                </Typography>
                            ) : (
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 500 }}>Date</TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>Hours</TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {week.partRides.map((pr, prIndex) => {
                                            const isLast = prIndex === week.partRides.length - 1;
                                            return (
                                                <TableRow
                                                    key={pr.id}
                                                    hover
                                                    sx={{ cursor: 'pointer' }}
                                                    onClick={() => router.push(`/partrides/${pr.id}`)}
                                                >
                                                    <TableCell sx={isLast ? { borderBottom: 'none' } : undefined}>
                                                        {dayjs(pr.date).format('DD.MM.YY')}
                                                    </TableCell>
                                                    <TableCell sx={isLast ? { borderBottom: 'none' } : undefined}>
                                                        {pr.decimalHours.toString().replace('.', ',')} h.
                                                    </TableCell>
                                                    <TableCell sx={isLast ? { borderBottom: 'none' } : undefined}>
                                                        <Chip
                                                            label={approvalLabel(pr.status)}
                                                            size="small"
                                                            color={approvalColor(pr.status)}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </AccordionDetails>
                    </Accordion>
                    {index !== weeks.length - 1 && <Divider />}
                </Box>
            ))}
        </>
    );
}