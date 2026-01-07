'use client';

import { useEffect, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Select, { MultiValue, StylesConfig } from 'react-select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { apiClient, UserCarrierRow, Carrier } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

/* -------------------------------------------------------
   React Select styles - Metronic theme
------------------------------------------------------- */
type CarrierOption = {
    value: string;
    label: string;
    subCarrierIds?: string[];
    isHeadCarrier?: boolean;
};

function getCustomStyles(): StylesConfig<CarrierOption, true> {
    return {
        control: (base, state) => ({
            ...base,
            backgroundColor: 'var(--bs-modal-bg)',
            borderColor: state.isFocused ? 'var(--bs-primary)' : 'var(--bs-border-color)',
            boxShadow: state.isFocused ? `0 0 0 2px var(--bs-primary)33` : 'none',
            minHeight: 40,
            borderRadius: 8,
            fontSize: 14,
            color: 'var(--bs-body-color)',
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
                ? 'var(--bs-primary-bg-subtle)'
                : state.isFocused
                    ? 'var(--bs-gray-100)'
                    : 'var(--bs-modal-bg)', // same as dialog
            color: 'var(--bs-body-color)',
            cursor: 'pointer',
        }),
        multiValue: (base) => ({
            ...base,
            backgroundColor: 'var(--bs-gray-200)',
            borderRadius: 6,
        }),
        multiValueLabel: (base) => ({
            ...base,
            color: 'var(--bs-primary)',
            fontWeight: 500,
        }),
        multiValueRemove: (base) => ({
            ...base,
            color: 'var(--bs-primary)',
            ':hover': {
                backgroundColor: 'var(--bs-primary)',
                color: 'var(--bs-white)',
            },
        }),
        menu: (base) => ({
            ...base,
            backgroundColor: 'var(--bs-modal-bg)', // same background as dialog
            borderRadius: 8,
            zIndex: 9999,
        }),
        placeholder: (base) => ({
            ...base,
            color: 'var(--bs-gray-500)',
            fontSize: 14,
        }),
        singleValue: (base) => ({
            ...base,
            color: 'var(--bs-body-color)',
        }),
        menuPortal: (base) => ({
            ...base,
            zIndex: 9999, // ensures menu appears above dialog
        }),
    };
}

/* -------------------------------------------------------
   Component
------------------------------------------------------- */
interface EditCarriersDialogProps {
    user: UserCarrierRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditCarriersDialog({
    user,
    open,
    onOpenChange,
}: EditCarriersDialogProps) {
    const queryClient = useQueryClient();
    const [selectedCarriers, setSelectedCarriers] = useState<string[]>([]);

    /* ---------- Queries ---------- */
    const { data: carriersData, isLoading } = useQuery({
        queryKey: ['available-carriers', user?.userId],
        queryFn: () => apiClient.getAvailableCarriers(user?.userId),
        enabled: open && !!user?.userId,
    });

    const { data: headCarriersData, isLoading: isHeadLoading } = useQuery({
        queryKey: ['available-head-carriers'],
        queryFn: () => apiClient.getAvailableHeadCarriers(),
        enabled: open,
    });

    const availableCarriers: Carrier[] = useMemo(
        () => carriersData?.carriers ?? [],
        [carriersData]
    );

    /* ---------- Sync user carriers ---------- */
    useEffect(() => {
        if (!open || !user || !availableCarriers.length) return;

        setSelectedCarriers(
            user.carriers
                .map(c => c.carrierId)
                .filter(id => availableCarriers.some(ac => ac.id === id))
        );
    }, [open, user, availableCarriers]);

    /* ---------- Mutation ---------- */
    const updateMutation = useMutation({
        mutationFn: (carrierIds: string[]) =>
            apiClient.updateUserCarriers(user!.userId, carrierIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-carriers'] });
            toast.success('Carriers updated successfully');
            onOpenChange(false);
        },
        onError: () => toast.error('Failed to update carriers'),
    });

    /* ---------- Options ---------- */
    const carrierOptions: CarrierOption[] = availableCarriers.map(c => ({
        value: c.id,
        label: c.name,
    }));

    const headCarrierOptions: CarrierOption[] =
        headCarriersData?.headCarriers.map(hc => ({
            value: hc.id,
            label: hc.name,
            subCarrierIds: hc.carriersId ?? [],
            isHeadCarrier: true,
        })) ?? [];

    /* ---------- Visibility rules ---------- */
    const visibleHeadCarriers = headCarrierOptions.filter(
        hc =>
            hc.subCarrierIds &&
            !hc.subCarrierIds.every(id => selectedCarriers.includes(id))
    );

    const hiddenCarrierIds = headCarrierOptions
        .filter(hc => hc.subCarrierIds?.every(id => selectedCarriers.includes(id)))
        .flatMap(hc => hc.subCarrierIds ?? []);

    const visibleCarrierOptions = carrierOptions.filter(
        c => !hiddenCarrierIds.includes(c.value)
    );

    const groupedOptions = [
        { label: 'Head Carriers', options: visibleHeadCarriers },
        { label: 'Carriers', options: visibleCarrierOptions },
    ];

    /* ---------- Value (REAL carriers only) ---------- */
    const value = carrierOptions.filter(o =>
        selectedCarriers.includes(o.value)
    );

    /* ---------- Change handler ---------- */
    const handleSelectChange = (selected: MultiValue<CarrierOption>) => {
        const selectedIds = selected.map(o => o.value);

        const added = selected.find(
            o => !selectedCarriers.includes(o.value)
        );

        if (added?.isHeadCarrier && added.subCarrierIds) {
            setSelectedCarriers(prev =>
                Array.from(new Set([...prev, ...added.subCarrierIds!]))
            );
            return;
        }

        setSelectedCarriers(selectedIds);
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Carriers</DialogTitle>
                    <DialogDescription>
                        Select carriers for <strong>{user.name}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <Label className="mb-2 block">Available Carriers</Label>

                    {(isLoading || isHeadLoading) ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin" />
                        </div>
                    ) : (
                        <Select
                            isMulti
                            closeMenuOnSelect={false}
                            options={groupedOptions}
                            value={value}
                            onChange={handleSelectChange}
                            styles={getCustomStyles()}
                            placeholder="Select carriers..."
                        />
                    )}

                    <p className="mt-2 text-xs text-muted-foreground">
                        {selectedCarriers.length} carrier
                        {selectedCarriers.length !== 1 && 's'} selected
                    </p>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={updateMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => updateMutation.mutate(selectedCarriers)}
                        disabled={updateMutation.isPending}
                    >
                        {updateMutation.isPending && (
                            <Loader2 className="mr-2 animate-spin" />
                        )}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}