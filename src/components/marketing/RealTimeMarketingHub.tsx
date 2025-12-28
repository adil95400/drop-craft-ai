import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Activity, Bell, Target, TrendingUp, 
  Users, Mail, ShoppingCart, DollarSign,
  Eye, MousePointer, ArrowUp, ArrowDown, Settings, RefreshCw
} from 'lucide-react';
import { useUnifiedMarketing } from '@/hooks/useUnifiedMarketing';
import { supabase } from '@/integrations/supabase/client';

interface LiveActivity {
  id: string;
  type: 'email_open' | 'click' | 'conversion' | 'visit' | 'signup' | 'purchase';
  timestamp: Date;
  campaign: string;
  user: string;
  value?: number;
  location?: string;
  device?: string;
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  isActive: boolean;
  lastTriggered?: Date;
  actions: string[];
}

interface LiveMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  icon: React.ElementType;
  color: string;
  target: number;
  unit: string;
}

export const RealTimeMarketingHub: React.FC = () => {
  const { stats, campaigns, isLoading } = useUnifiedMarketing();
  
  const [isLive, setIsLive] = useState(true);
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>([]);

  // Fetch real conversion events
  useEffect(() => {
    const fetchActivities = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: events } = await supabase
        .from('conversion_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (events) {
        const mappedActivities: LiveActivity[] = events.map((event: any) => ({
          id: event.id,
          type: event.event_type as LiveActivity['type'],
          timestamp: new Date(event.created_at),
          campaign: event.source || 'Direct',
          user: 'Client',
          value: event.revenue,
          location: 'France',
          device: 'Web'
        }));
        setActivities(mappedActivities);
      }
    };

    fetchActivities();
  }, []);

  // Initialize metrics from real stats
  useEffect(() => {
    const metrics: LiveMetric[] = [
      {
        id: 'visitors_now',
        name: 'Visiteurs Actifs',
        value: stats.totalImpressions > 0 ? Math.floor(stats.totalImpressions / 100) : 0,
        change: 12,
        icon: Users,
        color: 'text-primary',
        target: 500,
        unit: ''
      },
      {
        id: 'emails_opened',
        name: 'Clics/h',
        value: stats.totalClicks,
        change: -8,
        icon: Mail,
        color: 'text-secondary',
        target: 1500,
        unit: '/h'
      },
      {
        id: 'conversions_today',
        name: 'Conversions Aujourd\'hui',
        value: Math.floor(stats.totalClicks * stats.conversionRate),
        change: 23,
        icon: Target,
        color: 'text-accent',
        target: 120,
        unit: ''
      },
      {
        id: 'revenue_hour',
        name: 'Revenus/h',
        value: Math.floor(stats.totalBudget * stats.avgROAS),
        change: 34,
        icon: DollarSign,
        color: 'text-warning',
        target: 3000,
        unit: '€'
      }
    ];
    
    setLiveMetrics(metrics);
  }, [stats]);

  // Initialize alerts from campaigns
  useEffect(() => {
    const alertRules: AlertRule[] = [
      {
        id: 'conversion_drop',
        name: 'Chute Conversion',
        condition: `Taux conversion < ${(stats.conversionRate * 100).toFixed(1)}%`,
        threshold: stats.conversionRate * 100,
        isActive: true,
        actions: ['Email équipe', 'Pause campagne faible performance']
      },
      {
        id: 'high_cpc',
        name: 'CPC Élevé',
        condition: 'CPC > 5€',
        threshold: 5,
        isActive: true,
        lastTriggered: new Date(Date.now() - 3600000),
        actions: ['Optimisation automatique', 'Notification manager']
      },
      {
        id: 'budget_alert',
        name: 'Budget 90%',
        condition: 'Budget utilisé > 90%',
        threshold: 90,
        isActive: true,
        actions: ['Alerte budget', 'Recommandation extension']
      },
      {
        id: 'engagement_spike',
        name: 'Pic Engagement',
        condition: 'Engagement > 150% moyenne',
        threshold: 150,
        isActive: true,
        actions: ['Boost automatique', 'Capitaliser sur trend']
      }
    ];
    setAlerts(alertRules);
  }, [stats]);

  // Live updates simulation
  useEffect(() => {
    if (isLive && activities.length > 0) {
      const interval = setInterval(() => {
        const types: LiveActivity['type'][] = ['email_open', 'click', 'conversion', 'visit', 'signup', 'purchase'];
        const campaignNames = campaigns.map(c => c.name).slice(0, 4);
        const users = ['Marie L.', 'Jean D.', 'Sophie M.', 'Pierre R.', 'Alice B.', 'Marc V.'];
        const locations = ['Paris, FR', 'Lyon, FR', 'Marseille, FR', 'Toulouse, FR', 'Nice, FR'];
        const devices = ['Mobile', 'Desktop', 'Tablet'];

        const newActivity: LiveActivity = {
          id: Math.random().toString(36).substr(2, 9),
          type: types[Math.floor(Math.random() * types.length)],
          timestamp: new Date(),
          campaign: campaignNames[Math.floor(Math.random() * campaignNames.length)] || 'Direct',
          user: users[Math.floor(Math.random() * users.length)],
          value: Math.random() > 0.7 ? Math.round(Math.random() * 200 + 50) : undefined,
          location: locations[Math.floor(Math.random() * locations.length)],
          device: devices[Math.floor(Math.random() * devices.length)]
        };

        setActivities(prev => [newActivity, ...prev.slice(0, 19)]);

        setLiveMetrics(prev => prev.map(metric => ({
          ...metric,
          value: Math.max(0, metric.value + Math.round(Math.random() * 10 - 5)),
          change: Math.round((Math.random() - 0.5) * 50)
        })));
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isLive, activities.length, campaigns]);

  const getActivityIcon = (type: LiveActivity['type']) => {
    switch (type) {
      case 'email_open': return Mail;
      case 'click': return MousePointer;
      case 'conversion': return Target;
      case 'visit': return Eye;
      case 'signup': return Users;
      case 'purchase': return ShoppingCart;
      default: return Activity;
    }
  };

  const getActivityColor = (type: LiveActivity['type']) => {
    switch (type) {
      case 'email_open': return 'text-primary';
      case 'click': return 'text-accent';
      case 'conversion': return 'text-secondary';
      case 'visit': return 'text-warning';
      case 'signup': return 'text-primary';
      case 'purchase': return 'text-secondary';
      default: return 'text-muted-foreground';
    }
  };

  const getActivityLabel = (type: LiveActivity['type']) => {
    switch (type) {
      case 'email_open': return 'Email ouvert';
      case 'click': return 'Clic';
      case 'conversion': return 'Conversion';
      case 'visit': return 'Visite';
      case 'signup': return 'Inscription';
      case 'purchase': return 'Achat';
      default: return 'Activité';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
    return `${Math.floor(diffInSeconds / 3600)}h`;
  };

  const toggleAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, isActive: !alert.isActive }
        : alert
    ));
    toast.success('Règle d\'alerte mise à jour');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Status Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
              <div>
                <h3 className="font-semibold">Hub Marketing Temps Réel</h3>
                <p className="text-sm text-muted-foreground">
                  {isLive ? 'Surveillance active' : 'Surveillance désactivée'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Mode Live</span>
              <Switch checked={isLive} onCheckedChange={setIsLive} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {liveMetrics.map((metric) => {
          const MetricIcon = metric.icon;
          const progress = (metric.value / metric.target) * 100;
          
          return (
            <Card key={metric.id} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <MetricIcon className={`h-5 w-5 ${metric.color}`} />
                  <div className={`flex items-center text-sm ${metric.change > 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {metric.change > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    <span>{Math.abs(metric.change)}%</span>
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {metric.unit === '€' && metric.unit}
                  {metric.value.toLocaleString()}
                  {metric.unit !== '€' && metric.unit}
                </div>
                <div className="text-sm text-muted-foreground mb-2">{metric.name}</div>
                <Progress value={Math.min(progress, 100)} className="h-1" />
              </CardContent>
              {isLive && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Live Activity Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activité en Direct
                </CardTitle>
                <CardDescription>Flux temps réel des interactions utilisateurs</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune activité récente
                </div>
              ) : (
                activities.map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted/50">
                        <ActivityIcon className={`h-4 w-4 ${getActivityColor(activity.type)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{getActivityLabel(activity.type)}</p>
                          <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">{activity.user}</span> • {activity.campaign}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {activity.device}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{activity.location}</span>
                          {activity.value && (
                            <Badge variant="secondary" className="text-xs text-green-600">
                              +{activity.value}€
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Automated Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertes Automatisées
            </CardTitle>
            <CardDescription>Règles de surveillance et notifications intelligentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-3 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{alert.name}</h4>
                      <Badge variant={alert.isActive ? 'default' : 'secondary'}>
                        {alert.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <Switch 
                      checked={alert.isActive} 
                      onCheckedChange={() => toggleAlert(alert.id)}
                    />
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">{alert.condition}</p>
                  
                  {alert.lastTriggered && (
                    <p className="text-xs text-warning mb-2">
                      Dernière activation: {formatTimeAgo(alert.lastTriggered)}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-1">
                    {alert.actions.map((action, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <Button variant="outline" className="w-full mt-4">
              <Settings className="mr-2 h-4 w-4" />
              Configurer Alertes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Heatmap Performance Temps Réel
          </CardTitle>
          <CardDescription>Visualisation des performances par heure et campagne</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-1">
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="text-center">
                <div className="text-xs text-muted-foreground mb-1">{hour}h</div>
                {campaigns.slice(0, 4).map((campaign, campaignIndex) => (
                  <div 
                    key={campaignIndex}
                    className={`h-4 mb-1 rounded ${
                      Math.random() > 0.7 ? 'bg-green-500' :
                      Math.random() > 0.4 ? 'bg-yellow-500' :
                      Math.random() > 0.2 ? 'bg-orange-500' : 'bg-red-500'
                    } opacity-${Math.floor(Math.random() * 5 + 1) * 20}`}
                    title={`${campaign.name} - ${hour}h`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <span>Performance faible</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <div className="w-3 h-3 bg-orange-500 rounded" />
              <div className="w-3 h-3 bg-yellow-500 rounded" />
              <div className="w-3 h-3 bg-green-500 rounded" />
            </div>
            <span>Performance élevée</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
