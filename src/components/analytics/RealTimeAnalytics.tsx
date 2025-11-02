import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  ShoppingCart, 
  DollarSign, 
  Users,
  Activity,
  Zap,
  Clock
} from 'lucide-react';
import { useRealTimeMetrics } from '@/hooks/useRealTimeMetrics';

export function RealTimeAnalytics() {
  const { metrics, events, isLive, setIsLive, isLoading } = useRealTimeMetrics();

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return `€${value.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`;
      case 'percentage':
        return `${value}%`;
      default:
        return value.toLocaleString('fr-FR');
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'sale': return '💰';
      case 'visitor': return '👤';
      case 'product_view': return '👁️';
      case 'signup': return '✨';
      default: return '📊';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'sale': return 'border-green-200 bg-green-50';
      case 'visitor': return 'border-blue-200 bg-blue-50';
      case 'product_view': return 'border-purple-200 bg-purple-50';
      case 'signup': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      DollarSign,
      Users,
      TrendingUp,
      ShoppingCart
    };
    return icons[iconName] || Activity;
  };

  if (isLoading && metrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chargement...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Activity className="h-5 w-5 mr-2 text-primary" />
          <h3 className="text-lg font-semibold">Analytics Temps Réel</h3>
          <Badge 
            variant={isLive ? "default" : "secondary"} 
            className="ml-2"
          >
            {isLive ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                LIVE
              </>
            ) : (
              'PAUSE'
            )}
          </Badge>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isLive ? 'Mettre en pause' : 'Reprendre'}
        </button>
      </div>

      {/* Métriques temps réel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.color === 'text-green-600' ? DollarSign :
                       metric.color === 'text-blue-600' ? Users :
                       metric.color === 'text-purple-600' ? TrendingUp :
                       ShoppingCart;
          return (
            <Card key={metric.id} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatValue(metric.value, metric.format)}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {metric.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : metric.trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  ) : null}
                  <span className={
                    metric.trend === 'up' ? 'text-green-600' : 
                    metric.trend === 'down' ? 'text-red-600' : 
                    'text-muted-foreground'
                  }>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                  <span className="ml-1">vs hier</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Flux d'activité en temps réel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Activité en Temps Réel
          </CardTitle>
          <CardDescription>
            Flux en direct de votre boutique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {events.length > 0 ? events.map((event) => (
              <div 
                key={event.id} 
                className={`flex items-center justify-between p-3 rounded-lg border ${getEventColor(event.type)} animate-in slide-in-from-top-2 duration-300`}
              >
                <div className="flex items-center">
                  <span className="text-lg mr-3">{getEventIcon(event.type)}</span>
                  <div>
                    <p className="text-sm font-medium">{event.message}</p>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {event.timestamp.toLocaleTimeString('fr-FR')}
                    </p>
                  </div>
                </div>
                {event.value && (
                  <Badge variant="outline" className="bg-white">
                    €{event.value}
                  </Badge>
                )}
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>En attente d'activité en temps réel...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progression quotidienne */}
      <Card>
        <CardHeader>
          <CardTitle>Progression Quotidienne</CardTitle>
          <CardDescription>
            Objectifs vs réalisations du jour
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Chiffre d'affaires (€2,847 / €3,000)</span>
              <span className="font-medium">95%</span>
            </div>
            <Progress value={95} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Commandes (23 / 25)</span>
              <span className="font-medium">92%</span>
            </div>
            <Progress value={92} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Nouveaux visiteurs (127 / 150)</span>
              <span className="font-medium">85%</span>
            </div>
            <Progress value={85} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}