/**
 * Create Bulk Order Dialog
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useCreateBulkSupplierOrder } from '@/hooks/useBulkSupplierOrders';
import { Plus, Loader2, ShoppingCart } from 'lucide-react';
interface CreateBulkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBulkOrderDialog({ open, onOpenChange }: CreateBulkOrderDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    notes: '',
    shipping_method: ''
  });

  const createMutation = useCreateBulkSupplierOrder();

  const handleSubmit = () => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        onOpenChange(false);
        setFormData({ name: '', notes: '', shipping_method: '' });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Nouvelle Commande Groupée
          </DialogTitle>
          <DialogDescription>
            Créez une commande pour regrouper plusieurs produits de différents fournisseurs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Nom de la commande (optionnel)</Label>
            <Input
              placeholder="Ex: Réassort Juillet, Commande Black Friday..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label>Méthode d'expédition (optionnel)</Label>
            <Input
              placeholder="Ex: Express, Standard, Économique..."
              value={formData.shipping_method}
              onChange={(e) => setFormData({ ...formData, shipping_method: e.target.value })}
            />
          </div>

          <div>
            <Label>Notes (optionnel)</Label>
            <Textarea
              placeholder="Instructions spéciales, remarques..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Créer la commande
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
