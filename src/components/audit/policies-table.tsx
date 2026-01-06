'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ColumnDef,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    PaginationState,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { Download, Search, X } from 'lucide-react';
import { Policy, apiClient, UserCarrierRow } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface PoliciesTableProps {
    queryKey: (string | number | boolean)[];
    fetchFn: (params: {
        page: number;
        limit: number;
        search: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) => Promise<{
        data: Policy[];
        count: number;
        totalPages: number;
    }>;
    downloadFn: (params: {
        page: number;
        limit: number;
        search: string;
    }) => Promise<{
        data: Policy[];
        count: number;
    }>;
    title: string;
    singularLabel: string;
    pluralLabel: string;
    downloadFilename: string;
}

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

export const PoliciesTable = ({
    queryKey,
    fetchFn,
    downloadFn,
    title,
    singularLabel,
    pluralLabel,
    downloadFilename,
}: PoliciesTableProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 25,
    });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState({});
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserCarrierRow | null>(null);
    const [policiesForAssignment, setPoliciesForAssignment] = useState<Policy[]>([]);
    const [isAssigning, setIsAssigning] = useState(false);

    // Fetch available users for assignment
    const { data: usersData } = useQuery({
        queryKey: ['available-users-for-assignment'],
        queryFn: async () => {
            const response = await apiClient.getUserCarriers({
                page: 1,
                limit: 1000,
                search: '',
            });
            return response.data || [];
        },
    });

    // Fetch policies from backend with server-side pagination and sorting
    const { data: policiesData, isLoading, error } = useQuery({
        queryKey: [
            ...queryKey,
            pagination.pageIndex,
            pagination.pageSize,
            searchQuery,
            sorting,
        ],
        queryFn: async () => {
            const sortField = sorting.length > 0 ? sorting[0].id : undefined;
            const sortDirection =
                sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : undefined;

            return fetchFn({
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
                search: searchQuery,
                sortBy: sortField,
                sortOrder: sortDirection,
            });
        },
    });

    // Get policies from server response
    const filteredPolicies = useMemo(() => {
        return policiesData?.data || [];
    }, [policiesData?.data]);

    // Confirm assignment and send to backend
    const handleConfirmAssignment = async () => {
        if (!selectedUser || policiesForAssignment.length === 0) return;

        setIsAssigning(true);
        try {
            // Send assignment requests for each policy
            await Promise.all(
                policiesForAssignment.map((policy) =>
                    apiClient.assignPolicy(policy.policy_id, selectedUser.userId)
                )
            );

            // Clear selection and close dialog
            setRowSelection({});
            setAssignDialogOpen(false);
            setSelectedUser(null);
            setPoliciesForAssignment([]);
        } catch (error) {
            console.error('Error assigning policies:', error);
        } finally {
            setIsAssigning(false);
        }
    };

    // Download CSV handler
    const handleDownloadCSV = async () => {
        try {
            const response = await downloadFn({
                page: 1,
                limit: 10000,
                search: searchQuery,
            });

            const policies = response.data || [];

            // Create CSV content
            const headers = [
                'Policy Number',
                'Insured Name',
                'Carrier',
                'Effective Date',
                'Expiration Date',
                'Premium',
                'CSR',
            ];
            const csvContent = [
                headers.join(','),
                ...policies.map((policy: Policy) =>
                    [
                        `"${policy.policy_number || ''}"`,
                        `"${policy.insured_name || ''}"`,
                        `"${policy.carrier || ''}"`,
                        formatDate(policy.effective_date),
                        formatDate(policy.exp_date),
                        policy.premium !== null ? policy.premium : '',
                        `"${policy.csr || ''}"`,
                    ].join(',')
                ),
            ].join('\n');

            // Create and trigger download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute(
                'download',
                `${downloadFilename}_${new Date().toISOString().split('T')[0]}.csv`
            );
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading CSV:', error);
        }
    };

    // Define columns for the DataGrid
    const columns = useMemo<ColumnDef<Policy>[]>(
        () => [
            {
                id: 'checkbox',
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllRowsSelected()}
                        onChange={table.getToggleAllRowsSelectedHandler()}
                        aria-label="Select all rows"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                        aria-label="Select row"
                    />
                ),
                enableSorting: false,
                size: 50,
            },
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
            rowSelection,
            columnPinning: {
                left: ['checkbox'],
            },
        },
        onRowSelectionChange: setRowSelection,
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
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
                                    Error Loading {title}
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
                            <h2 className="text-xl font-semibold">{title}</h2>
                            {!isLoading && (
                                <span className="text-sm text-muted-foreground">
                                    {policiesData?.count || 0}{' '}
                                    {policiesData?.count === 1 ? singularLabel : pluralLabel}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={Object.keys(rowSelection).length === 0}
                                    >
                                        Actions
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => {
                                            const selectedPolicies = Object.keys(rowSelection)
                                                .map((key) => filteredPolicies.find((p) => p.policy_number === key))
                                                .filter((p) => p !== undefined) as Policy[];
                                            setPoliciesForAssignment(selectedPolicies);
                                            setAssignDialogOpen(true);
                                        }}
                                    >
                                        Assign to
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                                onClick={handleDownloadCSV}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                <Download className="size-4" />
                                Download
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full">
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder={`Search ${pluralLabel}...`}
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPagination({ pageIndex: 0, pageSize: 25 });
                                }}
                                className="pl-9 h-9"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setPagination({ pageIndex: 0, pageSize: 25 });
                                    }}
                                    className="absolute right-3 top-2.5"
                                >
                                    <X className="size-4 text-muted-foreground hover:text-foreground" />
                                </button>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <DataGridTable />

                {isLoading && (
                    <div className="space-y-2 p-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                )}

                {filteredPolicies.length > 0 && (
                    <CardHeader className="border-t py-4">
                        <DataGridPagination />
                    </CardHeader>
                )}

                {filteredPolicies.length === 0 && !isLoading && (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                            <p className="text-muted-foreground">No {pluralLabel.toLowerCase()} found</p>
                        </div>
                    </div>
                )}
            </Card>

            {/* Assignment Dialog */}
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent className="max-w-2xl max-h-96">
                    <DialogHeader>
                        <DialogTitle>Assign {policiesForAssignment.length} {policiesForAssignment.length === 1 ? singularLabel : pluralLabel} to User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-muted p-3 rounded text-sm">
                            <p className="font-semibold mb-2">Policies to assign:</p>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {policiesForAssignment.map((policy) => (
                                    <div key={policy.policy_id} className="text-muted-foreground">
                                        • {policy.policy_number} - {policy.insured_name}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Select User:</label>
                            <div className="border rounded-lg max-h-64 overflow-y-auto">
                                {usersData && usersData.length > 0 ? (
                                    usersData.map((user) => (
                                        <button
                                            key={user.userId}
                                            onClick={() => setSelectedUser(user)}
                                            className={`w-full text-left p-3 border-b hover:bg-accent transition-colors ${selectedUser?.userId === user.userId
                                                ? 'bg-primary text-primary-foreground'
                                                : ''
                                                }`}
                                        >
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {user.email}
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-3 text-center text-muted-foreground">
                                        No users available
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setAssignDialogOpen(false);
                                    setSelectedUser(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirmAssignment}
                                disabled={!selectedUser || isAssigning}
                            >
                                {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </DataGrid>
    );
};
