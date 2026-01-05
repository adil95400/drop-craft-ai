/**
 * Bulk Order Detail Modal
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  useBulkSupplierOrder, 
  useAddBulkSupplierOrderItem, 
  useRemoveBulkSupplierOrderItem,
  useSubmitBulkSupplierOrder
} from '@/hooks/useBulkSupplierOrders';
import { BulkOrdersService } from '@/services/BulkOrdersService';
import { 
  Package, Plus, Trash2, Send, Loader2, Clock,
  CheckCircle, Truck, DollarSign, Layers
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface BulkOrderDetailModalProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkOrderDetailModal({ orderId, open, onOpenChange }: BulkOrderDetailModalProps) {
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    product_title: '',
    product_sku: '',
    quantity: 1,
    unit_price: 0
  });

  const { data: order, isLoading } = useBulkSupplierOrder(orderId);
  const addItemMutation = useAddBulkSupplierOrderItem();
  const removeItemMutation = useRemoveBulkSupplierOrderItem();
  const submitMutation = useSubmitBulkSupplierOrder();

  const handleAddItem = () => {
    if (!newItem.product_title || newItem.quantity <= 0 || newItem.unit_price <= 0) return;

    addItemMutation.mutate({
      bulk_order_id: orderId,
      ...newItem
    }, {
      onSuccess: () => {
        setNewItem({ product_title: '', product_sku: '', quantity: 1, unit_price: 0 });
        setShowAddItem(false);
      }
    });
  };

  // Group items by supplier
  const itemsBySupplier = order ? BulkOrdersService.groupItemsBySupplier(order.items) : new Map();

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <Skeleton className="h-[600px] w-full" />
        </DialogContent>
      </Dialog>
    );
  }

  if (!order) return null;

  const isDraft = order.status === 'draft';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {order.order_number}
            {order.name && <span className="font-normal text-muted-foreground">- {order.name}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <Layers className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xl font-bold">{order.total_items}</p>
                  <p className="text-xs text-muted-foreground">Produits</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-xl font-bold">
                    {parseFloat(order.total_amount as any).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                  </p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <Clock className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-xl font-bold capitalize">{order.status}</p>
                  <p className="text-xs text-muted-foreground">Statut</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Produits ({order.items.length})</h3>
              {isDraft && (
                <Button size="sm" onClick={() => setShowAddItem(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un produit
                </Button>
              )}
            </div>

            {/* Add Item Form */}
            {showAddItem && (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <Label>Nom du produit</Label>
                      <Input
                        placeholder="Titre du produit"
                        value={newItem.product_title}
                        onChange={(e) => setNewItem({ ...newItem, product_title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Quantité</Label>
                      <Input
                        type="number"
                        min={1}
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    <div>
                      <Label>Prix unitaire (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={newItem.unit_price}
                        onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" onClick={handleAddItem} disabled={addItemMutation.isPending}>
                      {addItemMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Ajouter
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddItem(false)}>
                      Annuler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <ScrollArea className="h-[300px]">
              {order.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun produit dans cette commande</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead className="text-center">Qté</TableHead>
                      <TableHead className="text-right">Prix unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      {isDraft && <TableHead className="w-12"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.product_title}</p>
                            {item.product_sku && (
                              <p className="text-xs text-muted-foreground">SKU: {item.product_sku}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {item.unit_price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.total_price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                        </TableCell>
                        {isDraft && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItemMutation.mutate(item.id)}
                              disabled={removeItemMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </div>

          {/* Footer Actions */}
          {isDraft && order.items.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="flex justify-end">
                <Button onClick={() => submitMutation.mutate(orderId)} disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Soumettre la commande
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
