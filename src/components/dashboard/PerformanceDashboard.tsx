import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap,
  Eye,
  Users,
  ShoppingCart,
  DollarSign
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { logError } from '@/utils/consoleCleanup';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  previous_value: number;
  target: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  change_percent: number;
}

interface PerformanceData {
  score: number;
  metrics: PerformanceMetric[];
  trends: Array<{ date: string; score: number; revenue: number; conversions: number }>;
  issues: Array<{ 
    id: string; 
    type: 'performance' | 'seo' | 'conversion' | 'technical';
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
    solution: string;
  }>;
}

export function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPerformanceData();
    }
  }, [user]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);

      // Simuler des données de performance
      const mockData: PerformanceData = {
        score: 82,
        metrics: [
          {
            id: '1',
            name: 'Taux de Conversion',
            value: 3.2,
            previous_value: 2.8,
            target: 4.0,
            unit: '%',
            status: 'good',
            trend: 'up',
            change_percent: 14.3
          },
          {
            id: '2',
            name: 'Temps de Chargement',
            value: 2.1,
            previous_value: 2.8,
            target: 1.5,
            unit: 's',
            status: 'warning',
            trend: 'up',
            change_percent: -25
          },
          {
            id: '3',
            name: 'Taux de Rebond',
            value: 45,
            previous_value: 52,
            target: 35,
            unit: '%',
            status: 'good',
            trend: 'down',
            change_percent: -13.5
          },
          {
            id: '4',
            name: 'Score SEO',
            value: 78,
            previous_value: 71,
            target: 90,
            unit: '/100',
            status: 'warning',
            trend: 'up',
            change_percent: 9.9
          },
          {
            id: '5',
            name: 'Satisfaction Client',
            value: 4.6,
            previous_value: 4.3,
            target: 4.8,
            unit: '/5',
            status: 'good',
            trend: 'up',
            change_percent: 7.0
          },
          {
            id: '6',
            name: 'Panier Moyen',
            value: 156.50,
            previous_value: 142.20,
            target: 180.00,
            unit: '€',
            status: 'good',
            trend: 'up',
            change_percent: 10.1
          }
        ],
        trends: [
          { date: '2024-01', score: 75, revenue: 32000, conversions: 245 },
          { date: '2024-02', score: 78, revenue: 35000, conversions: 267 },
          { date: '2024-03', score: 80, revenue: 38000, conversions: 289 },
          { date: '2024-04', score: 82, revenue: 42000, conversions: 312 }
        ],
        issues: [
          {
            id: '1',
            type: 'performance',
            severity: 'high',
            title: 'Images non optimisées',
            description: '23 images dépassent 500KB et ralentissent le site',
            impact: 'Perte de 15% de conversions potentielles',
            solution: 'Compresser et optimiser automatiquement'
          },
          {
            id: '2',
            type: 'seo',
            severity: 'medium',
            title: 'Meta descriptions manquantes',
            description: '45 produits n\'ont pas de meta description',
            impact: 'Réduction de 8% du trafic organique',
            solution: 'Générer automatiquement avec l\'IA'
          },
          {
            id: '3',
            type: 'conversion',
            severity: 'medium',
            title: 'Abandons panier élevés',
            description: '67% d\'abandons au checkout',
            impact: 'Perte de 12% de revenus',
            solution: 'Optimiser le tunnel de commande'
          },
          {
            id: '4',
            type: 'technical',
            severity: 'low',
            title: 'Cache non optimisé',
            description: 'Configuration cache sous-optimale',
            impact: 'Temps de chargement +0.8s',
            solution: 'Activer la compression Gzip et CDN'
          }
        ]
      };

      setData(mockData);
    } catch (error) {
      logError(error as Error, 'Error fetching performance data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-orange-500 bg-orange-50';
      case 'low': return 'border-l-yellow-500 bg-yellow-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Score */}
      <Card className="bg-gradient-to-r from-primary/5 to-blue-500/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Score de Performance Global
            </span>
            <div className={`text-4xl font-bold ${getScoreColor(data?.score || 0)}`}>
              {data?.score}/100
            </div>
          </CardTitle>
          <CardDescription>
            Évaluation complète des performances de votre e-commerce
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={data?.score} className="h-3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">85</div>
                <div className="text-muted-foreground">Technique</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">78</div>
                <div className="text-muted-foreground">SEO</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">82</div>
                <div className="text-muted-foreground">UX</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">74</div>
                <div className="text-muted-foreground">Conversion</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.metrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              <Badge className={getStatusColor(metric.status)}>
                {metric.status === 'good' && 'Bon'}
                {metric.status === 'warning' && 'Attention'}
                {metric.status === 'critical' && 'Critique'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {metric.value}{metric.unit}
                  </div>
                  <div className="flex items-center text-sm">
                    {metric.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : metric.trend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    ) : null}
                    <span className={
                      metric.change_percent > 0 ? 'text-green-600' : 'text-red-600'
                    }>
                      {metric.change_percent > 0 ? '+' : ''}{metric.change_percent}%
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Actuel: {metric.value}{metric.unit}</span>
                    <span>Objectif: {metric.target}{metric.unit}</span>
                  </div>
                  <Progress 
                    value={(metric.value / metric.target) * 100} 
                    className="h-1" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution des Performances</CardTitle>
          <CardDescription>
            Tendances des indicateurs clés sur les 4 derniers mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Score Performance"
              />
              <Line 
                type="monotone" 
                dataKey="conversions" 
                stroke="#82ca9d"
                strokeWidth={2}
                name="Conversions"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Issues & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Problèmes Détectés & Recommandations
          </CardTitle>
          <CardDescription>
            Points d'amélioration identifiés par l'IA avec solutions recommandées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.issues.map((issue) => (
              <div key={issue.id} className={`border-l-4 p-4 rounded-lg ${getSeverityColor(issue.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{issue.title}</h4>
                      <Badge variant={
                        issue.severity === 'high' ? 'destructive' :
                        issue.severity === 'medium' ? 'secondary' : 'outline'
                      }>
                        {issue.severity === 'high' ? 'Critique' :
                         issue.severity === 'medium' ? 'Important' : 'Mineur'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {issue.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{issue.description}</p>
                    <div className="text-sm">
                      <span className="font-medium text-red-600">Impact:</span> {issue.impact}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-green-600">Solution:</span> {issue.solution}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="ml-4">
                    <Zap className="mr-2 h-3 w-3" />
                    Corriger
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}