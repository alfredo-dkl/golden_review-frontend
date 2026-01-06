'use client';

import { apiClient } from '@/lib/api-client';
import { PoliciesTable } from '@/components/audit/policies-table';

const NewBusinessPage = () => {
  return (
    <PoliciesTable
      queryKey={['new-business']}
      fetchFn={apiClient.getNewBusiness}
      downloadFn={apiClient.getNewBusiness}
      title="New Business"
      singularLabel="policy"
      pluralLabel="policies"
      downloadFilename="new_business_policies"
    />
  );
};

export { NewBusinessPage };
