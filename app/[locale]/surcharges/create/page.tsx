// app/clients/[id]/edit/page.tsx

'use client';

import React, { Suspense } from 'react';
import CreateSurchargeComponent from './CreateSurchargeComponent';
import { useTranslations } from 'next-intl';

export default function EditClientPage() {
    const t = useTranslations('surcharges.create');
    
    return (
        <Suspense fallback={<div>{t('loadingText')}</div>}>
            <CreateSurchargeComponent />
        </Suspense>
    );
}
