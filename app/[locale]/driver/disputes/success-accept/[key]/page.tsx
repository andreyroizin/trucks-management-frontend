'use client';

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function WeekSignedSuccess() {
    const router = useRouter();
    const { key } = useParams<{ key: string }>();
    const t = useTranslations('disputes.driver.success.accept');

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
                {t('heading')}
            </Typography>

            {/* Informational paragraphs */}
            <Typography variant="body1" maxWidth="500px" mb={5}>
                {t('description', { key })}
            </Typography>

            {/* Buttons */}
                <Button
                    variant="contained"
                    fullWidth
                    onClick={() => router.push('/dashboard/driver')}
                >
                    {t('goHome')}
                </Button>
        </Box>
    );
}
