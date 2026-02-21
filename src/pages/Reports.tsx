import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  ShoppingCart,
  DollarSign,
  Package,
  Printer,
  Mail,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { exportSalesExcel, exportInventoryExcel, exportCustomersExcel, exportOrdersExcel } from '@/utils/excelExport';
import { 
  downloadPDFReport, 
  generateSalesReport, 
  generateInventoryReport,
  generateCustomersReport,
  generateOrdersReport 
} from '@/utils/pdfExport';

export default function Reports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('30d');
  const [format, setFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeTables, setIncludeTables] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(false);

  const reportTemplates = [
    {
      id: 'sales-summary',
      name: 'Rapport des Ventes',
      description: 'Analyse détaillée des ventes par période',
      category: 'sales',
      icon: DollarSign,
      lastGenerated: '2024-01-15',
      size: '2.3 MB'
    },
    {
      id: 'inventory-status',
      name: 'État des Stocks',
      description: 'Vue d\'ensemble des niveaux de stock actuels',
      category: 'inventory',
      icon: Package,
      lastGenerated: '2024-01-14',
      size: '1.8 MB'
    },
    {
      id: 'customer-analysis',
      name: 'Analyse Clientèle',
      description: 'Segmentation et comportement des clients',
      category: 'customers',
      icon: Users,
      lastGenerated: '2024-01-13',
      size: '3.1 MB'
    },
    {
      id: 'order-performance',
      name: 'Performance des Commandes',
      description: 'Métriques de traitement et livraison',
      category: 'orders',
      icon: ShoppingCart,
      lastGenerated: '2024-01-12',
      size: '2.7 MB'
    },
    {
      id: 'financial-overview',
      name: 'Vue Financière',
      description: 'Bilan et analyse de rentabilité',
      category: 'finance',
      icon: TrendingUp,
      lastGenerated: '2024-01-11',
      size: '4.2 MB'
    }
  ];

  const scheduledReports = [
    {
      id: 1,
      name: 'Rapport Hebdomadaire Ventes',
      frequency: 'Hebdomadaire',
      nextRun: '2024-01-22',
      status: 'active',
      recipients: ['manager@example.com', 'sales@example.com']
    },
    {
      id: 2,
      name: 'Analyse Mensuelle Stocks',
      frequency: 'Mensuel',
      nextRun: '2024-02-01',
      status: 'active',
      recipients: ['inventory@example.com']
    },
    {
      id: 3,
      name: 'Rapport Trimestriel Finances',
      frequency: 'Trimestriel',
      nextRun: '2024-04-01',
      status: 'paused',
      recipients: ['finance@example.com', 'ceo@example.com']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'paused': return 'bg-muted text-muted-foreground';
      case 'error': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      sales: DollarSign,
      inventory: Package,
      customers: Users,
      orders: ShoppingCart,
      finance: TrendingUp
    };
    return iconMap[category] || FileText;
  };

  const getDateRangeValues = () => {
    const end = new Date();
    let start = new Date();
    
    switch (dateRange) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear(), 0, 1);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    
    return { start, end };
  };

  const fetchReportData = async (type: string) => {
    if (!user?.id) return [];
    const { start, end } = getDateRangeValues();
    const startISO = start.toISOString();
    const endISO = end.toISOString();

    switch (type) {
      case 'sales': {
        const { data: orders } = await supabase
          .from('orders')
          .select('created_at, total_amount')
          .eq('user_id', user.id)
          .gte('created_at', startISO)
          .lte('created_at', endISO)
          .order('created_at', { ascending: true });

        // Group by day
        const byDay: Record<string, { orders: number; revenue: number }> = {};
        (orders || []).forEach(o => {
          const day = o.created_at?.split('T')[0] || '';
          if (!byDay[day]) byDay[day] = { orders: 0, revenue: 0 };
          byDay[day].orders++;
          byDay[day].revenue += o.total_amount || 0;
        });
        return Object.entries(byDay).map(([date, v]) => ({ date, ...v }));
      }
      case 'inventory': {
        const { data: products } = await supabase
          .from('products')
          .select('id, name, title, sku, stock_quantity, price')
          .eq('user_id', user.id)
          .order('stock_quantity', { ascending: true })
          .limit(100);
        return (products || []).map(p => ({
          id: p.id,
          title: p.name || p.title || 'Sans nom',
          sku: p.sku || '—',
          stock: p.stock_quantity ?? 0,
          low_stock_threshold: 10,
          price: p.price ?? 0,
        }));
      }
      case 'customers': {
        const { data: customers } = await supabase
          .from('customers')
          .select('id, first_name, last_name, email, total_orders, total_spent, created_at')
          .eq('user_id', user.id)
          .order('total_spent', { ascending: false })
          .limit(100);
        return (customers || []).map(c => ({
          id: c.id,
          name: [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Anonyme',
          email: c.email || '—',
          orders_count: c.total_orders ?? 0,
          total_spent: c.total_spent ?? 0,
          created_at: c.created_at,
        }));
      }
      case 'orders': {
        const { data: orders } = await supabase
          .from('orders')
          .select('id, order_number, customer_name, status, total_amount, created_at')
          .eq('user_id', user.id)
          .gte('created_at', startISO)
          .lte('created_at', endISO)
          .order('created_at', { ascending: false })
          .limit(200);
        return (orders || []).map(o => ({
          id: o.id,
          order_number: o.order_number || o.id.slice(0, 8),
          customer_name: o.customer_name || 'Inconnu',
          status: o.status || 'pending',
          total: o.total_amount || 0,
          created_at: o.created_at,
        }));
      }
      default:
        return [];
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      const { start, end } = getDateRangeValues();
      const realData = await fetchReportData(reportType);
      
      if (realData.length === 0) {
        toast({
          title: "Aucune donnée",
          description: "Aucune donnée trouvée pour cette période. Ajoutez des données d'abord.",
        });
        setIsGenerating(false);
        return;
      }

      let reportData;
      switch (reportType) {
        case 'sales':
          reportData = generateSalesReport(realData, { start, end });
          break;
        case 'inventory':
          reportData = generateInventoryReport(realData);
          break;
        case 'customers':
          reportData = generateCustomersReport(realData);
          break;
        case 'orders':
          reportData = generateOrdersReport(realData);
          break;
        default:
          reportData = generateSalesReport(realData, { start, end });
      }

      if (format === 'pdf') {
        downloadPDFReport(reportData, {
          includeCharts,
          includeTables,
          includeSummary,
          includeRecommendations,
        });
      } else if (format === 'excel') {
        switch (reportType) {
          case 'sales': exportSalesExcel(realData as any); break;
          case 'inventory': exportInventoryExcel(realData as any); break;
          case 'customers': exportCustomersExcel(realData as any); break;
          case 'orders': exportOrdersExcel(realData as any); break;
          default: exportSalesExcel(realData as any);
        }
      } else if (format === 'csv') {
        // CSV fallback using xlsx lib
        switch (reportType) {
          case 'sales': exportSalesExcel(realData as any); break;
          default: exportSalesExcel(realData as any);
        }
      } else {
        toast({
          title: "Format non disponible",
          description: `L'export ${format.toUpperCase()} n'est pas encore supporté.`,
          variant: "default",
        });
        return;
      }

      toast({
        title: "Rapport généré avec succès",
        description: `Votre rapport ${format.toUpperCase()} a été téléchargé.`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickExport = (templateId: string) => {
    const template = reportTemplates.find(t => t.id === templateId);
    if (template) {
      setReportType(template.category);
      setTimeout(() => handleGenerateReport(), 100);
    }
  };

  const getReportTypeName = () => {
    const names: Record<string, string> = {
      sales: 'Rapport des Ventes',
      inventory: 'État des Stocks',
      customers: 'Analyse Clientèle',
      orders: 'Performance Commandes',
      finance: 'Vue Financière'
    };
    return names[reportType] || 'Rapport';
  };

  const getDateRangeName = () => {
    const names: Record<string, string> = {
      '7d': '7 derniers jours',
      '30d': '30 derniers jours',
      '90d': '90 derniers jours',
      '1y': 'Cette année',
      'custom': 'Période personnalisée'
    };
    return names[dateRange] || '30 derniers jours';
  };

  return (
    <ChannablePageWrapper
      title="Centre de Rapports"
      subtitle="Analytics"
      description="Générez et gérez vos rapports d'activité avec exports PDF et tableaux détaillés"
      heroImage="analytics"
      badge={{ label: "Export PDF", icon: FileText }}
      actions={
        <Button className="gap-2" onClick={handleGenerateReport} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Nouveau Rapport
            </>
          )}
        </Button>
      }
    >

      <Tabs defaultValue="generate" className="w-full">
        <TabsList>
          <TabsTrigger value="generate">Générer</TabsTrigger>
          <TabsTrigger value="templates">Modèles</TabsTrigger>
          <TabsTrigger value="scheduled">Planifiés</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration du Rapport</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="report-type">Type de Rapport</Label>
                      <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">Rapport des Ventes</SelectItem>
                          <SelectItem value="inventory">État des Stocks</SelectItem>
                          <SelectItem value="customers">Analyse Clientèle</SelectItem>
                          <SelectItem value="orders">Performance Commandes</SelectItem>
                          <SelectItem value="finance">Vue Financière</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date-range">Période</Label>
                      <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7d">7 derniers jours</SelectItem>
                          <SelectItem value="30d">30 derniers jours</SelectItem>
                          <SelectItem value="90d">90 derniers jours</SelectItem>
                          <SelectItem value="1y">Cette année</SelectItem>
                          <SelectItem value="custom">Période personnalisée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Options d'Inclusion</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="include-charts" 
                          checked={includeCharts}
                          onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                        />
                        <Label htmlFor="include-charts">Graphiques</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="include-tables" 
                          checked={includeTables}
                          onCheckedChange={(checked) => setIncludeTables(checked as boolean)}
                        />
                        <Label htmlFor="include-tables">Tableaux détaillés</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="include-summary" 
                          checked={includeSummary}
                          onCheckedChange={(checked) => setIncludeSummary(checked as boolean)}
                        />
                        <Label htmlFor="include-summary">Résumé exécutif</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="include-recommendations" 
                          checked={includeRecommendations}
                          onCheckedChange={(checked) => setIncludeRecommendations(checked as boolean)}
                        />
                        <Label htmlFor="include-recommendations">Recommandations</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="format">Format de Sortie</Label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-success" />
                            PDF
                          </div>
                        </SelectItem>
                        <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="powerpoint">PowerPoint (.pptx)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Aperçu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">{getReportTypeName()}</h4>
                    <p className="text-sm text-muted-foreground">
                      Période: {getDateRangeName()}<br />
                      Format: {format.toUpperCase()}<br />
                      Taille estimée: ~2.5 MB
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      className="w-full gap-2" 
                      onClick={handleGenerateReport}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      {isGenerating ? 'Génération...' : 'Générer Rapport'}
                    </Button>
                    <Button variant="outline" className="w-full gap-2">
                      <Printer className="h-4 w-4" />
                      Aperçu avant impression
                    </Button>
                    <Button variant="outline" className="w-full gap-2">
                      <Mail className="h-4 w-4" />
                      Envoyer par email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTemplates.map((template) => {
              const IconComponent = getCategoryIcon(template.category);
              return (
                <Card key={template.id} className="transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Dernière génération:</span>
                        <span className="text-foreground">{template.lastGenerated}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taille:</span>
                        <span className="text-foreground">{template.size}</span>
                      </div>
                      <Separator />
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleQuickExport(template.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Exporter PDF
                        </Button>
                        <Button size="sm" variant="outline">Modifier</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="scheduled">
          <div className="space-y-6">
            {scheduledReports.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{report.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Fréquence: {report.frequency}</span>
                          <span>Prochaine exécution: {report.nextRun}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-muted-foreground">Destinataires:</span>
                          {report.recipients.map((email, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {email}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Modifier</Button>
                        <Button size="sm" variant="outline">
                          {report.status === 'active' ? 'Pause' : 'Reprendre'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Rapports Générés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(10)].map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium text-foreground">
                          Rapport des Ventes - {new Date(Date.now() - index * 86400000).toLocaleDateString()}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Généré le {new Date(Date.now() - index * 86400000).toLocaleDateString()} • 2.3 MB
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ChannablePageWrapper>
  );
}
