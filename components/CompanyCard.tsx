import { Company } from '@/types/api';

export default function CompanyCard({ company }: { company: Company }) {
    return (
        <div className="border rounded-lg p-4 shadow-sm">
            <h3 className="text-lg font-bold">{company.name}</h3>
            <p className="text-sm text-gray-600">Users: {company.users.length}</p>
        </div>
    );
}
