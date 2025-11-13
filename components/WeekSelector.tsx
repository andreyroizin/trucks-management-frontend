'use client';

import React from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';

type Props = {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
};

export default function WeekSelector({ selectedDate, onDateChange }: Props) {
    const t = useTranslations('planning.weekly.selector');
    const locale = useLocale();
    // Get Monday of the current week
    const getMondayOfWeek = (date: Date): Date => {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(date.setDate(diff));
    };

    // Get Sunday of the current week
    const getSundayOfWeek = (monday: Date): Date => {
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return sunday;
    };

    const currentMonday = getMondayOfWeek(new Date(selectedDate));
    const currentSunday = getSundayOfWeek(new Date(currentMonday));

    const goToPreviousWeek = () => {
        const previousWeek = new Date(currentMonday);
        previousWeek.setDate(currentMonday.getDate() - 7);
        onDateChange(previousWeek);
    };

    const goToNextWeek = () => {
        const nextWeek = new Date(currentMonday);
        nextWeek.setDate(currentMonday.getDate() + 7);
        onDateChange(nextWeek);
    };

    const goToCurrentWeek = () => {
        onDateChange(new Date());
    };

    const formatDateRange = (monday: Date, sunday: Date): string => {
        const formatter = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' });
        const mondayStr = formatter.format(monday);
        const sundayStr = formatter.format(sunday);
        const year = monday.getFullYear();

        return t('range', { start: mondayStr, end: sundayStr, year });
    };

    const isCurrentWeek = (): boolean => {
        const today = new Date();
        const todayMonday = getMondayOfWeek(new Date(today));
        return currentMonday.toDateString() === todayMonday.toDateString();
    };

    return (
        <Box 
            sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mb: 3,
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                backgroundColor: 'background.paper'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={goToPreviousWeek} size="small">
                    <ChevronLeft />
                </IconButton>
                
                <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center' }}>
                    {formatDateRange(currentMonday, currentSunday)}
                </Typography>
                
                <IconButton onClick={goToNextWeek} size="small">
                    <ChevronRight />
                </IconButton>
            </Box>

            {!isCurrentWeek() && (
                <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={goToCurrentWeek}
                >
                    {t('currentWeek')}
                </Button>
            )}
        </Box>
    );
}
