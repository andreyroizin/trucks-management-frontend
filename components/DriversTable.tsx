'use client';

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import {Driver} from "@/hooks/useDrivers";

type DriversTableProps = {
    drivers: Driver[];
};

const DriversTable: React.FC<DriversTableProps> = ({ drivers }) => {
    const router = useRouter();

    const handleRowClick = (driverId: string) => {
        // Navigate to driver details page (adjust the route as needed)
        router.push(`/drivers/${driverId}`);
    };

    return (
        <TableContainer component={Paper}>
            <Table aria-label="drivers table">
                <TableHead>
                    <TableRow>
                        <TableCell><Typography variant="subtitle1">Driver Name</Typography></TableCell>
                        <TableCell><Typography variant="subtitle1">Email</Typography></TableCell>
                        <TableCell><Typography variant="subtitle1">Company</Typography></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {drivers.map((driver) => (
                        <TableRow
                            key={driver.id}
                            hover
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleRowClick(driver.user.id)}
                        >
                            <TableCell>
                                {driver.user.firstName} {driver.user.lastName}
                            </TableCell>
                            <TableCell>{driver.user.email}</TableCell>
                            <TableCell>{driver.companyName}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default DriversTable;
