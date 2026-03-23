/**
 * Smart Reorder Config — Auto-reorder intelligent basé sur les prévisions
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Zap, Loader2, RefreshCw, Target, Package,
  TrendingUp, CheckCircle2, XCircle, Clock
} from 'lucide-react';

interface ReorderRule {
  id: string;
  product_id: string;
  min_stock_trigger: number;
  reorder_quantity: number;
  max_price: number | null;
  is_active: boolean;
  trigger_count: number;
  last_triggered_at: string | null;
  supplier_type: string;
  products?: { title: string; stock_quantity: number };
  suppliers?: { name: string };
}

export function SmartReorderConfig() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['auto-reorder-rules', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auto_order_rules')
        .select('*, products(title, stock_quantity), suppliers(name)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ReorderRule[];
    },
    enabled: !!user?.id,
  });

  const smartReorder = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('smart-inventory-engine', {
        body: { action: 'auto_reorder_check', userId: user!.id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['auto-reorder-rules'] });
      queryClient.invalidateQueries({ queryKey: ['supply-chain-stats'] });
      const r = data?.results;
      toast.success(`Vérification intelligente: ${r?.checked || 0} règles, ${r?.triggered || 0} commandes basées sur prévisions`);
    },
    onError: (e: Error) => toast.error(`Erreur: ${e.message}`),
  });

  const toggleRule = useMutation({
    mutationFn: async ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('auto_order_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-reorder-rules'] });
      toast.success('Règle mise à jour');
    },
  });

  // Get recent orders from queue
  const { data: recentOrders = [] } = useQuery({
    queryKey: ['recent-auto-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auto_order_queue')
        .select('id, status, payload, created_at, supplier_order_id')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const activeRules = rules.filter(r => r.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Auto-Reorder Intelligent</h3>
          <p className="text-sm text-muted-foreground">
            {activeRules.length} règles actives • Seuils dynamiques basés sur les prévisions
          </p>
        </div>
        <Button
          onClick={() => smartReorder.mutate()}
          disabled={smartReorder.isPending}
          className="gap-2"
        >
          {smartReorder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          Vérification intelligente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Target className="h-3.5 w-3.5 text-primary" />
              Règles actives
            </div>
            <p className="text-2xl font-bold">{activeRules.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Zap className="h-3.5 w-3.5 text-yellow-500" />
              Déclenchements
            </div>
            <p className="text-2xl font-bold">{rules.reduce((s, r) => s + (r.trigger_count || 0), 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              Commandes réussies
            </div>
            <p className="text-2xl font-bold">{recentOrders.filter(o => o.status === 'completed').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Clock className="h-3.5 w-3.5 text-orange-500" />
              En attente
            </div>
            <p className="text-2xl font-bold">{recentOrders.filter(o => o.status === 'pending').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Info card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Auto-reorder basé sur la prévision</p>
              <p className="text-xs text-muted-foreground mt-1">
                Les seuils de réapprovisionnement sont ajustés dynamiquement selon la vélocité des ventes,
                les tendances et la saisonnalité. La quantité commandée est optimisée pour 30 jours de couverture.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aucune règle de réapprovisionnement</p>
            <p className="text-sm text-muted-foreground mt-1">Créez des règles depuis le Fulfillment Hub</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rules.map((rule, i) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className={`transition-all ${!rule.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => toggleRule.mutate({ ruleId: rule.id, isActive: checked })}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {rule.products?.title || rule.product_id?.slice(0, 12)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Seuil: {rule.min_stock_trigger}</span>
                          <span>•</span>
                          <span>Qté: {rule.reorder_quantity}</span>
                          {rule.max_price && (
                            <>
                              <span>•</span>
                              <span>Max: {rule.max_price}€</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">Stock: {rule.products?.stock_quantity ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">
                          {rule.suppliers?.name || rule.supplier_type}
                        </p>
                      </div>
                      <Badge variant={rule.trigger_count > 0 ? 'default' : 'outline'}>
                        {rule.trigger_count || 0}x
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Commandes récentes auto-générées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentOrders.slice(0, 5).map(order => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    {order.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : order.status === 'failed' ? (
                      <XCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="text-sm">{(order.payload as any)?.product_title?.slice(0, 40) || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {(order.payload as any)?.quantity || 0} unités
                    </span>
                    <Badge variant="outline" className="text-xs">{order.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
