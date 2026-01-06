// 'use client';

import { apiClient } from '@/lib/api-client';
import { PoliciesTable } from '@/components/audit/policies-table';

const UnassignedPoliciesPage = () => {
	return (
		<PoliciesTable
			queryKey={['unassigned']}
			fetchFn={(params) => apiClient.getUnassigned(params)}
			downloadFn={(params) => apiClient.getUnassigned(params)}
			title="Unassigned Policies"
			singularLabel="policy"
			pluralLabel="policies"
			downloadFilename="unassigned_policies"
		/>
	);
};

export { UnassignedPoliciesPage };
