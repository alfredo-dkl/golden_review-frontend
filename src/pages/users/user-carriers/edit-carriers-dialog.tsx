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
type CarrierOption = { value: string; label: string; };

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
                    : 'var(--bs-modal-bg)', // mismo que diálogo
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
            backgroundColor: 'var(--bs-modal-bg)', // mismo fondo que diálogo
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
            zIndex: 9999, // asegura que el menú aparezca encima del diálogo
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

    /* ---------- Fetch carriers ---------- */
    const { data, isLoading } = useQuery({
        queryKey: ['available-carriers'],
        queryFn: () => apiClient.getAvailableCarriers(),
        enabled: open,
    });

    const availableCarriers: Carrier[] = useMemo(() => {
        return data?.carriers ?? [];
    }, [data]);

    /* ---------- SYNC USER → SELECT ---------- */
    useEffect(() => {
        if (!open) {
            setSelectedCarriers([]);
            return;
        }

        if (!user || availableCarriers.length === 0) return;

        const carrierIds = user.carriers
            .map(c => c.carrierId)
            .filter(id => availableCarriers.some(ac => ac.id === id));

        setSelectedCarriers(carrierIds);
    }, [open, user, availableCarriers]);

    /* ---------- Mutation ---------- */
    const updateMutation = useMutation({
        mutationFn: (carrierIds: string[]) => {
            if (!user) throw new Error('No user selected');
            return apiClient.updateUserCarriers(user.userId, carrierIds);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-carriers'] });
            toast.success('Carriers updated successfully');
            onOpenChange(false);
        },
        onError: () => {
            toast.error('Failed to update carriers');
        },
    });

    const carrierOptions: CarrierOption[] = availableCarriers.map(c => ({
        value: c.id,
        label: c.name,
    }));

    const handleSelectChange = (selected: MultiValue<CarrierOption>) => {
        setSelectedCarriers(selected.map(o => o.value));
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Carriers</DialogTitle>
                    <DialogDescription>
                        Select carriers for <span className="font-medium">{user.name}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <Label className="mb-3 block text-sm font-medium">
                        Available Carriers
                    </Label>

                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="size-6 animate-spin" />
                        </div>
                    ) : (
                        <Select
                            isMulti
                            options={carrierOptions}
                            value={carrierOptions.filter(o =>
                                selectedCarriers.includes(o.value)
                            )}
                            onChange={handleSelectChange}
                            placeholder="Select carriers..."
                            styles={getCustomStyles()}
                        />
                    )}

                    <p className="mt-3 text-xs text-muted-foreground">
                        {selectedCarriers.length} carrier
                        {selectedCarriers.length !== 1 ? 's' : ''} selected
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
                        disabled={updateMutation.isPending || isLoading}
                    >
                        {updateMutation.isPending && (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                        )}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}