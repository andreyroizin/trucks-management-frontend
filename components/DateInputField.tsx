'use client';

import React from 'react';
import {Controller} from 'react-hook-form';
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { TextField } from '@mui/material';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface DateInputFieldProps {
    name: string;
    control?: any;
    label?: string;
    placeholder?: string;
    helperText?: string;
    timezone?: string;
    error?: boolean;
    errorMessage?: string;
    slotProps?: Partial<{
        textField: Partial<React.ComponentProps<typeof TextField>>;
        [key: string]: any;
    }>;
    value?: dayjs.Dayjs | null;
    onDateChange?: (value: dayjs.Dayjs | null) => void;
    sx?: React.CSSProperties;
}

const DateInputField: React.FC<DateInputFieldProps> = ({
                                                           name,
                                                           control,
                                                           label = 'Date (dd-mm-yy)',
                                                           placeholder = 'dd-mm-yy',
                                                           helperText = '',
                                                           timezone = 'Europe/Amsterdam',
                                                           error = false,
                                                           errorMessage = '',
                                                           slotProps,
                                                           value,
                                                           onDateChange,
                                                           sx,
                                                       }) => {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            {control ? (
                <Controller
                    name={name}
                    control={control}
                    render={({ field }) => (
                        <DatePicker
                            {...field}
                            value={value ?? (field.value ? dayjs.utc(field.value).tz(timezone) : null)}
                            onChange={(newDate) => {
                                field.onChange(newDate ? newDate.format('YYYY-MM-DD') : '');
                                if (onDateChange) {
                                    onDateChange(newDate);
                                }
                            }}
                            sx={sx}
                            format="DD-MM-YYYY"
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    margin: 'normal',
                                    label,
                                    placeholder,
                                    error,
                                    helperText: errorMessage || helperText,
                                    ...(slotProps?.textField || {}),
                                },
                                ...slotProps,
                            }}
                        />
                    )}
                />
            ) : (
                <DatePicker
                    value={value}
                    onChange={(newDate) => {
                        if (onDateChange) {
                            onDateChange(newDate);
                        }
                    }}
                    label={label}
                    sx={sx}
                    format="DD-MM-YYYY"
                    slotProps={{
                        textField: {
                            fullWidth: true,
                            margin: 'normal',
                            label,
                            placeholder,
                            error,
                            helperText: errorMessage || helperText,
                            ...(slotProps?.textField || {}),
                        },
                        ...slotProps,
                    }}
                />
            )}
        </LocalizationProvider>
    );
};

export default DateInputField;
