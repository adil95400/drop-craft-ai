import React, { useState, useEffect } from 'react';
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

interface RealTimeMetric {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  format: 'currency' | 'number' | 'percentage';
  trend: 'up' | 'down' | 'stable';
  change: number;
  icon: any;
  color: string;
}

interface RealTimeEvent {
  id: string;
  type: 'sale' | 'visitor' | 'signup' | 'product_view';
  message: string;
  value?: number;
  timestamp: Date;
  location?: string;
}

export function RealTimeAnalytics() {
  const [metrics, setMetrics] = useState<RealTimeMetric[]>([]);
  const [events, setEvents] = useState<RealTimeEvent[]>([]);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    // Initialiser les métriques
    const initialMetrics: RealTimeMetric[] = [
      {
        id: 'revenue',
        label: 'CA Temps Réel',
        value: 2847.50,
        previousValue: 2690.20,
        format: 'currency',
        trend: 'up',
        change: 5.8,
        icon: DollarSign,
        color: 'text-green-600'
      },
      {
        id: 'visitors',
        label: 'Visiteurs Actifs',
        value: 127,
        previousValue: 98,
        format: 'number',
        trend: 'up',
        change: 29.6,
        icon: Users,
        color: 'text-blue-600'
      },
      {
        id: 'conversion',
        label: 'Taux de Conversion',
        value: 3.8,
        previousValue: 3.2,
        format: 'percentage',
        trend: 'up',
        change: 18.7,
        icon: TrendingUp,
        color: 'text-purple-600'
      },
      {
        id: 'cart_abandonment',
        label: 'Abandon Panier',
        value: 68.2,
        previousValue: 72.1,
        format: 'percentage',
        trend: 'down',
        change: -5.4,
        icon: ShoppingCart,
        color: 'text-orange-600'
      }
    ];

    setMetrics(initialMetrics);

    // Simuler les événements en temps réel
    const eventInterval = setInterval(() => {
      if (isLive) {
        generateRandomEvent();
        updateMetrics();
      }
    }, 3000 + Math.random() * 4000); // Entre 3-7 secondes

    return () => clearInterval(eventInterval);
  }, [isLive]);

  const generateRandomEvent = () => {
    const eventTypes = [
      {
        type: 'sale' as const,
        messages: [
          'Nouvelle commande de €{value} depuis Paris',
          'Vente de €{value} confirmée - Lyon',
          'Commande €{value} finalisée - Marseille',
          'Achat de €{value} depuis Toulouse'
        ],
        valueRange: [25, 350]
      },
      {
        type: 'visitor' as const,
        messages: [
          'Nouveau visiteur depuis {location}',
          'Visiteur actif de {location}',
          'Session démarrée depuis {location}'
        ],
        locations: ['France', 'Belgique', 'Suisse', 'Canada', 'Allemagne']
      },
      {
        type: 'product_view' as const,
        messages: [
          'Produit "Smart Watch Pro" consulté',
          'Produit "Gaming Headset" vu 5x',
          'Article "Wireless Charger" populaire',
          'Produit "Fitness Tracker" en tendance'
        ]
      },
      {
        type: 'signup' as const,
        messages: [
          'Nouvelle inscription newsletter',
          'Nouveau compte client créé',
          'Inscription compte pro'
        ]
      }
    ];

    const selectedType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const message = selectedType.messages[Math.floor(Math.random() * selectedType.messages.length)];
    
    let finalMessage = message;
    let eventValue = undefined;

    if (selectedType.type === 'sale' && 'valueRange' in selectedType) {
      eventValue = Math.floor(
        Math.random() * (selectedType.valueRange[1] - selectedType.valueRange[0]) 
        + selectedType.valueRange[0]
      );
      finalMessage = message.replace('{value}', eventValue.toString());
    }

    if ('locations' in selectedType) {
      const location = selectedType.locations[Math.floor(Math.random() * selectedType.locations.length)];
      finalMessage = message.replace('{location}', location);
    }

    const newEvent: RealTimeEvent = {
      id: Date.now().toString(),
      type: selectedType.type,
      message: finalMessage,
      value: eventValue,
      timestamp: new Date()
    };

    setEvents(prev => [newEvent, ...prev.slice(0, 9)]); // Garder seulement les 10 derniers
  };

  const updateMetrics = () => {
    setMetrics(prev => prev.map(metric => {
      // Simuler de légères variations
      const variation = (Math.random() - 0.5) * 0.1; // ±5%
      const newValue = Math.max(0, metric.value * (1 + variation));
      const change = ((newValue - metric.previousValue) / metric.previousValue) * 100;

      return {
        ...metric,
        value: Number(newValue.toFixed(metric.format === 'currency' ? 2 : 1)),
        change: Number(change.toFixed(1)),
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
      };
    }));
  };

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
          const Icon = metric.icon;
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