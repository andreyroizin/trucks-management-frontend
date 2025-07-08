'use client';

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useRouter, useParams } from 'next/navigation';

export default function WeekSignedSuccess() {
    const router = useRouter();
    const { key } = useParams<{ key: string }>();

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
                Your workday has been approved
            </Typography>

            {/* Informational paragraphs */}
            <Typography variant="body1" maxWidth="500px" mb={5}>
                You’ve accepted the correction for <strong>{key}</strong>. The workday is now approved and included in your totals.
            </Typography>

            {/* Buttons */}
                <Button
                    variant="contained"
                    fullWidth
                    onClick={() => router.push('/dashboard/driver')}
                >
                    Go to Home Page
                </Button>
        </Box>
    );
}
