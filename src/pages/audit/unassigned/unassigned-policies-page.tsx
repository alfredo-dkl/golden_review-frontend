// 'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
	ColumnDef,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	PaginationState,
	SortingState,
	useReactTable,
} from '@tanstack/react-table';
import { Search, X, MoreVertical, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardFooter, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Skeleton from '@/components/ui/skeleton';
import apiClient from '@/lib/api-client';

type Policy = {
	policy_number: string;
	insured_name: string;
	carrier: string;
	effective_date: string | Date;
	exp_date: string | Date;
	premium: number | null;
	csr: string;
};

const UnassignedPoliciesPage = () => {
	const [searchQuery, setSearchQuery] = useState('');
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 25,
	});
	const [sorting, setSorting] = useState<SortingState>([]);

	// Fetch policies from backend with server-side pagination and sorting
	const { data: policiesData, isLoading, error } = useQuery({
		queryKey: ['unassigned', pagination.pageIndex, pagination.pageSize, searchQuery, sorting],
		queryFn: async () => {
			const sortField = sorting.length > 0 ? sorting[0].id : undefined;
			const sortDirection = sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : undefined;

			const response = await apiClient.getUnassigned({
				page: pagination.pageIndex + 1,
				limit: pagination.pageSize,
				search: searchQuery,
				sortBy: sortField,
				sortOrder: sortDirection as 'asc' | 'desc' | undefined,
			});
			return response;
		},
	});

	// Get policies from server response (filtering is done server-side)
	const filteredPolicies = useMemo(() => {
		return policiesData?.data || [];
	}, [policiesData?.data]);

	// Download CSV handler
	const handleDownloadCSV = async () => {
		try {
			const response = await apiClient.getUnassigned({
				page: 1,
				limit: 10000,
				search: searchQuery,
			});

			const policies = response.data || [];

			// Create CSV content
			const headers = ['Policy Number', 'Insured Name', 'Carrier', 'Effective Date', 'Expiration Date', 'Premium', 'CSR'];
			const csvContent = [
				headers.join(','),
				...policies.map((policy: Policy) => [
					`"${policy.policy_number || ''}"`,
					`"${policy.insured_name || ''}"`,
					`"${policy.carrier || ''}"`,
					formatDate(policy.effective_date),
					formatDate(policy.exp_date),
					policy.premium !== null ? policy.premium : '',
					`"${policy.csr || ''}"`,
				].join(','))
			].join('\n');

			// Create and trigger download
			const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
			const link = document.createElement('a');
			const url = URL.createObjectURL(blob);
			link.setAttribute('href', url);
			link.setAttribute('download', `unassigned_policies_${new Date().toISOString().split('T')[0]}.csv`);
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (error) {
			console.error('Error downloading CSV:', error);
		}
	};

	// Format date helper
	const formatDate = (date: Date | string) => {
		if (!date) return '-';
		const d = new Date(date);
		return d.toLocaleDateString('en-US', {
			month: '2-digit',
			day: '2-digit',
			year: 'numeric',
		});
	};

	// Format currency helper
	const formatCurrency = (amount: number | null) => {
		if (amount === null || amount === undefined) return '-';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(amount);
	};

	// Define columns for the DataGrid
	const columns = useMemo<ColumnDef<Policy>[]>(
		() => [
			{
				id: 'policy_number',
				accessorKey: 'policy_number',
				header: ({ column }) => (
					<DataGridColumnHeader title="Policy Number" column={column} />
				),
				cell: ({ row }) => (
					<div className="flex items-center gap-2">
						<span className="font-medium">{row.original.policy_number}</span>
					</div>
				),
				enableSorting: true,
				size: 150,
			},
			{
				id: 'insured_name',
				accessorKey: 'insured_name',
				header: ({ column }) => (
					<DataGridColumnHeader title="Insured Name" column={column} />
				),
				cell: ({ row }) => (
					<span className="text-foreground">{row.original.insured_name}</span>
				),
				enableSorting: true,
				size: 200,
			},
			{
				id: 'carrier',
				accessorKey: 'carrier',
				header: ({ column }) => (
					<DataGridColumnHeader title="Carrier" column={column} />
				),
				cell: ({ row }) => (
					<span className="text-secondary-foreground">{row.original.carrier}</span>
				),
				enableSorting: true,
				size: 180,
			},
			{
				id: 'effective_date',
				accessorKey: 'effective_date',
				header: ({ column }) => (
					<DataGridColumnHeader title="Effective Date" column={column} />
				),
				cell: ({ row }) => (
					<span className="text-secondary-foreground">
						{formatDate(row.original.effective_date)}
					</span>
				),
				enableSorting: true,
				size: 140,
			},
			{
				id: 'exp_date',
				accessorKey: 'exp_date',
				header: ({ column }) => (
					<DataGridColumnHeader title="Expiration Date" column={column} />
				),
				cell: ({ row }) => (
					<span className="text-secondary-foreground">
						{formatDate(row.original.exp_date)}
					</span>
				),
				enableSorting: true,
				size: 140,
			},
			{
				id: 'premium',
				accessorKey: 'premium',
				header: ({ column }) => (
					<DataGridColumnHeader title="Premium" column={column} />
				),
				cell: ({ row }) => (
					<span className="font-medium text-mono">
						{formatCurrency(row.original.premium)}
					</span>
				),
				enableSorting: true,
				size: 120,
			},
			{
				id: 'csr',
				accessorKey: 'csr',
				header: ({ column }) => (
					<DataGridColumnHeader title="CSR" column={column} />
				),
				cell: ({ row }) => (
					<span className="text-secondary-foreground">{row.original.csr}</span>
				),
				enableSorting: true,
				size: 150,
			},
			{
				id: 'actions',
				header: 'Actions',
				cell: () => (
					<Button mode="icon" variant="ghost" size="sm">
						<MoreVertical className="size-4" />
					</Button>
				),
				enableSorting: false,
				enablePinning: true,
				size: 80,
			},
		],
		[]
	);

	const table = useReactTable({
		columns,
		data: filteredPolicies,
		pageCount: policiesData?.totalPages || 0,
		getRowId: (row: Policy) => row.policy_number,
		state: {
			pagination,
			sorting,
			columnPinning: {
				right: ['actions'],
			},
		},
		onPaginationChange: setPagination,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		manualSorting: true,
		manualPagination: true,
		enableColumnPinning: true,
	});

	// Show error state
	if (error) {
		return (
			<div className="container mx-auto py-10">
				<Card>
					<CardHeader>
						<div className="flex items-center justify-center py-8">
							<div className="text-center">
								<h3 className="text-lg font-semibold text-destructive">
									Error Loading Unassigned Policies
								</h3>
								<p className="text-muted-foreground mt-2">
									{error instanceof Error ? error.message : 'An error occurred'}
								</p>
							</div>
						</div>
					</CardHeader>
				</Card>
			</div>
		);
	}

	return (
		<DataGrid
			table={table}
			recordCount={filteredPolicies?.length || 0}
			isLoading={isLoading}
			tableLayout={{
				columnsPinnable: true,
				columnsMovable: true,
				columnsVisibility: false,
				cellBorder: true,
			}}
		>
			<Card className="min-w-full">
				<CardHeader className="py-5 flex-wrap gap-2">
					<div className="flex items-center justify-between w-full gap-4">
						<div className="flex items-center gap-4 flex-1">
							<h2 className="text-xl font-semibold">Unassigned Policies</h2>
							{!isLoading && (
								<span className="text-sm text-muted-foreground">
									{policiesData?.count || 0} {policiesData?.count === 1 ? 'policy' : 'policies'}
								</span>
							)}
						</div>

						<Button
							onClick={handleDownloadCSV}
							variant="secondary"
							size="sm"
							disabled={isLoading || !filteredPolicies.length}
						>
							<Download className="size-4 mr-2" />
							Download CSV
						</Button>

						<div className="relative w-full max-w-[300px]">
							<Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
							<Input
								placeholder="Search unassigned policies..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="ps-9"
							/>
							{searchQuery.length > 0 && (
								<Button
									mode="icon"
									variant="ghost"
									className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
									onClick={() => setSearchQuery('')}
								>
									<X />
								</Button>
							)}
						</div>
					</div>
				</CardHeader>

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
			</Card>
		</DataGrid>
	);
};

export { UnassignedPoliciesPage };
