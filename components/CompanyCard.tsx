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

    const handleView = () => {
        router.push(`/companies/${id}`);
        handleClose();
    };

    const handleEdit = () => {
        onEdit(id);
        handleClose();
    };

    const handleDelete = () => {
        onDelete(id);
        handleClose();
    };

    const handleCardClick = () => {
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
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                >
                    <MenuItem onClick={handleView}>View</MenuItem>
                    <MenuItem onClick={handleEdit}>Edit</MenuItem>
                    <MenuItem onClick={handleDelete}>Delete</MenuItem>
                </Menu>
            </CardContent>
        </Card>
    );
}
