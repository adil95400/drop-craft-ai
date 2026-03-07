import { useState } from "react";
import { ChannablePageWrapper } from "@/components/channable/ChannablePageWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, AlertTriangle, CheckCircle2, Clock, Database, Globe, Heart, RefreshCw, Server, Shield, Zap } from "lucide-react";
import { useSystemHealthV2, useMetricsSnapshotV2, useUptimeReportV2, useLogAggregationV2 } from "@/hooks/useObservabilityV2";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  healthy: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  operational: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  degraded: "bg-red-500/15 text-red-700 border-red-500/30",
};

const severityColors: Record<string, string> = {
  info: "bg-blue-500/15 text-blue-700",
  warn: "bg-amber-500/15 text-amber-700",
  error: "bg-red-500/15 text-red-700",
  critical: "bg-red-600/15 text-red-800",
};

export default function ObservabilityDashboard() {
  const [period, setPeriod] = useState("24h");
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useSystemHealthV2();
  const { data: metrics, isLoading: metricsLoading } = useMetricsSnapshotV2(period);
  const { data: uptime } = useUptimeReportV2(30);
  const { data: logs } = useLogAggregationV2("activity");

  return (
    <ChannablePageWrapper title="Observabilité & Monitoring">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Observabilité & Monitoring
            </h1>
            <p className="text-muted-foreground mt-1">Santé système, métriques et alertes en temps réel</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24h</SelectItem>
                <SelectItem value="7d">7 jours</SelectItem>
                <SelectItem value="30d">30 jours</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => refetchHealth()}>
              <RefreshCw className="h-4 w-4 mr-1" /> Actualiser
            </Button>
          </div>
        </div>

        {/* System Status Banner */}
        {healthLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : health ? (
          <Card className="border-l-4" style={{ borderLeftColor: health.status === "healthy" ? "hsl(var(--primary))" : "hsl(var(--destructive))" }}>
            <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <Heart className={`h-8 w-8 ${health.status === "healthy" ? "text-emerald-500" : "text-red-500"}`} />
                <div>
                  <p className="text-lg font-semibold">Système {health.status === "healthy" ? "opérationnel" : health.status === "warning" ? "en alerte" : "dégradé"}</p>
                  <p className="text-sm text-muted-foreground">Dernière vérification : {new Date(health.timestamp).toLocaleTimeString("fr-FR")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(health.services || []).map((s: any) => (
                  <Badge key={s.name} variant="outline" className={statusColors[s.status] || ""}>
                    {s.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<Zap className="h-5 w-5 text-blue-500" />}
            title="Requêtes API (1h)"
            value={health?.metrics?.api?.total_requests_1h ?? "—"}
            subtitle={`${health?.metrics?.api?.error_rate ?? 0}% erreurs`}
            loading={healthLoading}
          />
          <MetricCard
            icon={<Clock className="h-5 w-5 text-amber-500" />}
            title="Latence moyenne"
            value={health?.metrics?.api?.avg_latency_ms ? `${health.metrics.api.avg_latency_ms}ms` : "—"}
            subtitle="Dernière heure"
            loading={healthLoading}
          />
          <MetricCard
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            title="Alertes actives"
            value={health?.metrics?.alerts?.active_count ?? 0}
            subtitle="Nécessitent attention"
            loading={healthLoading}
          />
          <MetricCard
            icon={<Shield className="h-5 w-5 text-emerald-500" />}
            title="Uptime (30j)"
            value={uptime?.uptime_percent ? `${uptime.uptime_percent}%` : "—"}
            subtitle={uptime?.sla_status === "met" ? "SLA respecté" : "SLA à risque"}
            loading={!uptime}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="services">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="metrics">Métriques</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="uptime">Uptime</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">État des services</CardTitle>
                <CardDescription>Statut en temps réel de tous les services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(health?.services || [
                    { name: "database", status: "operational" },
                    { name: "edge_functions", status: "operational" },
                    { name: "storage", status: "operational" },
                    { name: "auth", status: "operational" },
                  ]).map((service: any) => (
                    <div key={service.name} className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <ServiceIcon name={service.name} />
                        <span className="font-medium capitalize">{service.name.replace("_", " ")}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {service.latency_ms && (
                          <span className="text-sm text-muted-foreground">{service.latency_ms}ms</span>
                        )}
                        <Badge variant="outline" className={statusColors[service.status] || ""}>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {service.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Snapshot métriques — {period}</CardTitle>
              </CardHeader>
              <CardContent>
                {metricsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : metrics ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    {metrics.api && (
                      <div className="p-4 rounded-lg border bg-card">
                        <p className="text-sm font-medium text-muted-foreground">API</p>
                        <p className="text-2xl font-bold mt-1">{metrics.api.summary?.total_requests ?? 0}</p>
                        <p className="text-sm text-muted-foreground">requêtes • {metrics.api.summary?.total_errors ?? 0} erreurs</p>
                        <p className="text-sm text-muted-foreground">~{metrics.api.summary?.avg_response_time ?? 0}ms latence moy.</p>
                      </div>
                    )}
                    {metrics.orders && (
                      <div className="p-4 rounded-lg border bg-card">
                        <p className="text-sm font-medium text-muted-foreground">Commandes</p>
                        <p className="text-2xl font-bold mt-1">{metrics.orders.count}</p>
                        <p className="text-sm text-muted-foreground">période : {metrics.orders.period}</p>
                      </div>
                    )}
                    {metrics.products && (
                      <div className="p-4 rounded-lg border bg-card">
                        <p className="text-sm font-medium text-muted-foreground">Produits</p>
                        <p className="text-2xl font-bold mt-1">{metrics.products.total}</p>
                        <p className="text-sm text-muted-foreground">total catalogue</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucune donnée disponible</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Logs récents</CardTitle>
                <CardDescription>
                  {logs?.aggregation?.total ?? 0} entrées • Par sévérité : {
                    Object.entries(logs?.aggregation?.by_severity ?? {}).map(([k, v]) => `${k}: ${v}`).join(", ") || "—"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(logs?.logs || []).slice(0, 30).map((log: any, i: number) => (
                    <div key={log.id || i} className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 text-sm">
                      <Badge variant="outline" className={`text-xs shrink-0 ${severityColors[log.severity] || ""}`}>
                        {log.severity || "info"}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{log.action || log.endpoint || "—"}</p>
                        <p className="text-muted-foreground truncate">{log.description || log.error_message || ""}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {log.created_at ? new Date(log.created_at).toLocaleTimeString("fr-FR") : ""}
                      </span>
                    </div>
                  ))}
                  {(!logs?.logs || logs.logs.length === 0) && (
                    <p className="text-muted-foreground text-center py-8">Aucun log récent</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="uptime" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rapport d'uptime — 30 jours</CardTitle>
                <CardDescription>
                  SLA : {uptime?.sla_status === "met" ? "✅ Respecté" : "⚠️ À risque"} • {uptime?.total_requests ?? 0} requêtes totales
                </CardDescription>
              </CardHeader>
              <CardContent>
                {uptime?.daily_breakdown ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {uptime.daily_breakdown.map((day: any) => (
                      <div key={day.date} className="flex items-center gap-3 py-2">
                        <span className="text-sm font-mono w-24 shrink-0">{day.date}</span>
                        <Progress value={day.uptime} className="flex-1 h-2" />
                        <span className="text-sm font-medium w-16 text-right">{day.uptime}%</span>
                        <span className="text-xs text-muted-foreground w-20 text-right">{day.requests} req</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Chargement...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ChannablePageWrapper>
  );
}

function MetricCard({ icon, title, value, subtitle, loading }: { icon: React.ReactNode; title: string; value: any; subtitle: string; loading: boolean }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">{icon}</div>
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ServiceIcon({ name }: { name: string }) {
  switch (name) {
    case "database": return <Database className="h-5 w-5 text-blue-500" />;
    case "edge_functions": return <Zap className="h-5 w-5 text-amber-500" />;
    case "storage": return <Server className="h-5 w-5 text-purple-500" />;
    case "auth": return <Shield className="h-5 w-5 text-emerald-500" />;
    default: return <Globe className="h-5 w-5 text-muted-foreground" />;
  }
}
