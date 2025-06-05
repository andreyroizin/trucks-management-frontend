'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useArchivedDriverPeriods } from '@/hooks/useArchivedDriverPeriods';
import DriverPeriodListContent from '@/components/DriverPeriodList';

export default function ArchivedPeriodsPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useAuth();

    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const { data, isLoading, isError, error } = useArchivedDriverPeriods(page, size);

    useEffect(() => {
        if (!loading && (!isAuthenticated || !user?.roles.some(r => ['driver', 'globalAdmin'].includes(r))))
            router.push(isAuthenticated ? '/403' : '/auth/login');
    }, [loading, isAuthenticated, user, router]);

    return (
        <DriverPeriodListContent
            title="Archived Periods"
            description="Browse your signed and completed work periods."
            pagination={{
                pageNumber: page,
                pageSize: size,
                totalCount: data?.totalCount || 0,
                onPageChange: setPage,
                onPageSizeChange: setSize
            }}
            fetchState={{
                data: data?.data || [],
                isLoading: loading || isLoading,
                isError,
                error
            }}
        />
    );
}