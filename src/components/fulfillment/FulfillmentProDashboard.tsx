import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, Truck, CheckCircle, Clock, AlertTriangle, 
  TrendingUp, DollarSign, BarChart3, ArrowUpRight, ArrowDownRight,
  RefreshCw, Zap, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFulfillmentProStats } from '@/hooks/useFulfillmentProStats';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const STATUS_COLORS = {
  pending: 'hsl(var(--muted-foreground))',
  processing: 'hsl(45, 93%, 47%)',
  shipped: 'hsl(217, 91%, 60%)',
  delivered: 'hsl(142, 76%, 36%)',
  failed: 'hsl(0, 84%, 60%)',
  cancelled: 'hsl(0, 0%, 60%)',
};

export function FulfillmentProDashboard() {
  const { stats, trends, costData, funnelData, isLoading, refresh } = useFulfillmentProStats();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-6 h-24" /></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Taux de Fulfillment"
          value={`${stats.fulfillmentRate}%`}
          change={stats.fulfillmentRateChange}
          icon={<CheckCircle className="h-5 w-5" />}
          color="text-green-500"
          bgColor="bg-green-500/10"
        />
        <KPICard
          title="Délai moyen"
          value={`${stats.avgDeliveryDays}j`}
          change={stats.avgDeliveryDaysChange}
          icon={<Clock className="h-5 w-5" />}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
          invertChange
        />
        <KPICard
          title="Coût total expéditions"
          value={`${stats.totalShippingCost.toLocaleString('fr-FR')}€`}
          change={stats.shippingCostChange}
          icon={<DollarSign className="h-5 w-5" />}
          color="text-amber-500"
          bgColor="bg-amber-500/10"
          invertChange
        />
        <KPICard
          title="Commandes en attente"
          value={`${stats.pendingOrders}`}
          change={stats.pendingChange}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="text-orange-500"
          bgColor="bg-orange-500/10"
          invertChange
        />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Fulfillment Trend */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Tendance Fulfillment</CardTitle>
                <CardDescription>Commandes traitées / jour (30j)</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={refresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="fulfillGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }} 
                />
                <Area type="monotone" dataKey="fulfilled" stroke="hsl(142, 76%, 36%)" fill="url(#fulfillGrad)" name="Traitées" />
                <Area type="monotone" dataKey="total" stroke="hsl(217, 91%, 60%)" fill="none" strokeDasharray="5 5" name="Total" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Répartition des Statuts</CardTitle>
            <CardDescription>Distribution actuelle des commandes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={funnelData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {funnelData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {funnelData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Analysis */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Analyse des Coûts d'Expédition</CardTitle>
              <CardDescription>Coût par transporteur sur les 30 derniers jours</CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <BarChart3 className="h-3 w-3" />
              Mensuel
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="carrier" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `${v}€`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [`${value}€`, 'Coût']}
              />
              <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-500/10">
                <ShieldCheck className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux de succès</p>
                <p className="text-xl font-bold">{stats.successRate}%</p>
              </div>
            </div>
            <Progress value={stats.successRate} className="mt-3 h-2" />
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10">
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Auto-fulfillment</p>
                <p className="text-xl font-bold">{stats.autoFulfillRate}%</p>
              </div>
            </div>
            <Progress value={stats.autoFulfillRate} className="mt-3 h-2" />
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Coût moyen / colis</p>
                <p className="text-xl font-bold">{stats.avgCostPerShipment.toFixed(2)}€</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ title, value, change, icon, color, bgColor, invertChange }: {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  invertChange?: boolean;
}) {
  const isPositive = invertChange ? change <= 0 : change >= 0;
  
  return (
    <Card className="hover:shadow-md transition-shadow border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <div className="flex items-center gap-1 mt-1">
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {Math.abs(change)}%
              </span>
              <span className="text-xs text-muted-foreground">vs 30j</span>
            </div>
          </div>
          <div className={`p-2.5 rounded-xl ${bgColor}`}>
            <span className={color}>{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
