import { Suspense } from 'react';
import ResetPasswordPage from './ResetPasswordPage';
import {useTranslations} from 'next-intl';

export default function PageWrapper() {
    const t = useTranslations();
    
    return (
        <Suspense fallback={<div>{t('auth.common.loading')}</div>}>
            <ResetPasswordPage />
        </Suspense>
    );
}