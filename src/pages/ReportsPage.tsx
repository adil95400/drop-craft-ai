import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Download, FileText, TrendingUp, DollarSign, Package, Users, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReports } from '@/hooks/useReports';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('30');
  const [reportType, setReportType] = useState('sales');
  
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

  const { data: stats } = useQuery({
    queryKey: ['reports-stats', dateRange],
    queryFn: () => fetchStats(parseInt(dateRange)),
  });

  const handleGenerateReport = () => {
    generateReport({ reportType, dateRange });
  };

  const formatReportData = (data: Record<string, unknown>) => {
    return Object.entries(data).map(([key, value]) => ({
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      value: typeof value === 'number' 
        ? value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
        : JSON.stringify(value)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Rapports
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
              Consultez vos rapports de performance
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Revenus</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">
                {(stats?.revenue || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {stats?.revenueChange !== undefined && (
                  <span className={stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {stats.revenueChange >= 0 ? '+' : ''}{stats.revenueChange}%
                  </span>
                )} vs période précédente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Commandes</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{stats?.orders || 0}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Sur les {dateRange} derniers jours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Produits</CardTitle>
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{stats?.products || 0}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                En catalogue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Clients</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-lg sm:text-2xl font-bold">{stats?.customers || 0}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Actifs
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Générateur de Rapports</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Créez des rapports personnalisés</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium">Type de rapport</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
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
                <label className="text-xs sm:text-sm font-medium">Période</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
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
                <Button onClick={handleGenerateReport} className="w-full" size="sm" disabled={isGenerating}>
                  {isGenerating ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  )}
                  Générer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Rapports Disponibles</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Consultez vos rapports générés</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <Tabs defaultValue="recent" className="space-y-4">
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <TabsList className="w-max sm:w-auto">
                  <TabsTrigger value="recent" className="text-xs sm:text-sm px-2 sm:px-3">
                    Récents ({recentReports.length})
                  </TabsTrigger>
                  <TabsTrigger value="scheduled" className="text-xs sm:text-sm px-2 sm:px-3">
                    Programmés ({scheduledReports.length})
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="text-xs sm:text-sm px-2 sm:px-3">
                    Tous ({customReports.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="recent" className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : recentReports.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-muted-foreground">
                    <FileText className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">Aucun rapport récent</p>
                    <p className="text-xs sm:text-sm mt-2">Générez votre premier rapport</p>
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
                  <div className="text-center py-8 sm:py-12 text-muted-foreground">
                    <FileText className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">Aucun rapport programmé</p>
                    <p className="text-xs sm:text-sm mt-2">Configurez des rapports automatiques</p>
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
                  <div className="text-center py-8 sm:py-12 text-muted-foreground">
                    <FileText className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">Aucun rapport</p>
                    <p className="text-xs sm:text-sm mt-2">Créez des rapports sur mesure</p>
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
      </div>
    </div>
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
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div 
          className="flex-1 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <h3 className="font-semibold">{report.report_name}</h3>
          <p className="text-sm text-muted-foreground">
            {format(new Date(report.created_at), 'PPP à HH:mm', { locale: fr })}
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
            <div key={label} className="bg-muted/50 rounded p-2">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium text-sm">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
