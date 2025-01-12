// src/app/companies/page.tsx
import CompanyList from '@/components/CompanyList';

export default function CompaniesPage() {
    return (
        <div className="max-w-5xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Companies</h1>
            <CompanyList />
        </div>
    );
}
