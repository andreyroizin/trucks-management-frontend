'use client';

import React, { Suspense } from 'react';
import CreateRatePageWrapper from "@/app/[locale]/rates/create/CreateRatePageWrapper";

export default function EditClientPage() {
    return (
        <Suspense fallback={<div>Loading create surcharge form...</div>}>
            <CreateRatePageWrapper />
        </Suspense>
    );
}
