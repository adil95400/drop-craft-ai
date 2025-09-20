import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/page-header';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Save, RefreshCw, AlertTriangle, CheckCircle,
  Database, Globe, FileText, Code, Clock, Zap, Shield,
  Upload, Download, Eye, Edit, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const ImportConfigurationPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [configs, setConfigs] = useState({
    general: {
      autoImport: true,
      batchSize: 100,
      timeout: 30,
      retryAttempts: 3,
      logLevel: 'info'
    },
    csv: {
      delimiter: ',',
      encoding: 'utf-8',
      hasHeader: true,
      skipEmptyLines: true,
      trimWhitespace: true
    },
    api: {
      apiTimeout: 60,
      rateLimitPerMinute: 100,
      enableRetry: true,
      authType: 'bearer',
      userAgent: 'ImportBot/1.0'
    },
    database: {
      connectionTimeout: 30,
      queryTimeout: 60,
      maxConnections: 10,
      enableSSL: true
    },
    mapping: {
      autoDetectFields: true,
      defaultCurrency: 'EUR',
      defaultLanguage: 'fr',
      enableAIOptimization: true
    }
  });

  const handleSaveConfig = (section: string) => {
    toast.success(`Configuration ${section} sauvegardée avec succès!`);
  };

  const handleResetConfig = (section: string) => {
    toast.info(`Configuration ${section} remise à zéro`);
  };

  const handleTestConnection = () => {
    toast.loading('Test de connexion en cours...');
    setTimeout(() => {
      toast.success('Connexion testée avec succès!');
    }, 2000);
  };

  const savedConfigurations = [
    {
      id: 1,
      name: 'Config Amazon Import',
      type: 'API',
      lastUsed: '2024-01-15',
      status: 'active'
    },
    {
      id: 2,
      name: 'CSV Fournisseur A',
      type: 'CSV',
      lastUsed: '2024-01-14',
      status: 'inactive'
    },
    {
      id: 3,
      name: 'Base MySQL Prod',
      type: 'Database',
      lastUsed: '2024-01-13',
      status: 'active'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <PageHeader
        title="Configuration Import"
        description="Configurez vos paramètres d'import pour optimiser vos performances"
      />

      <div className="container mx-auto p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="formats">Formats</TabsTrigger>
            <TabsTrigger value="connections">Connexions</TabsTrigger>
            <TabsTrigger value="mapping">Mapping</TabsTrigger>
            <TabsTrigger value="saved">Sauvegardées</TabsTrigger>
          </TabsList>

          {/* Configuration générale */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Paramètres généraux
                </CardTitle>
                <CardDescription>
                  Configuration globale pour tous les types d'import
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-import">Import automatique</Label>
                      <Switch
                        id="auto-import"
                        checked={configs.general.autoImport}
                        onCheckedChange={(checked) => 
                          setConfigs(prev => ({
                            ...prev,
                            general: { ...prev.general, autoImport: checked }
                          }))
                        }
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="batch-size">Taille des lots</Label>
                      <Input
                        id="batch-size"
                        type="number"
                        value={configs.general.batchSize}
                        onChange={(e) => 
                          setConfigs(prev => ({
                            ...prev,
                            general: { ...prev.general, batchSize: parseInt(e.target.value) }
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeout">Timeout (secondes)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        value={configs.general.timeout}
                        onChange={(e) => 
                          setConfigs(prev => ({
                            ...prev,
                            general: { ...prev.general, timeout: parseInt(e.target.value) }
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="retry">Tentatives de retry</Label>
                      <Input
                        id="retry"
                        type="number"
                        value={configs.general.retryAttempts}
                        onChange={(e) => 
                          setConfigs(prev => ({
                            ...prev,
                            general: { ...prev.general, retryAttempts: parseInt(e.target.value) }
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="log-level">Niveau de log</Label>
                      <Select 
                        value={configs.general.logLevel}
                        onValueChange={(value) => 
                          setConfigs(prev => ({
                            ...prev,
                            general: { ...prev.general, logLevel: value }
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="debug">Debug</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warn">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => handleSaveConfig('general')}>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </Button>
                  <Button variant="outline" onClick={() => handleResetConfig('general')}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration des formats */}
          <TabsContent value="formats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Configuration CSV
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="delimiter">Délimiteur</Label>
                    <Input
                      id="delimiter"
                      value={configs.csv.delimiter}
                      onChange={(e) => 
                        setConfigs(prev => ({
                          ...prev,
                          csv: { ...prev.csv, delimiter: e.target.value }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="encoding">Encodage</Label>
                    <Select 
                      value={configs.csv.encoding}
                      onValueChange={(value) => 
                        setConfigs(prev => ({
                          ...prev,
                          csv: { ...prev.csv, encoding: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utf-8">UTF-8</SelectItem>
                        <SelectItem value="iso-8859-1">ISO-8859-1</SelectItem>
                        <SelectItem value="windows-1252">Windows-1252</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="has-header">Première ligne = en-têtes</Label>
                    <Switch
                      id="has-header"
                      checked={configs.csv.hasHeader}
                      onCheckedChange={(checked) => 
                        setConfigs(prev => ({
                          ...prev,
                          csv: { ...prev.csv, hasHeader: checked }
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Configuration API
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-timeout">Timeout API (s)</Label>
                    <Input
                      id="api-timeout"
                      type="number"
                      value={configs.api.apiTimeout}
                      onChange={(e) => 
                        setConfigs(prev => ({
                          ...prev,
                          api: { ...prev.api, apiTimeout: parseInt(e.target.value) }
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rate-limit">Limite par minute</Label>
                    <Input
                      id="rate-limit"
                      type="number"
                      value={configs.api.rateLimitPerMinute}
                      onChange={(e) => 
                        setConfigs(prev => ({
                          ...prev,
                          api: { ...prev.api, rateLimitPerMinute: parseInt(e.target.value) }
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-agent">User Agent</Label>
                    <Input
                      id="user-agent"
                      value={configs.api.userAgent}
                      onChange={(e) => 
                        setConfigs(prev => ({
                          ...prev,
                          api: { ...prev.api, userAgent: e.target.value }
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Configurations sauvegardées */}
          <TabsContent value="saved" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  Configurations sauvegardées
                </CardTitle>
                <CardDescription>
                  Gérez vos configurations d'import pré-configurées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {savedConfigurations.map((config) => (
                    <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          config.type === 'API' ? 'bg-blue-100' :
                          config.type === 'CSV' ? 'bg-green-100' : 'bg-purple-100'
                        }`}>
                          {config.type === 'API' ? <Code className="h-4 w-4" /> :
                           config.type === 'CSV' ? <FileText className="h-4 w-4" /> :
                           <Database className="h-4 w-4" />}
                        </div>
                        <div>
                          <h4 className="font-medium">{config.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Type: {config.type} • Dernière utilisation: {config.lastUsed}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={config.status === 'active' ? 'default' : 'secondary'}>
                          {config.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button variant="outline" className="justify-start" onClick={handleTestConnection}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Test connexion
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/import/history')}>
                <Clock className="h-4 w-4 mr-2" />
                Voir historique
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/import-management')}>
                <Upload className="h-4 w-4 mr-2" />
                Hub Import
              </Button>
              <Button variant="outline" className="justify-start">
                <Download className="h-4 w-4 mr-2" />
                Exporter config
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImportConfigurationPage;