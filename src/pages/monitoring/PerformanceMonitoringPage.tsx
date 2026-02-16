/**
 * PerformanceMonitoringPage — Sprint 23: Performance & Monitoring
 * Dashboard de monitoring temps réel avec health checks, Core Web Vitals,
 * métriques système et alertes
 */
import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Globe,
  HardDrive,
  Heart,
  MemoryStick,
  Monitor,
  RefreshCw,
  Server,
  Shield,
  Signal,
  Timer,
  TrendingUp,
  Wifi,
  XCircle,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────
interface HealthCheck {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  lastCheck: string;
  uptime: number;
  icon: React.ReactNode;
}

interface SystemMetric {
  label: string;
  value: number;
  max: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
  color: string;
  icon: React.ReactNode;
}

interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  source: string;
}

interface WebVital {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  target: number;
  unit: string;
  description: string;
}

// ─── Mock Data Generators ─────────────────────────────────────
const generateTimeSeriesData = (hours: number, baseValue: number, variance: number) => {
  return Array.from({ length: hours }, (_, i) => {
    const time = new Date();
    time.setHours(time.getHours() - (hours - i));
    return {
      time: time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      value: Math.max(0, baseValue + (Math.random() - 0.5) * variance),
    };
  });
};

const HEALTH_CHECKS: HealthCheck[] = [
  { id: 'api', name: 'API Gateway', status: 'healthy', latency: 45, lastCheck: 'il y a 30s', uptime: 99.98, icon: <Server className="h-5 w-5" /> },
  { id: 'db', name: 'Base de données', status: 'healthy', latency: 12, lastCheck: 'il y a 30s', uptime: 99.99, icon: <Database className="h-5 w-5" /> },
  { id: 'cdn', name: 'CDN / Assets', status: 'healthy', latency: 8, lastCheck: 'il y a 1min', uptime: 100, icon: <Globe className="h-5 w-5" /> },
  { id: 'auth', name: 'Authentification', status: 'healthy', latency: 67, lastCheck: 'il y a 30s', uptime: 99.95, icon: <Shield className="h-5 w-5" /> },
  { id: 'sync', name: 'Moteur de Sync', status: 'degraded', latency: 230, lastCheck: 'il y a 2min', uptime: 98.5, icon: <RefreshCw className="h-5 w-5" /> },
  { id: 'edge', name: 'Edge Functions', status: 'healthy', latency: 89, lastCheck: 'il y a 30s', uptime: 99.9, icon: <Zap className="h-5 w-5" /> },
  { id: 'storage', name: 'Stockage fichiers', status: 'healthy', latency: 34, lastCheck: 'il y a 1min', uptime: 99.97, icon: <HardDrive className="h-5 w-5" /> },
  { id: 'realtime', name: 'Realtime / WebSocket', status: 'healthy', latency: 15, lastCheck: 'il y a 30s', uptime: 99.92, icon: <Wifi className="h-5 w-5" /> },
];

const WEB_VITALS: WebVital[] = [
  { name: 'LCP', value: 1.8, rating: 'good', target: 2.5, unit: 's', description: 'Largest Contentful Paint' },
  { name: 'FID', value: 45, rating: 'good', target: 100, unit: 'ms', description: 'First Input Delay' },
  { name: 'CLS', value: 0.05, rating: 'good', target: 0.1, unit: '', description: 'Cumulative Layout Shift' },
  { name: 'TTFB', value: 320, rating: 'good', target: 800, unit: 'ms', description: 'Time to First Byte' },
  { name: 'FCP', value: 1.2, rating: 'good', target: 1.8, unit: 's', description: 'First Contentful Paint' },
  { name: 'INP', value: 120, rating: 'needs-improvement', target: 200, unit: 'ms', description: 'Interaction to Next Paint' },
];

const SYSTEM_METRICS: SystemMetric[] = [
  { label: 'CPU', value: 34, max: 100, unit: '%', trend: 'down', trendValue: '-5%', color: 'hsl(var(--primary))', icon: <Cpu className="h-5 w-5" /> },
  { label: 'Mémoire', value: 62, max: 100, unit: '%', trend: 'up', trendValue: '+3%', color: 'hsl(var(--chart-2))', icon: <MemoryStick className="h-5 w-5" /> },
  { label: 'Disque', value: 45, max: 100, unit: '%', trend: 'stable', trendValue: '0%', color: 'hsl(var(--chart-3))', icon: <HardDrive className="h-5 w-5" /> },
  { label: 'Réseau', value: 28, max: 100, unit: '%', trend: 'down', trendValue: '-12%', color: 'hsl(var(--chart-4))', icon: <Signal className="h-5 w-5" /> },
];

