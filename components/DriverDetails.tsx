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
import { useTranslations } from 'next-intl';
import { UserDetails } from "@/hooks/useUser";

type DriverDetailsProps = {
    driver: UserDetails;
};

const DriverDetails: React.FC<DriverDetailsProps> = ({ driver }) => {
    const t = useTranslations('drivers.details');
    const tNotAvailable = useTranslations('drivers.detail');

    return (
        <Card sx={{ maxWidth: 800, margin: 'auto', mt: 2 }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h5">
                        {t('title')}
                    </Typography>
                    <Link href={`/users/edit?id=${driver.id}`} passHref>
                        <Button variant="contained" color="primary" size="small">
                            {t('buttons.editUser')}
                        </Button>
                    </Link>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" flexDirection="row" flexWrap="wrap" gap={1}>
                    <Box width={{ xs: '100%', sm: '50%' }}>
                        <Typography variant="subtitle2" color="textSecondary">
                            {t('fields.name')}
                        </Typography>
                        <Typography variant="body1">
                            {driver.firstName} {driver.lastName}
                        </Typography>
                    </Box>
                    <Box width={{ xs: '100%', sm: '50%' }}>
                        <Typography variant="subtitle2" color="textSecondary">
                            {t('fields.email')}
                        </Typography>
                        <Typography variant="body1">
                            {driver.email}
                        </Typography>
                    </Box>
                    <Box width={{ xs: '100%', sm: '50%' }}>
                        <Typography variant="subtitle2" color="textSecondary">
                            {t('fields.phoneNumber')}
                        </Typography>
                        <Typography variant="body1">
                            {driver.phoneNumber || tNotAvailable('notAvailable')}
                        </Typography>
                    </Box>
                    <Box width={{ xs: '100%', sm: '50%' }}>
                        <Typography variant="subtitle2" color="textSecondary">
                            {t('fields.address')}
                        </Typography>
                        <Typography variant="body1">
                            {driver.address || tNotAvailable('notAvailable')}, {driver.city || tNotAvailable('notAvailable')}, {driver.postcode || tNotAvailable('notAvailable')}, {driver.country || tNotAvailable('notAvailable')}
                        </Typography>
                    </Box>
                    {driver.driverInfo && (
                        <>
                            <Box width={{ xs: '100%', sm: '50%' }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    {t('fields.companyId')}
                                </Typography>
                                <Typography variant="body1">
                                    {driver.driverInfo.companyId}
                                </Typography>
                            </Box>
                            <Box width={{ xs: '100%', sm: '50%' }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    {t('fields.companyName')}
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
