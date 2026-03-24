/**
 * Create Repricing Rule Dialog — routes to pricing_rules canonical table
 */
import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Zap } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STRATEGIES = [
  { value: 'undercut', label: 'Sous-coter', desc: 'Prix inférieur au concurrent' },
  { value: 'match', label: 'Aligner', desc: 'Même prix que le concurrent' },
  { value: 'margin_floor', label: 'Plancher marge', desc: 'Ne pas descendre sous un seuil' },
  { value: 'dynamic_ai', label: 'IA dynamique', desc: 'Optimisation automatique par IA' },
];

export function CreateRepricingRuleDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    description: '',
    strategy: 'undercut',
    price_offset: 1,
    offset_type: 'percent',
    min_margin: 15,
    max_discount: 30,
    schedule: 'hourly',
  });

  const createRule = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase
        .from('repricing_rules')
        .insert({
          user_id: user.id,
          name: form.name,
          description: form.description,
          strategy: form.strategy,
          price_offset: form.price_offset,
          offset_type: form.offset_type,
          min_margin: form.min_margin,
          max_discount: form.max_discount,
          schedule: form.schedule,
          is_active: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast.success('Règle de repricing créée');
      onOpenChange(false);
      setForm({ name: '', description: '', strategy: 'undercut', price_offset: 1, offset_type: 'percent', min_margin: 15, max_discount: 30, schedule: 'hourly' });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Nouvelle règle de repricing
          </DialogTitle>
          <DialogDescription>
            Configurez une règle d'ajustement automatique de vos prix
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Nom de la règle</Label>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Sous-coter Amazon -2%"
            />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description optionnelle..."
              rows={2}
            />
          </div>

          <div className="space-y-1">
            <Label>Stratégie</Label>
            <Select value={form.strategy} onValueChange={v => setForm(f => ({ ...f, strategy: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STRATEGIES.map(s => (
                  <SelectItem key={s.value} value={s.value}>
                    <div className="flex items-center gap-2">
                      <span>{s.label}</span>
                      <span className="text-muted-foreground text-xs">— {s.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Offset prix</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.5"
                  value={form.price_offset}
                  onChange={e => setForm(f => ({ ...f, price_offset: parseFloat(e.target.value) || 0 }))}
                  className="flex-1"
                />
                <Select value={form.offset_type} onValueChange={v => setForm(f => ({ ...f, offset_type: v }))}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">%</SelectItem>
                    <SelectItem value="fixed">€</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Fréquence</Label>
              <Select value={form.schedule} onValueChange={v => setForm(f => ({ ...f, schedule: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Temps réel</SelectItem>
                  <SelectItem value="hourly">Toutes les heures</SelectItem>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>Marge minimum</span>
              <Badge variant="outline">{form.min_margin}%</Badge>
            </Label>
            <Slider
              value={[form.min_margin]}
              onValueChange={([v]) => setForm(f => ({ ...f, min_margin: v }))}
              min={0} max={50} step={1}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>Remise maximum</span>
              <Badge variant="outline">{form.max_discount}%</Badge>
            </Label>
            <Slider
              value={[form.max_discount]}
              onValueChange={([v]) => setForm(f => ({ ...f, max_discount: v }))}
              min={5} max={60} step={1}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button
            onClick={() => createRule.mutate()}
            disabled={!form.name || createRule.isPending}
          >
            {createRule.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Créer la règle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
