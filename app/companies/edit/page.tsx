import { Suspense } from 'react';
import EditPage from './EditPage';

export default function PageWrapper() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EditPage />
        </Suspense>
    );
}