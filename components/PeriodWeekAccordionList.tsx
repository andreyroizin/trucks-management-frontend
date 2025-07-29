'use client';

import React from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import dayjs from 'dayjs';
import {useRouter} from 'next/navigation';
import StatusChip from "@/components/StatusChip";
import {WeekInPeriod} from "@/hooks/useDriverPeriodDetail";
import {PartRideStatusChip} from "@/components/PartRideStatusChip";
import { useTranslations } from 'next-intl';


export default function PeriodWeekAccordionList({ weeks, year }: { weeks: WeekInPeriod[], year: number }) {
    const router = useRouter();
    const t = useTranslations('periods.driver.weeks');

    const getWeekChip = (status?: number) => {
      if (status === 0) return <StatusChip label={t('weekChip.ongoing')}   variant="info"    />;
      if (status === 1) return <StatusChip label={t('weekChip.ready')}     variant="success" />;
      return null;
    };

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
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle1">{t('weekLabel')} {week.weekNumber}</Typography>
                                    {getWeekChip(week.status)}
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    {week.totalDecimalHours} {t('hoursWorked')}
                                </Typography>
                            </Box>
                        </AccordionSummary>

                        <AccordionDetails sx={{ px: 0 }}>
                            {week.partRides.length === 0 ? (
                                <Typography color="text.secondary" px={2} pb={1}>
                                    {t('noRecords')}
                                </Typography>
                            ) : (
                                <>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 500 }}>{t('table.date')}</TableCell>
                                                <TableCell sx={{ fontWeight: 500 }}>{t('table.hours')}</TableCell>
                                                <TableCell sx={{ fontWeight: 500 }}>{t('table.status')}</TableCell>
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
                                                        <TableCell sx={{ py: 2, ...(isLast ? { borderBottom: 'none' } : {}) }}>
                                                            {dayjs(pr.date).format('DD.MM.YY')}
                                                        </TableCell>
                                                        <TableCell sx={{ py: 2, ...(isLast ? { borderBottom: 'none' } : {}) }}>
                                                            {pr.decimalHours.toString().replace('.', ',')} h.
                                                        </TableCell>
                                                        <TableCell sx={{ py: 2, ...(isLast ? { borderBottom: 'none' } : {}) }}>
                                                            <PartRideStatusChip status={pr.status} />
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                    {(week.status === 1 || week.status === 2) && (
                                        <Box display="flex" justifyContent="flex-end" mt={2} gap={1}>
                                            {week.status === 1 && (
                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    color="success"
                                                    size="large"
                                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
                                                    startIcon={<CheckIcon />}
                                                    onClick={() => router.push(`/weeks/sign/${year}-${week.weekNumber}`)}
                                                >
                                                    {t('signButton')}
                                                </Button>
                                            )}
                                            {week.status === 2 && (
                                                <Button
                                                    variant="outlined"
                                                    fullWidth
                                                    color="primary"
                                                    size="large"
                                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
                                                    onClick={() => router.push(`/weeks/signed/${year}-${week.weekNumber}`)}
                                                >
                                                    {t('viewSignedButton')}
                                                </Button>
                                            )}
                                        </Box>
                                    )}
                                </>
                            )}
                        </AccordionDetails>
                    </Accordion>
                    {index !== weeks.length - 1 && <Divider />}
                </Box>
            ))}
        </>
    );
}