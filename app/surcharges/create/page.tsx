// app/clients/[id]/edit/page.tsx

'use client';

import React, { Suspense } from 'react';
import CreateComponent from './CreateComponent';

export default function EditClientPage() {
    return (
        <Suspense fallback={<div>Loading create surcharge form...</div>}>
            <CreateComponent />
        </Suspense>
    );
}
