/**
 * Bulk Pricing Optimizer — Mass editing, simulation & scheduling
 */
import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Play, Clock, Search, AlertTriangle, CheckCircle2,
  Loader2, TrendingUp, TrendingDown, DollarSign, Percent,
  Calendar, ArrowRight, Undo2, Eye
} from 'lucide-react';

interface SimulationResult {
  product_id: string;
  title: string;
  current_price: number;
  new_price: number;
  current_margin: number;
  new_margin: number;
  price_change_pct: number;
  margin_impact: number;
}

export function BulkPricingOptimizer() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [adjustType, setAdjustType] = useState<'percent' | 'fixed'>('percent');
  const [adjustValue, setAdjustValue] = useState(5);
  const [adjustDirection, setAdjustDirection] = useState<'increase' | 'decrease'>('increase');
  const [minMarginGuard, setMinMarginGuard] = useState(10);
  const [roundingStrategy, setRoundingStrategy] = useState<'none' | 'nearest_99' | 'nearest_95'>('nearest_99');
  const [simulationResults, setSimulationResults] = useState<SimulationResult[] | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('02:00');

  const { data, isLoading } = useQuery({
    queryKey: ['bulk-pricing-products'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { products: [], categories: [] };

      const { data: products } = await supabase.from('products')
        .select('id, title, price, cost_price, stock_quantity, category, status')
        .eq('user_id', user.id)
        .not('price', 'is', null)
        .order('title');

      const list = products || [];
      const cats = new Set<string>();
      list.forEach((p: any) => cats.add(p.category || 'Non catégorisé'));

      return { products: list, categories: Array.from(cats).sort() };
    },
  });

  const filtered = useMemo(() => {
    let list = data?.products || [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p: any) => (p.title || '').toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') {
      list = list.filter((p: any) => (p.category || 'Non catégorisé') === categoryFilter);
    }
    return list;
  }, [data?.products, search, categoryFilter]);

  const toggleAll = useCallback(() => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p: any) => p.id)));
    }
  }, [filtered, selectedIds.size]);

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const applyRounding = (price: number): number => {
    if (roundingStrategy === 'nearest_99') {
      return Math.floor(price) + 0.99;
    } else if (roundingStrategy === 'nearest_95') {
      return Math.floor(price) + 0.95;
    }
    return Math.round(price * 100) / 100;
  };

  const simulate = () => {
    const products = data?.products || [];
    const results: SimulationResult[] = [];

    selectedIds.forEach(id => {
      const p = products.find((pr: any) => pr.id === id);
      if (!p) return;

      const currentPrice = p.price || 0;
      const costPrice = p.cost_price || 0;
      let delta = adjustType === 'percent'
        ? currentPrice * (adjustValue / 100)
        : adjustValue;

      if (adjustDirection === 'decrease') delta = -delta;
      let newPrice = applyRounding(currentPrice + delta);

      // Margin guard
      if (costPrice > 0) {
        const minPrice = costPrice * (1 + minMarginGuard / 100);
        if (newPrice < minPrice) {
          newPrice = applyRounding(minPrice);
        }
      }

      const currentMargin = costPrice > 0 ? ((currentPrice - costPrice) / currentPrice) * 100 : 0;
      const newMargin = costPrice > 0 ? ((newPrice - costPrice) / newPrice) * 100 : 0;

      results.push({
        product_id: id,
        title: p.title || 'Sans titre',
        current_price: currentPrice,
        new_price: newPrice,
        current_margin: currentMargin,
        new_margin: newMargin,
        price_change_pct: currentPrice > 0 ? ((newPrice - currentPrice) / currentPrice) * 100 : 0,
        margin_impact: newMargin - currentMargin,
      });
    });

    setSimulationResults(results);
    toast.success(`Simulation: ${results.length} produits analysés`);
  };

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!simulationResults?.length) throw new Error('Pas de simulation');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // If scheduled, save to a scheduling table
      if (isScheduled && scheduleDate) {
        await supabase.from('ai_optimization_jobs').insert({
          user_id: user.id,
          job_type: 'pricing',
          status: 'pending',
          target_type: 'bulk_pricing',
          input_data: {
            adjustments: simulationResults.map(r => ({
              product_id: r.product_id,
              new_price: r.new_price,
            })),
            scheduled_at: `${scheduleDate}T${scheduleTime}:00`,
            adjust_config: { adjustType, adjustValue, adjustDirection, minMarginGuard, roundingStrategy },
          },
          priority: 5,
        } as any);
        return { scheduled: true, count: simulationResults.length };
      }

      // Apply immediately
      for (const r of simulationResults) {
        await supabase.from('products')
          .update({ price: r.new_price })
          .eq('id', r.product_id)
          .eq('user_id', user.id);

        // Log price change
        await (supabase.from('price_change_history') as any).insert({
          user_id: user.id,
          product_id: r.product_id,
          old_price: r.current_price,
          new_price: r.new_price,
          change_percent: r.price_change_pct,
          change_type: 'bulk_optimization',
          source: 'bulk_optimizer',
        });
      }

      return { scheduled: false, count: simulationResults.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['bulk-pricing-products'] });
      queryClient.invalidateQueries({ queryKey: ['price-change-history'] });
      if (result.scheduled) {
        toast.success(`${result.count} ajustements programmés pour le ${scheduleDate} à ${scheduleTime}`);
      } else {
        toast.success(`${result.count} prix mis à jour avec succès`);
      }
      setSimulationResults(null);
      setSelectedIds(new Set());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const simSummary = useMemo(() => {
    if (!simulationResults?.length) return null;
    const avgChange = simulationResults.reduce((s, r) => s + r.price_change_pct, 0) / simulationResults.length;
    const avgMarginImpact = simulationResults.reduce((s, r) => s + r.margin_impact, 0) / simulationResults.length;
    const guardsTriggered = simulationResults.filter(r => {
      const p = data?.products?.find((pr: any) => pr.id === r.product_id);
      if (!p?.cost_price) return false;
      const minPrice = p.cost_price * (1 + minMarginGuard / 100);
      return r.new_price <= minPrice + 0.02;
    }).length;

    return { avgChange, avgMarginImpact, guardsTriggered, count: simulationResults.length };
  }, [simulationResults, data?.products, minMarginGuard]);

  return (
    <div className="space-y-6">
      {/* Config panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Ajustement en masse
            </CardTitle>
            <CardDescription>Configurez et simulez avant d'appliquer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Direction</Label>
                <Select value={adjustDirection} onValueChange={(v: any) => setAdjustDirection(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increase">↑ Augmenter</SelectItem>
                    <SelectItem value="decrease">↓ Diminuer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Type</Label>
                <Select value={adjustType} onValueChange={(v: any) => setAdjustType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Pourcentage (%)</SelectItem>
                    <SelectItem value="fixed">Montant fixe (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Valeur: {adjustValue}{adjustType === 'percent' ? '%' : '€'}</Label>
                <Slider
                  value={[adjustValue]}
                  onValueChange={([v]) => setAdjustValue(v)}
                  min={1}
                  max={adjustType === 'percent' ? 50 : 100}
                  step={adjustType === 'percent' ? 0.5 : 1}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Arrondi</Label>
                <Select value={roundingStrategy} onValueChange={(v: any) => setRoundingStrategy(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    <SelectItem value="nearest_99">x.99€</SelectItem>
                    <SelectItem value="nearest_95">x.95€</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">Marge min. garde-fou:</Label>
                <Input
                  type="number"
                  value={minMarginGuard}
                  onChange={e => setMinMarginGuard(Number(e.target.value))}
                  className="w-20 h-8"
                  min={0}
                  max={100}
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scheduling */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Planification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch checked={isScheduled} onCheckedChange={setIsScheduled} />
              <Label className="text-sm">Programmer</Label>
            </div>
            {isScheduled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Heure</Label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="h-8"
                  />
                </div>
              </motion.div>
            )}
            {!isScheduled && (
              <p className="text-xs text-muted-foreground">Application immédiate après simulation</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-sm">
              Sélection ({selectedIds.size}/{filtered.length} produits)
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 h-8 w-48"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Catégorie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {(data?.categories || []).map((c: string) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[350px]">
            <div className="space-y-0.5">
              {/* Select all */}
              <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 rounded-md mb-1">
                <Checkbox
                  checked={selectedIds.size === filtered.length && filtered.length > 0}
                  onCheckedChange={toggleAll}
                />
                <span className="text-xs font-medium text-muted-foreground">
                  Tout sélectionner ({filtered.length})
                </span>
              </div>
              {isLoading ? (
                <div className="py-6 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Chargement...
                </div>
              ) : (
                filtered.map((p: any) => {
                  const margin = p.cost_price && p.price ? ((p.price - p.cost_price) / p.price * 100) : null;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/30 transition-colors"
                    >
                      <Checkbox
                        checked={selectedIds.has(p.id)}
                        onCheckedChange={() => toggleOne(p.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm truncate block">{p.title}</span>
                      </div>
                      <span className="text-sm font-medium">{p.price?.toFixed(2)}€</span>
                      {margin !== null && (
                        <Badge variant="outline" className={`text-xs ${margin >= 20 ? 'text-success' : margin >= 0 ? 'text-warning' : 'text-destructive'}`}>
                          {margin.toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={simulate}
          disabled={selectedIds.size === 0}
          variant="outline"
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          Simuler ({selectedIds.size})
        </Button>
        {simulationResults && (
          <>
            <Button
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending}
              className="gap-2"
            >
              {applyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isScheduled ? 'Programmer' : 'Appliquer'} ({simulationResults.length})
            </Button>
            <Button variant="ghost" onClick={() => setSimulationResults(null)} className="gap-2">
              <Undo2 className="h-4 w-4" />
              Annuler
            </Button>
          </>
        )}
      </div>

      {/* Simulation results */}
      <AnimatePresence>
        {simulationResults && simSummary && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <Card className="border-primary/20">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Produits</p>
                  <p className="text-lg font-bold">{simSummary.count}</p>
                </CardContent>
              </Card>
              <Card className={simSummary.avgChange >= 0 ? 'border-success/20' : 'border-destructive/20'}>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Δ Prix moyen</p>
                  <p className={`text-lg font-bold ${simSummary.avgChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {simSummary.avgChange >= 0 ? '+' : ''}{simSummary.avgChange.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
              <Card className={simSummary.avgMarginImpact >= 0 ? 'border-success/20' : 'border-warning/20'}>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Impact marge</p>
                  <p className={`text-lg font-bold ${simSummary.avgMarginImpact >= 0 ? 'text-success' : 'text-warning'}`}>
                    {simSummary.avgMarginImpact >= 0 ? '+' : ''}{simSummary.avgMarginImpact.toFixed(1)}pp
                  </p>
                </CardContent>
              </Card>
              <Card className={simSummary.guardsTriggered > 0 ? 'border-warning/20' : 'border-muted'}>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Garde-fous</p>
                  <p className="text-lg font-bold">{simSummary.guardsTriggered}</p>
                </CardContent>
              </Card>
            </div>

            {/* Details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Prévisualisation des ajustements</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-1">
                    <div className="grid grid-cols-7 gap-2 text-xs font-medium text-muted-foreground px-3 py-2 border-b">
                      <span className="col-span-2">Produit</span>
                      <span className="text-right">Actuel</span>
                      <span className="text-center">→</span>
                      <span className="text-right">Nouveau</span>
                      <span className="text-right">Δ Marge</span>
                      <span className="text-right">Δ Prix</span>
                    </div>
                    {simulationResults.map((r, i) => (
                      <motion.div
                        key={r.product_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.02, 0.5) }}
                        className="grid grid-cols-7 gap-2 items-center px-3 py-2 rounded-md hover:bg-muted/30 text-sm"
                      >
                        <span className="col-span-2 truncate">{r.title}</span>
                        <span className="text-right text-muted-foreground">{r.current_price.toFixed(2)}€</span>
                        <span className="text-center"><ArrowRight className="h-3 w-3 mx-auto text-muted-foreground" /></span>
                        <span className="text-right font-medium">{r.new_price.toFixed(2)}€</span>
                        <span className={`text-right text-xs ${r.margin_impact >= 0 ? 'text-success' : 'text-warning'}`}>
                          {r.margin_impact >= 0 ? '+' : ''}{r.margin_impact.toFixed(1)}pp
                        </span>
                        <span className={`text-right text-xs ${r.price_change_pct >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {r.price_change_pct >= 0 ? '+' : ''}{r.price_change_pct.toFixed(1)}%
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
