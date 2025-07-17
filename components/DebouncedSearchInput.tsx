import React, {useEffect, useRef, useState} from "react";
import {TextField, SxProps, Theme} from "@mui/material";

export const DebouncedSearchInput = ({ value, onDebouncedChange, placeholder, size, sx }: {
    value: string;
    onDebouncedChange: (value: string) => void;
    placeholder?: string;
    size?: 'small' | 'medium';
    sx?: SxProps<Theme>;
}) => {
    const [search, setSearch] = useState(value);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onDebouncedChange(search);
        }, 500);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [search, onDebouncedChange]);

    return (
        <TextField
            size={size || 'small'}
            placeholder={placeholder || 'Search...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={sx}
        />
    );
}