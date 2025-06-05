'use client';

import { Button, SxProps, Theme } from '@mui/material';
import { useRouter } from 'next/navigation';
import type { SystemStyleObject } from '@mui/system';

type RoundedNavButtonProps = {
    label: string;
    to?: string;
    onClick?: () => void;
    colorType?: 'gray' | 'green';
    sx?: SxProps<Theme>;
};

export default function RoundedButton({
                                             label,
                                             to,
                                             onClick,
                                             colorType = 'gray',
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
            backgroundColor: '#4caf50',
            color: 'common.white',
            '&:hover': {
                backgroundColor: '#43a047',
            },
        },
    };

    return (
        <Button
            fullWidth
            onClick={handleClick}
            sx={{
                mt: 3,
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
