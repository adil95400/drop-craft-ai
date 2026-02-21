/**
 * Dialog de création d'une règle de fallback fournisseur
 */
import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield } from 'lucide-react';
import { useSupplierFallback } from '@/hooks/useSupplierFallback';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFallbackRuleDialog({ open, onOpenChange }: Props) {
  const { createRule, isCreating } = useSupplierFallback();
  const [form, setForm] = useState({
    trigger_condition: 'out_of_stock' as 'out_of_stock' | 'low_stock' | 'price_increase',
    low_stock_threshold: 5,
    price_increase_threshold: 15,
    auto_switch: true,
    notify_on_switch: true,
    fallback_suppliers: [] as Array<{ supplier_id: string; priority: number }>,
  });

  const handleSubmit = () => {
    createRule({
      trigger_condition: form.trigger_condition,
      low_stock_threshold: form.low_stock_threshold,
      price_increase_threshold: form.price_increase_threshold,
      auto_switch: form.auto_switch,
      notify_on_switch: form.notify_on_switch,
      fallback_suppliers: form.fallback_suppliers,
      is_active: true,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <DialogTitle>Nouvelle règle de fallback</DialogTitle>
          </div>
          <DialogDescription>
            Configurez quand et comment basculer vers un fournisseur alternatif
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Condition de déclenchement</Label>
            <Select
              value={form.trigger_condition}
              onValueChange={(v: any) => setForm({ ...form, trigger_condition: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="out_of_stock">Rupture de stock</SelectItem>
                <SelectItem value="low_stock">Stock bas</SelectItem>
                <SelectItem value="price_increase">Hausse de prix fournisseur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.trigger_condition === 'low_stock' && (
            <div className="space-y-2">
              <Label>Seuil de stock bas</Label>
              <Input
                type="number"
                value={form.low_stock_threshold}
                onChange={(e) => setForm({ ...form, low_stock_threshold: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Déclencher quand le stock passe sous ce seuil
              </p>
            </div>
          )}

          {form.trigger_condition === 'price_increase' && (
            <div className="space-y-2">
              <Label>Seuil de hausse de prix (%)</Label>
              <Input
                type="number"
                value={form.price_increase_threshold}
                onChange={(e) => setForm({ ...form, price_increase_threshold: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Déclencher si le prix augmente de plus de ce pourcentage
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label>Basculement automatique</Label>
              <p className="text-xs text-muted-foreground">
                Basculer sans validation manuelle
              </p>
            </div>
            <Switch
              checked={form.auto_switch}
              onCheckedChange={(v) => setForm({ ...form, auto_switch: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Notifier lors du basculement</Label>
              <p className="text-xs text-muted-foreground">
                Envoyer une alerte lors de chaque switch
              </p>
            </div>
            <Switch
              checked={form.notify_on_switch}
              onCheckedChange={(v) => setForm({ ...form, notify_on_switch: v })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating}>
            {isCreating ? 'Création...' : 'Créer la règle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
