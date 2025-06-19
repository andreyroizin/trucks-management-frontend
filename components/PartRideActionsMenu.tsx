import React, { useState } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface RowActionsMenuProps {
    onApprove?: () => void;
    onOpenDispute?: () => void;
    onReject?: () => void;
    onEdit?: () => void;
    onExport?: () => void;
    onDelete?: () => void;
}

const RowActionsMenu: React.FC<RowActionsMenuProps> = ({
                                                           onApprove,
                                                           onOpenDispute,
                                                           onReject,
                                                           onEdit,
                                                           onDelete,
                                                           onExport
                                                       }) => {
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
                <MenuItem onClick={() => { onApprove?.(); handleClose(); }}>Approve</MenuItem>
                <MenuItem onClick={() => { onOpenDispute?.(); handleClose(); }}>Open Dispute</MenuItem>
                <MenuItem onClick={() => { onReject?.(); handleClose(); }}>Reject</MenuItem>
                <MenuItem onClick={() => { onEdit?.(); handleClose(); }}>Edit Workday</MenuItem>
                <MenuItem onClick={() => { onDelete?.(); handleClose(); }}>Delete Workday</MenuItem>
                {/*<MenuItem onClick={() => { onExport?.(); handleClose(); }}>Export</MenuItem>*/}
            </Menu>
        </>
    );
};

export default RowActionsMenu;
