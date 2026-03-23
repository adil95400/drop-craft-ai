import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized';
import { toast } from 'sonner';
import {
  TrendingUp, Plus, Zap, Package, ShoppingCart,
  Target, Sparkles, Pencil, Trash2, Play, Pause
} from 'lucide-react';

interface UpsellRule {
  id: string;
  name: string;
  trigger_type: string;
  action_type: string;
  is_active: boolean;
  trigger_config: any;
  action_config: any;
  trigger_count: number;
  execution_count: number;
}

const TRIGGER_TYPES = [
  { value: 'cart_add', label: 'Ajout au panier', icon: ShoppingCart },
  { value: 'purchase', label: 'Après achat', icon: Package },
  { value: 'cart_threshold', label: 'Seuil panier atteint', icon: Target },
  { value: 'product_view', label: 'Vue produit', icon: Sparkles },
];

const ACTION_TYPES = [
  { value: 'upsell', label: 'Upsell (version premium)' },
  { value: 'cross_sell', label: 'Cross-sell (complémentaire)' },
  { value: 'bundle', label: 'Bundle (offre groupée)' },
  { value: 'discount', label: 'Réduction conditionnelle' },
];

export function UpsellAutomationEngine() {
  const { user } = useAuthOptimized();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    triggerType: 'cart_add',
    actionType: 'upsell',
    discountPercent: '10',
    channel: 'in_app',
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['upsell-rules', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('user_id', user.id)
        .in('action_type', ['upsell', 'cross_sell', 'bundle'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as UpsellRule[];
    },
    enabled: !!user?.id,
  });

  const createRule = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Non authentifié');
      const { error } = await supabase.from('automation_workflows').insert({
        user_id: user.id,
        name: form.name || `Règle ${form.actionType} - ${form.triggerType}`,
        trigger_type: form.triggerType,
        action_type: form.actionType,
        is_active: true,
        trigger_config: { discount: Number(form.discountPercent) },
        action_config: { channel: form.channel },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsell-rules'] });
      toast.success('Règle créée avec succès');
      setShowCreate(false);
      setForm({ name: '', triggerType: 'cart_add', actionType: 'upsell', discountPercent: '10', channel: 'in_app' });
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('automation_workflows')
        .update({ is_active: active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsell-rules'] });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automation_workflows')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsell-rules'] });
      toast.success('Règle supprimée');
    },
  });

  const activeCount = rules.filter(r => r.is_active).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Règles totales', value: rules.length },
          { label: 'Actives', value: activeCount, color: 'text-success' },
          { label: 'Déclenchements', value: rules.reduce((s, r) => s + (r.trigger_count || 0), 0) },
          { label: 'Exécutions', value: rules.reduce((s, r) => s + (r.execution_count || 0), 0) },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-xl font-bold ${s.color || 'text-foreground'}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Règles d'automatisation</h3>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle règle
        </Button>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucune règle configurée</p>
            <p className="text-sm mt-1">Créez des règles pour automatiser vos upsells et cross-sells</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une règle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const trigger = TRIGGER_TYPES.find(t => t.value === rule.trigger_type);
            const TriggerIcon = trigger?.icon || Zap;
            return (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <TriggerIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{rule.name}</span>
                          <Badge variant={rule.is_active ? 'default' : 'secondary'} className="text-[10px]">
                            {rule.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {trigger?.label || rule.trigger_type} → {rule.action_type}
                          {rule.trigger_count ? ` • ${rule.trigger_count} déclenchements` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(v) => toggleRule.mutate({ id: rule.id, active: v })}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteRule.mutate(rule.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle règle d'automatisation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la règle</Label>
              <Input
                placeholder="Ex: Upsell après ajout panier"
                value={form.name}
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Déclencheur</Label>
              <Select value={form.triggerType} onValueChange={(v) => setForm(p => ({ ...p, triggerType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type d'action</Label>
              <Select value={form.actionType} onValueChange={(v) => setForm(p => ({ ...p, actionType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Canal</Label>
              <Select value={form.channel} onValueChange={(v) => setForm(p => ({ ...p, channel: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_app">In-app (popup/banner)</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="push">Notification push</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Réduction offerte (%)</Label>
              <Input
                type="number"
                value={form.discountPercent}
                onChange={(e) => setForm(p => ({ ...p, discountPercent: e.target.value }))}
                min={0}
                max={50}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button onClick={() => createRule.mutate()} disabled={createRule.isPending}>
              <Zap className="h-4 w-4 mr-2" />
              Créer la règle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
