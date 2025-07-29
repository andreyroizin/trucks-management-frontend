import { Suspense } from 'react';
import EditUserPage from './EditUserPage';
import { useTranslations } from 'next-intl';

export default function PageWrapper() {
    const t = useTranslations('users.edit');
    
    return (
        <Suspense fallback={<div>{t('loading')}</div>}>
            <EditUserPage />
        </Suspense>
    );
}