import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

interface FileTileProps {
    id: string;
    fileName: string;
    onDelete?: (id: string) => void;
    onClick?: (id: string) => void;
}

const FileTile: React.FC<FileTileProps> = ({ id, fileName, onDelete, onClick }) => {
    return (
        <Box
            onClick={() => onClick?.(id)}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{
                backgroundColor: '#1976D214',
                border: '1px solid #1976D2',
                borderRadius: '4px',
                padding: '16px',
                cursor: 'pointer',
            }}
        >
            <Box display="flex" alignItems="center" gap={2}>
                <InsertDriveFileOutlinedIcon sx={{ color: '#1976d2', fontSize: 32 }} />
                <Typography variant={"body1"}>{fileName}</Typography>
            </Box>
            {onDelete && (
                <IconButton onClick={(e) => { e.stopPropagation(); onDelete(id); }} aria-label="delete file">
                    <DeleteOutlineIcon sx={{ color: '#d32f2f' }} />
                </IconButton>
            )}
        </Box>
    );
};

export default FileTile;
