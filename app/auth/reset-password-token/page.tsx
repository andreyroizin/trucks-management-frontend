import { Suspense } from 'react';
import ResetPasswordPage from './ResetPasswordPage';

export default function PageWrapper() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordPage />
        </Suspense>
    );
}