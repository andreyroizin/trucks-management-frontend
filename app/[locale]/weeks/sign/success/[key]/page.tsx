'use client';

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useRouter, useParams } from 'next/navigation';
import {useTranslations} from 'next-intl';

export default function WeekSignedSuccess() {
    const router = useRouter();
    const params = useParams<{ key: string }>();
    const [yearStr, weekStr] = (params.key ?? '').split('-');
    const year = yearStr || '----';
    const weekNumber = weekStr || '--';

    const t = useTranslations('weeks.driver.sign.success');

    return (
        <Box
            maxWidth="600px"
            mx="auto"
            py={8}
            textAlign="center"
            display="flex"
            flexDirection="column"
            alignItems="center"
        >
            {/* Success icon */}
            <CheckCircleIcon
                sx={{
                    fontSize: 120,
                    color: 'success.main',
                    mb: 4,
                }}
            />

            {/* Heading */}
            <Typography variant="h4" fontWeight={500} gutterBottom>
                {t('title')}
            </Typography>

            {/* Informational paragraphs */}
            <Typography variant="body1" maxWidth="500px" mb={3}>
                {t('submitted', {week: weekNumber, year})}
            </Typography>
            <Typography variant="body1" maxWidth="500px" mb={6}>
                {t('processed')}
            </Typography>

            {/* Buttons */}
            <Box display="flex" gap={3} flexWrap="wrap" justifyContent="center">
                <Button
                    variant="contained"
                    color="success"
                    onClick={() => router.push(`/weeks/signed/${year}-${weekNumber}`)}
                >
                    {t('view')}
                </Button>

                <Button
                    variant="text"
                    color="primary"
                    onClick={() => router.push('/periods/driver/current')}
                >
                    {t('back')}
                </Button>
            </Box>
        </Box>
    );
}
