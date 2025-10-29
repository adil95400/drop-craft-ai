import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCustomerBehavior } from '@/hooks/useCustomerBehavior';
import { Sparkles } from 'lucide-react';

interface AnalyzeCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnalyzeCustomerDialog({ open, onOpenChange }: AnalyzeCustomerDialogProps) {
  const { analyzeBehavior, isAnalyzing } = useCustomerBehavior();
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_email: '',
    customer_name: '',
    total_orders: '',
    total_spent: '',
    avg_order_value: '',
    last_order_date: '',
    first_order_date: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    analyzeBehavior({
      customer_id: formData.customer_id || crypto.randomUUID(),
      customer_email: formData.customer_email,
      customer_name: formData.customer_name || undefined,
      total_orders: formData.total_orders ? parseInt(formData.total_orders) : undefined,
      total_spent: formData.total_spent ? parseFloat(formData.total_spent) : undefined,
      avg_order_value: formData.avg_order_value ? parseFloat(formData.avg_order_value) : undefined,
      last_order_date: formData.last_order_date || undefined,
      first_order_date: formData.first_order_date || undefined,
    });

    setFormData({
      customer_id: '',
      customer_email: '',
      customer_name: '',
      total_orders: '',
      total_spent: '',
      avg_order_value: '',
      last_order_date: '',
      first_order_date: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Analyser le Comportement Client
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_email">Email Client *</Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                required
                placeholder="client@exemple.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_name">Nom du Client</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="Jean Dupont"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_orders">Total Commandes</Label>
              <Input
                id="total_orders"
                type="number"
                min="0"
                value={formData.total_orders}
                onChange={(e) => setFormData({ ...formData, total_orders: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_spent">Montant Total</Label>
              <Input
                id="total_spent"
                type="number"
                step="0.01"
                min="0"
                value={formData.total_spent}
                onChange={(e) => setFormData({ ...formData, total_spent: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avg_order_value">Panier Moyen</Label>
              <Input
                id="avg_order_value"
                type="number"
                step="0.01"
                min="0"
                value={formData.avg_order_value}
                onChange={(e) => setFormData({ ...formData, avg_order_value: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_order_date">Première Commande</Label>
              <Input
                id="first_order_date"
                type="date"
                value={formData.first_order_date}
                onChange={(e) => setFormData({ ...formData, first_order_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_order_date">Dernière Commande</Label>
              <Input
                id="last_order_date"
                type="date"
                value={formData.last_order_date}
                onChange={(e) => setFormData({ ...formData, last_order_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isAnalyzing}>
              <Sparkles className="mr-2 h-4 w-4" />
              {isAnalyzing ? 'Analyse en cours...' : 'Analyser avec IA'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}