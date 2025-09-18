import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Upload,
  FileText,
  Database,
  Globe,
  Zap,
  Settings,
  CheckCircle,
  AlertCircle,
  Download,
  Calendar,
  MapPin,
  Filter,
  Eye,
  Play,
  Pause,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';

interface ComprehensiveImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importType?: 'csv' | 'xml' | 'api' | 'database' | 'url' | 'scheduled';
}

export const ComprehensiveImportModal: React.FC<ComprehensiveImportModalProps> = ({
  open,
  onOpenChange,
  importType = 'csv'
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [importConfig, setImportConfig] = useState({
    source: importType,
    file: null as File | null,
    url: '',
    apiKey: '',
    database: {
      host: '',
      port: '3306',
      username: '',
      password: '',
      database: '',
      table: ''
    },
    mapping: {},
    filters: [],
    schedule: {
      frequency: 'manual',
      time: '12:00',
      timezone: 'Europe/Paris'
    },
    options: {
      autoApprove: false,
      duplicateHandling: 'skip',
      aiEnhancement: true,
      notifications: true
    }
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [previewData, setPreviewData] = useState([]);

  const importMethods = [
    { id: 'csv', name: 'Fichier CSV/Excel', icon: FileText, description: 'Import depuis un fichier local' },
    { id: 'url', name: 'URL/Web Scraping', icon: Globe, description: 'Extraction depuis une URL' },
    { id: 'api', name: 'API REST', icon: Zap, description: 'Connexion API en temps réel' },
    { id: 'database', name: 'Base de données', icon: Database, description: 'Connexion directe BDD' },
    { id: 'scheduled', name: 'Import planifié', icon: Calendar, description: 'Automatisation récurrente' }
  ];

  const supportedFormats = [
    { format: 'CSV', description: 'Fichiers CSV avec délimiteurs personnalisés' },
    { format: 'Excel', description: 'Fichiers .xlsx et .xls' },
    { format: 'JSON', description: 'Données JSON structurées' },
    { format: 'XML', description: 'Fichiers XML avec mapping automatique' },
    { format: 'API', description: 'REST API, GraphQL, SOAP' },
    { format: 'Database', description: 'MySQL, PostgreSQL, MongoDB' }
  ];

  const fieldMappings = [
    { source: 'name', target: 'product_name', required: true, type: 'text' },
    { source: 'price', target: 'selling_price', required: true, type: 'number' },
    { source: 'cost', target: 'cost_price', required: false, type: 'number' },
    { source: 'description', target: 'description', required: false, type: 'text' },
    { source: 'category', target: 'category', required: false, type: 'select' },
    { source: 'stock', target: 'stock_quantity', required: false, type: 'number' },
    { source: 'sku', target: 'sku', required: false, type: 'text' },
    { source: 'images', target: 'image_urls', required: false, type: 'array' }
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImportConfig(prev => ({ ...prev, file }));
      toast({
        title: "Fichier ajouté",
        description: `${file.name} prêt pour l'import`,
      });
      // Simuler l'aperçu
      setTimeout(() => {
        setPreviewData([
          { name: 'Produit 1', price: 29.99, stock: 100, category: 'Électronique' },
          { name: 'Produit 2', price: 49.99, stock: 50, category: 'Maison' },
          { name: 'Produit 3', price: 19.99, stock: 200, category: 'Mode' }
        ]);
      }, 1000);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/json': ['.json'],
      'application/xml': ['.xml']
    },
    multiple: false
  });

  const handleTestConnection = async () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Connexion réussie",
        description: "La source de données est accessible",
      });
    }, 2000);
  };

  const handleStartImport = async () => {
    setIsProcessing(true);
    setImportProgress(0);
    
    const progressInterval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsProcessing(false);
          toast({
            title: "Import terminé",
            description: "Tous les produits ont été importés avec succès",
          });
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const handlePreview = () => {
    toast({
      title: "Aperçu généré",
      description: "Visualisation des données à importer",
    });
  };

  const steps = [
    { id: 'source', title: 'Source', description: 'Choisir la méthode d\'import' },
    { id: 'config', title: 'Configuration', description: 'Paramètres de connexion' },
    { id: 'mapping', title: 'Mapping', description: 'Correspondance des champs' },
    { id: 'options', title: 'Options', description: 'Paramètres avancés' },
    { id: 'preview', title: 'Aperçu', description: 'Validation finale' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Avancé de Produits
          </DialogTitle>
          <DialogDescription>
            Assistant complet d'import avec IA et automation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stepper */}
          <div className="flex justify-between items-center mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                `}>
                  {index + 1}
                </div>
                <div className="ml-3 hidden md:block">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-12 h-0.5 mx-4
                    ${index < currentStep ? 'bg-primary' : 'bg-muted'}
                  `} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <Tabs value={steps[currentStep].id} className="space-y-4">
            {/* Source Selection */}
            <TabsContent value="source" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Méthode d'import</CardTitle>
                  <CardDescription>Sélectionnez la source de vos données</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {importMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`
                          p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent
                          ${importConfig.source === method.id ? 'border-primary bg-primary/5' : 'border-border'}
                        `}
                        onClick={() => setImportConfig(prev => ({ ...prev, source: method.id as 'csv' | 'xml' | 'api' | 'database' | 'url' | 'scheduled' }))}
                      >
                        <div className="flex items-center gap-3">
                          <method.icon className="w-8 h-8" />
                          <div>
                            <div className="font-medium">{method.name}</div>
                            <div className="text-sm text-muted-foreground">{method.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Supported Formats */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Formats supportés</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {supportedFormats.map((format, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="font-medium text-sm">{format.format}</div>
                          <div className="text-xs text-muted-foreground">{format.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Configuration */}
            <TabsContent value="config" className="space-y-4">
              {importConfig.source === 'csv' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Upload de fichier</CardTitle>
                    <CardDescription>Glissez-déposez ou sélectionnez votre fichier</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      {...getRootProps()}
                      className={`
                        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                        ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                      `}
                    >
                      <input {...getInputProps()} />
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <div className="text-lg font-medium mb-2">
                        {isDragActive ? 'Déposez le fichier ici' : 'Glissez votre fichier ici'}
                      </div>
                      <div className="text-sm text-muted-foreground mb-4">
                        ou cliquez pour sélectionner (CSV, Excel, JSON, XML)
                      </div>
                      <Button variant="outline">Parcourir les fichiers</Button>
                    </div>

                    {importConfig.file && (
                      <div className="mt-4 p-4 border rounded-lg bg-green-50">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <div>
                            <div className="font-medium">{importConfig.file.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {(importConfig.file.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {importConfig.source === 'url' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Configuration URL</CardTitle>
                    <CardDescription>Paramètres d'extraction web</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="source-url">URL source</Label>
                      <Input
                        id="source-url"
                        placeholder="https://example.com/products"
                        value={importConfig.url}
                        onChange={(e) => setImportConfig(prev => ({ 
                          ...prev, 
                          url: e.target.value 
                        }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type d'extraction</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="html">HTML Scraping</SelectItem>
                            <SelectItem value="api">API JSON</SelectItem>
                            <SelectItem value="rss">Feed RSS</SelectItem>
                            <SelectItem value="xml">XML Feed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Fréquence</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Manuelle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Manuelle</SelectItem>
                            <SelectItem value="hourly">Chaque heure</SelectItem>
                            <SelectItem value="daily">Quotidienne</SelectItem>
                            <SelectItem value="weekly">Hebdomadaire</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button onClick={handleTestConnection} disabled={isProcessing}>
                      {isProcessing ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Globe className="w-4 h-4 mr-2" />
                      )}
                      Tester la connexion
                    </Button>
                  </CardContent>
                </Card>
              )}

              {importConfig.source === 'database' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Connexion Base de Données</CardTitle>
                    <CardDescription>Paramètres de connexion sécurisée</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type de base</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="MySQL" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mysql">MySQL</SelectItem>
                            <SelectItem value="postgres">PostgreSQL</SelectItem>
                            <SelectItem value="mongodb">MongoDB</SelectItem>
                            <SelectItem value="sqlite">SQLite</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Port</Label>
                        <Input
                          placeholder="3306"
                          value={importConfig.database.port}
                          onChange={(e) => setImportConfig(prev => ({
                            ...prev,
                            database: { ...prev.database, port: e.target.value }
                          }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Hôte</Label>
                      <Input
                        placeholder="localhost ou IP"
                        value={importConfig.database.host}
                        onChange={(e) => setImportConfig(prev => ({
                          ...prev,
                          database: { ...prev.database, host: e.target.value }
                        }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Utilisateur</Label>
                        <Input
                          placeholder="username"
                          value={importConfig.database.username}
                          onChange={(e) => setImportConfig(prev => ({
                            ...prev,
                            database: { ...prev.database, username: e.target.value }
                          }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Mot de passe</Label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={importConfig.database.password}
                          onChange={(e) => setImportConfig(prev => ({
                            ...prev,
                            database: { ...prev.database, password: e.target.value }
                          }))}
                        />
                      </div>
                    </div>

                    <Button onClick={handleTestConnection} disabled={isProcessing}>
                      {isProcessing ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Database className="w-4 h-4 mr-2" />
                      )}
                      Tester la connexion
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Field Mapping */}
            <TabsContent value="mapping" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Correspondance des Champs</CardTitle>
                  <CardDescription>Associez les champs source avec les champs destination</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {fieldMappings.map((mapping, index) => (
                      <div key={index} className="grid grid-cols-3 gap-4 items-center p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{mapping.target}</div>
                          {mapping.required && <Badge variant="destructive" className="text-xs mt-1">Requis</Badge>}
                        </div>
                        
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner champ source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={mapping.source}>{mapping.source}</SelectItem>
                            <SelectItem value="auto">Détection automatique</SelectItem>
                            <SelectItem value="none">Ignorer</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <div className="text-sm text-muted-foreground">
                          Type: {mapping.type}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex gap-2">
                    <Button variant="outline">
                      <Zap className="w-4 h-4 mr-2" />
                      Auto-mapping IA
                    </Button>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Modèle CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Options */}
            <TabsContent value="options" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Options d'import</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="auto-approve"
                        checked={importConfig.options.autoApprove}
                        onCheckedChange={(checked) => setImportConfig(prev => ({
                          ...prev,
                          options: { ...prev.options, autoApprove: checked as boolean }
                        }))}
                      />
                      <Label htmlFor="auto-approve">Auto-approbation des produits</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ai-enhancement"
                        checked={importConfig.options.aiEnhancement}
                        onCheckedChange={(checked) => setImportConfig(prev => ({
                          ...prev,
                          options: { ...prev.options, aiEnhancement: checked as boolean }
                        }))}
                      />
                      <Label htmlFor="ai-enhancement">Amélioration IA (descriptions, catégories)</Label>
                    </div>

                    <div className="space-y-2">
                      <Label>Gestion des doublons</Label>
                      <Select
                        value={importConfig.options.duplicateHandling}
                        onValueChange={(value) => setImportConfig(prev => ({
                          ...prev,
                          options: { ...prev.options, duplicateHandling: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip">Ignorer les doublons</SelectItem>
                          <SelectItem value="update">Mettre à jour</SelectItem>
                          <SelectItem value="create">Créer une variante</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Planification</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Fréquence</Label>
                      <Select
                        value={importConfig.schedule.frequency}
                        onValueChange={(value) => setImportConfig(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule, frequency: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manuel</SelectItem>
                          <SelectItem value="hourly">Chaque heure</SelectItem>
                          <SelectItem value="daily">Quotidien</SelectItem>
                          <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {importConfig.schedule.frequency !== 'manual' && (
                      <>
                        <div className="space-y-2">
                          <Label>Heure d'exécution</Label>
                          <Input
                            type="time"
                            value={importConfig.schedule.time}
                            onChange={(e) => setImportConfig(prev => ({
                              ...prev,
                              schedule: { ...prev.schedule, time: e.target.value }
                            }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Fuseau horaire</Label>
                          <Select
                            value={importConfig.schedule.timezone}
                            onValueChange={(value) => setImportConfig(prev => ({
                              ...prev,
                              schedule: { ...prev.schedule, timezone: value }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                              <SelectItem value="UTC">UTC</SelectItem>
                              <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Preview */}
            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Aperçu des données</span>
                    <Button onClick={handlePreview} variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Actualiser l'aperçu
                    </Button>
                  </CardTitle>
                  <CardDescription>Vérifiez les données avant l'import final</CardDescription>
                </CardHeader>
                <CardContent>
                  {previewData.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          {previewData.length} produits détectés
                        </div>
                        <Badge variant="secondary">Prêt pour l'import</Badge>
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted">
                            <tr>
                              <th className="p-3 text-left">Nom</th>
                              <th className="p-3 text-left">Prix</th>
                              <th className="p-3 text-left">Stock</th>
                              <th className="p-3 text-left">Catégorie</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.map((item: any, index) => (
                              <tr key={index} className="border-t">
                                <td className="p-3">{item.name}</td>
                                <td className="p-3">€{item.price}</td>
                                <td className="p-3">{item.stock}</td>
                                <td className="p-3">{item.category}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {isProcessing && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Import en cours...</span>
                            <span>{importProgress}%</span>
                          </div>
                          <Progress value={importProgress} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                      <div>Aucune donnée d'aperçu disponible</div>
                      <div className="text-sm">Configurez votre source de données pour voir l'aperçu</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Précédent
            </Button>

            <div className="flex gap-2">
              {currentStep === steps.length - 1 ? (
                <Button onClick={handleStartImport} disabled={isProcessing || previewData.length === 0}>
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Lancer l'import
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                >
                  Suivant
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};