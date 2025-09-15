import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logAction, logError } from '@/utils/consoleCleanup';

interface ReportData {
  id: string;
  report_name: string;
  report_type: string;
  status: string;
  created_at: string;
  report_data: any;
}

export function AdvancedReportsCenter() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('reports');
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);

  const [reportConfig, setReportConfig] = useState({
    reportType: 'business_comprehensive',
    dateRange: '30_days',
    includeMetrics: ['revenue', 'customers', 'operations']
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('advanced_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      logError(error as Error, 'Error loading reports');
      toast.error('Erreur lors du chargement des rapports');
    } finally {
      setLoading(false);
    }
  };

  const generateBusinessReport = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('advanced-analytics', {
        body: {
          action: 'generate_business_report',
          ...reportConfig
        }
      });

      if (error) throw error;
      
      toast.success('Rapport généré avec succès !');
      loadReports();
      
    } catch (error) {
      logError(error as Error, 'Error generating report');
      toast.error('Erreur lors de la génération du rapport');
    } finally {
      setGenerating(false);
    }
  };

  const analyzePerformanceTrends = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('advanced-analytics', {
        body: {
          action: 'analyze_performance_trends',
          metrics: ['revenue', 'customers', 'products'],
          period: reportConfig.dateRange
        }
      });

      if (error) throw error;
      
      toast.success('Analyse des tendances terminée !');
      logAction('Trend analysis', data);
      
    } catch (error) {
      logError(error as Error, 'Error analyzing trends');
      toast.error('Erreur lors de l\'analyse des tendances');
    } finally {
      setGenerating(false);
    }
  };

  const generateROIReport = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('advanced-analytics', {
        body: {
          action: 'calculate_roi_metrics',
          investments: ['technology', 'marketing', 'training'],
          period: reportConfig.dateRange
        }
      });

      if (error) throw error;
      
      toast.success('Analyse ROI terminée !');
      logAction('ROI analysis', data);
      
    } catch (error) {
      logError(error as Error, 'Error calculating ROI');
      toast.error('Erreur lors du calcul du ROI');
    } finally {
      setGenerating(false);
    }
  };

  const exportReport = async (reportId: string, format: string = 'pdf') => {
    try {
      const { data, error } = await supabase.functions.invoke('advanced-analytics', {
        body: {
          action: 'export_analytics_data',
          format,
          dataTypes: ['business_metrics', 'operational_data', 'analytics'],
          dateRange: reportConfig.dateRange
        }
      });

      if (error) throw error;
      
      toast.success(`Export ${format.toUpperCase()} généré avec succès !`);
      
      // In a real implementation, you would download the file
      logAction('Export data', data);
      
    } catch (error) {
      logError(error as Error, 'Error exporting report');
      toast.error('Erreur lors de l\'export');
    }
  };

  const reportTypes = [
    { value: 'business_comprehensive', label: 'Rapport Business Complet' },
    { value: 'financial_analysis', label: 'Analyse Financière' },
    { value: 'operational_metrics', label: 'Métriques Opérationnelles' },
    { value: 'market_intelligence', label: 'Intelligence Marché' },
    { value: 'performance_review', label: 'Revue de Performance' }
  ];

  const dateRanges = [
    { value: '7_days', label: '7 derniers jours' },
    { value: '30_days', label: '30 derniers jours' },
    { value: '90_days', label: '3 derniers mois' },
    { value: '1_year', label: '12 derniers mois' },
    { value: 'custom', label: 'Période personnalisée' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'generating': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'generating': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reports">Rapports</TabsTrigger>
          <TabsTrigger value="generator">Générateur</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Rapports Avancés
                  </CardTitle>
                  <CardDescription>
                    Historique de vos rapports et analyses
                  </CardDescription>
                </div>
                <Button onClick={loadReports} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card 
                      key={report.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedReport?.id === report.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedReport(report)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <BarChart3 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium">{report.report_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(report.created_at).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(report.status)}>
                              {getStatusIcon(report.status)}
                              {report.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportReport(report.id, 'pdf');
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun rapport généré pour le moment</p>
                  <p className="text-sm">Utilisez le générateur pour créer votre premier rapport</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Générateur de Rapports
              </CardTitle>
              <CardDescription>
                Créez des rapports personnalisés avec des analyses avancées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="report-type">Type de Rapport</Label>
                  <Select 
                    value={reportConfig.reportType} 
                    onValueChange={(value) => setReportConfig(prev => ({ ...prev, reportType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="date-range">Période d'Analyse</Label>
                  <Select 
                    value={reportConfig.dateRange} 
                    onValueChange={(value) => setReportConfig(prev => ({ ...prev, dateRange: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dateRanges.map(range => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={generateBusinessReport}
                  disabled={generating}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {generating ? 'Génération...' : 'Rapport Business'}
                </Button>
                
                <Button 
                  onClick={analyzePerformanceTrends}
                  disabled={generating}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Analyse Tendances
                </Button>
                
                <Button 
                  onClick={generateROIReport}
                  disabled={generating}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  Analyse ROI
                </Button>
              </div>

              {generating && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Génération en cours...</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <Progress value={45} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Revenus Totaux</p>
                    <p className="text-2xl font-bold">€245,000</p>
                  </div>
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs text-green-600">
                    +18.5% ce mois
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Clients Actifs</p>
                    <p className="text-2xl font-bold">2,450</p>
                  </div>
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs text-blue-600">
                    +12.3% ce mois
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">ROI Global</p>
                    <p className="text-2xl font-bold">182%</p>
                  </div>
                  <Target className="h-5 w-5 text-purple-600" />
                </div>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs text-purple-600">
                    Excellent
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Efficacité</p>
                    <p className="text-2xl font-bold">89%</p>
                  </div>
                  <Activity className="h-5 w-5 text-orange-600" />
                </div>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs text-orange-600">
                    +5.2% ce mois
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tendances de Revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">Graphique des revenus</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance par Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Technologie & IA', value: 78, color: 'bg-blue-500' },
                    { name: 'Marketing & Ventes', value: 65, color: 'bg-green-500' },
                    { name: 'Opérations', value: 89, color: 'bg-purple-500' },
                    { name: 'Support Client', value: 94, color: 'bg-orange-500' }
                  ].map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.name}</span>
                        <span className="font-medium">{item.value}%</span>
                      </div>
                      <Progress value={item.value} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Insights Clés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      type: 'success',
                      title: 'Croissance exceptionnelle',
                      description: 'Vos revenus croissent 18.5% plus vite que la moyenne du secteur',
                      action: 'Analysez les facteurs de succès'
                    },
                    {
                      type: 'warning',
                      title: 'Opportunité d\'automatisation',
                      description: '23% de tâches répétitives pourraient être automatisées',
                      action: 'Créer des workflows d\'automatisation'
                    },
                    {
                      type: 'info',
                      title: 'Tendance client positive',
                      description: 'Satisfaction client en hausse de 12% ce trimestre',
                      action: 'Capitaliser sur cette amélioration'
                    }
                  ].map((insight, index) => (
                    <Card key={index} className="border-l-4 border-l-primary">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            {insight.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                            {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                            {insight.type === 'info' && <Activity className="h-5 w-5 text-blue-600" />}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium mb-1">{insight.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                            <Button variant="outline" size="sm">
                              {insight.action}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}