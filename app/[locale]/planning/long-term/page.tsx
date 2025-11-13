'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from 'next-intl';
import CapacityTemplatesList from '@/components/CapacityTemplatesList';
import CapacityTemplateForm from '@/components/CapacityTemplateForm';
import { CapacityTemplate } from '@/hooks/useCapacityTemplates';
import LanguageSelectDesktop from '@/components/LanguageSelectDesktop';

export default function LongTermPlanningPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const t = useTranslations('planning.longTerm');
    
    const [formOpen, setFormOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<CapacityTemplate | null>(null);

    // Access control - only Customer Admin and Employer roles
    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                router.push('/auth/login');
            } else if (
                !user?.roles.includes('globalAdmin') &&
                !user?.roles.includes('customerAdmin') &&
                !user?.roles.includes('employer')
            ) {
                router.push('/403');
            }
        }
    }, [authLoading, isAuthenticated, user, router]);

    const handleCreateNew = () => {
        setEditingTemplate(null);
        setFormOpen(true);
    };

    const handleEdit = (template: CapacityTemplate) => {
        setEditingTemplate(template);
        setFormOpen(true);
    };

    const handleCloseForm = () => {
        setFormOpen(false);
        setEditingTemplate(null);
    };

    if (authLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        {t('title')}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        {t('subtitle')}
                    </Typography>
                </Box>
                <LanguageSelectDesktop />
            </Box>

            <Box sx={{ mt: 3 }}>
                <CapacityTemplatesList
                    onCreateNew={handleCreateNew}
                    onEdit={handleEdit}
                />
            </Box>

            <CapacityTemplateForm
                open={formOpen}
                onClose={handleCloseForm}
                template={editingTemplate}
            />
        </Box>
    );
}
