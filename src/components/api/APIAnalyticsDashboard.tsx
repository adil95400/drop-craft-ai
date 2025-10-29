import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, TrendingUp, Zap, AlertCircle, Clock, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function APIAnalyticsDashboard() {
  const { data: recentLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['api-recent-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    }
  });

  const { data: analytics } = useQuery({
    queryKey: ['api-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_analytics')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      return data;
    }
  });

  // Calcul des statistiques
  const totalRequests = recentLogs?.length || 0;
  const successfulRequests = recentLogs?.filter(log => log.status_code < 400).length || 0;
  const failedRequests = totalRequests - successfulRequests;
  const successRate = totalRequests > 0 ? ((successfulRequests / totalRequests) * 100).toFixed(1) : 0;
  const avgResponseTime = recentLogs?.reduce((acc, log) => acc + (log.response_time_ms || 0), 0) / totalRequests || 0;

  // Données pour les graphiques
  const endpointData = recentLogs?.reduce((acc: any, log) => {
    const endpoint = log.endpoint;
    if (!acc[endpoint]) {
      acc[endpoint] = { endpoint, count: 0, errors: 0 };
    }
    acc[endpoint].count++;
    if (log.status_code >= 400) {
      acc[endpoint].errors++;
    }
    return acc;
  }, {});

  const topEndpoints = Object.values(endpointData || {}).sort((a: any, b: any) => b.count - a.count).slice(0, 10);

  const statusCodeData = [
    { name: '2xx Success', value: recentLogs?.filter(l => l.status_code >= 200 && l.status_code < 300).length || 0, color: '#10b981' },
    { name: '4xx Client Error', value: recentLogs?.filter(l => l.status_code >= 400 && l.status_code < 500).length || 0, color: '#f59e0b' },
    { name: '5xx Server Error', value: recentLogs?.filter(l => l.status_code >= 500).length || 0, color: '#ef4444' }
  ];

  const timelineData = analytics?.map(a => ({
    date: new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    requests: a.total_requests,
    errors: a.failed_requests,
    avgTime: a.avg_response_time_ms
  })).reverse() || [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Requêtes totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Dernières 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Taux de réussite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {successfulRequests} succès / {failedRequests} erreurs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              Temps de réponse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgResponseTime)}ms</div>
            <p className="text-xs text-muted-foreground">Temps moyen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-orange-500" />
              Endpoints uniques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(endpointData || {}).length}</div>
            <p className="text-xs text-muted-foreground">Actifs aujourd'hui</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Requêtes au fil du temps</CardTitle>
            <CardDescription>Évolution sur les 30 derniers jours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribution des codes de statut</CardTitle>
            <CardDescription>Répartition par type de réponse</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusCodeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusCodeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Top 10 Endpoints</CardTitle>
            <CardDescription>Endpoints les plus sollicités</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topEndpoints}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="endpoint" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
                <Bar dataKey="errors" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>Les 10 dernières requêtes API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentLogs?.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={log.status_code < 400 ? 'default' : 'destructive'}>
                    {log.method}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{log.endpoint}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleTimeString('fr-FR')}
                      {log.ip_address && ` • ${log.ip_address}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{log.status_code}</Badge>
                  {log.response_time_ms && (
                    <span className="text-sm text-muted-foreground">
                      {log.response_time_ms}ms
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
