'use client';

import React, { useState } from 'react';
import {
    Button,
    ButtonGroup,
    IconButton,
    Menu,
    MenuItem,
    Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DriveFileRenameOutlineRoundedIcon from '@mui/icons-material/DriveFileRenameOutlineRounded';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

type Props = {
    onReject: () => void;
    onApprove: () => void;
    onEdit: () => void;
    onOpenDispute: () => void;
    onDelete: () => void;
    disabled?: boolean;
};

export default function PartrideDetailActionBar({
                                             onReject,
                                             onApprove,
                                             onOpenDispute,
                                             onEdit,
                                             onDelete,
                                             disabled = false,
                                         }: Props) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    return (
        <Box sx={{ display: 'flex', gap: 1 }}>
            {/* ─────────── Split button ─────────── */}
            <ButtonGroup variant="contained" disableElevation>
                <Button
                    sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
                    disabled={disabled}
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                >
                    Change Status
                </Button>
                <Button
                    size="small"
                    sx={{ minWidth: 32 }}
                    disabled={disabled}
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                >
                    <ExpandMoreIcon fontSize="small" />
                </Button>
            </ButtonGroup>

            <Menu
                open={open}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <MenuItem
                    onClick={() => {
                        setAnchorEl(null);
                        onReject();
                    }}
                >
                    Close Dispute
                </MenuItem>
            </Menu>

            {/* ─────────── Edit / Delete ─────────── */}
            <IconButton
                onClick={onEdit}
                disabled={disabled}
                sx={{
                    bgcolor: 'grey.800',
                    color: 'common.white',
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'grey.700' },
                    px: 1,
                    py: 0,
                }}
            >
                <DriveFileRenameOutlineRoundedIcon />
            </IconButton>

            <IconButton
                size="large"
                onClick={onDelete}
                disabled={disabled}
                sx={{
                    bgcolor: 'grey.800',
                    color: 'common.white',
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'grey.700' },
                    px: 1,
                    py: 0,
                }}
            >
                <DeleteOutlineIcon fontSize="medium" />
            </IconButton>
        </Box>
    );
}