const ALERTS: SystemAlert[] = [
  { id: '1', type: 'warning', title: 'Latence élevée — Moteur de Sync', message: 'La latence du moteur de synchronisation dépasse 200ms depuis 15 minutes.', timestamp: 'Il y a 15 min', acknowledged: false, source: 'sync' },
  { id: '2', type: 'info', title: 'Mise à jour planifiée', message: 'Maintenance planifiée le 18 février entre 02h00 et 04h00 UTC.', timestamp: 'Il y a 2h', acknowledged: true, source: 'system' },
  { id: '3', type: 'critical', title: 'Échec de synchronisation Amazon', message: '3 tentatives échouées pour la connexion Amazon Seller. Vérifiez les credentials.', timestamp: 'Il y a 45 min', acknowledged: false, source: 'sync' },
  { id: '4', type: 'warning', title: 'Quota API proche de la limite', message: 'Vous avez utilisé 87% de votre quota API mensuel (8 700 / 10 000 requêtes).', timestamp: 'Il y a 1h', acknowledged: false, source: 'api' },
  { id: '5', type: 'info', title: 'Nouveau record de performance', message: 'LCP moyen de 1.4s atteint aujourd\'hui — meilleur score du mois.', timestamp: 'Il y a 3h', acknowledged: true, source: 'performance' },
];

// ─── Hero Stats ───────────────────────────────────────────────
function HeroStats() {
  const healthy = HEALTH_CHECKS.filter(h => h.status === 'healthy').length;
  const degraded = HEALTH_CHECKS.filter(h => h.status === 'degraded').length;
  const down = HEALTH_CHECKS.filter(h => h.status === 'down').length;
  const avgUptime = (HEALTH_CHECKS.reduce((s, h) => s + h.uptime, 0) / HEALTH_CHECKS.length).toFixed(2);

  return (
    <div className="flex flex-wrap gap-6 mt-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-success" />
        </div>
        <div>
          <p className="text-2xl font-bold">{healthy}</p>
          <p className="text-xs text-muted-foreground">Services OK</p>
        </div>
      </div>
      {degraded > 0 && (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{degraded}</p>
            <p className="text-xs text-muted-foreground">Dégradés</p>
          </div>
        </div>
      )}
      {down > 0 && (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold">{down}</p>
            <p className="text-xs text-muted-foreground">Hors ligne</p>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{avgUptime}%</p>
          <p className="text-xs text-muted-foreground">Uptime moyen</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-2xl font-bold">{ALERTS.filter(a => !a.acknowledged).length}</p>
          <p className="text-xs text-muted-foreground">Alertes actives</p>
        </div>
      </div>
    </div>
  );
}

// ─── Health Check Card ────────────────────────────────────────
function HealthCheckCard({ check }: { check: HealthCheck }) {
  const statusStyles = {
    healthy: { border: 'border-success/30 hover:border-success/50', badge: 'bg-success/10 text-success border-success/30', icon: <CheckCircle2 className="h-3 w-3" /> },
    degraded: { border: 'border-amber-500/30 hover:border-amber-500/50', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/30', icon: <AlertTriangle className="h-3 w-3" /> },
    down: { border: 'border-destructive/30 hover:border-destructive/50', badge: 'bg-destructive/10 text-destructive border-destructive/30', icon: <XCircle className="h-3 w-3" /> },
  };
  const style = statusStyles[check.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative bg-card rounded-xl border hover:shadow-lg transition-all duration-300 p-5 cursor-pointer",
        style.border
      )}
    >
      <div className="absolute top-3 right-3">
        <Badge variant="outline" className={style.badge}>
          {style.icon}
          <span className="ml-1 capitalize">{check.status === 'healthy' ? 'OK' : check.status === 'degraded' ? 'Dégradé' : 'Hors ligne'}</span>
        </Badge>
      </div>

      <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:scale-105 transition-transform text-primary">
        {check.icon}
      </div>

      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{check.name}</h3>
      <p className="text-xs text-muted-foreground mt-1">Latence : {check.latency}ms</p>

      <div className="flex flex-wrap gap-1 mt-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          Uptime {check.uptime}%
        </span>
      </div>

      <div className="flex items-center text-xs text-muted-foreground mt-3 pt-2 border-t border-dashed">
        <Clock className="w-3 h-3 mr-1" />
        {check.lastCheck}
      </div>

      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <Heart className="w-4 h-4 text-primary" />
      </div>
    </motion.div>
  );
}

// ─── Web Vital Card ───────────────────────────────────────────
function WebVitalCard({ vital }: { vital: WebVital }) {
  const ratingStyles = {
    good: 'border-success/30 hover:border-success/50',
    'needs-improvement': 'border-amber-500/30 hover:border-amber-500/50',
    poor: 'border-destructive/30 hover:border-destructive/50',
  };
  const ratingBadge = {
    good: { class: 'bg-success/10 text-success border-success/30', label: 'Bon' },
    'needs-improvement': { class: 'bg-amber-500/10 text-amber-600 border-amber-500/30', label: 'À améliorer' },
    poor: { class: 'bg-destructive/10 text-destructive border-destructive/30', label: 'Mauvais' },
  };
  const percent = Math.min((vital.value / vital.target) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative bg-card rounded-xl border hover:shadow-lg transition-all duration-300 p-5",
        ratingStyles[vital.rating]
      )}
    >
      <div className="absolute top-3 right-3">
        <Badge variant="outline" className={ratingBadge[vital.rating].class}>
          {ratingBadge[vital.rating].label}
        </Badge>
      </div>

      <h3 className="text-2xl font-bold text-foreground">{vital.value}{vital.unit}</h3>
      <p className="font-semibold text-sm text-foreground mt-1">{vital.name}</p>
      <p className="text-xs text-muted-foreground">{vital.description}</p>

      <div className="mt-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Actuel</span>
          <span>Cible : {vital.target}{vital.unit}</span>
        </div>
        <Progress value={vital.rating === 'good' ? percent : Math.min(percent, 100)} className="h-2" />
      </div>
    </motion.div>
  );
}

