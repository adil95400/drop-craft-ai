import { useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  TrendingUp, 
  Users, 
  ShoppingCart,
  DollarSign,
  Package,
  Printer,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

export default function Reports() {
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('30d');
  const [format, setFormat] = useState('pdf');

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

  return (
    <div className="container-fluid">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Centre de Rapports</h1>
          <p className="text-muted-foreground">Générez et gérez vos rapports d'activité</p>
        </div>
        <Button className="gap-2">
          <FileText className="h-4 w-4" />
          Nouveau Rapport
        </Button>
      </div>

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
                        <Checkbox id="include-charts" defaultChecked />
                        <Label htmlFor="include-charts">Graphiques</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="include-tables" defaultChecked />
                        <Label htmlFor="include-tables">Tableaux détaillés</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="include-summary" defaultChecked />
                        <Label htmlFor="include-summary">Résumé exécutif</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="include-recommendations" />
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
                        <SelectItem value="pdf">PDF</SelectItem>
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
                    <h4 className="font-medium text-foreground mb-2">Rapport des Ventes</h4>
                    <p className="text-sm text-muted-foreground">
                      Période: 30 derniers jours<br />
                      Format: PDF<br />
                      Taille estimée: ~2.5 MB
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Button className="w-full gap-2">
                      <Download className="h-4 w-4" />
                      Générer Rapport
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
                        <Button size="sm" className="flex-1">Utiliser</Button>
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
    </div>
  );
}