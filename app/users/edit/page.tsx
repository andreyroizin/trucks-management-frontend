import { Suspense } from 'react';
import EditUserPage from './EditUserPage';

export default function PageWrapper() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EditUserPage />
        </Suspense>
    );
}