import React, { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Zap,
  Link,
  Globe,
  Database,
  Settings,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Play,
  Pause,
  BarChart3,
  Shield,
  Clock,
  Webhook,
  Key,
  Monitor
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SmartIntegrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integrationType?: 'shopify' | 'woocommerce' | 'api' | 'webhook' | 'database';
}

export const SmartIntegrationModal: React.FC<SmartIntegrationModalProps> = ({
  open,
  onOpenChange,
  integrationType = 'shopify'
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [integrationConfig, setIntegrationConfig] = useState({
    platform: integrationType,
    name: '',
    url: '',
    apiKey: '',
    apiSecret: '',
    webhook: '',
    settings: {
      autoSync: true,
      syncFrequency: 'hourly',
      conflictResolution: 'overwrite',
      dataTypes: ['products', 'orders', 'customers'],
      retryAttempts: 3,
      timeout: 30
    }
  });

  const integrationPlatforms = [
    { 
      id: 'shopify', 
      name: 'Shopify', 
      icon: Globe, 
      description: 'E-commerce leader mondial',
      status: 'verified',
      setup_time: '5 min',
      features: ['Sync bidirectionnel', 'Webhooks temps réel', 'Gestion inventaire']
    },
    { 
      id: 'woocommerce', 
      name: 'WooCommerce', 
      icon: Database, 
      description: 'WordPress e-commerce',
      status: 'verified',
      setup_time: '8 min',
      features: ['API REST complète', 'Personnalisation avancée', 'Extensions']
    },
    { 
      id: 'magento', 
      name: 'Magento', 
      icon: Settings, 
      description: 'Enterprise e-commerce',
      status: 'beta',
      setup_time: '15 min',
      features: ['Multi-stores', 'B2B optimisé', 'Performances élevées']
    },
    { 
      id: 'prestashop', 
      name: 'PrestaShop', 
      icon: Link, 
      description: 'Solution française',
      status: 'verified',
      setup_time: '10 min',
      features: ['Interface française', 'Modules natifs', 'Support local']
    },
    { 
      id: 'api', 
      name: 'API Custom', 
      icon: Zap, 
      description: 'Intégration personnalisée',
      status: 'advanced',
      setup_time: '20 min',
      features: ['Flexibilité totale', 'Mapping sur mesure', 'Développement requis']
    },
    { 
      id: 'webhook', 
      name: 'Webhooks', 
      icon: Webhook, 
      description: 'Événements temps réel',
      status: 'verified',
      setup_time: '3 min',
      features: ['Temps réel', 'Léger', 'Déclenché par événements']
    }
  ];

  const connectionSteps = [
    { id: 'platform', title: 'Plateforme', description: 'Sélection de l\'intégration' },
    { id: 'credentials', title: 'Authentification', description: 'Clés API et accès' },
    { id: 'settings', title: 'Configuration', description: 'Paramètres de synchronisation' },
    { id: 'mapping', title: 'Mapping', description: 'Correspondance des données' },
    { id: 'test', title: 'Test', description: 'Validation de la connexion' }
  ];

  const dataTypes = [
    { id: 'products', name: 'Produits', description: 'Catalogue, prix, descriptions', enabled: true },
    { id: 'orders', name: 'Commandes', description: 'Ventes, statuts, paiements', enabled: true },
    { id: 'customers', name: 'Clients', description: 'Profils, historique, segmentation', enabled: true },
    { id: 'inventory', name: 'Inventaire', description: 'Stock, réservations, mouvements', enabled: false },
    { id: 'analytics', name: 'Analytics', description: 'Statistiques, rapports, KPIs', enabled: false },
    { id: 'marketing', name: 'Marketing', description: 'Campagnes, coupons, promotions', enabled: false }
  ];

  const syncFrequencies = [
    { value: 'realtime', label: 'Temps réel', description: 'Webhooks instantanés' },
    { value: '5min', label: '5 minutes', description: 'Haute fréquence' },
    { value: 'hourly', label: 'Horaire', description: 'Équilibré' },
    { value: 'daily', label: 'Quotidien', description: 'Économique' },
    { value: 'weekly', label: 'Hebdomadaire', description: 'Données statiques' }
  ];

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectionProgress(0);
    
    const steps = [
      'Validation des credentials',
      'Test de connexion',
      'Configuration des webhooks',
      'Mapping des données',
      'Synchronisation initiale'
    ];
    
    for (let i = 0; i < steps.length; i++) {
      setTimeout(() => {
        setConnectionProgress(((i + 1) / steps.length) * 100);
        
        if (i === steps.length - 1) {
          setIsConnecting(false);
          toast({
            title: "Intégration réussie",
            description: `${integrationConfig.platform} connecté avec succès`,
          });
        }
      }, (i + 1) * 1000);
    }
  };

  const handleTestConnection = async () => {
    toast({
      title: "Test en cours",
      description: "Vérification de la connexion...",
    });
    
    setTimeout(() => {
      toast({
        title: "Test réussi",
        description: "La connexion fonctionne parfaitement",
      });
    }, 2000);
  };

  const handleDisconnect = () => {
    toast({
      title: "Déconnexion",
      description: "Intégration désactivée",
      variant: "destructive"
    });
  };

  const handleDataSync = (type: string) => {
    toast({
      title: `Synchronisation ${type}`,
      description: "Données en cours de synchronisation...",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            Intégrations Intelligentes
          </DialogTitle>
          <DialogDescription>
            Connectez votre écosystème e-commerce avec l'IA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stepper */}
          <div className="flex justify-between items-center mb-8">
            {connectionSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                `}>
                  {index + 1}
                </div>
                <div className="ml-2 hidden md:block">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
                {index < connectionSteps.length - 1 && (
                  <div className={`
                    w-8 h-0.5 mx-2
                    ${index < currentStep ? 'bg-primary' : 'bg-muted'}
                  `} />
                )}
              </div>
            ))}
          </div>

          <Tabs value={connectionSteps[currentStep].id} className="space-y-4">
            {/* Platform Selection */}
            <TabsContent value="platform" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Plateforme d'intégration</CardTitle>
                  <CardDescription>Choisissez votre écosystème e-commerce</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {integrationPlatforms.map((platform) => (
                      <div
                        key={platform.id}
                        className={`
                          p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md
                          ${integrationConfig.platform === platform.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border'}
                        `}
                        onClick={() => setIntegrationConfig(prev => ({ ...prev, platform: platform.id as 'shopify' | 'woocommerce' | 'api' | 'webhook' | 'database' }))}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <platform.icon className="w-8 h-8" />
                            <div>
                              <div className="font-semibold">{platform.name}</div>
                              <div className="text-sm text-muted-foreground">{platform.description}</div>
                            </div>
                          </div>
                          <Badge 
                            variant={platform.status === 'verified' ? 'default' : platform.status === 'beta' ? 'secondary' : 'outline'}
                          >
                            {platform.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Configuration:</span>
                            <span className="font-medium">{platform.setup_time}</span>
                          </div>
                          
                          <div className="space-y-1">
                            {platform.features.map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Credentials */}
            <TabsContent value="credentials" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Authentification {integrationConfig.platform}
                  </CardTitle>
                  <CardDescription>Configurez l'accès sécurisé à votre plateforme</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {integrationConfig.platform === 'shopify' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="shop-domain">Domaine de la boutique</Label>
                        <Input
                          id="shop-domain"
                          placeholder="monshop.myshopify.com"
                          value={integrationConfig.url}
                          onChange={(e) => setIntegrationConfig(prev => ({ 
                            ...prev, 
                            url: e.target.value 
                          }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="api-key">Clé API Privée</Label>
                        <Input
                          id="api-key"
                          type="password"
                          placeholder="shppa_xxxxxxxxxxxxxxxxxxxxxxxx"
                          value={integrationConfig.apiKey}
                          onChange={(e) => setIntegrationConfig(prev => ({ 
                            ...prev, 
                            apiKey: e.target.value 
                          }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="api-secret">Mot de passe API</Label>
                        <Input
                          id="api-secret"
                          type="password"
                          placeholder="shpss_xxxxxxxxxxxxxxxxxxxxxxxx"
                          value={integrationConfig.apiSecret}
                          onChange={(e) => setIntegrationConfig(prev => ({ 
                            ...prev, 
                            apiSecret: e.target.value 
                          }))}
                        />
                      </div>
                    </div>
                  )}

                  {integrationConfig.platform === 'api' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="api-endpoint">Endpoint API</Label>
                        <Input
                          id="api-endpoint"
                          placeholder="https://api.exemple.com/v1"
                          value={integrationConfig.url}
                          onChange={(e) => setIntegrationConfig(prev => ({ 
                            ...prev, 
                            url: e.target.value 
                          }))}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Méthode d'authentification</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Bearer Token" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bearer">Bearer Token</SelectItem>
                              <SelectItem value="basic">Basic Auth</SelectItem>
                              <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                              <SelectItem value="apikey">API Key</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Format des données</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="JSON" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="json">JSON</SelectItem>
                              <SelectItem value="xml">XML</SelectItem>
                              <SelectItem value="csv">CSV</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="headers">Headers personnalisés</Label>
                        <Textarea
                          id="headers"
                          placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                          rows={3}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleTestConnection} variant="outline">
                      <Shield className="w-4 h-4 mr-2" />
                      Tester la connexion
                    </Button>
                    <Button onClick={() => toast({ title: "Guide ouvert", description: "Documentation d'aide" })} variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Guide d'installation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Synchronisation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-sync">Synchronisation automatique</Label>
                        <div className="text-sm text-muted-foreground">
                          Maintient les données à jour en permanence
                        </div>
                      </div>
                      <Switch
                        id="auto-sync"
                        checked={integrationConfig.settings.autoSync}
                        onCheckedChange={(checked) => setIntegrationConfig(prev => ({
                          ...prev,
                          settings: { ...prev.settings, autoSync: checked }
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Fréquence de synchronisation</Label>
                      <Select
                        value={integrationConfig.settings.syncFrequency}
                        onValueChange={(value) => setIntegrationConfig(prev => ({
                          ...prev,
                          settings: { ...prev.settings, syncFrequency: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {syncFrequencies.map((freq) => (
                            <SelectItem key={freq.value} value={freq.value}>
                              <div>
                                <div>{freq.label}</div>
                                <div className="text-xs text-muted-foreground">{freq.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Résolution des conflits</Label>
                      <Select
                        value={integrationConfig.settings.conflictResolution}
                        onValueChange={(value) => setIntegrationConfig(prev => ({
                          ...prev,
                          settings: { ...prev.settings, conflictResolution: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="overwrite">Écraser (source → destination)</SelectItem>
                          <SelectItem value="merge">Fusionner intelligemment</SelectItem>
                          <SelectItem value="skip">Ignorer les conflits</SelectItem>
                          <SelectItem value="manual">Résolution manuelle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Types de données
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dataTypes.map((dataType) => (
                      <div key={dataType.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{dataType.name}</div>
                          <div className="text-sm text-muted-foreground">{dataType.description}</div>
                        </div>
                        <Switch
                          checked={dataType.enabled}
                          onCheckedChange={(checked) => {
                            // Handle data type toggle
                            toast({
                              title: `${dataType.name} ${checked ? 'activé' : 'désactivé'}`,
                              description: `Synchronisation ${dataType.name.toLowerCase()} ${checked ? 'activée' : 'désactivée'}`,
                            });
                          }}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Mapping */}
            <TabsContent value="mapping" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Correspondance des Champs</CardTitle>
                  <CardDescription>Mappez les champs entre les systèmes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 font-medium text-sm border-b pb-2">
                      <div>Champ Source ({integrationConfig.platform})</div>
                      <div>Champ Destination (ShopOpti)</div>
                      <div>Transformation</div>
                    </div>
                    
                    {[
                      { source: 'title', destination: 'product_name', transform: 'Aucune' },
                      { source: 'handle', destination: 'slug', transform: 'URL friendly' },
                      { source: 'price', destination: 'selling_price', transform: 'Format monétaire' },
                      { source: 'compare_at_price', destination: 'original_price', transform: 'Format monétaire' },
                      { source: 'inventory_quantity', destination: 'stock_quantity', transform: 'Nombre entier' },
                      { source: 'product_type', destination: 'category', transform: 'Mapping catégories' }
                    ].map((mapping, index) => (
                      <div key={index} className="grid grid-cols-3 gap-4 items-center p-3 border rounded-lg">
                        <div className="font-medium">{mapping.source}</div>
                        <div>{mapping.destination}</div>
                        <Badge variant="outline">{mapping.transform}</Badge>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 flex gap-2">
                    <Button variant="outline">
                      <Zap className="w-4 h-4 mr-2" />
                      Auto-mapping IA
                    </Button>
                    <Button variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Mapping avancé
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Test */}
            <TabsContent value="test" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Test de l'intégration
                  </CardTitle>
                  <CardDescription>Validez le bon fonctionnement de votre intégration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Test Connection */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">Connexion API</div>
                        <div className="text-sm text-muted-foreground">Vérification des credentials et de l'accès</div>
                      </div>
                      <Button onClick={handleTestConnection} size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Tester
                      </Button>
                    </div>

                    {/* Test Data Sync */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">Synchronisation de test</div>
                        <div className="text-sm text-muted-foreground">Import de 5 produits pour validation</div>
                      </div>
                      <Button onClick={() => handleDataSync('test')} size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Synchroniser
                      </Button>
                    </div>

                    {/* Progress */}
                    {isConnecting && (
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Configuration en cours...</span>
                          <span>{Math.round(connectionProgress)}%</span>
                        </div>
                        <Progress value={connectionProgress} />
                        <div className="text-sm text-muted-foreground">
                          Initialisation de l'intégration {integrationConfig.platform}
                        </div>
                      </div>
                    )}

                    {/* Status Dashboard */}
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Statut de connexion</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm">Connecté</span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Dernière sync</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">Il y a 2 min</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
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
              {currentStep === connectionSteps.length - 1 ? (
                <Button onClick={handleConnect} disabled={isConnecting}>
                  {isConnecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Activer l'intégration
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentStep(Math.min(connectionSteps.length - 1, currentStep + 1))}
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