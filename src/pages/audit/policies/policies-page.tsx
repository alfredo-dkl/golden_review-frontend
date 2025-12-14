'use client';

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
import { Search, X, FileText } from 'lucide-react';
import { apiClient, Policy } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

const PoliciesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  // Fetch policies from backend
  const { data: policiesData, isLoading, error } = useQuery({
    queryKey: ['policies'],
    queryFn: async () => {
      const response = await apiClient.getPolicies();
      return response;
    },
  });

  // Filter policies based on search query
  const filteredPolicies = useMemo(() => {
    const policies = policiesData?.data || [];
    
    if (!searchQuery) return policies;

    const query = searchQuery.toLowerCase();
    return policies.filter(
      (policy) =>
        policy.policy_number?.toLowerCase().includes(query) ||
        policy.insured_name?.toLowerCase().includes(query) ||
        policy.carrier?.toLowerCase().includes(query) ||
        policy.csr?.toLowerCase().includes(query)
    );
  }, [policiesData?.data, searchQuery]);

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
            <FileText className="size-4 text-muted-foreground" />
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
    ],
    []
  );

  const table = useReactTable({
    columns,
    data: filteredPolicies,
    pageCount: Math.ceil((filteredPolicies?.length || 0) / pagination.pageSize),
    getRowId: (row: Policy) => row.policy_number,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
                  Error Loading Policies
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
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Policies</h2>
              {!isLoading && (
                <span className="text-sm text-muted-foreground">
                  {filteredPolicies.length} {filteredPolicies.length === 1 ? 'policy' : 'policies'}
                </span>
              )}
            </div>

            <div className="relative w-full max-w-[300px]">
              <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search policies..."
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
          <DataGridPagination />
        </CardFooter>
      </Card>
    </DataGrid>
  );
};

export { PoliciesPage };
