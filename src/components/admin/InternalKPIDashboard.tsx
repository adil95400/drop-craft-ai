import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Activity, TrendingUp, ShoppingCart, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function InternalKPIDashboard() {
  // Total users
  const { data: userStats } = useQuery({
    queryKey: ['admin-kpi', 'users'],
    queryFn: async () => {
      const { count: total } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { count: newUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo);

      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', sevenDaysAgo);

      return { total: total ?? 0, newUsers: newUsers ?? 0, activeUsers: activeUsers ?? 0 };
    },
    staleTime: 60000,
  });

  // Plan distribution
  const { data: planDistribution } = useQuery({
    queryKey: ['admin-kpi', 'plans'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('subscription_plan');
      const counts: Record<string, number> = {};
      (data ?? []).forEach((p: any) => {
        const plan = p.subscription_plan || 'free';
        counts[plan] = (counts[plan] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
    staleTime: 60000,
  });

  // Activation funnel
  const { data: funnelData } = useQuery({
    queryKey: ['admin-kpi', 'funnel'],
    queryFn: async () => {
      const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      const { data: withStores } = await supabase.from('integrations').select('user_id');
      const storeUsers = new Set((withStores ?? []).map((i: any) => i.user_id)).size;
      
      const { data: withProducts } = await supabase.from('products').select('user_id');
      const productUsers = new Set((withProducts ?? []).map((p: any) => p.user_id)).size;
      
      const { data: withOrders } = await supabase.from('orders').select('user_id');
      const orderUsers = new Set((withOrders ?? []).map((o: any) => o.user_id)).size;

      return [
        { step: 'Inscription', users: totalUsers ?? 0 },
        { step: 'Boutique connectée', users: storeUsers },
        { step: '1er produit importé', users: productUsers },
        { step: '1ère commande', users: orderUsers },
      ];
    },
    staleTime: 60000,
  });

  const retentionRate = userStats ? Math.round((userStats.activeUsers / Math.max(userStats.total, 1)) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Utilisateurs totaux</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.total ?? '—'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nouveaux (30j)</CardTitle>
            <UserPlus className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">+{userStats?.newUsers ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actifs (7j)</CardTitle>
            <Activity className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.activeUsers ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rétention</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{retentionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activation Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-primary" />
              Funnel d'activation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {funnelData && funnelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={funnelData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="step" type="category" width={130} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="users" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4 text-primary" />
              Répartition des plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            {planDistribution && planDistribution.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={40}
                    >
                      {planDistribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {planDistribution.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-sm capitalize">{p.name}</span>
                      <Badge variant="secondary" className="text-xs">{p.value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
