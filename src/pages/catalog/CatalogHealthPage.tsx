/**
 * CatalogHealthPage - Santé du Catalogue (Version simplifiée)
 */
import { useState, useMemo } from 'react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HeartPulse, TrendingUp, CheckCircle, AlertTriangle, XCircle, Activity, Download } from 'lucide-react';
import { useProductsUnified } from '@/hooks/unified';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CatalogHealthPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const { products } = useProductsUnified();

  const healthMetrics = useMemo(() => {
    if (!products || products.length === 0) return null;
    const optimized = products.filter(p => p.image_url && p.category).length;
    const toProcess = products.filter(p => (p.stock_quantity || 0) < 5).length;
    const blocking = products.filter(p => !p.image_url || (p.stock_quantity || 0) === 0).length;
    const globalScore = Math.round((optimized / products.length) * 100);
    return { total: products.length, optimizedCount: optimized, optimizedPercent: Math.round((optimized / products.length) * 100), toProcessCount: toProcess, toProcessPercent: Math.round((toProcess / products.length) * 100), blockingCount: blocking, blockingPercent: Math.round((blocking / products.length) * 100), globalScore, trend: 5.2 };
  }, [products]);

  const evolutionData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return Array.from({ length: Math.min(days, 15) }, (_, i) => ({ date: `J${i+1}`, score: Math.round(60 + Math.random() * 25 + i * 0.3), optimized: Math.round(40 + Math.random() * 20 + i * 0.5) }));
  }, [timeRange]);

  const detailedKPIs = [
    { label: 'Produits optimisés', value: healthMetrics?.optimizedPercent || 0, count: healthMetrics?.optimizedCount || 0, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: '+8%' },
    { label: 'À traiter', value: healthMetrics?.toProcessPercent || 0, count: healthMetrics?.toProcessCount || 0, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: '-12%' },
    { label: 'Bloquants', value: healthMetrics?.blockingPercent || 0, count: healthMetrics?.blockingCount || 0, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', trend: '-5%' },
  ];

  return (
    <ChannablePageWrapper title="Santé du Catalogue" subtitle="Vue macro & KPIs" description="Pilotez la qualité de votre catalogue" heroImage="analytics"
      badge={{ label: `Score: ${healthMetrics?.globalScore || 0}%`, variant: (healthMetrics?.globalScore || 0) >= 70 ? 'default' : 'destructive' }}
      actions={<Button variant="outline"><Download className="h-4 w-4 mr-2" />Exporter</Button>}
    >
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-primary/5 via-violet-500/5 to-purple-500/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full border-8 border-primary/20 flex items-center justify-center">
                  <div className="text-center"><span className="text-3xl font-bold text-primary">{healthMetrics?.globalScore || 0}</span><span className="text-sm text-muted-foreground block">/ 100</span></div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Score global</h3>
                  <p className="text-muted-foreground">{healthMetrics?.total || 0} produits</p>
                  <div className="flex gap-2 mt-3">
                    {(['7d', '30d', '90d'] as const).map((range) => <Button key={range} variant={timeRange === range ? 'default' : 'outline'} size="sm" onClick={() => setTimeRange(range)}>{range}</Button>)}
                  </div>
                </div>
              </div>
              <HeartPulse className="h-16 w-16 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {detailedKPIs.map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={cn("p-3 rounded-xl", kpi.bg)}><kpi.icon className={cn("h-6 w-6", kpi.color)} /></div>
                  <Badge variant="outline" className={cn("text-xs", kpi.trend.startsWith('+') ? "text-emerald-600" : "text-red-600")}>{kpi.trend}</Badge>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2"><span className={cn("text-3xl font-bold", kpi.color)}>{kpi.value}%</span><span className="text-sm text-muted-foreground">({kpi.count})</span></div>
                  <p className="text-sm text-muted-foreground mt-1">{kpi.label}</p>
                </div>
                <Progress value={kpi.value} className="h-2 mt-3" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Évolution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </ChannablePageWrapper>
  );
}
