'use client';

import { Button, SxProps, Theme } from '@mui/material';
import { useRouter } from 'next/navigation';
import type { SystemStyleObject } from '@mui/system';
import { ReactNode } from 'react';

type RoundedNavButtonProps = {
    label: string;
    to?: string;
    onClick?: () => void;
    colorType?: 'gray' | 'green';
    icon?: ReactNode; // <-- ✅ NEW
    sx?: SxProps<Theme>;
};

export default function RoundedButton({
                                          label,
                                          to,
                                          onClick,
                                          colorType = 'gray',
                                          icon,
                                          sx = {},
                                      }: RoundedNavButtonProps) {
    const router = useRouter();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (to) {
            router.push(to);
        }
    };

    const colorStyles: Record<string, SystemStyleObject<Theme>> = {
        gray: {
            backgroundColor: '#e3e3e3',
            color: 'common.black',
            '&:hover': {
                backgroundColor: '#d5d5d5',
            },
        },
        green: {
            backgroundColor: '#2E7D32',
            color: 'common.white',
            '&:hover': {
                backgroundColor: '#2E7D32',
            },
        },
    };

    return (
        <Button
            fullWidth
            onClick={handleClick}
            startIcon={icon} // ✅ use MUI icon prop
            sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: 400,
                textTransform: 'none',
                ...colorStyles[colorType],
                ...sx,
            }}
        >
            {label}
        </Button>
    );
}
