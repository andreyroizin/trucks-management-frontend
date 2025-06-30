'use client';

import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {AuthProvider} from '@/hooks/useAuth';
import {ReactNode} from 'react';
import {SnackProvider} from "@/providers/SnackProvider";

const queryClient = new QueryClient();

export default function Providers({children}: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <SnackProvider>
                <AuthProvider>{children}</AuthProvider>
            </SnackProvider>
        </QueryClientProvider>
    );
}
