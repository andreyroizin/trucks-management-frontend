'use client';

import React, { Suspense } from 'react';
import CreateRatePageWrapper from "@/app/[locale]/rates/create/CreateRatePageWrapper";
import { useTranslations } from 'next-intl';

export default function EditClientPage() {
    const t = useTranslations('rates.create');
    
    return (
        <Suspense fallback={<div>{t('loadingText')}</div>}>
            <CreateRatePageWrapper />
        </Suspense>
    );
}
