'use client';

import { apiClient } from '@/lib/api-client';
import { PoliciesTable } from '@/components/audit/policies-table';

const RenewalsPage = () => {
    return (
        <PoliciesTable
            queryKey={['renewals']}
            fetchFn={(params) => apiClient.getRenewals(params)}
            downloadFn={(params) => apiClient.getRenewals(params)}
            title="Renewals"
            singularLabel="renewal"
            pluralLabel="renewals"
            downloadFilename="renewals_policies"
        />
    );
};

export { RenewalsPage };
