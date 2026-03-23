/**
 * Automated Returns Workflow
 * Client request → Validation → Supplier return → Stock update → Refund
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  RotateCcw, Package, CheckCircle2, XCircle, Clock, AlertTriangle,
  Loader2, ArrowRight, DollarSign, Truck, Plus, Search, Settings
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  requested: { label: 'Demandé', color: 'text-warning', icon: Clock },
  approved: { label: 'Approuvé', color: 'text-info', icon: CheckCircle2 },
  shipped_back: { label: 'Retourné', color: 'text-primary', icon: Truck },
  received: { label: 'Reçu', color: 'text-chart-2', icon: Package },
  refunded: { label: 'Remboursé', color: 'text-success', icon: DollarSign },
  exchanged: { label: 'Échangé', color: 'text-violet-500', icon: RotateCcw },
  rejected: { label: 'Rejeté', color: 'text-destructive', icon: XCircle },
};

const STEPS = ['requested', 'approved', 'shipped_back', 'received', 'refunded'];

interface AutoReturnRule {
  id: string;
  reason: string;
  action: 'auto_refund' | 'auto_exchange' | 'manual_review';
  max_value: number;
  enabled: boolean;
}

export function AutomatedReturnsWorkflow() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateReturn, setShowCreateReturn] = useState(false);
  const [newReturn, setNewReturn] = useState({ order_id: '', reason: '', items: '' });

  // Auto-return rules
  const [autoRules, setAutoRules] = useState<AutoReturnRule[]>([
    { id: '1', reason: 'defective', action: 'auto_refund', max_value: 50, enabled: true },
    { id: '2', reason: 'wrong_item', action: 'auto_exchange', max_value: 100, enabled: true },
    { id: '3', reason: 'not_as_described', action: 'manual_review', max_value: 0, enabled: true },
    { id: '4', reason: 'changed_mind', action: 'manual_review', max_value: 0, enabled: false },
  ]);

  // Fetch returns
  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['automated-returns'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase.from('returns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      return data || [];
    },
  });

  const filtered = useMemo(() => {
    let list = returns;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r: any) => 
        (r.rma_number || '').toLowerCase().includes(q) ||
        (r.order_id || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter((r: any) => r.status === statusFilter);
    }
    return list;
  }, [returns, search, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = returns.length;
    const pending = returns.filter((r: any) => ['requested', 'approved'].includes(r.status)).length;
    const resolved = returns.filter((r: any) => ['refunded', 'exchanged'].includes(r.status)).length;
    const avgResolutionDays = resolved > 0
      ? returns.filter((r: any) => r.resolved_at).reduce((sum: number, r: any) => {
          const created = new Date(r.created_at).getTime();
          const resolved = new Date(r.resolved_at).getTime();
          return sum + (resolved - created) / 86400000;
        }, 0) / resolved
      : 0;
    const totalRefunded = returns
      .filter((r: any) => r.status === 'refunded')
      .reduce((sum: number, r: any) => sum + (r.refund_amount || 0), 0);

    return { total, pending, resolved, avgResolutionDays, totalRefunded };
  }, [returns]);

  // Update return status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status, updates }: { id: string; status: string; updates?: Record<string, any> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const updateData: any = { status, ...updates };

      // If refunded, set resolved_at
      if (['refunded', 'exchanged', 'rejected'].includes(status)) {
        updateData.resolved_at = new Date().toISOString();
      }

      // If approved, update product stock if needed
      if (status === 'received') {
        // Get return details to update stock
        const { data: returnData } = await supabase.from('returns')
          .select('product_id, quantity')
          .eq('id', id)
          .single();

        if (returnData?.product_id) {
          const { data: product } = await supabase.from('products')
            .select('stock_quantity')
            .eq('id', returnData.product_id)
            .single();

          if (product) {
            await supabase.from('products')
              .update({ stock_quantity: (product.stock_quantity || 0) + (returnData.quantity || 1) })
              .eq('id', returnData.product_id);
          }
        }
      }

      const { error } = await supabase.from('returns')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Log
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'return_action',
        entity_type: 'return',
        entity_id: id,
        description: `Return ${id} updated to ${status}`,
        source: 'returns_workflow',
        severity: 'info',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automated-returns'] });
      toast.success('Statut retour mis à jour');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Create new return
  const createReturn = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error } = await supabase.from('returns').insert({
        user_id: user.id,
        order_id: newReturn.order_id,
        reason: newReturn.reason,
        status: 'requested',
        items: [{ description: newReturn.items }],
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automated-returns'] });
      setShowCreateReturn(false);
      setNewReturn({ order_id: '', reason: '', items: '' });
      toast.success('Demande de retour créée');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const getNextStatus = (current: string): string | null => {
    const idx = STEPS.indexOf(current);
    return idx >= 0 && idx < STEPS.length - 1 ? STEPS[idx + 1] : null;
  };

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total retours', value: stats.total, icon: RotateCcw, color: 'text-primary' },
          { label: 'En cours', value: stats.pending, icon: Clock, color: 'text-warning' },
          { label: 'Résolus', value: stats.resolved, icon: CheckCircle2, color: 'text-success' },
          { label: 'Délai moyen', value: `${stats.avgResolutionDays.toFixed(1)}j`, icon: AlertTriangle, color: 'text-chart-2' },
          { label: 'Remboursé', value: `${stats.totalRefunded.toFixed(0)}€`, icon: DollarSign, color: 'text-destructive' },
        ].map((kpi, i) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                {kpi.label}
              </div>
              <p className="text-xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Auto-rules config */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            Règles d'automatisation des retours
          </CardTitle>
          <CardDescription>Actions automatiques selon le motif</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {autoRules.map(rule => {
              const reasonLabels: Record<string, string> = {
                defective: 'Produit défectueux',
                wrong_item: 'Mauvais produit',
                not_as_described: 'Non conforme',
                changed_mind: 'Changement d\'avis',
              };
              const actionLabels: Record<string, string> = {
                auto_refund: '→ Remboursement auto',
                auto_exchange: '→ Échange auto',
                manual_review: '→ Vérification manuelle',
              };
              const actionColors: Record<string, string> = {
                auto_refund: 'text-success',
                auto_exchange: 'text-info',
                manual_review: 'text-warning',
              };

              return (
                <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(v) => {
                        setAutoRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: v } : r));
                      }}
                    />
                    <div>
                      <p className="text-sm font-medium">{reasonLabels[rule.reason] || rule.reason}</p>
                      <p className={`text-xs ${actionColors[rule.action]}`}>
                        {actionLabels[rule.action]}
                        {rule.max_value > 0 && ` (≤ ${rule.max_value}€)`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {rule.enabled ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters + actions */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher RMA ou commande..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={showCreateReturn} onOpenChange={setShowCreateReturn}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Nouveau retour</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une demande de retour</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-sm">ID Commande</Label>
                <Input value={newReturn.order_id} onChange={e => setNewReturn(p => ({ ...p, order_id: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Motif</Label>
                <Select value={newReturn.reason} onValueChange={v => setNewReturn(p => ({ ...p, reason: v }))}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="defective">Produit défectueux</SelectItem>
                    <SelectItem value="wrong_item">Mauvais produit</SelectItem>
                    <SelectItem value="not_as_described">Non conforme</SelectItem>
                    <SelectItem value="changed_mind">Changement d'avis</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Articles</Label>
                <Textarea
                  value={newReturn.items}
                  onChange={e => setNewReturn(p => ({ ...p, items: e.target.value }))}
                  placeholder="Décrivez les articles à retourner..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createReturn.mutate()} disabled={createReturn.isPending}>
                {createReturn.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Returns list */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Chargement...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <RotateCcw className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Aucun retour trouvé</p>
              </div>
            ) : (
              <div className="divide-y">
                {filtered.map((ret: any, i: number) => {
                  const statusConf = STATUS_CONFIG[ret.status] || STATUS_CONFIG.requested;
                  const StatusIcon = statusConf.icon;
                  const nextStatus = getNextStatus(ret.status);
                  const nextConf = nextStatus ? STATUS_CONFIG[nextStatus] : null;

                  // Progress through steps
                  const stepIdx = STEPS.indexOf(ret.status);
                  const progress = stepIdx >= 0 ? ((stepIdx + 1) / STEPS.length) * 100 : 0;

                  return (
                    <motion.div
                      key={ret.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.03, 0.5) }}
                      className="p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <StatusIcon className={`h-5 w-5 mt-0.5 ${statusConf.color}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-medium">{ret.rma_number || '—'}</span>
                              <Badge variant="outline" className={`text-xs ${statusConf.color}`}>
                                {statusConf.label}
                              </Badge>
                              {ret.reason && (
                                <Badge variant="secondary" className="text-xs">{ret.reason}</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Commande: {(ret.order_id || '').substring(0, 12)}...
                              {ret.refund_amount ? ` • Remboursement: ${ret.refund_amount}€` : ''}
                            </p>

                            {/* Progress steps */}
                            <div className="flex items-center gap-1 mt-2">
                              {STEPS.map((step, si) => (
                                <div key={step} className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${si <= stepIdx ? 'bg-primary' : 'bg-muted'}`} />
                                  {si < STEPS.length - 1 && (
                                    <div className={`w-4 h-0.5 ${si < stepIdx ? 'bg-primary' : 'bg-muted'}`} />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {nextStatus && nextConf && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus.mutate({ id: ret.id, status: nextStatus })}
                              disabled={updateStatus.isPending}
                              className="text-xs h-7 gap-1"
                            >
                              <ArrowRight className="h-3 w-3" />
                              {nextConf.label}
                            </Button>
                          )}
                          {ret.status === 'requested' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateStatus.mutate({ id: ret.id, status: 'rejected' })}
                              disabled={updateStatus.isPending}
                              className="text-xs h-7"
                            >
                              <XCircle className="h-3 w-3 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
