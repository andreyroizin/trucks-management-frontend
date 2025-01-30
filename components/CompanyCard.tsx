// components/CompanyCard.tsx

'use client';

import React from 'react';
import Link from 'next/link';
import {
    Card,
    CardActionArea,
    CardContent,
    Typography,
} from '@mui/material';

type Company = {
    id: string;
    name: string;
};

export default function CompanyCard({ company }: { company: Company }) {
    return (
        <Card sx={{  borderRadius: 2, boxShadow: 3 }}>
            <CardActionArea component={Link} href={`/companies/${company.id}`}>
                <CardContent>
                    <Typography variant="h6" component="h3">
                        {company.name}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}
