'use client';

import React, { useState } from 'react';
import { Box, Menu, MenuItem } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const LanguageSelectDesktop = () => {
  const [language, setLanguage] = useState('en');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (value: string) => {
    setLanguage(value);
    handleClose();
  };

  return (
    <Box display="flex" alignItems="center">
      <Box sx={{ fontSize: '20px' }}>
        <Box
          onClick={handleClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            fontWeight: 500,
            color: 'text.primary',
          }}
        >
          {{
            en: 'English',
            nl: 'Dutch',
            bg: 'Bulgarian'
          }[language]}
          <ArrowDropDownIcon />
        </Box>
        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
          <MenuItem onClick={() => handleSelect('en')}>English</MenuItem>
          <MenuItem onClick={() => handleSelect('nl')}>Dutch</MenuItem>
          <MenuItem onClick={() => handleSelect('bg')}>Bulgarian</MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default LanguageSelectDesktop;