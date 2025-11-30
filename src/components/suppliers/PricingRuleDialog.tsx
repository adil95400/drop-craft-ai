import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSupplierPricing } from '@/hooks/useSupplierPricing';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { PricingRule } from '@/hooks/useSupplierPricing';

interface PricingRuleDialogProps {
  supplierId: string;
  rule: PricingRule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  pricing_strategy: string;
  fixed_markup_percentage?: number;
  target_margin_percentage?: number;
  minimum_price?: number;
  maximum_price?: number;
  priority: number;
  is_active: boolean;
}

export function PricingRuleDialog({ supplierId, rule, open, onOpenChange }: PricingRuleDialogProps) {
  const { createRule, updateRule, isCreating, isUpdating } = useSupplierPricing(supplierId);
  const { register, handleSubmit, watch, setValue, reset } = useForm<FormData>({
    defaultValues: {
      pricing_strategy: 'fixed_markup',
      priority: 1,
      is_active: true
    }
  });

  const strategy = watch('pricing_strategy');

  useEffect(() => {
    if (rule) {
      reset({
        pricing_strategy: rule.pricing_strategy,
        fixed_markup_percentage: rule.fixed_markup_percentage || undefined,
        target_margin_percentage: rule.target_margin_percentage || undefined,
        minimum_price: rule.minimum_price || undefined,
        maximum_price: rule.maximum_price || undefined,
        priority: rule.priority,
        is_active: rule.is_active
      });
    } else {
      reset({
        pricing_strategy: 'fixed_markup',
        priority: 1,
        is_active: true
      });
    }
  }, [rule, reset]);

  const onSubmit = (data: FormData) => {
    if (rule) {
      updateRule({ id: rule.id, updates: data });
    } else {
      createRule(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Modifier la règle' : 'Nouvelle règle de tarification'}
          </DialogTitle>
          <DialogDescription>
            Configurez une stratégie de prix automatique
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Stratégie de pricing</Label>
            <Select
              value={strategy}
              onValueChange={(value) => setValue('pricing_strategy', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed_markup">Marge fixe</SelectItem>
                <SelectItem value="target_margin">Marge cible</SelectItem>
                <SelectItem value="competitive">Compétitif</SelectItem>
                <SelectItem value="minimum_threshold">Seuil minimum</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {strategy === 'fixed_markup' && (
            <div className="space-y-2">
              <Label>Marge fixe (%)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="50"
                {...register('fixed_markup_percentage', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Prix = Coût × (1 + marge/100)
              </p>
            </div>
          )}

          {strategy === 'target_margin' && (
            <div className="space-y-2">
              <Label>Marge cible (%)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="30"
                {...register('target_margin_percentage', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Prix = Coût / (1 - marge/100)
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prix minimum (€)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="10.00"
                {...register('minimum_price', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label>Prix maximum (€)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="100.00"
                {...register('maximum_price', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Priorité</Label>
            <Input
              type="number"
              placeholder="1"
              {...register('priority', { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              Les règles avec priorité plus élevée sont appliquées en premier
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label>Règle active</Label>
            <Switch
              checked={watch('is_active')}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {rule ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
