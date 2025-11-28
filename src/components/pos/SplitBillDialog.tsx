import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CartItem } from '@/lib/types';
import { Split, Plus, Trash2 } from 'lucide-react';

interface SplitBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onProcessSplitPayment: (groups: CartItem[][]) => void;
}

interface ItemGroup {
  id: string;
  name: string;
  itemIds: Set<string>;
}

export const SplitBillDialog = ({
  open,
  onOpenChange,
  items,
  onProcessSplitPayment,
}: SplitBillDialogProps) => {
  // Initialize with 2 groups
  const [groups, setGroups] = useState<ItemGroup[]>([
    { id: '1', name: 'Grup 1', itemIds: new Set() },
    { id: '2', name: 'Grup 2', itemIds: new Set() },
  ]);

  // Add new group
  const handleAddGroup = () => {
    const newGroupNumber = groups.length + 1;
    setGroups([
      ...groups,
      {
        id: newGroupNumber.toString(),
        name: `Grup ${newGroupNumber}`,
        itemIds: new Set(),
      },
    ]);
  };

  // Remove group
  const handleRemoveGroup = (groupId: string) => {
    if (groups.length <= 2) {
      return; // Minimum 2 groups
    }
    setGroups(groups.filter((g) => g.id !== groupId));
  };

  // Toggle item in group
  const handleToggleItem = (groupId: string, productId: string) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id === groupId) {
          const newItemIds = new Set(group.itemIds);
          if (newItemIds.has(productId)) {
            newItemIds.delete(productId);
          } else {
            // Remove from other groups first
            prevGroups.forEach((g) => {
              if (g.id !== groupId) {
                g.itemIds.delete(productId);
              }
            });
            newItemIds.add(productId);
          }
          return { ...group, itemIds: newItemIds };
        }
        return group;
      })
    );
  };

  // Calculate total for each group
  const groupTotals = useMemo(() => {
    return groups.map((group) => {
      const groupItems = items.filter((item) =>
        group.itemIds.has(item.product_id)
      );
      return groupItems.reduce((sum, item) => sum + item.total_price, 0);
    });
  }, [groups, items]);

  // Calculate overall total
  const overallTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  }, [items]);

  // Calculate assigned total
  const assignedTotal = useMemo(() => {
    return groupTotals.reduce((sum, total) => sum + total, 0);
  }, [groupTotals]);

  // Check if all items are assigned
  const allItemsAssigned = useMemo(() => {
    const assignedItemIds = new Set<string>();
    groups.forEach((group) => {
      group.itemIds.forEach((id) => assignedItemIds.add(id));
    });
    return assignedItemIds.size === items.length;
  }, [groups, items]);

  // Check if split is valid
  const isValidSplit = allItemsAssigned && Math.abs(assignedTotal - overallTotal) < 0.01;

  // Handle process payment
  const handleProcessPayment = () => {
    if (!isValidSplit) {
      return;
    }

    // Create groups of cart items
    const itemGroups: CartItem[][] = groups.map((group) => {
      return items.filter((item) => group.itemIds.has(item.product_id));
    }).filter((group) => group.length > 0); // Only include non-empty groups

    onProcessSplitPayment(itemGroups);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
            <Split className="w-6 h-6" />
            Split Bill
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-600">Total Keseluruhan</p>
                  <p className="text-lg font-bold text-gray-900">
                    Rp {overallTotal.toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Terbagi</p>
                  <p className="text-lg font-bold text-blue-600">
                    Rp {assignedTotal.toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Sisa</p>
                  <p className={`text-lg font-bold ${
                    Math.abs(overallTotal - assignedTotal) < 0.01 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Rp {Math.abs(overallTotal - assignedTotal).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Groups */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {groups.map((group, groupIndex) => (
                <Card key={group.id} className="border-2">
                  <CardContent className="pt-4">
                    {/* Group Header */}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg">{group.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-red-600">
                          Rp {groupTotals[groupIndex].toLocaleString('id-ID')}
                        </span>
                        {groups.length > 2 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveGroup(group.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <Separator className="mb-3" />

                    {/* Items */}
                    <div className="space-y-2">
                      {items.map((item) => {
                        const isChecked = group.itemIds.has(item.product_id);
                        return (
                          <div
                            key={item.product_id}
                            className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                              isChecked ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                            }`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() =>
                                handleToggleItem(group.id, item.product_id)
                              }
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.product_name}</p>
                              <p className="text-xs text-gray-500">
                                {item.quantity}x @ Rp {item.unit_price.toLocaleString('id-ID')}
                              </p>
                            </div>
                            <p className="font-semibold text-sm">
                              Rp {item.total_price.toLocaleString('id-ID')}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add Group Button */}
              <Button
                variant="outline"
                className="w-full border-dashed border-2"
                onClick={handleAddGroup}
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Grup
              </Button>
            </div>
          </ScrollArea>

          {/* Validation Message */}
          {!allItemsAssigned && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ Semua item harus dimasukkan ke dalam grup
                </p>
              </CardContent>
            </Card>
          )}

          {/* Process Payment Button */}
          <Button
            onClick={handleProcessPayment}
            disabled={!isValidSplit}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg font-semibold"
          >
            Proses Pembayaran ({groups.filter(g => g.itemIds.size > 0).length} Grup)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
