import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell } from 'recharts';
import { TrendingDown, TrendingUp, Eye, ShoppingCart, CreditCard, CheckCircle, MousePointerClick, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

const FUNNEL_DATA = [
  { name: 'Visiteurs', value: 12450, fill: 'hsl(var(--primary))' },
  { name: 'Vues produit', value: 6230, fill: 'hsl(var(--primary) / 0.85)' },
  { name: 'Ajout panier', value: 2180, fill: 'hsl(var(--primary) / 0.7)' },
  { name: 'Checkout initié', value: 1420, fill: 'hsl(var(--primary) / 0.55)' },
  { name: 'Paiement', value: 890, fill: 'hsl(var(--primary) / 0.4)' },
  { name: 'Commande confirmée', value: 756, fill: 'hsl(var(--primary) / 0.3)' },
];

const ABANDONMENT_DATA = [
  { stage: 'Page → Produit', rate: 49.9, lost: 6220 },
  { stage: 'Produit → Panier', rate: 65.0, lost: 4050 },
  { stage: 'Panier → Checkout', rate: 34.9, lost: 760 },
  { stage: 'Checkout → Paiement', rate: 37.3, lost: 530 },
  { stage: 'Paiement → Confirmation', rate: 15.1, lost: 134 },
];

const DAILY_CONVERSIONS = Array.from({ length: 14 }, (_, i) => ({
  date: new Date(Date.now() - (13 - i) * 86400000).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
  visitors: Math.floor(800 + Math.random() * 400),
  conversions: Math.floor(40 + Math.random() * 30),
  rate: +(3 + Math.random() * 4).toFixed(1),
}));

const ConversionFunnelPage = () => {
  const [period, setPeriod] = useState('7d');
  const overallRate = ((756 / 12450) * 100).toFixed(1);

    const { t: tPages } = useTranslation('pages');

  return (
    <ChannablePageWrapper
      title={tPages('tunnelDeConversion.title')}
      description="Analysez chaque étape du parcours d'achat et identifiez les points d'abandon"
    >
      <div className="space-y-6">
        {/* Period Selector */}
        <div className="flex justify-end">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Dernières 24h</SelectItem>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Taux de conversion', value: `${overallRate}%`, icon: TrendingUp, trend: '+0.8%', positive: true },
            { label: 'Visiteurs', value: '12 450', icon: Eye, trend: '+12%', positive: true },
            { label: 'Abandon panier', value: '34.9%', icon: ShoppingCart, trend: '-2.1%', positive: true },
            { label: 'Commandes', value: '756', icon: CheckCircle, trend: '+18%', positive: true },
          ].map((kpi, i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-1">
                <div className="flex items-center justify-between">
                  <kpi.icon className="h-4 w-4 text-muted-foreground" />
                  <Badge variant={kpi.positive ? 'default' : 'destructive'} className="text-xs">
                    {kpi.positive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {kpi.trend}
                  </Badge>
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Funnel Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MousePointerClick className="h-5 w-5 text-primary" />Entonnoir de conversion</CardTitle>
            <CardDescription>Parcours visiteur → commande confirmée</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {FUNNEL_DATA.map((step, i) => {
                const pct = ((step.value / FUNNEL_DATA[0].value) * 100).toFixed(1);
                const dropoff = i > 0 ? ((1 - step.value / FUNNEL_DATA[i - 1].value) * 100).toFixed(1) : null;
                return (
                  <div key={step.name} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-40 text-right">{step.name}</span>
                    <div className="flex-1 relative">
                      <div className="h-10 rounded bg-muted/50" />
                      <div
                        className="absolute top-0 left-0 h-10 rounded flex items-center px-3"
                        style={{ width: `${pct}%`, backgroundColor: step.fill, minWidth: '60px' }}
                      >
                        <span className="text-xs font-bold text-primary-foreground">{step.value.toLocaleString()}</span>
                      </div>
                    </div>
                    <span className="text-sm w-16 text-right font-mono">{pct}%</span>
                    {dropoff && (
                      <Badge variant="destructive" className="w-20 justify-center text-xs">-{dropoff}%</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Abandonment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-destructive" />Analyse des abandons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ABANDONMENT_DATA.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">{item.stage}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{item.lost.toLocaleString()} perdus</span>
                    <Badge variant={item.rate > 40 ? 'destructive' : 'secondary'}>{item.rate}% abandon</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Tendance journalière</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={DAILY_CONVERSIONS}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="visitors" fill="hsl(var(--primary) / 0.3)" name="Visiteurs" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="conversions" fill="hsl(var(--primary))" name="Conversions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Microsoft Clarity Info */}
        <Card className="border-primary/20">
          <CardContent className="pt-6 flex items-center gap-4">
            <Eye className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-semibold">Heatmaps & enregistrements de session</h3>
              <p className="text-sm text-muted-foreground">
                Microsoft Clarity est intégré pour capturer les heatmaps, les scrollmaps et les replays de session.
                Les données sont disponibles dans le tableau de bord Clarity.
              </p>
            </div>
            <Badge className="bg-success/10 text-success ml-auto">Actif</Badge>
          </CardContent>
        </Card>
      </div>
    </ChannablePageWrapper>
  );
};

export default ConversionFunnelPage;
