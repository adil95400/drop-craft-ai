/**
 * Automation Metrics Dashboard - Overview tab
 * Charts: price changes over time, sync success rate, workflow execution
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';

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

      const [
        { data: priceChanges },
        { data: syncLogs },
        { data: autoOrders },
      ] = await Promise.all([
        supabase.from('price_change_history')
          .select('changed_at, change_type, old_value, new_value')
          .eq('user_id', user.id).gte('changed_at', since)
          .order('changed_at', { ascending: true }).limit(500),
        supabase.from('supplier_sync_logs')
          .select('started_at, status, products_synced, duration_ms')
          .eq('user_id', user.id).gte('started_at', since)
          .order('started_at', { ascending: true }).limit(200),
        supabase.from('auto_order_queue')
          .select('created_at, status')
          .eq('user_id', user.id).gte('created_at', since)
          .limit(200),
      ]);

      // Aggregate price changes by day
      const priceByDay = new Map<string, { day: string; count: number; avgChange: number }>();
      for (const pc of priceChanges || []) {
        const day = pc.changed_at?.split('T')[0] || 'unknown';
        const entry = priceByDay.get(day) || { day, count: 0, avgChange: 0 };
        entry.count++;
        if (pc.old_value && pc.new_value) {
          entry.avgChange += ((pc.new_value - pc.old_value) / pc.old_value) * 100;
        }
        priceByDay.set(day, entry);
      }
      const priceData = Array.from(priceByDay.values()).map(e => ({
        ...e, avgChange: e.count > 0 ? Math.round(e.avgChange / e.count * 10) / 10 : 0,
      }));

      // Sync success/failure
      const syncSuccess = (syncLogs || []).filter(s => s.status === 'completed').length;
      const syncFailed = (syncLogs || []).filter(s => s.status === 'error').length;
      const avgDuration = (syncLogs || []).filter(s => s.duration_ms).reduce((a, b) => a + (b.duration_ms || 0), 0) / Math.max((syncLogs || []).length, 1);

      // Order statuses
      const orderStatuses = new Map<string, number>();
      for (const o of autoOrders || []) {
        orderStatuses.set(o.status, (orderStatuses.get(o.status) || 0) + 1);
      }

      return {
        priceData,
        syncPie: [
          { name: 'Réussi', value: syncSuccess },
          { name: 'Échoué', value: syncFailed },
        ],
        avgSyncDuration: Math.round(avgDuration),
        totalSyncs: (syncLogs || []).length,
        orderPie: Array.from(orderStatuses.entries()).map(([name, value]) => ({ name, value })),
        totalPriceChanges: (priceChanges || []).length,
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
      {/* Price changes over time */}
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

      {/* Sync success rate */}
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
        <div className="px-6 pb-4 text-xs text-muted-foreground text-center">
          Durée moyenne: {data?.avgSyncDuration || 0}ms
        </div>
      </Card>

      {/* Auto-order breakdown */}
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
