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
                Your comment sent
            </Typography>

            {/* Informational paragraphs */}
            <Typography variant="body1" maxWidth="500px" mb={5}>
                Your comment for {key} has been successfully sent to the Transport Admin.
                <br/>
                <br/>
                You will get a notification if the admin approved your comment or not.
            </Typography>


            {/* Buttons */}
            <Button
                variant="contained"
                fullWidth
                onClick={() => router.back()}
            >
                Go to Dispute
            </Button>
        </Box>
    );
}
