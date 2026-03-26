'use client';

import React, { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuoteDetail } from '@/hooks/useQuoteDetail';
import { useUpdateQuote } from '@/hooks/useUpdateQuote';
import QuoteForm from '@/components/QuoteForm';
import LanguageSelectDesktop from '@/components/LanguageSelectDesktop';
import { CreateQuoteRequest } from '@/types/quote';

export default function EditQuotePage() {
    const router = useRouter();
    const t = useTranslations();
    const { id } = useParams<{ id: string }>();
    const { data: quote, isLoading } = useQuoteDetail(id);
    const updateQuote = useUpdateQuote();

    useEffect(() => {
        if (quote && quote.status !== 'Draft') {
            router.replace(`/quotes/${id}`);
        }
    }, [quote, id, router]);

    const handleSubmit = async (data: CreateQuoteRequest) => {
        try {
            await updateQuote.mutateAsync({ id, request: data });
            router.push(`/quotes/${id}`);
        } catch {
            alert(t('quotes.errors.updateFailed'));
        }
    };

    if (isLoading || !quote) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ py: 4, maxWidth: 900 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h3" fontWeight={500}>
                        {t('quotes.edit.title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {quote.quoteNumber}
                    </Typography>
                </Box>
                <LanguageSelectDesktop />
            </Box>

            <QuoteForm
                initialData={quote}
                onSubmit={handleSubmit}
                isSubmitting={updateQuote.isPending}
                submitLabel={t('quotes.edit.submitButton')}
            />
        </Box>
    );
}
