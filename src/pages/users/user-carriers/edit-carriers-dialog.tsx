import { useEffect, useState } from 'react';
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
   Hook: detección de modo oscuro (Tailwind + sistema)
------------------------------------------------------- */
function useIsDarkMode() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const match = window.matchMedia('(prefers-color-scheme: dark)');

        const update = () => {
            setIsDark(
                match.matches || document.documentElement.classList.contains('dark')
            );
        };

        update();
        match.addEventListener('change', update);

        return () => match.removeEventListener('change', update);
    }, []);

    return isDark;
}

/* -------------------------------------------------------
   React Select styles (Metronic / Tailwind look)
------------------------------------------------------- */
type CarrierOption = {
    value: string;
    label: string;
};

function getCustomStyles(
    isDark: boolean
): StylesConfig<CarrierOption, true> {
    return {
        control: (base, state) => ({
            ...base,
            backgroundColor: isDark ? '#181c32' : '#f9fafe',
            borderColor: state.isFocused
                ? '#3e97ff'
                : isDark
                    ? '#23273b'
                    : '#e4e6ef',
            boxShadow: state.isFocused
                ? '0 0 0 2px #3e97ff33'
                : 'none',
            minHeight: 40,
            borderRadius: 8,
            fontSize: 14,
            color: isDark ? '#fff' : '#181c32',
        }),

        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
                ? '#3e97ff'
                : state.isFocused
                    ? isDark
                        ? '#23273b'
                        : '#e1f0ff'
                    : isDark
                        ? '#181c32'
                        : '#fff',
            color: state.isSelected
                ? '#fff'
                : isDark
                    ? '#fff'
                    : '#181c32',
            cursor: 'pointer',
        }),

        multiValue: (base) => ({
            ...base,
            backgroundColor: isDark ? '#23273b' : '#e1f0ff',
            borderRadius: 6,
        }),

        multiValueLabel: (base) => ({
            ...base,
            color: '#3e97ff',
            fontWeight: 500,
        }),

        multiValueRemove: (base) => ({
            ...base,
            color: '#3e97ff',
            ':hover': {
                backgroundColor: '#3e97ff',
                color: '#fff',
            },
        }),

        menu: (base) => ({
            ...base,
            backgroundColor: isDark ? '#181c32' : '#fff',
            borderRadius: 8,
            zIndex: 9999,
        }),

        placeholder: (base) => ({
            ...base,
            color: '#a1a5b7',
            fontSize: 14,
        }),

        singleValue: (base) => ({
            ...base,
            color: isDark ? '#fff' : '#181c32',
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
    const isDarkMode = useIsDarkMode();
    const queryClient = useQueryClient();
    const [selectedCarriers, setSelectedCarriers] = useState<string[]>([]);

    const { data, isLoading } = useQuery({
        queryKey: ['available-carriers'],
        queryFn: () => apiClient.getAvailableCarriers(),
        enabled: open,
    });

    const availableCarriers: Carrier[] = data?.carriers ?? [];

    useEffect(() => {
        if (user) {
            setSelectedCarriers(user.carriers.map(c => c.carrierId));
        }
    }, [user]);

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
        onError: (error) => {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to update carriers'
            );
        },
    });

    const carrierOptions: CarrierOption[] = availableCarriers.map(carrier => ({
        value: carrier.id,
        label: carrier.name,
    }));

    const handleSelectChange = (
        selected: MultiValue<CarrierOption>
    ) => {
        setSelectedCarriers(selected.map(opt => opt.value));
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Carriers</DialogTitle>
                    <DialogDescription>
                        Select carriers for{' '}
                        <span className="font-medium">{user.name}</span>
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
                            value={carrierOptions.filter(opt =>
                                selectedCarriers.includes(opt.value)
                            )}
                            onChange={handleSelectChange}
                            placeholder="Select carriers..."
                            noOptionsMessage={() => 'No carriers available'}
                            styles={getCustomStyles(isDarkMode)}
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