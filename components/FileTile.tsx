import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {ApplicationFile} from "@/types/file";

interface FileTileProps {
    file: ApplicationFile;
    onDelete?: (file: ApplicationFile) => void;
    onClick?: (file: ApplicationFile) => void;
}

const FileTile: React.FC<FileTileProps> = ({ file, onDelete, onClick }) => {
    const { id, originalFileName, contentType } = file;
    return (
        <Box
            onClick={() => onClick?.({ id, originalFileName, contentType })}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                padding: '16px',
                cursor: 'pointer',
                boxShadow: 1,
                '&:hover': {
                    boxShadow: 2,
                    borderColor: 'primary.main',
                },
            }}
        >
            <Box display="flex" alignItems="center" gap={2}>
                <InsertDriveFileOutlinedIcon sx={{ color: '#1976d2', fontSize: 32 }} />
                <Typography variant={"body1"}>{originalFileName}</Typography>
            </Box>
            {onDelete && (
                <IconButton onClick={(e) => { e.stopPropagation(); onDelete({ id, originalFileName, contentType }); }} aria-label="delete file">
                    <DeleteOutlineIcon sx={{ color: '#d32f2f' }} />
                </IconButton>
            )}
        </Box>
    );
};

export default FileTile;
