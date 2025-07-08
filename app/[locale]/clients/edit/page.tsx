// app/clients/[id]/edit/page.tsx

'use client';

import React, { Suspense } from 'react';
import EditClient from './EditClient';

export default function EditClientPage() {
    return (
        <Suspense fallback={<div>Loading edit form...</div>}>
            <EditClient />
        </Suspense>
    );
}
