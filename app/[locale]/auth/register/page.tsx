'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import RegisterForm from '@/components/forms/RegisterForm';
import {useTranslations} from 'next-intl';

export default function RegisterPage() {
    const { user, isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const t = useTranslations();

    useEffect(() => {
        if (!loading && (!isAuthenticated || !user?.roles.includes('globalAdmin'))) {
            router.push('/auth/login'); // Redirect to login if not authorized
        }
    }, [isAuthenticated, loading, user, router]);

    // Show a loading indicator while auth state is being determined
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>{t('auth.common.loading')}</p>
            </div>
        );
    }

    // Prevent rendering until redirection happens for unauthorized users
    if (!isAuthenticated || !user?.roles.includes('globalAdmin')) {
        return null;
    }

    return (
        <div>
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <RegisterForm />
            </div>
        </div>
    );
}
