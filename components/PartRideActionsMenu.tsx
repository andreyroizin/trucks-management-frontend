'use client';

import React, { useState } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useTranslations } from 'next-intl';

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
    const t = useTranslations('partrides.components.actions');
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
                <MenuItem onClick={() => { onApprove?.(); handleClose(); }}>{t('approve')}</MenuItem>
                <MenuItem onClick={() => { onOpenDispute?.(); handleClose(); }}>{t('openDispute')}</MenuItem>
                <MenuItem onClick={() => { onReject?.(); handleClose(); }}>{t('reject')}</MenuItem>
                <MenuItem onClick={() => { onEdit?.(); handleClose(); }}>{t('editWorkday')}</MenuItem>
                <MenuItem onClick={() => { onDelete?.(); handleClose(); }}>{t('deleteWorkday')}</MenuItem>
                {/*<MenuItem onClick={() => { onExport?.(); handleClose(); }}>Export</MenuItem>*/}
            </Menu>
        </>
    );
};

export default RowActionsMenu;
