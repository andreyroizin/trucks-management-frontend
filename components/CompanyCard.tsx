// components/CompanyCard.tsx

'use client';

import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    IconButton,
    Menu,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Typography
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useRouter } from 'next/navigation';

type CompanyCardProps = {
    id: string;
    name: string;
    drivers: any[];
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
};

export default function CompanyCard({ id, name, drivers, onDelete, onEdit }: CompanyCardProps) {
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleEdit = (event?: React.MouseEvent) => {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        onEdit(id);
        handleClose();
    };

    const handleDelete = (event?: React.MouseEvent) => {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        onDelete(id);
        handleClose();
    };

    const handleCardClick = (event: React.MouseEvent) => {
        // Prevent navigation if menu is open
        if (anchorEl) {
            event.stopPropagation();
            return;
        }
        router.push(`/companies/${id}`);
    };

    return (
        <Card 
            sx={{ 
                borderRadius: 2, 
                boxShadow: 1, 
                cursor: 'pointer',
                '&:hover': { boxShadow: 3 }
            }}
            onClick={handleCardClick}
        >
            <CardContent sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                        {name}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={handleMenuClick}
                        aria-label="more options"
                    >
                        <MoreVertIcon fontSize="small" />
                    </IconButton>
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ boxShadow: 'none' }}>
                    <Table size="small">
                        <TableBody>
                            <TableRow>
                                <TableCell 
                                    sx={{ 
                                        fontWeight: 600, 
                                        borderBottom: 'none',
                                        py: 1,
                                        width: '40%'
                                    }}
                                >
                                    Drivers
                                </TableCell>
                                <TableCell 
                                    sx={{ 
                                        borderBottom: 'none',
                                        py: 1,
                                        textAlign: 'left'
                                    }}
                                >
                                    {drivers?.length || 0}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>

                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                >
                    <MenuItem onClick={handleEdit}>Edit</MenuItem>
                    <MenuItem onClick={handleDelete}>Delete</MenuItem>
                </Menu>
            </CardContent>
        </Card>
    );
}
