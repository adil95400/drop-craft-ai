import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Star,
  Calendar,
  DollarSign,
  Users,
  Activity
} from 'lucide-react';
import { useImportUltraPro } from '@/hooks/useImportUltraPro';

export const ImportDashboard = () => {
  const { importedProducts, aiJobs, scheduledImports } = useImportUltraPro();

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    const total = importedProducts.length;
    const published = importedProducts.filter(p => p.status === 'published').length;
    const draft = importedProducts.filter(p => p.status === 'draft').length;
    const pending = importedProducts.filter(p => p.review_status === 'pending').length;
    const approved = importedProducts.filter(p => p.review_status === 'approved').length;
    const rejected = importedProducts.filter(p => p.review_status === 'rejected').length;
    const aiOptimized = importedProducts.filter(p => p.ai_optimized).length;
    const withImages = importedProducts.filter(p => p.image_urls && p.image_urls.length > 0).length;
    const withDescription = importedProducts.filter(p => p.description && p.description.trim().length > 0).length;
    
    // Price analysis
    const prices = importedProducts.filter(p => p.price).map(p => Number(p.price));
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    
    // Quality scores
    const qualityScores = importedProducts.filter(p => p.import_quality_score).map(p => Number(p.import_quality_score));
    const avgQuality = qualityScores.length > 0 ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length : 0;
    
    return {
      total,
      published,
      draft,
      pending,
      approved,
      rejected,
      aiOptimized,
      withImages,
      withDescription,
      avgPrice,
      minPrice,
      maxPrice,
      avgQuality,
      publishedRate: total > 0 ? (published / total) * 100 : 0,
      approvalRate: total > 0 ? (approved / total) * 100 : 0,
      qualityRate: total > 0 ? (withImages / total) * 100 : 0,
      aiOptimizationRate: total > 0 ? (aiOptimized / total) * 100 : 0
    };
  }, [importedProducts]);

  // Category distribution
  const categoryData = useMemo(() => {
    const categories = importedProducts.reduce((acc, product) => {
      const category = product.category || 'Non catégorisé';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [importedProducts]);

  // Status distribution for pie chart
  const statusData = [
    { name: 'Publié', value: stats.published, color: '#10b981' },
    { name: 'Brouillon', value: stats.draft, color: '#f59e0b' },
    { name: 'En attente', value: stats.pending, color: '#6b7280' },
    { name: 'Rejeté', value: stats.rejected, color: '#ef4444' }
  ];

  // Import trend (last 30 days)
  const importTrendData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      const count = importedProducts.filter(p => 
        p.created_at && p.created_at.split('T')[0] === date
      ).length;
      
      return {
        date: new Date(date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        imports: count
      };
    });
  }, [importedProducts]);

  const COLORS = ['#10b981', '#f59e0b', '#6b7280', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Produits</p>
                <p className="text-2xl font-bold">{stats.total}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">+12% ce mois</span>
                </div>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux de Publication</p>
                <p className="text-2xl font-bold">{stats.publishedRate.toFixed(1)}%</p>
                <Progress value={stats.publishedRate} className="mt-2 h-2" />
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Optimisation IA</p>
                <p className="text-2xl font-bold">{stats.aiOptimizationRate.toFixed(1)}%</p>
                <div className="flex items-center mt-1">
                  <Star className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-sm text-purple-500">{stats.aiOptimized} produits</span>
                </div>
              </div>
              <Star className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prix Moyen</p>
                <p className="text-2xl font-bold">€{stats.avgPrice.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  €{stats.minPrice} - €{stats.maxPrice}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Tendance d'Import (30 jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={importTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="imports" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Répartition par Statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Distribution par Catégorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quality & Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Métriques de Qualité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Produits avec images</span>
                <span>{stats.withImages}/{stats.total}</span>
              </div>
              <Progress value={(stats.withImages / stats.total) * 100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Produits avec description</span>
                <span>{stats.withDescription}/{stats.total}</span>
              </div>
              <Progress value={(stats.withDescription / stats.total) * 100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Score qualité moyen</span>
                <span>{stats.avgQuality.toFixed(1)}/10</span>
              </div>
              <Progress value={stats.avgQuality * 10} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertes & Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.pending > 0 && (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">{stats.pending} produits en attente de révision</span>
                </div>
                <Button size="sm" variant="outline">Réviser</Button>
              </div>
            )}
            
            {stats.draft > stats.published && (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Plus de brouillons que de publiés</span>
                </div>
                <Button size="sm" variant="outline">Publier</Button>
              </div>
            )}
            
            {stats.aiOptimizationRate < 50 && (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-purple-50">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Faible taux d'optimisation IA</span>
                </div>
                <Button size="sm" variant="outline">Optimiser</Button>
              </div>
            )}

            <div className="pt-2 border-t">
              <Button className="w-full">
                Rapport Détaillé
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};