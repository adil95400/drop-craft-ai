/**
 * Interactive Margin Calculator — Per-product profitability simulator
 * Connected to real products from DB + manual mode
 */
import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Calculator, DollarSign, TrendingUp, TrendingDown, Package,
  Truck, Percent, BarChart3, PieChart, Target, ArrowRight, Loader2
} from 'lucide-react';
import {
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

interface CostBreakdown {
  costPrice: number;
  sellingPrice: number;
  shippingCost: number;
  platformFeesPercent: number;
  adSpendPerUnit: number;
  packagingCost: number;
  vatPercent: number;
  returnRatePercent: number;
}

const DEFAULT_COSTS: CostBreakdown = {
  costPrice: 10,
  sellingPrice: 29.99,
  shippingCost: 3.5,
  platformFeesPercent: 15,
  adSpendPerUnit: 2,
  packagingCost: 0.5,
  vatPercent: 20,
  returnRatePercent: 5,
};

function calculateMargins(costs: CostBreakdown) {
  const platformFees = costs.sellingPrice * (costs.platformFeesPercent / 100);
  const vatAmount = costs.sellingPrice * (costs.vatPercent / 100) / (1 + costs.vatPercent / 100);
  const returnCost = costs.sellingPrice * (costs.returnRatePercent / 100);
  const totalCosts = costs.costPrice + costs.shippingCost + platformFees + costs.adSpendPerUnit + costs.packagingCost + returnCost;
  const grossProfit = costs.sellingPrice - totalCosts;
  const netProfit = grossProfit - vatAmount;
  const grossMargin = costs.sellingPrice > 0 ? (grossProfit / costs.sellingPrice) * 100 : 0;
  const netMargin = costs.sellingPrice > 0 ? (netProfit / costs.sellingPrice) * 100 : 0;
  const roi = totalCosts > 0 ? (grossProfit / totalCosts) * 100 : 0;
  const breakEvenUnits = grossProfit > 0 ? Math.ceil(100 / grossProfit) : Infinity;

  return {
    platformFees,
    vatAmount,
    returnCost,
    totalCosts,
    grossProfit,
    netProfit,
    grossMargin,
    netMargin,
    roi,
    breakEvenUnits,
    costBreakdown: [
      { name: 'Coût produit', value: costs.costPrice, color: 'hsl(var(--chart-1))' },
      { name: 'Shipping', value: costs.shippingCost, color: 'hsl(var(--chart-2))' },
      { name: 'Frais plateforme', value: platformFees, color: 'hsl(var(--chart-3))' },
      { name: 'Publicité', value: costs.adSpendPerUnit, color: 'hsl(var(--chart-4))' },
      { name: 'Packaging', value: costs.packagingCost, color: 'hsl(var(--chart-5))' },
      { name: 'Retours', value: returnCost, color: 'hsl(var(--destructive))' },
    ].filter(c => c.value > 0),
  };
}

export default function MarginCalculatorPage() {
  const [costs, setCosts] = useState<CostBreakdown>(DEFAULT_COSTS);
  const [selectedProduct, setSelectedProduct] = useState<string>('');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-for-calculator'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('products')
        .select('id, title, price, cost_price')
        .eq('user_id', user.id)
        .not('price', 'is', null)
        .order('title')
        .limit(200);
      return data || [];
    },
  });

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    const product = products.find((p: any) => p.id === productId);
    if (product) {
      setCosts(prev => ({
        ...prev,
        sellingPrice: (product as any).price || prev.sellingPrice,
        costPrice: (product as any).cost_price || prev.costPrice,
      }));
    }
  };

  const updateCost = (key: keyof CostBreakdown, value: number) => {
    setCosts(prev => ({ ...prev, [key]: value }));
  };

  const margins = useMemo(() => calculateMargins(costs), [costs]);

  // Scenario comparison data
  const scenarios = useMemo(() => {
    const deltas = [-20, -10, 0, 10, 20];
    return deltas.map(d => {
      const price = costs.sellingPrice * (1 + d / 100);
      const m = calculateMargins({ ...costs, sellingPrice: price });
      return { name: d === 0 ? 'Actuel' : `${d > 0 ? '+' : ''}${d}%`, price: Math.round(price * 100) / 100, margin: Math.round(m.grossMargin * 10) / 10, profit: Math.round(m.grossProfit * 100) / 100 };
    });
  }, [costs]);

  const marginColor = margins.grossMargin >= 30 ? 'text-success' : margins.grossMargin >= 15 ? 'text-warning' : 'text-destructive';
  const marginBg = margins.grossMargin >= 30 ? 'bg-green-500/10' : margins.grossMargin >= 15 ? 'bg-yellow-500/10' : 'bg-destructive/10';

  return (
    <>
      <Helmet>
        <title>Calculateur de Marge | Drop-Craft AI</title>
        <meta name="description" content="Calculez vos marges en temps réel avec simulation de coûts complète." />
      </Helmet>

      <ChannablePageWrapper
        title="Calculateur de Marge"
        description="Simulez votre rentabilité par produit avec tous les coûts inclus"
        heroImage="products"
        badge={{ label: 'Calculator', icon: Calculator }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Input Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Product Selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" /> Produit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedProduct} onValueChange={handleProductSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoading ? 'Chargement...' : 'Sélectionner un produit ou saisir manuellement'} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title} — {p.price?.toFixed(2)}€
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Cost Inputs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Coûts & Prix
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {([
                  { key: 'sellingPrice', label: 'Prix de vente (€)', icon: DollarSign },
                  { key: 'costPrice', label: 'Coût produit (€)', icon: Package },
                  { key: 'shippingCost', label: 'Coût shipping (€)', icon: Truck },
                  { key: 'adSpendPerUnit', label: 'Pub / unité (€)', icon: Target },
                  { key: 'packagingCost', label: 'Packaging (€)', icon: Package },
                ] as const).map(({ key, label, icon: Icon }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      <Icon className="h-3 w-3" /> {label}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={costs[key]}
                      onChange={e => updateCost(key, parseFloat(e.target.value) || 0)}
                    />
                  </div>
                ))}

                <div className="space-y-2">
                  <Label className="text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1"><Percent className="h-3 w-3" /> Frais plateforme</span>
                    <span className="font-mono">{costs.platformFeesPercent}%</span>
                  </Label>
                  <Slider
                    value={[costs.platformFeesPercent]}
                    onValueChange={([v]) => updateCost('platformFeesPercent', v)}
                    min={0} max={40} step={0.5}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs flex items-center justify-between">
                    <span>TVA</span>
                    <span className="font-mono">{costs.vatPercent}%</span>
                  </Label>
                  <Slider
                    value={[costs.vatPercent]}
                    onValueChange={([v]) => updateCost('vatPercent', v)}
                    min={0} max={25} step={0.5}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs flex items-center justify-between">
                    <span>Taux de retour</span>
                    <span className="font-mono">{costs.returnRatePercent}%</span>
                  </Label>
                  <Slider
                    value={[costs.returnRatePercent]}
                    onValueChange={([v]) => updateCost('returnRatePercent', v)}
                    min={0} max={30} step={0.5}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-2 space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className={`p-4 ${marginBg}`}>
                <p className="text-xs text-muted-foreground">Marge brute</p>
                <p className={`text-2xl font-bold ${marginColor}`}>{margins.grossMargin.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">{margins.grossProfit.toFixed(2)}€ / unité</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Marge nette</p>
                <p className="text-2xl font-bold">{margins.netMargin.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">{margins.netProfit.toFixed(2)}€ / unité</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">ROI</p>
                <p className="text-2xl font-bold text-primary">{margins.roi.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">retour sur investissement</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted-foreground">Seuil rentabilité</p>
                <p className="text-2xl font-bold">{margins.breakEvenUnits === Infinity ? '∞' : margins.breakEvenUnits}</p>
                <p className="text-xs text-muted-foreground">ventes pour 100€</p>
              </Card>
            </div>

            <Tabs defaultValue="breakdown" className="w-full">
              <TabsList>
                <TabsTrigger value="breakdown"><PieChart className="mr-2 h-4 w-4" /> Répartition</TabsTrigger>
                <TabsTrigger value="scenarios"><BarChart3 className="mr-2 h-4 w-4" /> Scénarios</TabsTrigger>
              </TabsList>

              <TabsContent value="breakdown" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Décomposition des coûts</CardTitle>
                    <CardDescription>
                      Total coûts: {margins.totalCosts.toFixed(2)}€ sur un prix de {costs.sellingPrice.toFixed(2)}€
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-full md:w-1/2">
                      <ResponsiveContainer width="100%" height={260}>
                        <RePieChart>
                          <Pie
                            data={margins.costBreakdown}
                            cx="50%" cy="50%"
                            innerRadius={60} outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {margins.costBreakdown.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `${value.toFixed(2)}€`} />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full md:w-1/2 space-y-2">
                      {margins.costBreakdown.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span>{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">{item.value.toFixed(2)}€</span>
                            <Badge variant="outline" className="text-xs">
                              {((item.value / costs.sellingPrice) * 100).toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-2 flex items-center justify-between font-semibold text-sm">
                        <span className="flex items-center gap-2 text-success">
                          <TrendingUp className="h-4 w-4" /> Profit brut
                        </span>
                        <span className="font-mono">{margins.grossProfit.toFixed(2)}€</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="scenarios" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Simulation de prix</CardTitle>
                    <CardDescription>Impact des variations de prix sur votre marge</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={scenarios}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" unit="%" />
                        <YAxis yAxisId="right" orientation="right" unit="€" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="margin" name="Marge %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="profit" name="Profit €" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="pb-2 text-left">Scénario</th>
                            <th className="pb-2 text-right">Prix</th>
                            <th className="pb-2 text-right">Marge</th>
                            <th className="pb-2 text-right">Profit/unité</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scenarios.map(s => (
                            <tr key={s.name} className={`border-b last:border-0 ${s.name === 'Actuel' ? 'bg-accent/50 font-medium' : ''}`}>
                              <td className="py-2">{s.name}</td>
                              <td className="py-2 text-right font-mono">{s.price.toFixed(2)}€</td>
                              <td className="py-2 text-right">
                                <Badge variant={s.margin >= 30 ? 'default' : s.margin >= 15 ? 'secondary' : 'destructive'} className="text-xs">
                                  {s.margin}%
                                </Badge>
                              </td>
                              <td className="py-2 text-right font-mono">{s.profit.toFixed(2)}€</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ChannablePageWrapper>
    </>
  );
}
