import React, { useState } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useTranslations } from 'next-intl';

interface PartRideDetailActionsMenuDriverProps {
    onEdit?: () => void;
    onDelete?: () => void;
}

const PartRideDetailActionsMenuDriver: React.FC<PartRideDetailActionsMenuDriverProps> = ({
                                                           onEdit,
                                                           onDelete,
                                                       }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const t = useTranslations('partrides.driver.detail.actions');

    return (
        <>
            <IconButton onClick={handleClick}>
                <MoreVertIcon />
            </IconButton>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                <MenuItem onClick={() => { onEdit?.(); handleClose(); }}>{t('edit')}</MenuItem>
                <MenuItem onClick={() => { onDelete?.(); handleClose(); }}>{t('delete')}</MenuItem>
                {/*<MenuItem onClick={() => { onExport?.(); handleClose(); }}>Export</MenuItem>*/}
            </Menu>
        </>
    );
};

export default PartRideDetailActionsMenuDriver;
