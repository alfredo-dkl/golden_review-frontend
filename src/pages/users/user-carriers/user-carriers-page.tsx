'use client';

import { useCallback, useMemo, useState } from 'react';
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
import { Search, X, Pencil } from 'lucide-react';
import { apiClient, UserCarrierRow } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toAbsoluteUrl } from '@/lib/helpers';
import { EditCarriersDialog } from './edit-carriers-dialog';

const UserCarriersPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [editingUser, setEditingUser] = useState<UserCarrierRow | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleEditUser = (user: UserCarrierRow) => {
        setEditingUser(user);
        setDialogOpen(true);
    };

    const { data, isLoading, error } = useQuery({
        queryKey: ['user-carriers', pagination.pageIndex, pagination.pageSize, searchQuery, sorting],
        queryFn: () => {
            const sortField = sorting.length > 0 ? sorting[0].id : undefined;
            const sortDirection = sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : undefined;

            return apiClient.getUserCarriers({
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
                search: searchQuery,
                sortBy: sortField,
                sortOrder: sortDirection as 'asc' | 'desc' | undefined,
            });
        },
    });

    const users = data?.data || [];

    const formatCarriers = useCallback((carriers: UserCarrierRow['carriers']) => {
        if (!carriers.length) return '—';
        return carriers.map(c => c.carrierName || c.carrierId).join(', ');
    }, []);

    const getAvatarSrc = useCallback((photoPath?: string | null) => {
        if (!photoPath) return null;
        if (photoPath.startsWith('http')) return photoPath;
        return toAbsoluteUrl(photoPath);
    }, []);

    const getInitials = useCallback((name: string) => {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return 'U';
        if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'U';
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }, []);

    const columns = useMemo<ColumnDef<UserCarrierRow>[]>(
        () => [
            {
                id: 'name',
                accessorKey: 'name',
                header: ({ column }) => (
                    <DataGridColumnHeader title="User" column={column} />
                ),
                cell: ({ row }) => {
                    const avatarSrc = getAvatarSrc(row.original.photoPath);
                    const initials = getInitials(row.original.name);

                    return (
                        <div className="flex items-center gap-3">
                            {avatarSrc ? (
                                <img
                                    className="size-9 rounded-full object-cover shrink-0"
                                    src={avatarSrc}
                                    alt="User avatar"
                                />
                            ) : (
                                <span
                                    className={cn(
                                        'size-9 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold bg-primary text-primary-foreground',
                                    )}
                                >
                                    {initials}
                                </span>
                            )}
                            <div className="flex flex-col">
                                <span className="font-medium">{row.original.name}</span>
                                <span className="text-xs text-muted-foreground">{row.original.email}</span>
                            </div>
                        </div>
                    );
                },
                enableSorting: true,
                size: 220,
            },
            {
                id: 'department',
                accessorKey: 'department',
                header: ({ column }) => (
                    <DataGridColumnHeader title="Department" column={column} />
                ),
                cell: ({ row }) => (
                    <span className="text-secondary-foreground">{row.original.department || '—'}</span>
                ),
                enableSorting: true,
                size: 160,
            },
            {
                id: 'position',
                accessorKey: 'position',
                header: ({ column }) => (
                    <DataGridColumnHeader title="Position" column={column} />
                ),
                cell: ({ row }) => (
                    <span className="text-secondary-foreground">{row.original.position || '—'}</span>
                ),
                enableSorting: true,
                size: 160,
            },
            {
                id: 'carriers',
                accessorFn: row => formatCarriers(row.carriers),
                header: ({ column }) => (
                    <DataGridColumnHeader title="Carriers" column={column} />
                ),
                cell: ({ row }) => (
                    <span className="text-secondary-foreground">{formatCarriers(row.original.carriers)}</span>
                ),
                enableSorting: false,
                size: 240,
            },
            {
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => (
                    <Button
                        mode="icon"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(row.original)}
                        aria-label="Edit"
                    >
                        <Pencil className="size-4 text-orange-500" />
                    </Button>
                ),
                enableSorting: false,
                enableHiding: false,
                enablePinning: true,
                size: 100,
            },
        ],
        [formatCarriers, getAvatarSrc, getInitials]
    );

    const table = useReactTable({
        columns,
        data: users,
        pageCount: data?.totalPages || 0,
        getRowId: (row: UserCarrierRow) => row.userId,
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
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: true,
        manualSorting: true,
        enableColumnPinning: true,
    });

    if (error) {
        return (
            <div className="container mx-auto py-10">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-destructive">Error Loading Users</h3>
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
        <>
            <EditCarriersDialog
                user={editingUser}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />

            <DataGrid
                table={table}
                recordCount={data?.count || 0}
                isLoading={isLoading}
                tableLayout={{
                    columnsPinnable: false,
                    columnsMovable: true,
                    columnsVisibility: false,
                    cellBorder: true,
                }}
            >
                <Card className="min-w-full">
                    <CardHeader className="py-5 flex-wrap gap-2">
                        <div className="flex items-center justify-between w-full gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                <h2 className="text-xl font-semibold">User Carriers</h2>
                                {!isLoading && (
                                    <span className="text-sm text-muted-foreground">
                                        {data?.count || 0} {data?.count === 1 ? 'user' : 'users'}
                                    </span>
                                )}
                            </div>

                            <div className="relative w-full max-w-[300px]">
                                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                                <Input
                                    placeholder="Search users or carriers..."
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
                        <DataGridPagination sizes={[10, 25, 50]} />
                    </CardFooter>
                </Card>
            </DataGrid>
        </>
    );
};

export { UserCarriersPage };
