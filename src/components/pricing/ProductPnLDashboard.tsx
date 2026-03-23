/**
 * Product-level P&L Dashboard
 * Granular profit & loss by product/category with COGS, net margin, ROI
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import {
  DollarSign, TrendingUp, TrendingDown, Search, ArrowUpDown,
  Package, Percent, BarChart3, Loader2, AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ProductPnL {
  id: string;
  title: string;
  category: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  orders_count: number;
  revenue: number;
  cogs: number;
  gross_profit: number;
  gross_margin: number;
  net_margin: number;
  roi: number;
}

export function ProductPnLDashboard() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'gross_profit' | 'gross_margin' | 'revenue' | 'roi'>('gross_profit');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['product-pnl-dashboard'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { products: [], categories: [] };

      const [{ data: products }, { data: orderItems }] = await Promise.all([
        supabase.from('products')
          .select('id, title, price, cost_price, stock_quantity, category')
          .eq('user_id', user.id)
          .not('price', 'is', null),
        supabase.from('order_items')
          .select('product_id, quantity, unit_price, total_price')
          .limit(1000),
      ]);

      const productList = products || [];
      const items = orderItems || [];

      // Aggregate order data per product
      const orderAgg = new Map<string, { count: number; revenue: number; qty: number }>();
      items.forEach((item: any) => {
        const existing = orderAgg.get(item.product_id) || { count: 0, revenue: 0, qty: 0 };
        existing.count += 1;
        existing.revenue += item.total_price || (item.unit_price * item.quantity) || 0;
        existing.qty += item.quantity || 0;
        orderAgg.set(item.product_id, existing);
      });

      const categories = new Set<string>();

      const pnlProducts: ProductPnL[] = productList.map((p: any) => {
        const cat = p.category || 'Non catégorisé';
        categories.add(cat);
        const agg = orderAgg.get(p.id) || { count: 0, revenue: 0, qty: 0 };
        const costPrice = p.cost_price || 0;
        const revenue = agg.revenue;
        const cogs = costPrice * agg.qty;
        const grossProfit = revenue - cogs;
        const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
        // Estimated overhead (shipping ~8%, platform fees ~5%)
        const overheadRate = 0.13;
        const netProfit = grossProfit - (revenue * overheadRate);
        const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
        const roi = cogs > 0 ? (grossProfit / cogs) * 100 : 0;

        return {
          id: p.id,
          title: p.title || 'Sans titre',
          category: cat,
          price: p.price || 0,
          cost_price: costPrice,
          stock_quantity: p.stock_quantity || 0,
          orders_count: agg.count,
          revenue,
          cogs,
          gross_profit: grossProfit,
          gross_margin: grossMargin,
          net_margin: netMargin,
          roi,
        };
      });

      return { products: pnlProducts, categories: Array.from(categories).sort() };
    },
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    let list = data?.products || [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') {
      list = list.filter(p => p.category === categoryFilter);
    }
    list.sort((a, b) => {
      const va = a[sortBy];
      const vb = b[sortBy];
      return sortDir === 'desc' ? vb - va : va - vb;
    });
    return list;
  }, [data?.products, search, categoryFilter, sortBy, sortDir]);

  const totals = useMemo(() => {
    const r = filtered.reduce((acc, p) => ({
      revenue: acc.revenue + p.revenue,
      cogs: acc.cogs + p.cogs,
      grossProfit: acc.grossProfit + p.gross_profit,
      orders: acc.orders + p.orders_count,
    }), { revenue: 0, cogs: 0, grossProfit: 0, orders: 0 });
    return {
      ...r,
      grossMargin: r.revenue > 0 ? (r.grossProfit / r.revenue) * 100 : 0,
      netMargin: r.revenue > 0 ? ((r.grossProfit - r.revenue * 0.13) / r.revenue) * 100 : 0,
    };
  }, [filtered]);

  // Top 5 for chart
  const top5 = filtered.slice(0, 5).map(p => ({
    name: p.title.length > 20 ? p.title.substring(0, 20) + '…' : p.title,
    profit: Math.round(p.gross_profit * 100) / 100,
    margin: Math.round(p.gross_margin * 10) / 10,
  }));

  // Margin distribution
  const marginDist = [
    { range: '< 0%', count: 0, color: 'hsl(var(--destructive))' },
    { range: '0-15%', count: 0, color: 'hsl(var(--warning))' },
    { range: '15-30%', count: 0, color: 'hsl(var(--chart-2))' },
    { range: '30-50%', count: 0, color: 'hsl(var(--primary))' },
    { range: '50%+', count: 0, color: 'hsl(var(--success))' },
  ];
  filtered.forEach(p => {
    if (p.gross_margin < 0) marginDist[0].count++;
    else if (p.gross_margin < 15) marginDist[1].count++;
    else if (p.gross_margin < 30) marginDist[2].count++;
    else if (p.gross_margin < 50) marginDist[3].count++;
    else marginDist[4].count++;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Calcul P&L en cours...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Revenus', value: `${(totals.revenue / 1000).toFixed(1)}k€`, icon: DollarSign, color: 'text-primary' },
          { label: 'COGS', value: `${(totals.cogs / 1000).toFixed(1)}k€`, icon: Package, color: 'text-warning' },
          { label: 'Profit brut', value: `${(totals.grossProfit / 1000).toFixed(1)}k€`, icon: TrendingUp, color: 'text-success' },
          { label: 'Marge brute', value: `${totals.grossMargin.toFixed(1)}%`, icon: Percent, color: 'text-chart-2' },
          { label: 'Marge nette', value: `${totals.netMargin.toFixed(1)}%`, icon: BarChart3, color: totals.netMargin >= 0 ? 'text-success' : 'text-destructive' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                  {kpi.label}
                </div>
                <p className="text-xl font-bold">{kpi.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top 5 — Profit brut</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={top5} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: number) => `${v.toFixed(2)}€`} />
                <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                  {top5.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? 'hsl(var(--success))' : 'hsl(var(--primary))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distribution des marges</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={marginDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {marginDist.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {(data?.categories || []).map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gross_profit">Profit brut</SelectItem>
            <SelectItem value="gross_margin">Marge brute</SelectItem>
            <SelectItem value="revenue">Revenus</SelectItem>
            <SelectItem value="roi">ROI</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Product table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            P&L par produit ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-1">
              {/* Header */}
              <div className="grid grid-cols-8 gap-2 text-xs font-medium text-muted-foreground px-3 py-2 border-b">
                <span className="col-span-2">Produit</span>
                <span className="text-right">Prix</span>
                <span className="text-right">COGS</span>
                <span className="text-right">Revenus</span>
                <span className="text-right">Profit</span>
                <span className="text-right">Marge</span>
                <span className="text-right">ROI</span>
              </div>
              {filtered.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Aucun produit trouvé</p>
                </div>
              ) : (
                filtered.map((p, idx) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(idx * 0.015, 0.5) }}
                    className="grid grid-cols-8 gap-2 items-center px-3 py-2.5 rounded-md hover:bg-muted/40 transition-colors text-sm"
                  >
                    <div className="col-span-2 flex items-center gap-2 min-w-0">
                      {p.gross_margin < 0 && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                      <span className="truncate font-medium">{p.title}</span>
                    </div>
                    <span className="text-right">{p.price.toFixed(2)}€</span>
                    <span className="text-right text-muted-foreground">
                      {p.cost_price > 0 ? `${p.cost_price.toFixed(2)}€` : '—'}
                    </span>
                    <span className="text-right">{p.revenue.toFixed(0)}€</span>
                    <span className={`text-right font-medium ${p.gross_profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {p.gross_profit.toFixed(0)}€
                    </span>
                    <span className="text-right">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          p.gross_margin >= 30 ? 'border-success/40 text-success' :
                          p.gross_margin >= 15 ? 'border-primary/40 text-primary' :
                          p.gross_margin >= 0 ? 'border-warning/40 text-warning' :
                          'border-destructive/40 text-destructive'
                        }`}
                      >
                        {p.gross_margin.toFixed(1)}%
                      </Badge>
                    </span>
                    <span className={`text-right text-xs ${p.roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {p.roi.toFixed(0)}%
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
