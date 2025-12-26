import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, UserCarrierRow } from '@/lib/api-client';
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
import Select, { MultiValue } from 'react-select';
import { Carrier } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditCarriersDialogProps {
    user: UserCarrierRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditCarriersDialog({ user, open, onOpenChange }: EditCarriersDialogProps) {
    const queryClient = useQueryClient();
    const [selectedCarriers, setSelectedCarriers] = useState<string[]>([]);

    // Fetch available carriers
    const { data: carriersData, isLoading: isLoadingCarriers } = useQuery({
        queryKey: ['available-carriers'],
        queryFn: () => apiClient.getAvailableCarriers(),
        enabled: open,
    });

    const availableCarriers = carriersData?.carriers || [];

    // Initialize selected carriers when user changes
    useEffect(() => {
        if (user) {
            setSelectedCarriers(user.carriers.map(c => c.carrierId));
        }
    }, [user]);

    // Mutation to update carriers
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
            toast.error(error instanceof Error ? error.message : 'Failed to update carriers');
        },
    });


    // Opciones para react-select

    type CarrierOption = { value: string; label: string };
    const carrierOptions: CarrierOption[] = (availableCarriers as Carrier[]).map((carrier) => ({
        value: carrier.id,
        label: carrier.name,
    }));

    const handleSelectChange = (selected: MultiValue<CarrierOption>) => {
        setSelectedCarriers(selected ? selected.map((opt) => opt.value) : []);
    };

    const handleSave = () => {
        updateMutation.mutate(selectedCarriers);
    };

    const handleCancel = () => {
        if (user) {
            setSelectedCarriers(user.carriers.map(c => c.carrierId));
        }
        onOpenChange(false);
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Carriers</DialogTitle>
                    <DialogDescription>
                        Select carriers for <span className="font-medium text-foreground">{user.name}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <Label className="text-sm font-medium mb-3 block">Available Carriers</Label>
                    {isLoadingCarriers ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Select
                            isMulti
                            options={carrierOptions}
                            value={carrierOptions.filter(opt => selectedCarriers.includes(opt.value))}
                            onChange={handleSelectChange}
                            classNamePrefix="react-select"
                            placeholder="Select carriers..."
                            noOptionsMessage={() => 'No carriers available'}
                            styles={{
                                menu: (base: React.CSSProperties) => ({ ...base, zIndex: 9999 }),
                            }}
                        />
                    )}
                    <p className="text-xs text-muted-foreground mt-3">
                        {selectedCarriers.length} carrier{selectedCarriers.length !== 1 ? 's' : ''} selected
                    </p>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updateMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={updateMutation.isPending || isLoadingCarriers}
                    >
                        {updateMutation.isPending && (
                            <Loader2 className="size-4 animate-spin mr-2" />
                        )}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
