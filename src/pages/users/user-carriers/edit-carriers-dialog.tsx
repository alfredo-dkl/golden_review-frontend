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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
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

    const handleToggleCarrier = (carrierId: string) => {
        setSelectedCarriers(prev =>
            prev.includes(carrierId)
                ? prev.filter(id => id !== carrierId)
                : [...prev, carrierId]
        );
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
                        <ScrollArea className="h-[300px] rounded-md border border-border p-4">
                            <div className="space-y-3">
                                {availableCarriers.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No carriers available
                                    </p>
                                ) : (
                                    availableCarriers.map((carrier) => (
                                        <div key={carrier.id} className="flex items-center space-x-3">
                                            <Checkbox
                                                id={`carrier-${carrier.id}`}
                                                checked={selectedCarriers.includes(carrier.id)}
                                                onCheckedChange={() => handleToggleCarrier(carrier.id)}
                                            />
                                            <label
                                                htmlFor={`carrier-${carrier.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                            >
                                                {carrier.name}
                                            </label>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
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
