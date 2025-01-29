// components/DriverDetails.tsx

'use client';

import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Button,
    Box,
    Divider,
} from '@mui/material';
import Link from 'next/link';
import { UserDetails } from "@/hooks/useUser";

type DriverDetailsProps = {
    driver: UserDetails;
};

const DriverDetails: React.FC<DriverDetailsProps> = ({ driver }) => {
    return (
        <Card sx={{ maxWidth: 800, margin: 'auto', mt: 2 }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h5">
                        Driver Details
                    </Typography>
                    <Link href={`/users/edit?id=${driver.id}`} passHref>
                        <Button variant="contained" color="primary" size="small">
                            Edit User
                        </Button>
                    </Link>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" flexDirection="row" flexWrap="wrap" gap={1}>
                    <Box width={{ xs: '100%', sm: '50%' }}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Name:
                        </Typography>
                        <Typography variant="body1">
                            {driver.firstName} {driver.lastName}
                        </Typography>
                    </Box>
                    <Box width={{ xs: '100%', sm: '50%' }}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Email:
                        </Typography>
                        <Typography variant="body1">
                            {driver.email}
                        </Typography>
                    </Box>
                    <Box width={{ xs: '100%', sm: '50%' }}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Phone Number:
                        </Typography>
                        <Typography variant="body1">
                            {driver.phoneNumber || 'N/A'}
                        </Typography>
                    </Box>
                    <Box width={{ xs: '100%', sm: '50%' }}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Address:
                        </Typography>
                        <Typography variant="body1">
                            {driver.address || 'N/A'}, {driver.city || 'N/A'}, {driver.postcode || 'N/A'}, {driver.country || 'N/A'}
                        </Typography>
                    </Box>
                    {driver.driverInfo && (
                        <>
                            <Box width={{ xs: '100%', sm: '50%' }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Company ID:
                                </Typography>
                                <Typography variant="body1">
                                    {driver.driverInfo.companyId}
                                </Typography>
                            </Box>
                            <Box width={{ xs: '100%', sm: '50%' }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Company Name:
                                </Typography>
                                <Typography variant="body1">
                                    {driver.driverInfo.companyName}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default DriverDetails;
