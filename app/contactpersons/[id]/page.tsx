'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUserDetails } from '@/hooks/useUser';
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    Button,
    List,
    ListItem,
    Link as MuiLink,
} from '@mui/material';
import Link from 'next/link';

export default function ContactPersonDetailPage() {
    const params = useParams();
    const router = useRouter();
    const contactPersonId = params.id as string; // ID from the URL
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { data: userDetails, isLoading, isError, error } = useUserDetails(contactPersonId);

    useEffect(() => {
        const allowedRoles = [
            'globalAdmin',
            'customerAdmin',
            'employer',
            'driver',
            'customerAccountant',
        ];
        const hasAccess = user?.roles.some(role => allowedRoles.includes(role));
        if (!authLoading && (!isAuthenticated || !hasAccess)) {
            router.push('/auth/login');
        }
    }, [authLoading, isAuthenticated, router, user?.roles]);

    if (authLoading || isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isError || !userDetails) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Alert severity="error">{error?.message || 'Failed to load contact person details.'}</Alert>
            </Box>
        );
    }

    const {
        id,
        email,
        firstName,
        lastName,
        phoneNumber,
        address,
        city,
        country,
        postcode,
        roles,
        remark,
        contactPersonInfo,
    } = userDetails;

    return (
        <Box maxWidth="600px" mx="auto" p={2}>
            <Card>
                <CardContent>
                    {/* Title & Edit link top-right */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h5">
                            {firstName} {lastName}
                        </Typography>
                        <Link href={`/contactpersons/edit?id=${id}`} passHref>
                            <Button variant="contained" color="primary">
                                Edit
                            </Button>
                        </Link>
                    </Box>

                    {/* Basic user info */}
                    <Typography>Email: {email}</Typography>
                    <Typography>Phone: {phoneNumber || 'N/A'}</Typography>
                    <Typography>
                        Address: {address || 'N/A'}, {city || 'N/A'}, {postcode || 'N/A'}, {country || 'N/A'}
                    </Typography>
                    <Typography>Roles: {roles.join(', ')}</Typography>
                    <Typography>Remark: {remark || 'N/A'}</Typography>

                    {/* Associated Entities */}
                    {contactPersonInfo && (
                        <>
                            <Typography variant="subtitle1" sx={{ mt: 2 }}>
                                Associated Entities
                            </Typography>
                            {contactPersonInfo.clientsCompanies?.length ? (
                                <List dense>
                                    {contactPersonInfo.clientsCompanies.map((cc, idx) => {
                                        // Decide if it's a company or a client
                                        const isCompany = cc.companyId;
                                        const linkPath = isCompany
                                            ? `/companies/${cc.companyId}`
                                            : `/clients/${cc.clientId}`;
                                        const name = cc.companyName || cc.clientName || 'Unknown';

                                        return (
                                            <ListItem key={idx}>
                                                <Link href={linkPath} passHref>
                                                    <MuiLink underline="hover" color="primary" sx={{ cursor: 'pointer' }}>
                                                        {name}
                                                    </MuiLink>
                                                </Link>
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            ) : (
                                <Typography variant="body2">No associated companies or clients</Typography>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}
