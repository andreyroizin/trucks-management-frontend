'use client';

import React from 'react';
import {Controller} from 'react-hook-form';
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface DateInputFieldProps {
    name: string;
    control: any;
    label?: string;
    placeholder?: string;
    helperText?: string;
    timezone?: string;
    error?: boolean;
    errorMessage?: string;
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
                                                       }) => {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <DatePicker
                        {...field}
                        value={field.value ? dayjs.utc(field.value).tz(timezone) : null}
                        onChange={(newDate) => {
                            field.onChange(newDate ? dayjs.utc(newDate).startOf('day').toISOString() : '');
                        }}
                        format="DD-MM-YYYY"
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                margin: 'normal',
                                label,
                                placeholder,
                                error,
                                helperText: errorMessage || helperText,
                            },
                        }}
                    />
                )}
            />
        </LocalizationProvider>
    );
};

export default DateInputField;
