// 'use client';

import { apiClient } from '@/lib/api-client';
import { PoliciesTable } from '@/components/audit/policies-table';

const UnassignedPoliciesPage = () => {
	return (
		<PoliciesTable
			queryKey={['unassigned']}
			fetchFn={apiClient.getUnassigned}
			downloadFn={apiClient.getUnassigned}
			title="Unassigned Policies"
			singularLabel="policy"
			pluralLabel="policies"
			downloadFilename="unassigned_policies"
		/>
	);
};

export { UnassignedPoliciesPage };
