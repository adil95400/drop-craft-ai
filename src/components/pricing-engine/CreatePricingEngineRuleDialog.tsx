/**
 * Dialog de création d'une règle dans le moteur de pricing P1-3
 */
import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator } from 'lucide-react';
import { usePricingRules } from '@/hooks/usePricingRules';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePricingEngineRuleDialog({ open, onOpenChange }: Props) {
  const { createRule } = usePricingRules();
  const [form, setForm] = useState({
    name: '',
    description: '',
    rule_type: 'margin',
    priority: 10,
    target_margin: 30,
    markup_percent: 50,
    fixed_amount: 5,
    min_price: 0,
    max_price: 0,
    margin_protection: 15,
    rounding_strategy: 'nearest_99',
    apply_to: 'all',
  });

  const handleSubmit = () => {
    const calculation: Record<string, any> = {};
    if (form.rule_type === 'markup') calculation.markup_percent = form.markup_percent;
    if (form.rule_type === 'fixed') calculation.fixed_amount = form.fixed_amount;

    createRule({
      name: form.name,
      description: form.description || null,
      rule_type: form.rule_type,
      priority: form.priority,
      target_margin: form.rule_type === 'margin' ? form.target_margin : null,
      calculation,
      min_price: form.min_price || null,
      max_price: form.max_price || null,
      margin_protection: form.margin_protection,
      rounding_strategy: form.rounding_strategy,
      apply_to: form.apply_to,
      is_active: true,
      conditions: {},
      actions: {},
    } as any);

    onOpenChange(false);
    setForm({ ...form, name: '', description: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <DialogTitle>Nouvelle règle de pricing</DialogTitle>
          </div>
          <DialogDescription>
            Configurez une règle d'ajustement automatique des prix
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-auto">
          <div className="space-y-2">
            <Label>Nom de la règle *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Marge 30% tous produits"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description optionnelle"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de règle</Label>
              <Select value={form.rule_type} onValueChange={(v) => setForm({ ...form, rule_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="margin">Marge cible (%)</SelectItem>
                  <SelectItem value="markup">Markup (%)</SelectItem>
                  <SelectItem value="fixed">Montant fixe (€)</SelectItem>
                  <SelectItem value="competitive">Compétitif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priorité</Label>
              <Input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          {form.rule_type === 'margin' && (
            <div className="space-y-2">
              <Label>Marge cible (%)</Label>
              <Input
                type="number"
                value={form.target_margin}
                onChange={(e) => setForm({ ...form, target_margin: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Prix = Coût / (1 - marge/100). Ex: marge 30% → coût 10€ = prix 14.29€
              </p>
            </div>
          )}

          {form.rule_type === 'markup' && (
            <div className="space-y-2">
              <Label>Markup (%)</Label>
              <Input
                type="number"
                value={form.markup_percent}
                onChange={(e) => setForm({ ...form, markup_percent: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Prix = Coût × (1 + markup/100). Ex: markup 50% → coût 10€ = prix 15€
              </p>
            </div>
          )}

          {form.rule_type === 'fixed' && (
            <div className="space-y-2">
              <Label>Montant à ajouter (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.fixed_amount}
                onChange={(e) => setForm({ ...form, fixed_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prix minimum (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.min_price}
                onChange={(e) => setForm({ ...form, min_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Prix maximum (€)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.max_price}
                onChange={(e) => setForm({ ...form, max_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Protection de marge minimale (%)</Label>
            <Input
              type="number"
              value={form.margin_protection}
              onChange={(e) => setForm({ ...form, margin_protection: parseFloat(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground">
              Le prix ne descendra jamais en-dessous de cette marge
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Stratégie d'arrondi</Label>
              <Select value={form.rounding_strategy} onValueChange={(v) => setForm({ ...form, rounding_strategy: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nearest_99">x.99€ (psychologique)</SelectItem>
                  <SelectItem value="nearest_50">x.50€</SelectItem>
                  <SelectItem value="round_up">Arrondi supérieur</SelectItem>
                  <SelectItem value="none">Aucun</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Appliquer à</Label>
              <Select value={form.apply_to} onValueChange={(v) => setForm({ ...form, apply_to: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les produits</SelectItem>
                  <SelectItem value="category">Par catégorie</SelectItem>
                  <SelectItem value="tag">Par tag</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!form.name}>
            Créer la règle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
