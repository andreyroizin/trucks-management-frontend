// app/clients/[id]/edit/page.tsx

'use client';

import React, { Suspense } from 'react';
import CreateSurchargeComponent from './CreateSurchargeComponent';

export default function EditClientPage() {
    return (
        <Suspense fallback={<div>Loading create surcharge form...</div>}>
            <CreateSurchargeComponent />
        </Suspense>
    );
}
