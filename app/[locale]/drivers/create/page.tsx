'use client';

import React from 'react';
import {
    Box,
    Typography,
    Alert,
    CircularProgress,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function CreateDriverPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    // Check access permissions
    const allowedRoles = ['globalAdmin', 'customerAdmin'];
    const hasAccess = user?.roles.some(r => allowedRoles.includes(r));

    if (authLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated || !hasAccess) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">You don't have permission to access this page.</Alert>
            </Box>
        );
    }

    return (
        <Box maxWidth="800px" p={4}>
            {/* Header Block */}
            <Box mb={4}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                    New Driver Creation Form
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Use this form to create a new employment contract for a driver. Please ensure all fields are filled out accurately.
                </Typography>
            </Box>

            {/* Form Block */}
            <Box>
                {/* Form fields will be added in the next step */}
                <Typography variant="body1" color="text.secondary">
                    Form fields will be implemented in the next step.
                </Typography>
            </Box>
        </Box>
    );
} 