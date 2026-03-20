/**
 * Marketing Automation Performance Dashboard
 * Shows real metrics from email_campaigns and email_sending_logs
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Mail, MousePointer, Eye, UserX, TrendingUp, Send } from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function AutomationPerformance() {
  const { data: campaigns = [] } = useQuery({
    queryKey: ['email-campaign-performance'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('email_campaigns')
        .select('id, name, status, sent_count, recipient_count, sent_at, type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['email-sending-logs-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('email_sending_logs')
        .select('status, campaign_id')
        .eq('user_id', user.id)
        .limit(1000);
      return data || [];
    },
  });

  const { data: unsubCount = 0 } = useQuery({
    queryKey: ['email-unsub-count'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      const { count } = await supabase
        .from('email_unsubscribes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      return count || 0;
    },
  });

  // Compute aggregated stats
  const totalSent = campaigns.reduce((s, c: any) => s + (c.sent_count || 0), 0);
  const totalRecipients = campaigns.reduce((s, c: any) => s + (c.recipient_count || 0), 0);

  const statusCounts = logs.reduce((acc: Record<string, number>, l: any) => {
    acc[l.status || 'unknown'] = (acc[l.status || 'unknown'] || 0) + 1;
    return acc;
  }, {});

  const deliveredCount = statusCounts['delivered'] || statusCounts['sent'] || 0;
  const openedCount = statusCounts['opened'] || 0;
  const clickedCount = statusCounts['clicked'] || 0;
  const bouncedCount = statusCounts['bounced'] || 0;

  const deliveryRate = totalSent > 0 ? ((deliveredCount / Math.max(logs.length, 1)) * 100) : 0;
  const openRate = deliveredCount > 0 ? ((openedCount / deliveredCount) * 100) : 0;
  const clickRate = openedCount > 0 ? ((clickedCount / openedCount) * 100) : 0;

  const kpis = [
    { label: 'Emails envoyés', value: totalSent, icon: Send, color: 'text-info' },
    { label: 'Taux livraison', value: `${deliveryRate.toFixed(1)}%`, icon: Mail, color: 'text-success' },
    { label: 'Taux ouverture', value: `${openRate.toFixed(1)}%`, icon: Eye, color: 'text-purple-500' },
    { label: 'Taux clic', value: `${clickRate.toFixed(1)}%`, icon: MousePointer, color: 'text-warning' },
    { label: 'Désabonnements', value: unsubCount, icon: UserX, color: 'text-destructive' },
    { label: 'Campagnes', value: campaigns.length, icon: TrendingUp, color: 'text-primary' },
  ];

  // Chart data for campaigns
  const campaignChartData = campaigns.slice(0, 8).map((c: any) => ({
    name: c.name?.substring(0, 20) || 'Sans nom',
    envoyés: c.sent_count || 0,
    destinataires: c.recipient_count || 0,
  }));

  // Pie data for status distribution
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(kpi => (
          <Card key={kpi.label} className="p-4">
            <div className="flex items-center gap-2">
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="text-xl font-bold mt-1">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Performance par campagne</CardTitle>
          </CardHeader>
          <CardContent>
            {campaignChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={campaignChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="envoyés" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="destinataires" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                Aucune campagne envoyée
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status pie chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribution des statuts</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" outerRadius={80}
                      strokeWidth={2}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="capitalize">{d.name}</span>
                      <Badge variant="outline" className="text-xs ml-auto">{d.value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                Aucune donnée d'envoi
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent campaigns table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Campagnes récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length > 0 ? (
            <div className="space-y-2">
              {campaigns.slice(0, 10).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.sent_at ? new Date(c.sent_at).toLocaleDateString('fr-FR') : 'Non envoyé'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {c.sent_count || 0} / {c.recipient_count || 0}
                    </span>
                    <Badge variant={c.status === 'sent' ? 'default' : 'secondary'} className="capitalize text-xs">
                      {c.status || 'brouillon'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">Aucune campagne</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
