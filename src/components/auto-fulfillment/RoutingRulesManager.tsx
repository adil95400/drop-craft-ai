import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Route, Plus, ArrowRight, ArrowDown, Trash2, GripVertical, Warehouse, Globe, Package, Zap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RoutingRule {
  id: string;
  name: string;
  conditions: {
    type: 'country' | 'category' | 'supplier' | 'price' | 'weight';
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: string;
  }[];
  primary_supplier: string;
  fallback_supplier: string | null;
  warehouse: string | null;
  is_active: boolean;
  priority: number;
}

const SUPPLIER_OPTIONS = [
  { value: 'cj-dropshipping', label: 'CJ Dropshipping' },
  { value: 'bigbuy', label: 'BigBuy' },
  { value: 'aliexpress', label: 'AliExpress' },
  { value: 'printful', label: 'Printful' },
  { value: 'manual', label: 'Traitement manuel' },
];

const WAREHOUSE_OPTIONS = [
  { value: 'us', label: '🇺🇸 États-Unis' },
  { value: 'eu', label: '🇪🇺 Europe' },
  { value: 'cn', label: '🇨🇳 Chine' },
  { value: 'uk', label: '🇬🇧 Royaume-Uni' },
];

export function RoutingRulesManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    conditionType: 'country' as string,
    conditionValue: '',
    primarySupplier: 'cj-dropshipping',
    fallbackSupplier: '',
    warehouse: '',
  });
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['routing-rules'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await (supabase
        .from('supplier_fallback_rules') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });
      return (data || []) as RoutingRule[];
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      await (supabase.from('supplier_fallback_rules') as any).insert({
        user_id: user.id,
        name: newRule.name || `Règle ${rules.length + 1}`,
        conditions: [{ type: newRule.conditionType, operator: 'equals', value: newRule.conditionValue }],
        primary_supplier: newRule.primarySupplier,
        fallback_supplier: newRule.fallbackSupplier || null,
        warehouse: newRule.warehouse || null,
        is_active: true,
        priority: rules.length + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routing-rules'] });
      toast.success('Règle de routage créée');
      setIsDialogOpen(false);
      setNewRule({ name: '', conditionType: 'country', conditionValue: '', primarySupplier: 'cj-dropshipping', fallbackSupplier: '', warehouse: '' });
    },
    onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await (supabase.from('supplier_fallback_rules') as any)
        .update({ is_active: active })
        .eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routing-rules'] }),
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      await (supabase.from('supplier_fallback_rules') as any).delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routing-rules'] });
      toast.success('Règle supprimée');
    },
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base md:text-lg">Règles de Routing</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Routez automatiquement les commandes selon le pays, la catégorie ou le fournisseur
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full xs:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden xs:inline">Nouvelle </span>Règle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvelle règle de routage</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nom de la règle</Label>
                    <Input
                      placeholder="Ex: Commandes EU → BigBuy"
                      value={newRule.name}
                      onChange={e => setNewRule(r => ({ ...r, name: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Condition</Label>
                      <Select value={newRule.conditionType} onValueChange={v => setNewRule(r => ({ ...r, conditionType: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="country">Pays</SelectItem>
                          <SelectItem value="category">Catégorie</SelectItem>
                          <SelectItem value="supplier">Fournisseur</SelectItem>
                          <SelectItem value="price">Prix &gt;</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Valeur</Label>
                      <Input
                        placeholder={newRule.conditionType === 'country' ? 'FR, DE, ES...' : 'Valeur'}
                        value={newRule.conditionValue}
                        onChange={e => setNewRule(r => ({ ...r, conditionValue: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Fournisseur principal</Label>
                    <Select value={newRule.primarySupplier} onValueChange={v => setNewRule(r => ({ ...r, primarySupplier: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SUPPLIER_OPTIONS.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Fournisseur de secours (optionnel)</Label>
                    <Select value={newRule.fallbackSupplier} onValueChange={v => setNewRule(r => ({ ...r, fallbackSupplier: v }))}>
                      <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Aucun</SelectItem>
                        {SUPPLIER_OPTIONS.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Entrepôt préféré</Label>
                    <Select value={newRule.warehouse} onValueChange={v => setNewRule(r => ({ ...r, warehouse: v }))}>
                      <SelectTrigger><SelectValue placeholder="Auto (le plus proche)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Auto (le plus proche)</SelectItem>
                        {WAREHOUSE_OPTIONS.map(w => (
                          <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                  <Button onClick={() => createRuleMutation.mutate()} disabled={createRuleMutation.isPending}>
                    {createRuleMutation.isPending ? 'Création...' : 'Créer la règle'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : rules.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <Route className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-base md:text-lg font-medium">Aucune règle configurée</p>
              <p className="text-xs md:text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                Créez des règles pour router automatiquement les commandes vers les bons fournisseurs et entrepôts
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule: any) => (
                <div key={rule.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{rule.name || 'Règle sans nom'}</span>
                      {rule.is_active ? (
                        <Badge variant="default" className="text-[10px]">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {rule.conditions?.map((c: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-[10px]">
                          {c.type}: {c.value}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="text-[10px]">
                        <Package className="h-3 w-3 mr-1" />
                        {SUPPLIER_OPTIONS.find(s => s.value === rule.primary_supplier)?.label || rule.primary_supplier}
                      </Badge>
                      {rule.fallback_supplier && (
                        <Badge variant="outline" className="text-[10px]">
                          ↪ {SUPPLIER_OPTIONS.find(s => s.value === rule.fallback_supplier)?.label}
                        </Badge>
                      )}
                      {rule.warehouse && (
                        <Badge variant="outline" className="text-[10px]">
                          <Warehouse className="h-3 w-3 mr-1" />
                          {WAREHOUSE_OPTIONS.find(w => w.value === rule.warehouse)?.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={(checked) => toggleRuleMutation.mutate({ id: rule.id, active: checked })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => deleteRuleMutation.mutate(rule.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supported Suppliers */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Fournisseurs supportés</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Auto-commande directe via API
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'CJ Dropshipping', icon: '📦', status: 'API directe' },
              { name: 'BigBuy', icon: '🇪🇺', status: 'API directe' },
              { name: 'AliExpress', icon: '🛒', status: 'API directe' },
              { name: 'Printful', icon: '👕', status: 'API directe' },
            ].map(s => (
              <div key={s.name} className="p-3 border rounded-lg text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-sm font-medium">{s.name}</div>
                <Badge variant="outline" className="mt-1 text-[10px]">
                  <Zap className="h-3 w-3 mr-1" />
                  {s.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Pipeline de fulfillment</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 space-y-3 md:space-y-4">
          {[
            { step: 1, title: 'Commande reçue', desc: 'Shopify → ShopOpti en temps réel' },
            { step: 2, title: 'Routing intelligent', desc: 'Règles de routage → fournisseur + entrepôt optimal' },
            { step: 3, title: 'Auto-commande', desc: 'Commande fournisseur via API (CJ, BigBuy, AliExpress, Printful)' },
            { step: 4, title: 'Tracking sync', desc: 'Numéro de suivi → Shopify → notification client' },
          ].map((s, i) => (
            <div key={s.step}>
              <div className="flex items-start gap-3 md:gap-4">
                <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm md:text-base shrink-0">
                  {s.step}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm md:text-base mb-1">{s.title}</h4>
                  <p className="text-xs md:text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
              {i < 3 && (
                <div className="flex items-center justify-center pl-4 md:pl-5 py-1">
                  <ArrowDown className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
