/**
 * Dialog for creating stock movements
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Package, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

interface StockMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type MovementType = 'in' | 'out' | 'adjustment';

export function StockMovementDialog({ open, onOpenChange }: StockMovementDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_id: '',
    movement_type: 'in' as MovementType,
    quantity: '',
    reason: '',
    notes: '',
  });
  
  const queryClient = useQueryClient();

  // Fetch products for selection
  const { data: products = [] } = useQuery({
    queryKey: ['products-for-movement'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, stock_quantity')
        .eq('user_id', user.id)
        .order('name')
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Fetch warehouses for selection
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses-for-movement'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_id || !formData.quantity) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('La quantité doit être un nombre positif');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Insert stock movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          user_id: user.id,
          product_id: formData.product_id,
          warehouse_id: formData.warehouse_id || null,
          movement_type: formData.movement_type,
          quantity: formData.movement_type === 'out' ? -quantity : quantity,
          reason: formData.reason || null,
          notes: formData.notes || null,
        });

      if (movementError) throw movementError;

      // Update product stock
      const selectedProduct = products.find(p => p.id === formData.product_id);
      const currentStock = selectedProduct?.stock_quantity || 0;
      const newStock = formData.movement_type === 'out' 
        ? currentStock - quantity 
        : currentStock + quantity;

      const { error: productError } = await supabase
        .from('products')
        .update({ 
          stock_quantity: Math.max(0, newStock),
          updated_at: new Date().toISOString()
        })
        .eq('id', formData.product_id);

      if (productError) throw productError;

      toast.success('Mouvement de stock enregistré');
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-stats'] });
      
      // Reset form and close
      setFormData({
        product_id: '',
        warehouse_id: '',
        movement_type: 'in',
        quantity: '',
        reason: '',
        notes: '',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Stock movement error:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMovementIcon = (type: MovementType) => {
    switch (type) {
      case 'in': return <ArrowDown className="h-4 w-4 text-green-600" />;
      case 'out': return <ArrowUp className="h-4 w-4 text-red-600" />;
      case 'adjustment': return <RefreshCw className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Nouveau mouvement de stock
          </DialogTitle>
          <DialogDescription>
            Enregistrer une entrée, sortie ou ajustement de stock
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Selection */}
          <div className="space-y-2">
            <Label htmlFor="product">Produit *</Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) => setFormData({ ...formData, product_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un produit" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} {product.sku && `(${product.sku})`} - Stock: {product.stock_quantity || 0}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Movement Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type de mouvement *</Label>
            <Select
              value={formData.movement_type}
              onValueChange={(value: MovementType) => setFormData({ ...formData, movement_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">
                  <span className="flex items-center gap-2">
                    {getMovementIcon('in')} Entrée (réception)
                  </span>
                </SelectItem>
                <SelectItem value="out">
                  <span className="flex items-center gap-2">
                    {getMovementIcon('out')} Sortie (expédition)
                  </span>
                </SelectItem>
                <SelectItem value="adjustment">
                  <span className="flex items-center gap-2">
                    {getMovementIcon('adjustment')} Ajustement (inventaire)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantité *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="10"
            />
          </div>

          {/* Warehouse (optional) */}
          {warehouses.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="warehouse">Entrepôt</Label>
              <Select
                value={formData.warehouse_id}
                onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.name}
                  </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Raison</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Ex: Réapprovisionnement fournisseur"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informations complémentaires..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
