'use client';

import { apiClient } from '@/lib/api-client';
import { PoliciesTable } from '@/components/audit/policies-table';

const RenewalsPage = () => {
    return (
        <PoliciesTable
            queryKey={['renewals']}
            fetchFn={apiClient.getRenewals}
            downloadFn={apiClient.getRenewals}
            title="Renewals"
            singularLabel="renewal"
            pluralLabel="renewals"
            downloadFilename="renewals_policies"
        />
    );
};

export { RenewalsPage };