// ─── Alert Item ───────────────────────────────────────────────
function AlertItem({ alert, onAcknowledge }: { alert: SystemAlert; onAcknowledge: (id: string) => void }) {
  const typeStyles = {
    critical: { icon: <XCircle className="h-5 w-5 text-destructive" />, border: 'border-l-destructive' },
    warning: { icon: <AlertTriangle className="h-5 w-5 text-amber-500" />, border: 'border-l-amber-500' },
    info: { icon: <AlertCircle className="h-5 w-5 text-primary" />, border: 'border-l-primary' },
  };
  const style = typeStyles[alert.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "bg-card rounded-lg border border-l-4 p-4 transition-all",
        style.border,
        alert.acknowledged && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          {style.icon}
          <div>
            <h4 className="font-medium text-sm text-foreground">{alert.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{alert.timestamp}</span>
              <Badge variant="outline" className="text-[10px]">{alert.source}</Badge>
            </div>
          </div>
        </div>
        {!alert.acknowledged && (
          <Button variant="ghost" size="sm" onClick={() => onAcknowledge(alert.id)} className="text-xs">
            Confirmer
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Response Time Chart ──────────────────────────────────────
function ResponseTimeChart() {
  const data = generateTimeSeriesData(24, 85, 60);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          Temps de réponse API (24h)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="apiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
              formatter={(value: number) => [`${value.toFixed(0)}ms`, 'Latence']}
            />
            <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#apiGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Requests Chart ───────────────────────────────────────────
function RequestsChart() {
  const data = generateTimeSeriesData(24, 450, 300);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Requêtes par heure (24h)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
              formatter={(value: number) => [`${value.toFixed(0)}`, 'Requêtes']}
            />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Error Rate Chart ─────────────────────────────────────────
function ErrorRateChart() {
  const data = generateTimeSeriesData(24, 1.2, 2);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          Taux d'erreur (24h)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} className="text-muted-foreground" />
            <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
              formatter={(value: number) => [`${Math.max(0, value).toFixed(2)}%`, 'Erreurs']}
            />
            <Line type="monotone" dataKey="value" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── System Metric Card ───────────────────────────────────────
function SystemMetricCard({ metric }: { metric: SystemMetric }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">{metric.icon}</div>
            <span className="font-medium text-sm">{metric.label}</span>
          </div>
          <div className={cn(
            "flex items-center gap-1 text-xs",
            metric.trend === 'up' ? 'text-amber-500' : metric.trend === 'down' ? 'text-success' : 'text-muted-foreground'
          )}>
            {metric.trend === 'up' ? <ArrowUp className="h-3 w-3" /> : metric.trend === 'down' ? <ArrowDown className="h-3 w-3" /> : null}
            {metric.trendValue}
          </div>
        </div>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-2xl font-bold">{metric.value}</span>
          <span className="text-sm text-muted-foreground mb-0.5">{metric.unit}</span>
        </div>
        <Progress value={metric.value} className="h-2" />
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function PerformanceMonitoringPage() {
  const [activeTab, setActiveTab] = useState('health');
  const [alerts, setAlerts] = useState(ALERTS);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    toast({ title: 'Alerte confirmée', description: "L'alerte a été marquée comme traitée." });
  }, [toast]);

  // Simulated auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      // In production, this would refetch metrics
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <>
      <Helmet>
        <title>Performance & Monitoring - ShopOpti</title>
        <meta name="description" content="Surveillez la performance de votre plateforme en temps réel avec des health checks, Core Web Vitals et alertes système." />
      </Helmet>

      <ChannablePageWrapper
        title="Performance"
        subtitle="Monitoring"
        description="Surveillez la santé de votre plateforme, les Core Web Vitals et les métriques système en temps réel"
        heroImage="analytics"
        badge={{ label: 'Live', icon: Activity }}
      >
        {/* Hero Stats */}
        <HeroStats />

        {/* Controls bar */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              <span className="text-muted-foreground">Auto-refresh (30s)</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Rafraîchir
          </Button>
        </div>

        {/* Tabs */}
        <section className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-auto inline-flex">
              <TabsTrigger value="health" className="gap-2">
                <Heart className="h-4 w-4" />
                Health Checks
              </TabsTrigger>
              <TabsTrigger value="vitals" className="gap-2">
                <Monitor className="h-4 w-4" />
                Web Vitals
              </TabsTrigger>
              <TabsTrigger value="system" className="gap-2">
                <Cpu className="h-4 w-4" />
                Système
              </TabsTrigger>
              <TabsTrigger value="alerts" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                Alertes
                {alerts.filter(a => !a.acknowledged).length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {alerts.filter(a => !a.acknowledged).length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Health Checks Tab */}
            <TabsContent value="health" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {HEALTH_CHECKS.map(check => (
                    <HealthCheckCard key={check.id} check={check} />
                  ))}
                </AnimatePresence>
              </div>

              {/* Charts */}
              <div className="grid lg:grid-cols-2 gap-4">
                <ResponseTimeChart />
                <RequestsChart />
              </div>
            </TabsContent>

            {/* Web Vitals Tab */}
            <TabsContent value="vitals" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {WEB_VITALS.map(vital => (
                    <WebVitalCard key={vital.name} vital={vital} />
                  ))}
                </AnimatePresence>
              </div>

              {/* Lighthouse-style summary */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full border-4 border-success flex items-center justify-center">
                      <span className="text-xl font-bold text-success">96</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">Score Performance</h3>
                      <p className="text-sm text-muted-foreground">Basé sur les Core Web Vitals et le Lighthouse audit</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Performance', score: 96, color: 'text-success' },
                      { label: 'Accessibilité', score: 91, color: 'text-success' },
                      { label: 'Bonnes pratiques', score: 100, color: 'text-success' },
                      { label: 'SEO', score: 97, color: 'text-success' },
                    ].map(item => (
                      <div key={item.label} className="text-center">
                        <p className={cn("text-2xl font-bold", item.color)}>{item.score}</p>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Tab */}
            <TabsContent value="system" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {SYSTEM_METRICS.map(metric => (
                  <SystemMetricCard key={metric.label} metric={metric} />
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <ResponseTimeChart />
                <ErrorRateChart />
              </div>

              {/* System info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Server className="h-4 w-4 text-primary" />
                    Informations système
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    {[
                      { label: 'Région', value: 'EU West (Paris)' },
                      { label: 'Runtime', value: 'Edge Functions v2' },
                      { label: 'Base de données', value: 'PostgreSQL 15' },
                      { label: 'Cache', value: 'Redis 7.2' },
                      { label: 'CDN', value: 'Cloudflare Enterprise' },
                      { label: 'SSL', value: 'TLS 1.3 (A+)' },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between py-2 border-b border-dashed last:border-0">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {alerts.filter(a => !a.acknowledged).length} alerte(s) non confirmée(s)
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
                    toast({ title: 'Toutes les alertes confirmées' });
                  }}
                >
                  Tout confirmer
                </Button>
              </div>

              <div className="space-y-3">
                {alerts
                  .sort((a, b) => {
                    if (a.acknowledged !== b.acknowledged) return a.acknowledged ? 1 : -1;
                    const priority = { critical: 0, warning: 1, info: 2 };
                    return priority[a.type] - priority[b.type];
                  })
                  .map(alert => (
                    <AlertItem key={alert.id} alert={alert} onAcknowledge={acknowledgeAlert} />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </ChannablePageWrapper>
    </>
  );
}
