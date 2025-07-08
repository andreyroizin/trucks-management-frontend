// app/companies/page.tsx

'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import CompanyList from '@/components/CompanyList';
import AddNewButton from '@/components/AddNewCompanyButton';
import {useAuth} from "@/hooks/useAuth";

export default function CompaniesPage() {
    const { user } = useAuth();
    const isCustomerAdmin = user?.roles.includes('customerAdmin');
    const isGlobalAdmin = user?.roles.includes('globalAdmin');

    return (
        <Box maxWidth="5xl" mx="auto" p={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" component="h1">
                    Companies
                </Typography>
                {(isGlobalAdmin || isCustomerAdmin) && <AddNewButton />}
            </Box>
            <CompanyList />
        </Box>
    );
}
