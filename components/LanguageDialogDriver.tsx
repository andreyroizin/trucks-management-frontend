// LanguageDialog.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions,
    List, ListItemButton, ListItemText, Button, Typography } from '@mui/material';
import { useLanguage } from '@/providers/LanguageProvider';

const LANGS = [
    { code: 'en', label: 'English' },
    { code: 'nl', label: 'Nederlands (Netherlands)' },
    { code: 'bg', label: 'Български (Bulgarian)' },
] as const;

type Lang = (typeof LANGS)[number]['code'];

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function LanguageDialogDriver({ open, onClose }: Props) {
    const { lang, setLang } = useLanguage();
    const [selected, setSelected] = useState<Lang>(lang);

    useEffect(() => { if (open) setSelected(lang); }, [open, lang]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle sx={{pt: 4}}>
                <Typography variant="h5" fontWeight={500}>Choose&nbsp;Your&nbsp;Language</Typography>
            </DialogTitle>

            <DialogContent>
                <List dense disablePadding>
                    {LANGS.map(l => (
                        <ListItemButton
                            key={l.code}
                            onClick={() => setSelected(l.code)}
                            sx={{ px: 0.5 }}
                        >
                            <ListItemText
                                primary={
                                    <Typography
                                        variant="body1"
                                        sx={{ textDecoration: selected === l.code ? 'underline' : 'none' }}
                                    >
                                        {l.label}
                                    </Typography>
                                }
                            />
                        </ListItemButton>
                    ))}
                </List>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button
                    variant="contained"
                    color="success"
                    sx={{ flex: 1 }}
                    onClick={() => { setLang(selected); onClose(); }}
                >
                    Save&nbsp;Changes
                </Button>
                <Button sx={{ flex: 1 }} onClick={onClose}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
}
