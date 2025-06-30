'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

type Snack = { text: string; severity?: AlertColor };

type Ctx = {
    showSnack: (s: Snack) => void;
};

const SnackCtx = createContext<Ctx | undefined>(undefined);

/* ------------------------------------------------------------------ */
export function SnackProvider({ children }: { children: React.ReactNode }) {
    const [snack, setSnack] = useState<Snack | null>(null);
    const [open, setOpen] = useState(false);

    const showSnack = useCallback((s: Snack) => {
        setSnack(s);
        setOpen(true);
    }, []);

    return (
        <SnackCtx.Provider value={{ showSnack }}>
            {children}

            {/* Render Snackbar only when we actually have a snack */}
            {snack && (
                <Snackbar
                    open={open}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    autoHideDuration={4000}
                    onClose={() => setOpen(false)}
                >
                    <Alert
                        elevation={3}
                        variant="filled"
                        severity={snack.severity ?? 'info'}
                        onClose={() => setOpen(false)}
                        sx={{ minWidth: 260 }}
                    >
                        {snack.text}
                    </Alert>
                </Snackbar>
            )}
        </SnackCtx.Provider>
    );
}

/* Hook so any component can fire a snack */
export function useSnack() {
    const ctx = useContext(SnackCtx);
    if (!ctx) throw new Error('useSnack must be used inside <SnackProvider>');
    return ctx.showSnack;
}
