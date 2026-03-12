import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, GitBranch, Zap, ArrowRight } from 'lucide-react';
import { useShippingRules, useCreateShippingRule, useToggleShippingRule, useDeleteShippingRule, useShippingZones } from '@/hooks/useShippingZones';
import { useCarriers } from '@/hooks/useFulfillment';
import { Skeleton } from '@/components/ui/skeleton';

const CONDITION_TYPES = [
  { value: 'weight_above', label: 'Poids supérieur à (kg)' },
  { value: 'weight_below', label: 'Poids inférieur à (kg)' },
  { value: 'total_above', label: 'Montant supérieur à (€)' },
  { value: 'total_below', label: 'Montant inférieur à (€)' },
  { value: 'country_in', label: 'Pays dans la liste' },
  { value: 'category_is', label: 'Catégorie produit' },
];

const ACTION_TYPES = [
  { value: 'assign_carrier', label: 'Assigner un transporteur' },
  { value: 'assign_zone', label: 'Forcer une zone' },
  { value: 'free_shipping', label: 'Livraison gratuite' },
  { value: 'add_insurance', label: 'Ajouter assurance' },
];

export function ShippingRulesTab() {
  const { data: rules = [], isLoading } = useShippingRules();
  const { data: zones = [] } = useShippingZones();
  const { data: carriers = [] } = useCarriers();
  const createRule = useCreateShippingRule();
  const toggleRule = useToggleShippingRule();
  const deleteRule = useDeleteShippingRule();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', priority: '0', condition_type: '', condition_value: '', action_type: 'assign_carrier', action_value: '',
  });

  const handleCreate = () => {
    createRule.mutate({
      name: form.name,
      priority: parseInt(form.priority) || 0,
      conditions: { type: form.condition_type, value: form.condition_value },
      action_type: form.action_type,
      action_config: { value: form.action_value },
      is_active: true,
    }, {
      onSuccess: () => { setIsOpen(false); setForm({ name: '', priority: '0', condition_type: '', condition_value: '', action_type: 'assign_carrier', action_value: '' }); },
    });
  };

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Règles d'expédition</h3>
          <p className="text-sm text-muted-foreground">Automatisez le choix du transporteur selon des conditions</p>
        </div>
        <Button onClick={() => setIsOpen(true)}><Plus className="h-4 w-4 mr-2" />Nouvelle règle</Button>
      </div>

      {rules.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center py-12 text-center">
          <GitBranch className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h4 className="font-semibold mb-2">Aucune règle configurée</h4>
          <p className="text-sm text-muted-foreground mb-4">Les règles automatisent le choix du transporteur selon le poids, le montant ou la destination</p>
          <Button onClick={() => setIsOpen(true)}><Plus className="h-4 w-4 mr-2" />Créer une règle</Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, idx) => (
            <Card key={rule.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.name}</span>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Badge variant="outline" className="text-xs">
                        {CONDITION_TYPES.find(c => c.value === (rule.conditions as any)?.type)?.label || (rule.conditions as any)?.type}
                      </Badge>
                      <span>{(rule.conditions as any)?.value}</span>
                      <ArrowRight className="h-3 w-3" />
                      <Badge variant="outline" className="text-xs">
                        {ACTION_TYPES.find(a => a.value === rule.action_type)?.label || rule.action_type}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {rule.trigger_count > 0 && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" />{rule.trigger_count}x</span>
                  )}
                  <Switch checked={rule.is_active} onCheckedChange={v => toggleRule.mutate({ id: rule.id, is_active: v })} />
                  <Button variant="ghost" size="icon" onClick={() => deleteRule.mutate(rule.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle règle d'expédition</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nom</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Colis lourd → DHL" /></div>
              <div><Label>Priorité</Label><Input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Condition</Label>
                <Select value={form.condition_type} onValueChange={v => setForm(f => ({ ...f, condition_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>{CONDITION_TYPES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Valeur</Label><Input value={form.condition_value} onChange={e => setForm(f => ({ ...f, condition_value: e.target.value }))} placeholder="Ex: 30" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Action</Label>
                <Select value={form.action_type} onValueChange={v => setForm(f => ({ ...f, action_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ACTION_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Cible</Label>
                {form.action_type === 'assign_carrier' ? (
                  <Select value={form.action_value} onValueChange={v => setForm(f => ({ ...f, action_value: v }))}>
                    <SelectTrigger><SelectValue placeholder="Transporteur" /></SelectTrigger>
                    <SelectContent>{(carriers as any[]).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                ) : form.action_type === 'assign_zone' ? (
                  <Select value={form.action_value} onValueChange={v => setForm(f => ({ ...f, action_value: v }))}>
                    <SelectTrigger><SelectValue placeholder="Zone" /></SelectTrigger>
                    <SelectContent>{zones.map(z => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <Input value={form.action_value} onChange={e => setForm(f => ({ ...f, action_value: e.target.value }))} placeholder="Valeur" />
                )}
              </div>
            </div>
            <Button onClick={handleCreate} disabled={!form.name || !form.condition_type} className="w-full">Créer la règle</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
