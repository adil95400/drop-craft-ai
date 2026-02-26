/**
 * Page Rapports - Style Channable
 * Actions via FastAPI + jobs
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Download, FileText, TrendingUp, DollarSign, Package, Users, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useReports } from '@/hooks/useReports';
import { format } from 'date-fns';
import { getDateFnsLocale } from '@/utils/dateFnsLocale';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import {
  ChannableStatsGrid,
  ChannableQuickActions
} from '@/components/channable';
import { ChannableStat, ChannableQuickAction } from '@/components/channable/types';
import { useToast } from '@/hooks/use-toast';
import { PDFExportButton } from '@/components/reports/PDFExportButton';
// Reports now use Supabase directly via useReports hook

export default function ReportsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState('30');
  const [reportType, setReportType] = useState('sales');
  const [isGeneratingViaApi, setIsGeneratingViaApi] = useState(false);
  
  const { 
    recentReports, 
    scheduledReports, 
    customReports,
    fetchStats,
    generateReport,
    deleteReport,
    exportReport,
    isGenerating,
    isLoading
  } = useReports();

  const { data: stats, refetch } = useQuery({
    queryKey: ['reports-stats', dateRange],
    queryFn: () => fetchStats(parseInt(dateRange)),
  });

  const handleGenerateReport = async () => {
    setIsGeneratingViaApi(true);
    generateReport({ reportType, dateRange });
    setIsGeneratingViaApi(false);
  };

  const formatReportData = (data: Record<string, unknown>) => {
    return Object.entries(data).map(([key, value]) => ({
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      value: typeof value === 'number' 
        ? value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
        : JSON.stringify(value)
    }));
  };

  const channableStats: ChannableStat[] = [
    {
      label: 'Revenus',
      value: (stats?.revenue || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
      icon: DollarSign,
      color: 'success',
      change: stats?.revenueChange,
      trend: (stats?.revenueChange || 0) >= 0 ? 'up' : 'down',
      changeLabel: 'vs période précédente',
      onClick: () => navigate('/analytics')
    },
    {
      label: 'Commandes',
      value: (stats?.orders || 0).toString(),
      icon: TrendingUp,
      color: 'primary',
      changeLabel: `${dateRange} derniers jours`,
      onClick: () => navigate('/orders')
    },
    {
      label: 'Produits',
      value: (stats?.products || 0).toString(),
      icon: Package,
      color: 'info',
      changeLabel: 'en catalogue',
      onClick: () => navigate('/products')
    },
    {
      label: 'Clients',
      value: (stats?.customers || 0).toString(),
      icon: Users,
      color: 'warning',
      changeLabel: 'actifs',
      onClick: () => navigate('/customers')
    }
  ];

  const quickActions: ChannableQuickAction[] = [
    {
      id: 'generate',
      label: 'Générer rapport',
      icon: BarChart3,
      onClick: handleGenerateReport,
      variant: 'primary'
    },
    {
      id: 'refresh',
      label: 'Actualiser',
      icon: RefreshCw,
      onClick: () => {
        refetch();
        toast({ title: 'Statistiques actualisées' });
      },
      description: 'Sync'
    },
    {
      id: 'export',
      label: 'Exporter tout',
      icon: Download,
      onClick: async () => {
        toast({ title: 'Export en cours', description: 'Tous les rapports seront exportés' });
      },
      description: 'CSV/Excel'
    }
  ];

  return (
    <ChannablePageWrapper
      title="Rapports"
      subtitle="Business Intelligence"
      description="Consultez vos rapports de performance, générez des analyses personnalisées et suivez vos KPIs."
      heroImage="analytics"
      badge={{
        label: `${recentReports.length + scheduledReports.length + customReports.length} rapports`,
        icon: BarChart3
      }}
      actions={
        <div className="flex gap-2">
          <PDFExportButton
            title="Rapport Analytics ShopOpti"
            subtitle={`Période: ${dateRange} jours`}
            data={[
              { 
                metric: 'Revenus', 
                value: (stats?.revenue || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
                trend: stats?.revenueChange ? `${stats.revenueChange > 0 ? '+' : ''}${stats.revenueChange}%` : 'N/A'
              },
              { metric: 'Commandes', value: stats?.orders || 0, trend: 'N/A' },
              { metric: 'Produits', value: stats?.products || 0, trend: 'N/A' },
              { metric: 'Clients', value: stats?.customers || 0, trend: 'N/A' },
            ]}
            columns={[
              { key: 'metric', label: 'Métrique' },
              { key: 'value', label: 'Valeur' },
              { key: 'trend', label: 'Évolution' },
            ]}
            summary={[
              { label: 'Période analysée', value: `${dateRange} jours` },
              { label: 'Date du rapport', value: new Date().toLocaleDateString('fr-FR') },
            ]}
          />
          <Button onClick={handleGenerateReport} className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Générer rapport
          </Button>
          <Button variant="outline" onClick={() => { refetch(); toast({ title: 'Actualisé' }); }} className="gap-2 bg-background/80 backdrop-blur">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      }
    >
      {/* Stats Grid */}
      <ChannableStatsGrid stats={channableStats} columns={4} compact />

      {/* Quick Actions */}
      <ChannableQuickActions actions={quickActions} variant="compact" />

      {/* Report Generator */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Générateur de Rapports
          </CardTitle>
          <CardDescription>Créez des rapports personnalisés</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type de rapport</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Ventes</SelectItem>
                  <SelectItem value="products">Produits</SelectItem>
                  <SelectItem value="customers">Clients</SelectItem>
                  <SelectItem value="inventory">Inventaire</SelectItem>
                  <SelectItem value="profit">Rentabilité</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Période</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 derniers jours</SelectItem>
                  <SelectItem value="30">30 derniers jours</SelectItem>
                  <SelectItem value="90">90 derniers jours</SelectItem>
                  <SelectItem value="365">1 an</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <Button onClick={handleGenerateReport} className="w-full" disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <BarChart3 className="h-4 w-4 mr-2" />
                )}
                Générer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Rapports Disponibles
          </CardTitle>
          <CardDescription>Consultez vos rapports générés</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recent" className="space-y-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="recent">Récents ({recentReports.length})</TabsTrigger>
              <TabsTrigger value="scheduled">Programmés ({scheduledReports.length})</TabsTrigger>
              <TabsTrigger value="custom">Tous ({customReports.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : recentReports.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun rapport récent</p>
                  <p className="text-sm mt-2">Générez votre premier rapport</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentReports.map((report) => (
                    <ReportCard 
                      key={report.id} 
                      report={report} 
                      onExport={() => exportReport(report)}
                      onDelete={() => deleteReport(report.id)}
                      formatData={formatReportData}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4">
              {scheduledReports.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun rapport programmé</p>
                  <p className="text-sm mt-2">Configurez des rapports automatiques</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledReports.map((report) => (
                    <ReportCard 
                      key={report.id} 
                      report={report} 
                      onExport={() => exportReport(report)}
                      onDelete={() => deleteReport(report.id)}
                      formatData={formatReportData}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              {customReports.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun rapport</p>
                  <p className="text-sm mt-2">Créez des rapports sur mesure</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customReports.map((report) => (
                    <ReportCard 
                      key={report.id} 
                      report={report} 
                      onExport={() => exportReport(report)}
                      onDelete={() => deleteReport(report.id)}
                      formatData={formatReportData}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </ChannablePageWrapper>
  );
}

interface ReportCardProps {
  report: {
    id: string;
    report_name: string;
    report_type: string;
    report_data: Record<string, unknown>;
    created_at: string;
  };
  onExport: () => void;
  onDelete: () => void;
  formatData: (data: Record<string, unknown>) => { label: string; value: string }[];
}

function ReportCard({ report, onExport, onDelete, formatData }: ReportCardProps) {
  const [expanded, setExpanded] = useState(false);
  const data = formatData(report.report_data);

  return (
    <div className="border rounded-xl p-4 bg-background/50 hover:bg-background/80 transition-colors">
      <div className="flex items-center justify-between">
        <div 
          className="flex-1 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <h3 className="font-semibold">{report.report_name}</h3>
          <p className="text-sm text-muted-foreground">
            {format(new Date(report.created_at), 'PPP à HH:mm', { locale: getDateFnsLocale() })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
      
      {expanded && (
        <div className="mt-4 pt-4 border-t grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.map(({ label, value }) => (
            <div key={label} className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium text-sm">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
