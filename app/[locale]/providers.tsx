'use client';

import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {AuthProvider} from '@/hooks/useAuth';
import {ReactNode} from 'react';
import {SnackProvider} from "@/providers/SnackProvider";
import {LanguageProvider} from "@/providers/LanguageProvider";
import {FeatureModuleProvider} from "@/providers/FeatureModuleProvider";

const queryClient = new QueryClient();

export default function Providers({children}: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <SnackProvider>
                    <AuthProvider>
                        <FeatureModuleProvider>{children}</FeatureModuleProvider>
                    </AuthProvider>
                </SnackProvider>
            </LanguageProvider>
        </QueryClientProvider>
    );
}
