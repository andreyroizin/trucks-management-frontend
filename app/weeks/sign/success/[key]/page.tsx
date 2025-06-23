'use client';

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useRouter, useParams } from 'next/navigation';

export default function WeekSignedSuccess() {
    const router = useRouter();
    const params = useParams<{ key: string }>();
    const [yearStr, weekStr] = (params.key ?? '').split('-');
    const year = yearStr || '----';
    const weekNumber = weekStr || '--';

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
                Success! Your Week&nbsp;Has
                <br />
                Been Signed
            </Typography>

            {/* Informational paragraphs */}
            <Typography variant="body1" maxWidth="500px" mb={3}>
                Week {weekNumber} ({year}) has been successfully signed and submitted.
            </Typography>
            <Typography variant="body1" maxWidth="500px" mb={6}>
                You’ll receive a notification once it’s processed by the Admin. A summary of this week
                is now available via the link below.
            </Typography>

            {/* Buttons */}
            <Box display="flex" gap={3} flexWrap="wrap" justifyContent="center">
                <Button
                    variant="contained"
                    color="success"
                    onClick={() => router.push(`/weeks/signed/${year}-${weekNumber}`)}
                >
                    View Signed Week
                </Button>

                <Button
                    variant="text"
                    color="primary"
                    onClick={() => router.push('/periods/driver/current')}
                >
                    Go&nbsp;To&nbsp;All&nbsp;Periods
                </Button>
            </Box>
        </Box>
    );
}
