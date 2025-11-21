'use client';

import React, { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import {
    Card,
    CardContent,
    CardHeader,
    IconButton,
    Typography,
    Box,
    Menu,
    MenuItem,
    Chip,
} from '@mui/material';
import { useRouter } from 'next/navigation';

export type CustomerAdminCardProps = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    associatedCompanies?: Array<{ id: string; name: string }>;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
};

export default function CustomerAdminCard({
    id,
    email,
    firstName,
    lastName,
    phoneNumber,
    associatedCompanies,
    onEdit,
    onDelete,
}: CustomerAdminCardProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const cardRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const t = useTranslations();

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
                    router.push(`/admins/${id}`);
                }}
                sx={{ height: 230, display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
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
                                    aria-label="admin actions"
                                    onClick={handleClick}
                                >
                                    <MoreHorizIcon />
                                </IconButton>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={open}
                                    onClose={handleClose}
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                >
                                    {onEdit && <MenuItem onClick={handleEdit}>{t('admins.card.menu.edit')}</MenuItem>}
                                    {onDelete && <MenuItem onClick={handleDelete}>{t('admins.card.menu.delete')}</MenuItem>}
                                </Menu>
                            </>
                        ) : null
                    }
                    sx={{ p: 2, alignItems: 'center' }}
                />

                <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                    <CardContent sx={{ pt: 3.5 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '4px 8px 4px 0px', width: '40%', textAlign: 'left', verticalAlign: 'top' }}>
                                        <Typography variant="caption">{t('admins.card.fields.email')}</Typography>
                                    </td>
                                    <td style={{ padding: '4px 0px', width: '60%', textAlign: 'left', verticalAlign: 'top' }}>
                                        <Typography variant="caption">{email || t('admins.card.notAvailable')}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '4px 8px 4px 0px', width: '40%', textAlign: 'left', verticalAlign: 'top' }}>
                                        <Typography variant="caption">{t('admins.card.fields.phoneNumber')}</Typography>
                                    </td>
                                    <td style={{ padding: '4px 0px', width: '60%', textAlign: 'left', verticalAlign: 'top' }}>
                                        <Typography variant="caption">{phoneNumber || t('admins.card.notAvailable')}</Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '4px 8px 4px 0px', width: '40%', textAlign: 'left', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                                        <Typography variant="caption">{t('admins.card.fields.companies')}</Typography>
                                    </td>
                                    <td style={{ padding: '4px 0px', width: '60%', textAlign: 'left', verticalAlign: 'top' }}>
                                        {associatedCompanies && associatedCompanies.length > 0 ? (
                                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                                                {associatedCompanies.slice(0, 2).map((company) => (
                                                    <Chip
                                                        key={company.id}
                                                        label={company.name}
                                                        size="small"
                                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                                    />
                                                ))}
                                                {associatedCompanies.length > 2 && (
                                                    <Chip
                                                        label={`+${associatedCompanies.length - 2}`}
                                                        size="small"
                                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                                    />
                                                )}
                                            </Box>
                                        ) : (
                                            <Typography variant="caption">{t('admins.card.noCompanies')}</Typography>
                                        )}
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

