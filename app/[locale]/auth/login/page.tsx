import Link from 'next/link';
import LoginForm from '@/components/forms/LoginForm';
import {useTranslations} from 'next-intl';

export default function LoginPage() {
    const t = useTranslations();
    
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
                <LoginForm />
                <div className="mt-4 text-center">
                    <Link href="/auth/forgot-password" className="text-blue-600 hover:underline">
                        {t('auth.login.forgotPassword')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
