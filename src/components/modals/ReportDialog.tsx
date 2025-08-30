import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  CalendarIcon, 
  Download, 
  Mail, 
  Settings, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Filter,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId?: string;
  onGenerate?: (reportConfig: ReportConfig) => void;
}

interface ReportConfig {
  id?: string;
  name: string;
  description?: string;
  type: 'sales' | 'products' | 'customers' | 'inventory' | 'marketing' | 'custom';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dateRange: {
    type: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'current_month' | 'custom';
    startDate?: Date;
    endDate?: Date;
  };
  filters: {
    categories?: string[];
    status?: string[];
    minAmount?: number;
    maxAmount?: number;
  };
  metrics: string[];
  groupBy?: 'day' | 'week' | 'month' | 'category' | 'status';
  chartTypes?: string[];
  recipients?: string[];
  isAutomated: boolean;
  nextRun?: Date;
}

const reportTypes = [
  { 
    value: 'sales', 
    label: 'Rapport de ventes', 
    icon: <TrendingUp className="h-4 w-4" />,
    metrics: ['total_sales', 'orders_count', 'average_order', 'conversion_rate']
  },
  { 
    value: 'products', 
    label: 'Rapport produits', 
    icon: <BarChart3 className="h-4 w-4" />,
    metrics: ['top_products', 'stock_levels', 'product_performance', 'categories_analysis']
  },
  { 
    value: 'customers', 
    label: 'Rapport clients', 
    icon: <PieChart className="h-4 w-4" />,
    metrics: ['new_customers', 'customer_lifetime_value', 'retention_rate', 'segments_analysis']
  },
  { 
    value: 'inventory', 
    label: 'Rapport stock', 
    icon: <BarChart3 className="h-4 w-4" />,
    metrics: ['stock_levels', 'low_stock_alerts', 'turnover_rate', 'supplier_performance']
  },
  { 
    value: 'marketing', 
    label: 'Rapport marketing', 
    icon: <TrendingUp className="h-4 w-4" />,
    metrics: ['campaign_performance', 'roi', 'channel_analytics', 'lead_conversion']
  }
];

const dateRanges = [
  { value: 'last_7_days', label: '7 derniers jours' },
  { value: 'last_30_days', label: '30 derniers jours' },
  { value: 'last_90_days', label: '90 derniers jours' },
  { value: 'current_month', label: 'Mois en cours' },
  { value: 'custom', label: 'Période personnalisée' }
];

const frequencies = [
  { value: 'once', label: 'Une fois', icon: <FileText className="h-4 w-4" /> },
  { value: 'daily', label: 'Quotidien', icon: <Clock className="h-4 w-4" /> },
  { value: 'weekly', label: 'Hebdomadaire', icon: <Calendar className="h-4 w-4" /> },
  { value: 'monthly', label: 'Mensuel', icon: <CalendarIcon className="h-4 w-4" /> },
  { value: 'quarterly', label: 'Trimestriel', icon: <CalendarIcon className="h-4 w-4" /> }
];

