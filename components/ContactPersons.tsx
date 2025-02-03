'use client';

import React, { useState } from 'react';
import {
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
    TablePagination,
    CircularProgress,
    Alert,
    Box,
} from '@mui/material';
import Link from 'next/link';
import { useContactPersons } from '@/hooks/useContactPersons';

type ContactPersonsSectionProps = {
    companyId?: string;
    clientId?: string;
};

export default function ContactPersonsSection({
                                                  companyId,
                                                  clientId,
                                              }: ContactPersonsSectionProps) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const {
        data: cpData,
        isLoading: cpLoading,
        isError: cpError,
        error: cpErr,
    } = useContactPersons(page + 1, rowsPerPage, companyId, clientId);

    // Pagination handlers
    const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    if (cpLoading) return <CircularProgress />;
    if (cpError) {
        return (
            <Alert severity="error">{cpErr?.message || 'Failed to load contact persons.'}</Alert>
        );
    }

    return (
        <Paper sx={{ mt: 3 }}>
            <Box p={2}>Contact Persons</Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Associated Companies</TableCell>
                            <TableCell>Associated Clients</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {cpData?.data.map((cp) => (
                            <TableRow
                                key={cp.contactPersonId}
                                hover
                                component={Link}
                                href={`/contactpersons/${cp.contactPersonId}`}
                                sx={{ cursor: 'pointer', textDecoration: 'none' }}
                            >
                                <TableCell>
                                    {cp.user.firstName} {cp.user.lastName}
                                </TableCell>
                                <TableCell>{cp.user.email}</TableCell>
                                <TableCell>{cp.associatedCompanies.length}</TableCell>
                                <TableCell>{cp.associatedClients.length}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                component="div"
                count={cpData?.totalCount || 0}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
                labelRowsPerPage="Rows per page:"
            />
        </Paper>
    );
}
