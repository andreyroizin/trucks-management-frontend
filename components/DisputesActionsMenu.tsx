import React, { useState } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface DisputeRowActionsMenuProps {
    onCloseDispute?: () => void;
    onDelete?: () => void;
    onEdit?: () => void;
}

const DisputesActionsMenu: React.FC<DisputeRowActionsMenuProps> = ({onDelete, onCloseDispute, onEdit}) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <IconButton onClick={handleClick}>
                <MoreVertIcon />
            </IconButton>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                <MenuItem onClick={() => { onCloseDispute?.(); handleClose(); }}>Close Dispute</MenuItem>
                <MenuItem onClick={() => { onEdit?.(); handleClose(); }}>Edit Dispute</MenuItem>
                <MenuItem onClick={() => { onDelete?.(); handleClose(); }}>Delete Dispute</MenuItem>
            </Menu>
        </>
    );
};

export default DisputesActionsMenu;
