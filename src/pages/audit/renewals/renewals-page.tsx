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

                <CardTable>
                    <ScrollArea>
                        {isLoading ? (
                            <div className="p-8 space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : (
                            <DataGridTable />
                        )}
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </CardTable>

                <CardFooter>
                    <DataGridPagination sizes={[25, 50, 100]} />
                </CardFooter>
            </Card >
        </DataGrid >
    );
};

export { RenewalsPage };
