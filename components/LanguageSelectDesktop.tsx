'use client';

import React, { useState } from 'react';
import { Box, Menu, MenuItem } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { SUPPORTED_LOCALES } from '@/utils/constants/supportedLocales';

const LanguageSelectDesktop = () => {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (locale: string) => {
    // Get the current path segments
    const segments = pathname.split('/');
    
    // Replace the locale segment (first segment after empty string)
    segments[1] = locale;
    
    // Construct the new path
    const newPath = segments.join('/');
    
    // Navigate to the new path
    router.push(newPath);
    router.refresh(); // Refresh to ensure translations are updated
    handleClose();
  };

  const localeNames = {
    en: 'English',
    nl: 'Dutch',
    bg: 'Bulgarian'
  } as const;

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
          {localeNames[currentLocale as keyof typeof localeNames]}
          <ArrowDropDownIcon />
        </Box>
        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
          {SUPPORTED_LOCALES.map((locale) => (
            <MenuItem 
              key={locale} 
              onClick={() => handleSelect(locale)}
              selected={currentLocale === locale}
            >
              {localeNames[locale]}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    </Box>
  );
};

export default LanguageSelectDesktop;