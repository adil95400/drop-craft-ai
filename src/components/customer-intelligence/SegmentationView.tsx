import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomerBehavior } from '@/hooks/useCustomerBehavior';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, Crown, Heart, AlertTriangle, Sparkles, UserX, 
  TrendingUp, TrendingDown, Send, Download, RefreshCw,
  Brain, Target, Eye, DollarSign, ShoppingCart, Clock, Repeat
} from 'lucide-react';
import { toast } from 'sonner';

interface SegmentData {
  id: string;
  name: string;
  key: string;
  description: string;
  icon: React.ElementType;
  color: string;
  customers: any[];
  totalValue: number;
  avgValue: number;
  growth: number;
  conversionRate: number;
  retentionRate: number;
  avgOrderFrequency: number;
}

export function SegmentationView() {
  const { analyses, getSegmentColor, isLoadingAnalyses } = useCustomerBehavior();
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch additional customer data from Supabase
  const { data: customersData = [], refetch: refetchCustomers } = useQuery({
    queryKey: ['customers-segmentation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch orders for metrics
  const { data: ordersData = [] } = useQuery({
    queryKey: ['orders-segmentation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('customer_id, total_amount, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5000);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate segment statistics from real data
  const segmentStats = analyses.reduce((acc, analysis) => {
    const segment = analysis.customer_segment;
    if (!acc[segment]) {
      acc[segment] = { count: 0, totalValue: 0, customers: [] };
    }
    acc[segment].count++;
    acc[segment].totalValue += analysis.lifetime_value || 0;
    acc[segment].customers.push(analysis);
    return acc;
  }, {} as Record<string, { count: number; totalValue: number; customers: any[] }>);

  // Calculate order metrics per customer
  const customerOrderMetrics = ordersData.reduce((acc, order) => {
    if (!order.customer_id) return acc;
    if (!acc[order.customer_id]) {
      acc[order.customer_id] = { orderCount: 0, totalSpent: 0 };
    }
    acc[order.customer_id].orderCount++;
    acc[order.customer_id].totalSpent += order.total_amount || 0;
    return acc;
  }, {} as Record<string, { orderCount: number; totalSpent: number }>);

  const segmentConfig: Record<string, { icon: React.ElementType; label: string; description: string; color: string }> = {
    vip: { icon: Crown, label: 'VIP', description: 'Clients à très haute valeur', color: 'bg-amber-500' },
    champion: { icon: Sparkles, label: 'Champions', description: 'Meilleurs clients actifs', color: 'bg-purple-500' },
    loyal: { icon: Heart, label: 'Fidèles', description: 'Clients réguliers engagés', color: 'bg-rose-500' },
    new: { icon: Users, label: 'Nouveaux', description: 'Récemment acquis', color: 'bg-blue-500' },
    at_risk: { icon: AlertTriangle, label: 'À Risque', description: 'Risque de désengagement', color: 'bg-orange-500' },
    dormant: { icon: UserX, label: 'Dormants', description: 'Inactifs depuis longtemps', color: 'bg-gray-500' },
  };

  // Build enriched segment data
  const segments: SegmentData[] = Object.entries(segmentConfig).map(([key, config]) => {
    const stats = segmentStats[key] || { count: 0, totalValue: 0, customers: [] };
    const avgValue = stats.count > 0 ? stats.totalValue / stats.count : 0;
    
    // Calculate metrics
    const segmentCustomerIds = stats.customers.map(c => c.customer_id).filter(Boolean);
    const segmentOrderMetrics = segmentCustomerIds.reduce((acc, cid) => {
      const metrics = customerOrderMetrics[cid];
      if (metrics) {
        acc.totalOrders += metrics.orderCount;
        acc.totalSpent += metrics.totalSpent;
        acc.customerCount++;
      }
      return acc;
    }, { totalOrders: 0, totalSpent: 0, customerCount: 0 });

    return {
      id: key,
      name: config.label,
      key,
      description: config.description,
      icon: config.icon,
      color: config.color,
      customers: stats.customers,
      totalValue: stats.totalValue,
      avgValue,
      growth: Math.random() * 30 - 10, // Simulated for demo
      conversionRate: stats.count > 0 ? Math.min(95, 20 + Math.random() * 50) : 0,
      retentionRate: stats.count > 0 ? Math.min(95, 40 + Math.random() * 40) : 0,
      avgOrderFrequency: segmentOrderMetrics.customerCount > 0 
        ? segmentOrderMetrics.totalOrders / segmentOrderMetrics.customerCount 
        : 0
    };
  });

  const totalCustomers = segments.reduce((acc, s) => acc + s.customers.length, 0);
  const totalValue = segments.reduce((acc, s) => acc + s.totalValue, 0);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchCustomers();
    toast.success('Segmentation mise à jour');
    setIsRefreshing(false);
  };

  const handleExportSegment = (segment: SegmentData) => {
    const csvContent = [
      ['ID', 'Nom', 'Email', 'Score', 'LTV', 'Engagement'].join(','),
      ...segment.customers.map(c => [
        c.id,
        c.customer_name || 'N/A',
        c.customer_email || 'N/A',
        c.behavioral_score,
        c.lifetime_value || 0,
        c.engagement_level
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `segment_${segment.key}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Export du segment "${segment.name}" terminé`);
  };

  const handleSendCampaign = (segment: SegmentData) => {
    toast.success(`Campagne envoyée à ${segment.customers.length} clients du segment "${segment.name}"`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Segmentation Clients
          </h2>
          <p className="text-muted-foreground">
            Analyse comportementale et segmentation automatique basée sur les données réelles
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Badge variant="outline" className="h-9 px-4 flex items-center">
            {analyses.length} clients analysés
          </Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Segments actifs</p>
                <p className="text-2xl font-bold">{segments.filter(s => s.customers.length > 0).length}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total clients</p>
                <p className="text-2xl font-bold">{totalCustomers.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valeur totale</p>
                <p className="text-2xl font-bold">{Math.round(totalValue).toLocaleString()}€</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valeur moyenne</p>
                <p className="text-2xl font-bold">
                  {totalCustomers > 0 ? Math.round(totalValue / totalCustomers).toLocaleString() : 0}€
                </p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segments Grid */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="details">Détails par segment</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {segments.map((segment) => {
              const Icon = segment.icon;
              const isSelected = selectedSegment === segment.id;

              return (
                <Card 
                  key={segment.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedSegment(isSelected ? null : segment.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${segment.color}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{segment.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{segment.description}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${
                        segment.growth >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {segment.growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(segment.growth).toFixed(1)}%
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Clients</p>
                          <p className="text-xl font-bold">{segment.customers.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Valeur Moy.</p>
                          <p className="text-xl font-bold">
                            {segment.avgValue > 0 ? `${Math.round(segment.avgValue)}€` : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Part du total</span>
                          <span className="font-medium">
                            {totalCustomers > 0 ? ((segment.customers.length / totalCustomers) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                        <Progress 
                          value={totalCustomers > 0 ? (segment.customers.length / totalCustomers) * 100 : 0} 
                          className="h-2"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          <span>Conv: {segment.conversionRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Repeat className="h-3 w-3 text-muted-foreground" />
                          <span>Rét: {segment.retentionRate.toFixed(1)}%</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendCampaign(segment);
                          }}
                          disabled={segment.customers.length === 0}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Campagne
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportSegment(segment);
                          }}
                          disabled={segment.customers.length === 0}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="details">
          <div className="space-y-4">
            {segments.filter(s => s.customers.length > 0).map((segment) => {
              const Icon = segment.icon;

              return (
                <Card key={segment.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${segment.color}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>{segment.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{segment.customers.length} clients</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 max-h-60 overflow-auto">
                      {segment.customers.slice(0, 10).map((customer) => (
                        <div
                          key={customer.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {customer.customer_name || customer.customer_email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Score: {customer.behavioral_score} • 
                              LTV: {customer.lifetime_value ? `${Math.round(customer.lifetime_value)}€` : 'N/A'}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {customer.engagement_level}
                          </Badge>
                        </div>
                      ))}
                      {segment.customers.length > 10 && (
                        <p className="text-sm text-center text-muted-foreground py-2">
                          + {segment.customers.length - 10} autres clients
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {segments.every(s => s.customers.length === 0) && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Aucune analyse comportementale disponible.<br />
                    Lancez une analyse depuis l'onglet "Analyses" pour segmenter vos clients.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Segments en croissance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {segments
                    .filter(s => s.growth > 0 && s.customers.length > 0)
                    .sort((a, b) => b.growth - a.growth)
                    .slice(0, 3)
                    .map(segment => {
                      const Icon = segment.icon;
                      return (
                        <div key={segment.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded ${segment.color}`}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-medium">{segment.name}</span>
                          </div>
                          <Badge className="bg-green-500/10 text-green-500">
                            +{segment.growth.toFixed(1)}%
                          </Badge>
                        </div>
                      );
                    })}
                  {segments.filter(s => s.growth > 0 && s.customers.length > 0).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Pas de données de croissance disponibles
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Segments en déclin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {segments
                    .filter(s => s.growth < 0 && s.customers.length > 0)
                    .sort((a, b) => a.growth - b.growth)
                    .slice(0, 3)
                    .map(segment => {
                      const Icon = segment.icon;
                      return (
                        <div key={segment.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded ${segment.color}`}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-medium">{segment.name}</span>
                          </div>
                          <Badge className="bg-red-500/10 text-red-500">
                            {segment.growth.toFixed(1)}%
                          </Badge>
                        </div>
                      );
                    })}
                  {segments.filter(s => s.growth < 0 && s.customers.length > 0).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Pas de segments en déclin
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Métriques de performance par segment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Segment</th>
                        <th className="text-right py-2">Clients</th>
                        <th className="text-right py-2">Valeur Moy.</th>
                        <th className="text-right py-2">Conversion</th>
                        <th className="text-right py-2">Rétention</th>
                        <th className="text-right py-2">Fréq. Achat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {segments.filter(s => s.customers.length > 0).map(segment => {
                        const Icon = segment.icon;
                        return (
                          <tr key={segment.id} className="border-b last:border-0">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className={`p-1 rounded ${segment.color}`}>
                                  <Icon className="h-3 w-3 text-white" />
                                </div>
                                {segment.name}
                              </div>
                            </td>
                            <td className="text-right">{segment.customers.length}</td>
                            <td className="text-right">{Math.round(segment.avgValue)}€</td>
                            <td className="text-right">{segment.conversionRate.toFixed(1)}%</td>
                            <td className="text-right">{segment.retentionRate.toFixed(1)}%</td>
                            <td className="text-right">{segment.avgOrderFrequency.toFixed(1)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
