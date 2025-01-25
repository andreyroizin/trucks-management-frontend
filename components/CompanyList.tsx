"use client"

import { useCompanies } from '@/hooks/useCompanies';
import CompanyCard from './CompanyCard';

export default function CompanyList() {
    const { data: companies, isLoading, isError, error } = useCompanies();

    if (isLoading) {
        return <div>Loading companies...</div>;
    }

    if (isError) {
        return <div>Error fetching companies: {error instanceof Error ? error.message : 'Unknown error'}</div>;
    }

    if (!companies?.data || companies?.data.length === 0) {
        return <div>No companies found.</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies?.data.map((company) => (
                <CompanyCard key={company.id} company={company} />
            ))}
        </div>
    );
}
