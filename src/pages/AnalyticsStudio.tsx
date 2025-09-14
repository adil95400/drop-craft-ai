import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AdvancedReportsCenter } from '@/components/analytics/AdvancedReportsCenter';
import { PredictiveInsights } from '@/components/analytics/PredictiveInsights';
import { useRealAnalytics } from '@/hooks/useRealAnalytics';
import { usePriorityInsights, useInsightMetrics } from '@/hooks/useBusinessIntelligence';
import {
  BarChart3,
  Brain,
  FileText,
  TrendingUp,
  Target,
  Sparkles,
  DollarSign,
  Users,
  Package,
  Activity,
  Zap,
  Eye
} from 'lucide-react';

export default function AnalyticsStudio() {
  const [activeTab, setActiveTab] = useState('reports');
  const { analytics, isLoading } = useRealAnalytics();
  const { data: insights } = usePriorityInsights();
  const { data: metrics } = useInsightMetrics();

  const analyticsFeatures = [
    {
      id: 'reports',
      name: 'Centre de Rapports',
      icon: FileText,
      description: 'Générez des rapports avancés et des analyses détaillées',
      color: 'text-blue-600',
      badge: 'Business'
    },
    {
      id: 'predictive',
      name: 'IA Prédictive',
      icon: Brain,
      description: 'Prédictions et insights basés sur l\'intelligence artificielle',
      color: 'text-purple-600',
      badge: 'IA'
    },
    {
      id: 'realtime',
      name: 'Analytics Temps Réel',
      icon: Activity,
      description: 'Surveillez vos métriques en temps réel',
      color: 'text-green-600',
      badge: 'Live'
    }
  ];

  const stats = [
    {
      label: 'Rapports Générés',
      value: analytics?.orders?.toString() || '0',
      icon: FileText,
      change: '+23'
    },
    {
      label: 'Prédictions IA',
      value: insights?.length?.toString() || '0',
      icon: Brain,
      change: '+12'
    },
    {
      label: 'Insights Actionnables',
      value: metrics?.totalInsights?.toString() || '0',
      icon: Target,
      change: '+8'
    },
    {
      label: 'ROI Moyen',
      value: analytics?.conversionRate ? `${analytics.conversionRate}%` : '0%',
      icon: TrendingUp,
      change: '+15%'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Analytics Studio
          </h1>
          <p className="text-muted-foreground mt-1">
            Suite complète d'outils d'analyse avancée et de business intelligence
          </p>
        </div>
        <Badge variant="default" className="flex items-center gap-1">
          <Sparkles className="h-4 w-4" />
          Powered by Advanced AI
        </Badge>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <Badge variant="outline" className="text-xs text-green-600">
                      {stat.change}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Navigation des fonctionnalités */}
      <Card>
        <CardHeader>
          <CardTitle>Fonctionnalités Analytics Avancées</CardTitle>
          <CardDescription>
            Explorez nos outils d'analyse et de business intelligence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analyticsFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    activeTab === feature.id
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setActiveTab(feature.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                      <Badge variant="outline" className="text-xs">
                        {feature.badge}
                      </Badge>
                    </div>
                    <h3 className="font-medium mb-2">{feature.name}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contenu principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Rapports
          </TabsTrigger>
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            IA Prédictive
          </TabsTrigger>
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Temps Réel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Centre de Rapports Avancés
              </CardTitle>
              <CardDescription>
                Générez des rapports personnalisés avec des analyses approfondies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvancedReportsCenter />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Intelligence Artificielle Prédictive
              </CardTitle>
              <CardDescription>
                Prédictions et insights basés sur l'analyse de vos données
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PredictiveInsights />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <div className="grid gap-6">
            {/* Real-time metrics overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Revenus Aujourd'hui</p>
                      <p className="text-2xl font-bold">€{analytics?.revenue ? (analytics.revenue / 100).toFixed(0) : '0'}</p>
                    </div>
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs text-green-600">
                      +12.3% vs hier
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Visiteurs Actuels</p>
                      <p className="text-2xl font-bold">{analytics?.customers || 0}</p>
                    </div>
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs text-blue-600">
                      en temps réel
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Commandes/Heure</p>
                      <p className="text-2xl font-bold">{Math.round((analytics?.orders || 0) / 24)}</p>
                    </div>
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs text-purple-600">
                      +8% cette heure
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Conversion</p>
                      <p className="text-2xl font-bold">{analytics?.conversionRate ? `${analytics.conversionRate}%` : '0%'}</p>
                    </div>
                    <Target className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs text-orange-600">
                      +0.3% aujourd'hui
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Real-time charts placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Trafic en Temps Réel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <Activity className="h-8 w-8 mx-auto mb-2 text-primary animate-pulse" />
                      <p className="text-muted-foreground">Graphique temps réel du trafic</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activité des Ventes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600 animate-pulse" />
                      <p className="text-muted-foreground">Graphique temps réel des ventes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Real-time alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Alertes Temps Réel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      type: 'success',
                      message: 'Pic de trafic détecté - +45% vs moyenne',
                      time: 'Il y a 2 minutes'
                    },
                    {
                      type: 'info',
                      message: 'Nouveau record de ventes journalières atteint',
                      time: 'Il y a 15 minutes'
                    },
                    {
                      type: 'warning',
                      message: 'Stock faible détecté sur produit populaire',
                      time: 'Il y a 23 minutes'
                    }
                  ].map((alert, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        alert.type === 'success' ? 'bg-green-500' : 
                        alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">{alert.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer avec conseils */}
      <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-1">Conseils pour optimiser vos analyses</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Configurez des rapports automatiques pour un suivi régulier</li>
                <li>• Utilisez l'IA prédictive pour anticiper les tendances du marché</li>
                <li>• Surveillez les métriques temps réel pour réagir rapidement</li>
                <li>• Exportez vos données pour des analyses approfondies</li>
                <li>• Créez des dashboards personnalisés pour votre équipe</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}