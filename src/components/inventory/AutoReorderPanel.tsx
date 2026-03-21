/**
 * AutoReorderPanel — Smart auto-reorder management
 * Manages reorder rules, triggers, and order queue
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Plus, Zap, AlertTriangle, CheckCircle, Clock,
  Package, Loader2, RefreshCw, Trash2, Settings, TrendingDown
} from 'lucide-react';

export function AutoReorderPanel() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    min_stock_trigger: 5,
    reorder_quantity: 50,
    max_price: 0,
    supplier_type: 'bigbuy',
    preferred_shipping: 'standard',
  });

  // Fetch auto-order rules
  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['auto-order-rules', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('auto_order_rules')
        .select('*, products(title, sku, stock_quantity, price), suppliers(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch order queue
  const { data: queue = [] } = useQuery({
    queryKey: ['auto-order-queue', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('auto_order_queue')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Toggle rule
  const toggleRule = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('auto_order_rules')
        .update({ is_active: active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-order-rules'] });
      toast.success('Règle mise à jour');
    },
  });

  // Delete rule
  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('auto_order_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-order-rules'] });
      toast.success('Règle supprimée');
    },
  });

  // Create rule
  const createRule = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Non authentifié');
      const { error } = await supabase.from('auto_order_rules').insert({
        user_id: user.id,
        min_stock_trigger: formData.min_stock_trigger,
        reorder_quantity: formData.reorder_quantity,
        max_price: formData.max_price || null,
        supplier_type: formData.supplier_type,
        preferred_shipping: formData.preferred_shipping,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-order-rules'] });
      setCreateOpen(false);
      toast.success('Règle de réapprovisionnement créée');
    },
  });

  const activeRules = rules.filter((r: any) => r.is_active);
  const pendingOrders = queue.filter((q: any) => q.status === 'pending' || q.status === 'processing');
  const statusIcons: Record<string, React.ElementType> = {
    pending: Clock,
    processing: Loader2,
    completed: CheckCircle,
    failed: AlertTriangle,
  };
  const statusColors: Record<string, string> = {
    pending: 'text-warning',
    processing: 'text-primary',
    completed: 'text-success',
    failed: 'text-destructive',
  };

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xl font-bold">{rules.length}</p>
                <p className="text-xs text-muted-foreground">Règles total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-success" />
              <div>
                <p className="text-xl font-bold">{activeRules.length}</p>
                <p className="text-xs text-muted-foreground">Actives</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-warning" />
              <div>
                <p className="text-xl font-bold">{pendingOrders.length}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-xl font-bold">
                  {rules.reduce((s: number, r: any) => s + (r.trigger_count || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Déclenchements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Règles de Réapprovisionnement</CardTitle>
              <CardDescription>Automatisez les commandes quand le stock atteint un seuil</CardDescription>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Nouvelle règle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rulesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucune règle configurée</p>
              <p className="text-xs">Créez une règle pour automatiser le réapprovisionnement</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {rules.map((rule: any, i: number) => (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center justify-between p-3 rounded-lg border ${rule.is_active ? '' : 'opacity-50'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-2 w-2 rounded-full ${rule.is_active ? 'bg-success' : 'bg-muted-foreground'}`} />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {(rule.products as any)?.title || 'Tous les produits'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Seuil: {rule.min_stock_trigger}</span>
                          <span>·</span>
                          <span>Qté: {rule.reorder_quantity}</span>
                          <span>·</span>
                          <span>{rule.supplier_type}</span>
                          {rule.trigger_count > 0 && (
                            <>
                              <span>·</span>
                              <span>{rule.trigger_count} déclenchements</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(v) => toggleRule.mutate({ id: rule.id, active: v })}
                      />
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => { if (confirm('Supprimer cette règle ?')) deleteRule.mutate(rule.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Queue */}
      {queue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">File de commandes automatiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {queue.slice(0, 10).map((item: any) => {
                const StatusIcon = statusIcons[item.status] || Clock;
                return (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-4 w-4 ${statusColors[item.status] || ''} ${item.status === 'processing' ? 'animate-spin' : ''}`} />
                      <span className="font-medium">{item.order_id?.substring(0, 8)}...</span>
                      <Badge variant="outline" className="text-xs">{item.supplier_type}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.tracking_number && (
                        <span className="text-xs text-muted-foreground">{item.tracking_number}</span>
                      )}
                      <Badge variant={item.status === 'completed' ? 'default' : 'secondary'} className="text-xs capitalize">
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Rule Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle règle de réapprovisionnement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Seuil de stock minimum</Label>
                <Input
                  type="number" min={1}
                  value={formData.min_stock_trigger}
                  onChange={e => setFormData(p => ({ ...p, min_stock_trigger: parseInt(e.target.value) || 1 }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Quantité à commander</Label>
                <Input
                  type="number" min={1}
                  value={formData.reorder_quantity}
                  onChange={e => setFormData(p => ({ ...p, reorder_quantity: parseInt(e.target.value) || 1 }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fournisseur</Label>
                <Select value={formData.supplier_type} onValueChange={v => setFormData(p => ({ ...p, supplier_type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bigbuy">BigBuy</SelectItem>
                    <SelectItem value="aliexpress">AliExpress</SelectItem>
                    <SelectItem value="temu">Temu</SelectItem>
                    <SelectItem value="1688">1688</SelectItem>
                    <SelectItem value="printify">Printify</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prix maximum (€)</Label>
                <Input
                  type="number" min={0} step={0.01}
                  value={formData.max_price}
                  onChange={e => setFormData(p => ({ ...p, max_price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0 = sans limite"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Mode d'expédition préféré</Label>
              <Select value={formData.preferred_shipping} onValueChange={v => setFormData(p => ({ ...p, preferred_shipping: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="express">Express</SelectItem>
                  <SelectItem value="economy">Économique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button onClick={() => createRule.mutate()} disabled={createRule.isPending}>
              {createRule.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Créer la règle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
