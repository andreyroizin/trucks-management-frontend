'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCreateQuote } from '@/hooks/useCreateQuote';
import QuoteForm from '@/components/QuoteForm';
import LanguageSelectDesktop from '@/components/LanguageSelectDesktop';
import { CreateQuoteRequest } from '@/types/quote';

export default function CreateQuotePage() {
    const router = useRouter();
    const t = useTranslations();
    const createQuote = useCreateQuote();

    const handleSubmit = async (data: CreateQuoteRequest) => {
        try {
            const result = await createQuote.mutateAsync(data);
            router.push(`/quotes/${result.id}`);
        } catch {
            alert(t('quotes.errors.createFailed'));
        }
    };

    return (
        <Box sx={{ py: 4, maxWidth: 900 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h3" fontWeight={500}>
                        {t('quotes.create.title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {t('quotes.create.subtitle')}
                    </Typography>
                </Box>
                <LanguageSelectDesktop />
            </Box>

            <QuoteForm
                onSubmit={handleSubmit}
                isSubmitting={createQuote.isPending}
                submitLabel={t('quotes.create.submitButton')}
            />
        </Box>
    );
}
