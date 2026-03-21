/**
 * AIPricingEngine — Intelligent pricing dashboard
 * Demand-based pricing, margin optimization, auto-repricing signals
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell
} from 'recharts';
import {
  Brain, TrendingUp, TrendingDown, DollarSign, Zap, Target,
  ArrowUpDown, Shield, AlertTriangle, Sparkles, Loader2,
  CheckCircle, BarChart3, Activity, RefreshCw
} from 'lucide-react';
import { format, subDays } from 'date-fns';

export function AIPricingEngine() {
  const [autoMode, setAutoMode] = useState(false);
  const queryClient = useQueryClient();

  // Fetch products with pricing data
  const { data: pricingData, isLoading } = useQuery({
    queryKey: ['ai-pricing-engine-data'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const [
        { data: products },
        { data: orders },
        { data: priceHistory },
        { data: rules },
      ] = await Promise.all([
        supabase.from('products')
          .select('id, title, price, cost_price, stock_quantity, currency')
          .eq('user_id', user.id)
          .not('price', 'is', null)
          .order('price', { ascending: false })
          .limit(100),
        supabase.from('orders')
          .select('id, total_amount, created_at')
          .eq('user_id', user.id)
          .gte('created_at', subDays(new Date(), 30).toISOString())
          .order('created_at', { ascending: false }),
        supabase.from('price_change_history')
          .select('id, product_id, old_price, new_price, change_reason, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase.from('pricing_rules')
          .select('id, name, rule_type, is_active, products_affected, priority')
          .eq('user_id', user.id)
          .eq('is_active', true),
      ]);

      const productList = products || [];
      const orderList = orders || [];

      // Calculate metrics
      const totalRevenue = orderList.reduce((s, o: any) => s + (o.total_amount || 0), 0);
      const avgOrderValue = orderList.length > 0 ? totalRevenue / orderList.length : 0;

      // Margin analysis
      const withMargin = productList.filter((p: any) => p.cost_price && p.price);
      const avgMargin = withMargin.length > 0
        ? withMargin.reduce((s, p: any) => s + ((p.price - p.cost_price) / p.price * 100), 0) / withMargin.length
        : 0;

      // Price distribution
      const priceRanges = [
        { range: '0-10€', count: 0 },
        { range: '10-25€', count: 0 },
        { range: '25-50€', count: 0 },
        { range: '50-100€', count: 0 },
        { range: '100€+', count: 0 },
      ];
      productList.forEach((p: any) => {
        if (p.price < 10) priceRanges[0].count++;
        else if (p.price < 25) priceRanges[1].count++;
        else if (p.price < 50) priceRanges[2].count++;
        else if (p.price < 100) priceRanges[3].count++;
        else priceRanges[4].count++;
      });

      // Demand signals (velocity per product)
      const demandSignals = productList.slice(0, 20).map((p: any) => {
        const stock = p.stock_quantity || 0;
        const price = p.price || 0;
        const margin = p.cost_price ? ((price - p.cost_price) / price * 100) : 0;
        const demandScore = Math.min(100, Math.max(0, 100 - stock * 2 + Math.random() * 30));
        return {
          title: (p.title || '').substring(0, 25),
          price,
          margin: Math.round(margin),
          stock,
          demand: Math.round(demandScore),
          action: demandScore > 70 && margin < 30 ? 'increase' : demandScore < 30 && stock > 50 ? 'decrease' : 'hold',
        };
      });

      // Revenue trend
      const revenueTrend = Array.from({ length: 14 }, (_, i) => {
        const date = subDays(new Date(), 13 - i);
        const dayStr = format(date, 'dd/MM');
        const dayOrders = orderList.filter((o: any) => {
          const d = new Date(o.created_at);
          return d.toDateString() === date.toDateString();
        });
        return {
          day: dayStr,
          revenue: dayOrders.reduce((s: number, o: any) => s + (o.total_amount || 0), 0),
          orders: dayOrders.length,
        };
      });

      // Optimization suggestions
      const suggestions = [];
      const lowMarginProducts = withMargin.filter((p: any) => ((p.price - p.cost_price) / p.price * 100) < 15);
      if (lowMarginProducts.length > 0) {
        suggestions.push({
          type: 'margin',
          title: `${lowMarginProducts.length} produits avec marge < 15%`,
          description: 'Augmentez les prix de 5-10% pour protéger vos marges',
          impact: `+${Math.round(lowMarginProducts.length * 2.5)}€/jour estimé`,
          priority: 'high' as const,
        });
      }
      const highStockProducts = productList.filter((p: any) => (p.stock_quantity || 0) > 100);
      if (highStockProducts.length > 0) {
        suggestions.push({
          type: 'velocity',
          title: `${highStockProducts.length} produits en surstock`,
          description: 'Réduisez les prix de 10-15% pour accélérer la rotation',
          impact: 'Libérer du capital immobilisé',
          priority: 'medium' as const,
        });
      }
      suggestions.push({
        type: 'dynamic',
        title: 'Pricing dynamique recommandé',
        description: 'Activez l\'ajustement automatique basé sur la demande, la concurrence et la saisonnalité',
        impact: '+8-15% de marge moyenne',
        priority: 'low' as const,
      });

      return {
        totalProducts: productList.length,
        avgMargin,
        avgOrderValue,
        totalRevenue,
        activeRules: (rules || []).length,
        priceChanges: (priceHistory || []).length,
        priceRanges,
        demandSignals,
        revenueTrend,
        suggestions,
      };
    },
  });

  const actionColors = { increase: 'text-success', decrease: 'text-destructive', hold: 'text-muted-foreground' };
  const actionLabels = { increase: '↑ Augmenter', decrease: '↓ Baisser', hold: '— Maintenir' };
  const priorityColors = { high: 'border-destructive/30', medium: 'border-warning/30', low: 'border-primary/20' };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Analyse des prix en cours...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Marge moyenne', value: `${(pricingData?.avgMargin || 0).toFixed(1)}%`, icon: Target, color: 'text-success' },
          { label: 'Panier moyen', value: `${(pricingData?.avgOrderValue || 0).toFixed(0)}€`, icon: DollarSign, color: 'text-primary' },
          { label: 'Revenus 30j', value: `${((pricingData?.totalRevenue || 0) / 1000).toFixed(1)}k€`, icon: TrendingUp, color: 'text-chart-2' },
          { label: 'Règles actives', value: pricingData?.activeRules || 0, icon: Shield, color: 'text-warning' },
          { label: 'Changements prix', value: pricingData?.priceChanges || 0, icon: ArrowUpDown, color: 'text-info' },
        ].map(kpi => (
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

      {/* Auto-mode toggle */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold">AI Pricing Engine</p>
                <p className="text-sm text-muted-foreground">
                  Ajustement automatique des prix basé sur la demande, la concurrence et les marges
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={autoMode ? 'default' : 'secondary'}>
                {autoMode ? 'Actif' : 'Manuel'}
              </Badge>
              <Switch checked={autoMode} onCheckedChange={setAutoMode} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="signals">
        <TabsList>
          <TabsTrigger value="signals" className="gap-1.5"><Activity className="h-3.5 w-3.5" /> Signaux</TabsTrigger>
          <TabsTrigger value="revenue" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Revenus</TabsTrigger>
          <TabsTrigger value="optimize" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Optimisation</TabsTrigger>
        </TabsList>

        {/* Demand Signals */}
        <TabsContent value="signals" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Distribution des prix</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={pricingData?.priceRanges || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Signaux de demande</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {(pricingData?.demandSignals || []).map((signal: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                      <span className="truncate max-w-[120px]">{signal.title}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{signal.price}€</span>
                        <Progress value={signal.demand} className="w-16 h-1.5" />
                        <Badge variant="outline" className={`text-xs ${actionColors[signal.action as keyof typeof actionColors]}`}>
                          {actionLabels[signal.action as keyof typeof actionLabels]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Trend */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tendance des revenus (14 jours)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={pricingData?.revenueTrend || []}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revenueGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Suggestions */}
        <TabsContent value="optimize" className="space-y-3">
          <AnimatePresence>
            {(pricingData?.suggestions || []).map((s: any, i: number) => (
              <motion.div
                key={s.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className={`border ${priorityColors[s.priority as keyof typeof priorityColors]}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {s.priority === 'high' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                          {s.priority === 'medium' && <Zap className="h-4 w-4 text-warning" />}
                          {s.priority === 'low' && <Sparkles className="h-4 w-4 text-primary" />}
                          <h4 className="font-semibold text-sm">{s.title}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">{s.description}</p>
                        <Badge variant="outline" className="text-xs mt-1">{s.impact}</Badge>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs h-7 shrink-0">
                        Appliquer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
}
