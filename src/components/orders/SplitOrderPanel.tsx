/**
 * SplitOrderPanel — Splits a multi-supplier order into sub-orders per supplier
 * Used when a single customer order contains products from different suppliers
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Split, Package, Truck, ArrowRight, Loader2, AlertTriangle, CheckCircle2, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderLineItem {
  id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  image_url?: string;
  supplier_id?: string;
  supplier_name?: string;
}

interface SplitOrderPanelProps {
  orderId: string;
  orderNumber: string;
  items: OrderLineItem[];
  customerName: string;
  shippingAddress: any;
  onSplitComplete?: () => void;
}

interface SupplierGroup {
  supplierId: string;
  supplierName: string;
  items: OrderLineItem[];
  totalAmount: number;
  carrier?: string;
}

const CARRIERS = [
  { id: 'auto', name: 'Sélection auto (meilleur prix)' },
  { id: 'colissimo', name: 'Colissimo' },
  { id: 'chronopost', name: 'Chronopost' },
  { id: 'ups', name: 'UPS' },
  { id: 'dhl', name: 'DHL Express' },
  { id: 'fedex', name: 'FedEx' },
  { id: 'mondialrelay', name: 'Mondial Relay' },
  { id: 'dpd', name: 'DPD' },
];

export function SplitOrderPanel({
  orderId,
  orderNumber,
  items,
  customerName,
  shippingAddress,
  onSplitComplete,
}: SplitOrderPanelProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [carrierOverrides, setCarrierOverrides] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  // Group items by supplier
  const supplierGroups = useMemo<SupplierGroup[]>(() => {
    const groups = new Map<string, SupplierGroup>();
    
    for (const item of items) {
      const suppId = item.supplier_id || 'unknown';
      const suppName = item.supplier_name || 'Fournisseur principal';
      
      if (!groups.has(suppId)) {
        groups.set(suppId, {
          supplierId: suppId,
          supplierName: suppName,
          items: [],
          totalAmount: 0,
        });
      }
      
      const group = groups.get(suppId)!;
      group.items.push(item);
      group.totalAmount += item.unit_price * item.quantity;
    }
    
    return Array.from(groups.values());
  }, [items]);

  const needsSplit = supplierGroups.length > 1;

  const splitMutation = useMutation({
    mutationFn: async () => {
      // Create sub-orders for each supplier group
      const subOrders = supplierGroups.map((group, idx) => ({
        parent_order_id: orderId,
        sub_order_number: `${orderNumber}-S${idx + 1}`,
        supplier_id: group.supplierId,
        supplier_name: group.supplierName,
        items: group.items.map(i => ({
          product_name: i.product_name,
          sku: i.sku,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
        total_amount: group.totalAmount,
        carrier: carrierOverrides[group.supplierId] || 'auto',
        status: 'pending',
        shipping_address: shippingAddress,
        customer_name: customerName,
      }));

      // Use the auto-fulfillment engine to process split orders
      const { data, error } = await supabase.functions.invoke('auto-fulfillment-engine', {
        body: {
          action: 'split_and_fulfill',
          order_id: orderId,
          sub_orders: subOrders,
        }
      });

      if (error) throw error;

      // Update parent order status
      await supabase
        .from('orders')
        .update({
          status: 'processing',
          fulfillment_status: 'split',
          notes: `Commande divisée en ${subOrders.length} sous-commandes`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'order_split',
        entity_type: 'order',
        entity_id: orderId,
        description: `Commande ${orderNumber} divisée en ${subOrders.length} sous-commandes`,
        details: { sub_orders: subOrders.map(s => s.sub_order_number) },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Commande ${orderNumber} divisée en ${supplierGroups.length} sous-commandes`);
      setConfirmOpen(false);
      onSplitComplete?.();
    },
    onError: (error: Error) => {
      toast.error('Erreur lors du split', { description: error.message });
    },
  });

  if (!needsSplit) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <p className="text-sm">
              Tous les articles proviennent du même fournisseur — pas de split nécessaire.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Split className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Split Order Multi-Fournisseurs</CardTitle>
                <CardDescription className="text-xs">
                  {supplierGroups.length} fournisseurs détectés — division recommandée
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {supplierGroups.length} sous-commandes
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence>
            {supplierGroups.map((group, idx) => (
              <motion.div
                key={group.supplierId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-lg border border-border p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      S{idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{group.supplierName}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.items.length} article{group.items.length > 1 ? 's' : ''} · {group.totalAmount.toFixed(2)} €
                      </p>
                    </div>
                  </div>
                  <Select
                    value={carrierOverrides[group.supplierId] || 'auto'}
                    onValueChange={(v) =>
                      setCarrierOverrides(prev => ({ ...prev, [group.supplierId]: v }))
                    }
                  >
                    <SelectTrigger className="w-[180px] h-8 text-xs">
                      <Truck className="h-3 w-3 mr-1" />
                      <SelectValue placeholder="Transporteur" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      {CARRIERS.map(c => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  {group.items.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-muted/40"
                    >
                      <div className="flex items-center gap-2">
                        <Box className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{item.product_name}</span>
                        {item.sku && (
                          <span className="text-muted-foreground">({item.sku})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">×{item.quantity}</span>
                        <span className="font-medium">{(item.unit_price * item.quantity).toFixed(2)} €</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <Separator />

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Chaque sous-commande sera envoyée au fournisseur correspondant pour fulfillment automatique.
            </p>
            <Button
              onClick={() => setConfirmOpen(true)}
              className="gap-2"
              size="sm"
            >
              <Split className="h-4 w-4" />
              Diviser et traiter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle>Confirmer le split de la commande</DialogTitle>
            <DialogDescription>
              La commande <strong>{orderNumber}</strong> sera divisée en{' '}
              <strong>{supplierGroups.length}</strong> sous-commandes et envoyée aux fournisseurs respectifs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            {supplierGroups.map((group, idx) => (
              <div key={group.supplierId} className="flex items-center gap-3 text-sm">
                <Badge variant="outline" className="min-w-[40px] justify-center">
                  S{idx + 1}
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{group.supplierName}</span>
                <span className="text-muted-foreground ml-auto">
                  {group.items.length} article{group.items.length > 1 ? 's' : ''} · {group.totalAmount.toFixed(2)} €
                </span>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => splitMutation.mutate()}
              disabled={splitMutation.isPending}
              className="gap-2"
            >
              {splitMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Split className="h-4 w-4" />
              )}
              Confirmer le split
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
