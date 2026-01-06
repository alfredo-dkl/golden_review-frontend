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
className = "absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
onClick = {() => setSearchQuery('')}
								>
	<X />
								</Button >
							)}
						</div >
					</div >
				</CardHeader >

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

export { UnassignedPoliciesPage };
