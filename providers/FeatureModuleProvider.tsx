'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMyModules } from '@/hooks/useFeatureModules';

type FeatureModuleContextType = {
    enabledModules: string[];
    isModuleEnabled: (module: string) => boolean;
    loading: boolean;
};

const FeatureModuleContext = createContext<FeatureModuleContextType | undefined>(undefined);

export const FeatureModuleProvider = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    const { data: enabledModules, isLoading } = useMyModules(isAuthenticated);

    const value = useMemo<FeatureModuleContextType>(() => ({
        enabledModules: enabledModules ?? [],
        isModuleEnabled: (module: string) => {
            if (module === 'Base') return true;
            if (!enabledModules) return true; // still loading — don't hide content yet
            return enabledModules.includes(module);
        },
        loading: isLoading,
    }), [enabledModules, isLoading]);

    return (
        <FeatureModuleContext.Provider value={value}>
            {children}
        </FeatureModuleContext.Provider>
    );
};

export const useFeatureModules = () => {
    const context = useContext(FeatureModuleContext);
    if (context === undefined) {
        throw new Error('useFeatureModules must be used within a FeatureModuleProvider');
    }
    return context;
};
