import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Mail, 
  Target, 
  DollarSign, 
  Eye, 
  MousePointer, 
  ShoppingCart, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Activity,
  PieChart,
  LineChart,
  BarChart
} from 'lucide-react';
import { useMarketing } from '@/hooks/useMarketing';

interface AnalyticsMetric {
  id: string;
  name: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ElementType;
  color: string;
  target?: number;
  description: string;
}

interface CampaignPerformance {
  id: string;
  name: string;
  type: string;
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roas: number;
  budget: number;
  spent: number;
}

interface AIInsight {
  type: 'opportunity' | 'warning' | 'success';
  title: string;
  description: string;
  action: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
}

export const AdvancedAnalyticsDashboard: React.FC = () => {
  const { stats } = useMarketing();
  
  const [timeRange, setTimeRange] = useState('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['all']);

  const analyticsMetrics: AnalyticsMetric[] = [
    {
      id: 'total_revenue',
      name: 'Revenus Totaux',
      value: '€47,892',
      change: 12.5,
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      target: 50000,
      description: 'Revenus générés par toutes les campagnes'
    },
    {
      id: 'conversion_rate',
      name: 'Taux de Conversion',
      value: '3.2%',
      change: 0.8,
      trend: 'up',
      icon: Target,
      color: 'text-blue-600',
      target: 4,
      description: 'Pourcentage de visiteurs qui convertissent'
    },
    {
      id: 'avg_order_value',
      name: 'Panier Moyen',
      value: '€89.45',
      change: -2.1,
      trend: 'down',
      icon: ShoppingCart,
      color: 'text-purple-600',
      target: 95,
      description: 'Valeur moyenne des commandes'
    },
    {
      id: 'customer_ltv',
      name: 'LTV Client',
      value: '€267.80',
      change: 8.3,
      trend: 'up',
      icon: Users,
      color: 'text-orange-600',
      target: 300,
      description: 'Valeur vie client moyenne'
    },
    {
      id: 'email_open_rate',
      name: 'Taux d\'Ouverture',
      value: '24.8%',
      change: 3.2,
      trend: 'up',
      icon: Mail,
      color: 'text-indigo-600',
      target: 25,
      description: 'Taux d\'ouverture des emails'
    },
    {
      id: 'click_through_rate',
      name: 'CTR Global',
      value: '4.7%',
      change: 1.1,
      trend: 'up',
      icon: MousePointer,
      color: 'text-pink-600',
      target: 5,
      description: 'Taux de clic global toutes campagnes'
    }
  ];

  const campaignPerformance: CampaignPerformance[] = [
    {
      id: '1',
      name: 'Black Friday 2024',
      type: 'Email',
      status: 'active',
      impressions: 45230,
      clicks: 2134,
      conversions: 187,
      ctr: 4.72,
      cpc: 1.25,
      roas: 4.8,
      budget: 2500,
      spent: 1847
    },
    {
      id: '2',
      name: 'Retargeting Q4',
      type: 'Display',
      status: 'active',
      impressions: 123450,
      clicks: 3421,
      conversions: 89,
      ctr: 2.77,
      cpc: 0.89,
      roas: 2.9,
      budget: 3000,
      spent: 2245
    },
    {
      id: '3',
      name: 'Social Media Boost',
      type: 'Social',
      status: 'paused',
      impressions: 67890,
      clicks: 1234,
      conversions: 45,
      ctr: 1.82,
      cpc: 2.15,
      roas: 1.8,
      budget: 1500,
      spent: 890
    }
  ];

  const aiInsights: AIInsight[] = [
    {
      type: 'opportunity',
      title: 'Optimisation Budget Détectée',
      description: 'Vos campagnes email performent 40% mieux que la moyenne. Augmentez le budget de 25% pour maximiser les revenus.',
      action: 'Augmenter budget email',
      impact: 'high',
      confidence: 87
    },
    {
      type: 'warning',
      title: 'Performance Retargeting en Baisse',
      description: 'Le CTR de vos campagnes retargeting a chuté de 15% cette semaine. Vérifiez la fatigue publicitaire.',
      action: 'Rafraîchir créatives',
      impact: 'medium',
      confidence: 92
    },
    {
      type: 'success',
      title: 'Segment High-Value Identifié',
      description: 'Un nouveau segment de clients VIP génère 5x plus de revenus. Créez une campagne dédiée.',
      action: 'Créer campagne VIP',
      impact: 'high',
      confidence: 95
    }
  ];

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
    toast.success('Données actualisées avec succès');
  };

  const handleExportData = () => {
    const csvData = [
      ['Métrique', 'Valeur', 'Changement', 'Tendance'],
      ...analyticsMetrics.map(metric => [
        metric.name,
        metric.value.toString(),
        `${metric.change > 0 ? '+' : ''}${metric.change}%`,
        metric.trend
      ])
    ];
    
    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketing-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Rapport exporté avec succès');
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return ArrowUp;
      case 'down': return ArrowDown;
      default: return Activity;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return TrendingUp;
      case 'warning': return AlertTriangle;
      case 'success': return CheckCircle2;
      default: return Eye;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'success': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Avancées</h2>
          <p className="text-muted-foreground">Vue d'ensemble complète de vos performances marketing</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="1y">1 année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button variant="outline" onClick={handleRefreshData} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analyticsMetrics.map((metric) => {
          const TrendIcon = getTrendIcon(metric.trend);
          const MetricIcon = metric.icon;
          const progress = metric.target ? (parseFloat(metric.value.toString().replace(/[€%,]/g, '')) / metric.target) * 100 : 0;
          
          return (
            <Card key={metric.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.name}
                </CardTitle>
                <MetricIcon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{metric.value}</div>
                <div className="flex items-center justify-between text-xs">
                  <div className={`flex items-center ${getTrendColor(metric.trend)}`}>
                    <TrendIcon className="h-3 w-3 mr-1" />
                    <span>{metric.change > 0 ? '+' : ''}{metric.change}%</span>
                  </div>
                  <span className="text-muted-foreground">vs période précédente</span>
                </div>
                {metric.target && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Objectif: {metric.target}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">{metric.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Campaign Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance par Campagne</CardTitle>
              <CardDescription>Analyse détaillée des performances de chaque campagne</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filtrer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium">Campagne</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Impressions</th>
                  <th className="text-left p-3 font-medium">Clics</th>
                  <th className="text-left p-3 font-medium">CTR</th>
                  <th className="text-left p-3 font-medium">Conversions</th>
                  <th className="text-left p-3 font-medium">ROAS</th>
                  <th className="text-left p-3 font-medium">Budget</th>
                </tr>
              </thead>
              <tbody>
                {campaignPerformance.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                          {campaign.status === 'active' ? 'Actif' : 'Pausé'}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3">{campaign.type}</td>
                    <td className="p-3">{campaign.impressions.toLocaleString()}</td>
                    <td className="p-3">{campaign.clicks.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={campaign.ctr > 3 ? 'text-green-600 font-medium' : ''}>
                        {campaign.ctr}%
                      </span>
                    </td>
                    <td className="p-3">{campaign.conversions}</td>
                    <td className="p-3">
                      <span className={campaign.roas > 3 ? 'text-green-600 font-medium' : campaign.roas < 2 ? 'text-red-600' : ''}>
                        {campaign.roas}x
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <div>€{campaign.spent} / €{campaign.budget}</div>
                        <Progress 
                          value={(campaign.spent / campaign.budget) * 100} 
                          className="h-1 mt-1" 
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Insights IA
          </CardTitle>
          <CardDescription>
            Recommandations intelligentes basées sur l'analyse de vos données
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiInsights.map((insight, index) => {
              const InsightIcon = getInsightIcon(insight.type);
              
              return (
                <div key={index} className="p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getInsightColor(insight.type)}`}>
                      <InsightIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{insight.title}</h4>
                        <Badge variant="outline" className={`text-xs ${
                          insight.impact === 'high' ? 'border-red-200 text-red-600' :
                          insight.impact === 'medium' ? 'border-orange-200 text-orange-600' :
                          'border-yellow-200 text-yellow-600'
                        }`}>
                          {insight.impact} impact
                        </Badge>
                        <span className="text-xs text-muted-foreground">{insight.confidence}% confiance</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                      <Button size="sm" variant="outline">
                        {insight.action}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <PieChart className="h-8 w-8 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">89%</div>
          <div className="text-sm text-muted-foreground">Score Santé Global</div>
        </Card>
        <Card className="text-center p-4">
          <BarChart className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <div className="text-2xl font-bold">+24%</div>
          <div className="text-sm text-muted-foreground">Croissance MoM</div>
        </Card>
        <Card className="text-center p-4">
          <LineChart className="h-8 w-8 mx-auto mb-2 text-blue-600" />
          <div className="text-2xl font-bold">€3.2K</div>
          <div className="text-sm text-muted-foreground">Revenus/Jour</div>
        </Card>
        <Card className="text-center p-4">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
          <div className="text-2xl font-bold">4.8x</div>
          <div className="text-sm text-muted-foreground">ROAS Moyen</div>
        </Card>
      </div>
    </div>
  );
};