import { useState } from 'react';
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
import { 
  downloadPDFReport, 
  generateSalesReport, 
  generateInventoryReport,
  generateCustomersReport,
  generateOrdersReport 
} from '@/utils/pdfExport';

export default function Reports() {
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

  const generateMockData = (type: string) => {
    const { start, end } = getDateRangeValues();
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (type) {
      case 'sales':
        return Array.from({ length: Math.min(days, 30) }, (_, i) => {
          const date = new Date(start);
          date.setDate(date.getDate() + i);
          return {
            date: date.toISOString().split('T')[0],
            orders: Math.floor(Math.random() * 50) + 10,
            revenue: Math.floor(Math.random() * 5000) + 1000,
          };
        });
      case 'inventory':
        return Array.from({ length: 20 }, (_, i) => ({
          id: `prod-${i}`,
          title: `Produit ${i + 1}`,
          sku: `SKU-${1000 + i}`,
          stock: Math.floor(Math.random() * 15),
          low_stock_threshold: 10,
          price: Math.floor(Math.random() * 100) + 10,
        }));
      case 'customers':
        return Array.from({ length: 50 }, (_, i) => ({
          id: `cust-${i}`,
          name: `Client ${i + 1}`,
          email: `client${i + 1}@example.com`,
          orders_count: Math.floor(Math.random() * 20) + 1,
          total_spent: Math.floor(Math.random() * 2000) + 100,
          created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
        }));
      case 'orders':
        const statuses = ['pending', 'processing', 'shipped', 'delivered'];
        return Array.from({ length: 30 }, (_, i) => ({
          id: `order-${i}`,
          order_number: `ORD-${10000 + i}`,
          customer_name: `Client ${Math.floor(Math.random() * 50) + 1}`,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          total: Math.floor(Math.random() * 500) + 50,
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        }));
      default:
        return [];
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      const { start, end } = getDateRangeValues();
      const mockData = generateMockData(reportType);
      
      let reportData;
      switch (reportType) {
        case 'sales':
          reportData = generateSalesReport(mockData, { start, end });
          break;
        case 'inventory':
          reportData = generateInventoryReport(mockData);
          break;
        case 'customers':
          reportData = generateCustomersReport(mockData);
          break;
        case 'orders':
          reportData = generateOrdersReport(mockData);
          break;
        default:
          reportData = generateSalesReport(mockData, { start, end });
      }

      if (format === 'pdf') {
        downloadPDFReport(reportData, {
          includeCharts,
          includeTables,
          includeSummary,
          includeRecommendations,
        });
      } else {
        // Pour les autres formats, afficher un message
        toast({
          title: "Format non disponible",
          description: `L'export ${format.toUpperCase()} sera bientôt disponible.`,
        });
        return;
      }

      toast({
        title: "Rapport généré avec succès",
        description: "Votre rapport PDF a été téléchargé.",
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
