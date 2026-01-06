'use client';

import { apiClient } from '@/lib/api-client';
import { PoliciesTable } from '@/components/audit/policies-table';

const NewBusinessPage = () => {
  return (
    <PoliciesTable
      queryKey={['new-business']}
      fetchFn={(params) => apiClient.getNewBusiness(params)}
      downloadFn={(params) => apiClient.getNewBusiness(params)}
      title="New Business"
      singularLabel="policy"
      pluralLabel="policies"
      downloadFilename="new_business_policies"
    />
  );
};

export { NewBusinessPage };
