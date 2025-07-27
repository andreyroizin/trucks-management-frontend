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
import { useDriverWithContract } from '@/hooks/useDriverWithContract';

export type DriverCardProps = {
    id: string;
    firstName: string;
    lastName: string;
    onMenuClick?: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
};

export default function DriverCard({
                                       id,
                                       firstName,
                                       lastName,
                                       onEdit,
                                       onDelete,
                                   }: DriverCardProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const cardRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    
    // Fetch contract data for this driver
    const { data: contractData, isLoading } = useDriverWithContract(id);
    

    
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };
    
    const handleClose = () => {
        setAnchorEl(null);
    };
    
    const handleEdit = (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        onEdit?.(id);
        handleClose();
    };
    
    const handleDelete = (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        onDelete?.(id);
        handleClose();
    };

    // Format contract end date
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return 'N/A';
        }
    };

    return (
        <Box>
            <Card
                ref={cardRef}
                onClick={(e) => {
                    // If menu is open, prevent navigation
                    if (anchorEl) return;
                    router.push(`/drivers/${id}`);
                }}
                sx={{height: 255, display: 'flex', flexDirection: 'column', cursor: 'pointer'}}
                variant="outlined"
            >
                <CardHeader
                    title={
                        <Typography variant="subtitle1" fontWeight={600}>
                            {firstName} {lastName}
                        </Typography>
                    }
                    action={
                        (onEdit || onDelete) ? (
                            <>
                                <IconButton
                                    size="small"
                                    aria-label="driver actions"
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
                                    <Typography variant="caption">Workweek Duration</Typography>
                                </td>
                                <td style={{padding: '4px 0px', width: '60%', textAlign: 'left', verticalAlign: 'top'}}>
                                    <Typography variant="caption">
                                        {contractData?.workweekDuration ? `${contractData.workweekDuration} hours` : (isLoading ? 'Loading...' : 'N/A')}
                                    </Typography>
                                </td>
                            </tr>
                            <tr>
                                <td style={{padding: '4px 8px 4px 0px', width: '40%', textAlign: 'left', verticalAlign: 'top'}}>
                                    <Typography variant="caption">Contract Date</Typography>
                                </td>
                                <td style={{padding: '4px 0px', width: '60%', textAlign: 'left', verticalAlign: 'top'}}>
                                    <Typography variant="caption">{formatDate(contractData?.dateOfEmployment) || (isLoading ? 'Loading...' : 'N/A')}</Typography>
                                </td>
                            </tr>
                            <tr>
                                <td style={{padding: '4px 8px 4px 0px', width: '40%', textAlign: 'left', verticalAlign: 'top'}}>
                                    <Typography variant="caption">Next Contract</Typography>
                                </td>
                                <td style={{padding: '4px 0px', width: '60%', textAlign: 'left', verticalAlign: 'top'}}>
                                    <Typography variant="caption">{formatDate(contractData?.lastWorkingDay) || (isLoading ? 'Loading...' : 'N/A')}</Typography>
                                </td>
                            </tr>
                            <tr>
                                <td style={{padding: '4px 8px 4px 0px', width: '40%', textAlign: 'left', verticalAlign: 'top', whiteSpace: 'nowrap'}}>
                                    <Typography variant="caption">Payscale Increase</Typography>
                                </td>
                                <td style={{padding: '4px 0px', width: '60%', textAlign: 'left', verticalAlign: 'top'}}>
                                    <Typography variant="caption">
                                        {(contractData?.payScale && contractData?.payScaleStep) 
                                            ? `${contractData.payScale}${contractData.payScaleStep}`
                                            : contractData?.payScale || (isLoading ? 'Loading...' : 'N/A')
                                        }
                                    </Typography>
                                </td>
                            </tr>
                            <tr>
                                <td style={{padding: '4px 8px 4px 0px', width: '40%', textAlign: 'left', verticalAlign: 'top', whiteSpace: 'nowrap'}}>
                                    <Typography variant="caption">Vacation Hours Left</Typography>
                                </td>
                                <td style={{padding: '4px 0px', width: '60%', textAlign: 'left', verticalAlign: 'top'}}>
                                    <Typography variant="caption">
                                        {contractData?.vacationHoursLeft !== undefined ? `${Number(contractData.vacationHoursLeft).toFixed(2)} hours` : (isLoading ? 'Loading...' : 'N/A')}
                                    </Typography>
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