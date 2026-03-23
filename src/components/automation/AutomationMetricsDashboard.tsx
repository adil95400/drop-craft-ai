/**
 * Automation Metrics Dashboard - Overview tab
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

interface Props {
  period: string;
}

export function AutomationMetricsDashboard({ period }: Props) {
  const periodMs = period === '1h' ? 3600000 : period === '24h' ? 86400000 : period === '7d' ? 604800000 : 2592000000;
  const since = new Date(Date.now() - periodMs).toISOString();

  const { data } = useQuery({
    queryKey: ['automation-metrics', period],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const [priceRes, syncRes, orderRes] = await Promise.all([
        supabase.from('price_change_history')
          .select('created_at, change_type, old_price, new_price')
          .eq('user_id', user.id).gte('created_at', since)
          .order('created_at', { ascending: true }).limit(500),
        supabase.from('supplier_sync_logs')
          .select('created_at, log_level, message')
          .eq('user_id', user.id).gte('created_at', since)
          .order('created_at', { ascending: true }).limit(200),
        supabase.from('auto_order_queue')
          .select('created_at, status')
          .eq('user_id', user.id).gte('created_at', since)
          .limit(200),
      ]);

      const priceChanges = priceRes.data || [];
      const syncLogs = syncRes.data || [];
      const autoOrders = orderRes.data || [];

      // Aggregate price changes by day
      const priceByDay = new Map<string, { day: string; count: number; avgChange: number }>();
      for (const pc of priceChanges) {
        const day = pc.created_at?.split('T')[0] || 'unknown';
        const entry = priceByDay.get(day) || { day, count: 0, avgChange: 0 };
        entry.count++;
        if (pc.old_price && pc.new_price && pc.old_price > 0) {
          entry.avgChange += ((pc.new_price - pc.old_price) / pc.old_price) * 100;
        }
        priceByDay.set(day, entry);
      }
      const priceData = Array.from(priceByDay.values()).map(e => ({
        ...e, avgChange: e.count > 0 ? Math.round(e.avgChange / e.count * 10) / 10 : 0,
      }));

      // Sync by log_level
      const syncInfo = syncLogs.filter(s => s.log_level === 'info').length;
      const syncError = syncLogs.filter(s => s.log_level === 'error').length;

      // Order statuses
      const orderStatuses = new Map<string, number>();
      for (const o of autoOrders) {
        orderStatuses.set(o.status, (orderStatuses.get(o.status) || 0) + 1);
      }

      return {
        priceData,
        syncPie: [
          { name: 'Réussi', value: syncInfo },
          { name: 'Échoué', value: syncError },
        ],
        totalSyncs: syncLogs.length,
        orderPie: Array.from(orderStatuses.entries()).map(([name, value]) => ({ name, value })),
        totalPriceChanges: priceChanges.length,
      };
    },
    staleTime: 60_000,
  });

  const COLORS = ['hsl(var(--success))', 'hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--primary))'];
  const STATUS_COLORS: Record<string, string> = {
    completed: 'hsl(var(--success))',
    pending: 'hsl(var(--warning))',
    processing: 'hsl(var(--primary))',
    failed: 'hsl(var(--destructive))',
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Modifications de prix ({data?.totalPriceChanges || 0} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data?.priceData || []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" name="Modifications" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Synchronisations ({data?.totalSyncs || 0})</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data?.syncPie || []} dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                {(data?.syncPie || []).map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Commandes automatiques</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data?.orderPie || []} dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                {(data?.orderPie || []).map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
