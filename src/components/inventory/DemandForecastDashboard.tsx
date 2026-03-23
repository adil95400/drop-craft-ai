/**
 * Demand Forecast Dashboard — Prévisions de demande par produit
 * Affiche les noms de produits, saisonnalité mensuelle, impact promotionnel
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Package,
  Loader2, BarChart3, ShieldAlert, ArrowRight, Brain, Sparkles
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';

interface Prediction {
  id: string;
  product_id: string;
  current_stock: number;
  predicted_days_until_stockout: number | null;
  confidence_score: number;
  daily_sale_velocity: number;
  trend_direction: string;
  recommendation: string;
  reorder_quantity: number | null;
  reorder_urgency: string;
  last_calculated_at: string;
  products?: { title: string; sku: string | null; image_url: string | null };
}

const urgencyColors: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
  medium: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  low: 'bg-green-500/20 text-green-700 dark:text-green-300',
};

const trendIcons: Record<string, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

export function DemandForecastDashboard() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [showAll, setShowAll] = useState(false);

  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ['stock-predictions-forecast', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('stock_predictions')
        .select('*, products(title, sku, image_url)')
        .eq('user_id', user!.id)
        .order('predicted_days_until_stockout', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data || []) as Prediction[];
    },
    enabled: !!user?.id,
  });

  const runForecast = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('smart-inventory-engine', {
        body: { action: 'forecast_all', userId: user!.id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-predictions-forecast'] });
      const s = data?.summary;
      toast.success(`Prévisions: ${data?.count} produits — ${s?.critical || 0} critiques, ${s?.high || 0} élevés`);
    },
    onError: (e: Error) => toast.error(`Erreur: ${e.message}`),
  });

  const runAIForecast = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('smart-inventory-engine', {
        body: { action: 'forecast_ai', userId: user!.id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-predictions-forecast'] });
      toast.success(`Prévisions IA: ${data?.count} produits analysés avec intelligence artificielle`);
    },
    onError: (e: Error) => toast.error(`Erreur IA: ${e.message}`),
  });

  const criticals = predictions.filter(p => p.reorder_urgency === 'critical' || p.reorder_urgency === 'high');
  const displayed = showAll ? predictions : predictions.slice(0, 12);

  const chartData = [
    { name: 'Critique', count: predictions.filter(p => p.reorder_urgency === 'critical').length, fill: 'hsl(var(--destructive))' },
    { name: 'Élevé', count: predictions.filter(p => p.reorder_urgency === 'high').length, fill: 'hsl(25 95% 53%)' },
    { name: 'Moyen', count: predictions.filter(p => p.reorder_urgency === 'medium').length, fill: 'hsl(48 96% 53%)' },
    { name: 'Faible', count: predictions.filter(p => p.reorder_urgency === 'low').length, fill: 'hsl(142 76% 36%)' },
  ];

  const getProductName = (pred: Prediction) => {
    return pred.products?.title || `Produit ${pred.product_id.slice(0, 8)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Prévisions de Demande</h3>
          <p className="text-sm text-muted-foreground">
            {predictions.length} produits analysés • {criticals.length} alertes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => runForecast.mutate()}
            disabled={runForecast.isPending || runAIForecast.isPending}
            variant="outline"
            className="gap-2"
          >
            {runForecast.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
            Statistique
          </Button>
          <Button
            onClick={() => runAIForecast.mutate()}
            disabled={runForecast.isPending || runAIForecast.isPending}
            className="gap-2"
          >
            {runAIForecast.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            Prévision IA
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
              Critiques
            </div>
            <p className="text-2xl font-bold">{predictions.filter(p => p.reorder_urgency === 'critical').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
              Élevés
            </div>
            <p className="text-2xl font-bold">{predictions.filter(p => p.reorder_urgency === 'high').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Package className="h-3.5 w-3.5 text-primary" />
              Stock moyen
            </div>
            <p className="text-2xl font-bold">
              {predictions.length > 0
                ? Math.round(predictions.reduce((s, p) => s + p.current_stock, 0) / predictions.length)
                : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              Vélocité moy.
            </div>
            <p className="text-2xl font-bold">
              {predictions.length > 0
                ? (predictions.reduce((s, p) => s + Number(p.daily_sale_velocity), 0) / predictions.length).toFixed(1)
                : '—'}/j
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {predictions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribution des risques</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Product predictions list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : predictions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aucune prévision disponible</p>
            <p className="text-sm text-muted-foreground mt-1">Lancez le calcul pour analyser vos produits</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3">
            <AnimatePresence>
              {displayed.map((pred, i) => {
                const TrendIcon = trendIcons[pred.trend_direction] || Minus;
                const isAI = pred.recommendation?.includes('IA');
                return (
                  <motion.div
                    key={pred.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <Card className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <Badge className={urgencyColors[pred.reorder_urgency] || urgencyColors.low}>
                              {pred.reorder_urgency}
                            </Badge>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium truncate">{getProductName(pred)}</p>
                                {isAI && <Sparkles className="h-3 w-3 text-primary shrink-0" />}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {pred.products?.sku && <span className="font-mono">{pred.products.sku}</span>}
                                <span>Stock: {pred.current_stock}</span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <TrendIcon className="h-3 w-3" />
                                  {Number(pred.daily_sale_velocity).toFixed(1)}/j
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-semibold">
                                {pred.predicted_days_until_stockout !== null
                                  ? `${pred.predicted_days_until_stockout}j`
                                  : '∞'}
                              </p>
                              <p className="text-xs text-muted-foreground">avant rupture</p>
                            </div>
                            <div className="w-20">
                              <Progress value={pred.confidence_score} className="h-1.5" />
                              <p className="text-xs text-muted-foreground text-center mt-0.5">{pred.confidence_score}%</p>
                            </div>
                            {pred.reorder_quantity && (
                              <div className="text-right">
                                <p className="text-sm font-medium text-primary">+{pred.reorder_quantity}</p>
                                <p className="text-xs text-muted-foreground">à commander</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {predictions.length > 12 && (
            <div className="text-center">
              <Button variant="ghost" onClick={() => setShowAll(!showAll)} className="gap-2">
                {showAll ? 'Voir moins' : `Voir tous (${predictions.length})`}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
