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
import {useRouter} from 'next/navigation';

export type CarCardProps = {
    id: string;
    licensePlate: string;
    vehicleYear?: string;
    registrationDate?: string;
    driverFirstName?: string | null;
    driverLastName?: string | null;
    onMenuClick?: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
};

export default function CarCard({
                                    id,
                                    licensePlate,
                                    vehicleYear,
                                    registrationDate,
                                    driverFirstName,
                                    driverLastName,
                                    onEdit,
                                    onDelete,
                                }: CarCardProps) {
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
                    router.push(`/cars/${id}`);
                }}
                sx={{height: 230, display: 'flex', flexDirection: 'column', cursor: 'pointer'}}
                variant="outlined"
            >
                <CardHeader
                    title={
                        <Typography variant="subtitle1" fontWeight={600}>
                            {licensePlate}
                        </Typography>
                    }
                    action={
                        (onEdit || onDelete) ? (
                            <>
                                <IconButton
                                    size="small"
                                    aria-label="car actions"
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
                                    {onEdit && <MenuItem onClick={handleEdit}>Edit</MenuItem>}
                                    {onDelete && <MenuItem onClick={handleDelete}>Delete</MenuItem>}
                                </Menu>
                            </>
                        ) : null
                    }
                    sx={{p: 2, alignItems: 'center'}}
                />

                <Box sx={{borderTop: '1px solid', borderColor: 'divider'}}>
                    <CardContent sx={{pt: 3.5}}>
                        <table style={{width: '100%', borderCollapse: 'collapse'}}>
                            <tbody>
                            <tr>
                                <td style={{padding: '4px 8px 4px 0px', width: '40%', textAlign: 'left', verticalAlign: 'top'}}>
                                    <Typography variant="caption">Assigned Driver</Typography>
                                </td>
                                <td style={{padding: '4px 0px', width: '60%', textAlign: 'left', verticalAlign: 'top'}}>
                                    <Typography variant="caption">
                                        {driverFirstName && driverLastName 
                                            ? `${driverFirstName} ${driverLastName}`
                                            : 'Not assigned'
                                        }
                                    </Typography>
                                </td>
                            </tr>
                            <tr>
                                <td style={{padding: '4px 8px 4px 0px', width: '40%', textAlign: 'left', verticalAlign: 'top'}}>
                                    <Typography variant="caption">Vehicle Year</Typography>
                                </td>
                                <td style={{padding: '4px 0px', width: '60%', textAlign: 'left', verticalAlign: 'top'}}>
                                    <Typography variant="caption">{vehicleYear || 'N/A'}</Typography>
                                </td>
                            </tr>
                            <tr>
                                <td style={{padding: '4px 8px 4px 0px', width: '40%', textAlign: 'left', verticalAlign: 'top', whiteSpace: 'nowrap'}}>
                                    <Typography variant="caption">Registration Date</Typography>
                                </td>
                                <td style={{padding: '4px 0px', width: '60%', textAlign: 'left', verticalAlign: 'top'}}>
                                    <Typography variant="caption">{registrationDate || 'N/A'}</Typography>
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