export const ReportDialog: React.FC<ReportDialogProps> = ({
  open,
  onOpenChange,
  reportId,
  onGenerate
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [formData, setFormData] = useState<ReportConfig>({
    name: '',
    type: 'sales',
    format: 'pdf',
    frequency: 'once',
    dateRange: {
      type: 'last_30_days'
    },
    filters: {},
    metrics: [],
    isAutomated: false
  });

  const currentReportType = reportTypes.find(t => t.value === formData.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: "Erreur",
        description: "Veuillez donner un nom au rapport",
        variant: "destructive"
      });
      return;
    }

    if (formData.metrics.length === 0) {
      toast({
        title: "Erreur", 
        description: "Veuillez sélectionner au moins une métrique",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setActiveTab('preview');

    // Simulate report generation
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    onGenerate?.(formData);
    
    toast({
      title: "Succès",
      description: `Rapport "${formData.name}" généré avec succès`,
      variant: "default"
    });

    setIsGenerating(false);
    setProgress(0);
    onOpenChange(false);
  };

  const handleMetricToggle = (metric: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      metrics: checked 
        ? [...prev.metrics, metric]
        : prev.metrics.filter(m => m !== metric)
    }));
  };

  const getMetricLabel = (metric: string) => {
    const labels: Record<string, string> = {
      total_sales: 'Chiffre d\'affaires total',
      orders_count: 'Nombre de commandes',
      average_order: 'Panier moyen',
      conversion_rate: 'Taux de conversion',
      top_products: 'Top produits',
      stock_levels: 'Niveaux de stock',
      product_performance: 'Performance produits',
      categories_analysis: 'Analyse par catégories',
      new_customers: 'Nouveaux clients',
      customer_lifetime_value: 'Valeur vie client',
      retention_rate: 'Taux de rétention',
      segments_analysis: 'Analyse des segments',
      low_stock_alerts: 'Alertes stock bas',
      turnover_rate: 'Taux de rotation',
      supplier_performance: 'Performance fournisseurs',
      campaign_performance: 'Performance campagnes',
      roi: 'Retour sur investissement',
      channel_analytics: 'Analyse des canaux',
      lead_conversion: 'Conversion des leads'
    };
    return labels[metric] || metric;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {reportId ? 'Modifier le rapport' : 'Générer un rapport'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Configuration</TabsTrigger>
            <TabsTrigger value="filters">Filtres</TabsTrigger>
            <TabsTrigger value="automation">Automatisation</TabsTrigger>
            <TabsTrigger value="preview">Aperçu</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="basic" className="space-y-6 mt-6">
              {/* Basic Configuration */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du rapport *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="ex: Rapport de ventes mensuel"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Type de rapport</Label>
                    <Select value={formData.type} onValueChange={(value: any) => {
                      const reportType = reportTypes.find(t => t.value === value);
                      setFormData(prev => ({ 
                        ...prev, 
                        type: value,
                        metrics: reportType?.metrics.slice(0, 2) || []
                      }));
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {reportTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              {type.icon}
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optionnelle)</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description du rapport"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select value={formData.format} onValueChange={(value: any) => setFormData(prev => ({ ...prev, format: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Période</Label>
                    <Select value={formData.dateRange.type} onValueChange={(value: any) => setFormData(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, type: value } 
                    }))}>
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

                  <div className="space-y-2">
                    <Label>Fréquence</Label>
                    <Select value={formData.frequency} onValueChange={(value: any) => setFormData(prev => ({ ...prev, frequency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencies.map(freq => (
                          <SelectItem key={freq.value} value={freq.value}>
                            <div className="flex items-center gap-2">
                              {freq.icon}
                              {freq.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Custom Date Range */}
                {formData.dateRange.type === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date de début</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.dateRange.startDate ? 
                              formData.dateRange.startDate.toLocaleDateString() : 
                              "Sélectionner"
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.dateRange.startDate}
                            onSelect={(date) => setFormData(prev => ({
                              ...prev,
                              dateRange: { ...prev.dateRange, startDate: date }
                            }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Date de fin</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.dateRange.endDate ? 
                              formData.dateRange.endDate.toLocaleDateString() : 
                              "Sélectionner"
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.dateRange.endDate}
                            onSelect={(date) => setFormData(prev => ({
                              ...prev,
                              dateRange: { ...prev.dateRange, endDate: date }
                            }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}

                {/* Metrics Selection */}
                <div className="space-y-2">
                  <Label>Métriques à inclure</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {currentReportType?.metrics.map(metric => (
                      <div key={metric} className="flex items-center space-x-2 p-2 border rounded-lg">
                        <Checkbox
                          id={metric}
                          checked={formData.metrics.includes(metric)}
                          onCheckedChange={(checked) => handleMetricToggle(metric, checked as boolean)}
                        />
                        <Label htmlFor={metric} className="flex-1 cursor-pointer text-sm">
                          {getMetricLabel(metric)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="filters" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Filter className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Affinez votre rapport avec des filtres personnalisés
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Montant minimum</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.filters.minAmount || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        filters: { ...prev.filters, minAmount: parseFloat(e.target.value) || undefined }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Montant maximum</Label>
                    <Input
                      type="number"
                      placeholder="Illimité"
                      value={formData.filters.maxAmount || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        filters: { ...prev.filters, maxAmount: parseFloat(e.target.value) || undefined }
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Grouper par</Label>
                  <Select value={formData.groupBy} onValueChange={(value: any) => setFormData(prev => ({ ...prev, groupBy: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Aucun groupement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Par jour</SelectItem>
                      <SelectItem value="week">Par semaine</SelectItem>
                      <SelectItem value="month">Par mois</SelectItem>
                      <SelectItem value="category">Par catégorie</SelectItem>
                      <SelectItem value="status">Par statut</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="automation" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="automated"
                    checked={formData.isAutomated}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAutomated: checked as boolean }))}
                  />
                  <Label htmlFor="automated" className="text-base font-medium">
                    Rapport automatisé
                  </Label>
                </div>

                {formData.isAutomated && (
                  <div className="ml-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Destinataires (emails)</Label>
                      <Textarea
                        placeholder="email1@example.com, email2@example.com"
                        value={formData.recipients?.join(', ') || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                        }))}
                        rows={2}
                      />
                    </div>

                    {formData.frequency !== 'once' && (
                      <div className="space-y-2">
                        <Label>Prochaine exécution</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="justify-start">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.nextRun ? 
                                formData.nextRun.toLocaleString() : 
                                "Sélectionner la date"
                              }
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.nextRun}
                              onSelect={(date) => setFormData(prev => ({ ...prev, nextRun: date }))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6 mt-6">
              {isGenerating ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">Génération du rapport en cours...</h3>
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-muted-foreground mt-2">{progress}% terminé</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Résumé de la configuration</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom du rapport</Label>
                      <div className="p-2 bg-muted rounded">{formData.name || 'Non défini'}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <div className="p-2 bg-muted rounded flex items-center gap-2">
                        {currentReportType?.icon}
                        {currentReportType?.label}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Format</Label>
                      <div className="p-2 bg-muted rounded uppercase">{formData.format}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Fréquence</Label>
                      <div className="p-2 bg-muted rounded">
                        {frequencies.find(f => f.value === formData.frequency)?.label}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Métriques sélectionnées</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.metrics.map(metric => (
                        <Badge key={metric} variant="secondary">
                          {getMetricLabel(metric)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {formData.isAutomated && (
                    <div className="space-y-2">
                      <Label>Automatisation</Label>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Rapport automatisé</span>
                        </div>
                        <p className="text-xs text-green-700">
                          Sera envoyé à {formData.recipients?.length || 0} destinataire(s)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Actions */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab(activeTab === 'basic' ? 'basic' : 
                  activeTab === 'filters' ? 'basic' : 
                  activeTab === 'automation' ? 'filters' : 'automation')}
                disabled={activeTab === 'basic' || isGenerating}
              >
                Précédent
              </Button>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                
                {activeTab === 'preview' ? (
                  <Button type="submit" disabled={isGenerating}>
                    <Download className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Génération...' : 'Générer le rapport'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setActiveTab(activeTab === 'basic' ? 'filters' : 
                      activeTab === 'filters' ? 'automation' : 'preview')}
                  >
                    Suivant
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};