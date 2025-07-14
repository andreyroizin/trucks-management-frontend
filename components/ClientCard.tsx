'use client';

import React, {useRef, useState} from 'react';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import {
    Card,
    CardContent,
    CardHeader,
    IconButton,
    Typography,
    Box,
    Menu,
    MenuItem
} from '@mui/material';
import { useRouter } from 'next/navigation';

export type ClientCardProps = {
    id: string;
    name: string;
    tav: string;
    lastWorkday: string;
    lastDriver: string;
    onMenuClick?: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
};

export default function ClientCard({
                                       id,
                                       name,
                                       tav,
                                       lastWorkday,
                                       lastDriver,
                                       onEdit,
                                       onDelete,
                                   }: ClientCardProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const cardRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    const handleEdit = () => {
        onEdit?.(id);
        handleClose();
    };
    const handleDelete = () => {
        onDelete?.(id);
        handleClose();
    };

    return (
        <Box>
            <Card
                ref={cardRef}
                onClick={(e) => {
                    // If menu is open, prevent navigation
                    if (anchorEl) return;
                    router.push(`/clients/${id}`);
                }}
                sx={{height: 230, display: 'flex', flexDirection: 'column', cursor: 'pointer'}}
                variant="outlined"
            >
                <CardHeader
                    title={
                        <Typography variant="subtitle1" fontWeight={600}>
                            {name}
                        </Typography>
                    }
                    action={
                        <>
                            <IconButton
                                size="small"
                                aria-label="client actions"
                                onClick={handleClick}
                            >
                                <MoreHorizIcon/>
                            </IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleClose}
                                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                                transformOrigin={{vertical: 'top', horizontal: 'right'}}
                            >
                                <MenuItem onClick={handleEdit}>Edit</MenuItem>
                                <MenuItem onClick={handleDelete}>Delete</MenuItem>
                            </Menu>
                        </>
                    }
                    sx={{p:2, alignItems: 'center'}}
                />

                <Box sx={{borderTop: '1px solid', borderColor: 'divider'}}>
                    <CardContent sx={{pt: 3.5}}>
                        <table style={{width: '100%', borderCollapse: 'collapse'}}>
                            <tbody>
                            <tr>
                                <td style={{padding: '4px 0px'}}>
                                    <Typography variant="caption">TAV</Typography>
                                </td>
                                <td style={{padding: '4px 0px'}}>
                                    <Typography variant="caption">{tav}</Typography>
                                </td>
                            </tr>
                            <tr>
                                <td style={{padding: '4px 0px'}}>
                                    <Typography variant="caption">Last Workday</Typography>
                                </td>
                                <td style={{padding: '4px 0px'}}>
                                    <Typography variant="caption">{lastWorkday}</Typography>
                                </td>
                            </tr>
                            <tr>
                                <td style={{padding: '4px 0px'}}>
                                    <Typography variant="caption">Last Driver</Typography>
                                </td>
                                <td style={{padding: '4px 0px'}}>
                                    <Typography variant="caption">{lastDriver}</Typography>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </CardContent>
                </Box>
            </Card>
        </Box>
    );
}
