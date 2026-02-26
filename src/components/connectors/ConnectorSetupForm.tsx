import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { PlatformInfo, ConnectorManager } from '@/services/ConnectorManager';
import { PlatformCredentials } from '@/services/connectors/AdvancedBaseConnector';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, AlertCircle, ExternalLink, Settings, Zap, Shield } from 'lucide-react';

interface ConnectorSetupFormProps {
  platform: PlatformInfo;
  onSuccess: (connectorId: string) => void;
  onCancel: () => void;
}

export const ConnectorSetupForm: React.FC<ConnectorSetupFormProps> = ({
  platform,
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<PlatformCredentials>({});
  const [syncConfig, setSyncConfig] = useState({
    frequency: 'manual' as 'manual' | 'hourly' | 'daily' | 'realtime',
    entities: ['products'] as ('products' | 'orders' | 'customers' | 'inventory')[],
    webhooks: false
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const connectorManager = ConnectorManager.getInstance();

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
    setConnectionStatus('idle');
  };

  const handleEntityToggle = (entity: 'products' | 'orders' | 'customers' | 'inventory') => {
    setSyncConfig(prev => ({
      ...prev,
      entities: prev.entities.includes(entity)
        ? prev.entities.filter(e => e !== entity)
        : [...prev.entities, entity]
    }));
  };

  const testConnection = async () => {
    if (!user) return;

    setIsTestingConnection(true);
    setConnectionStatus('idle');
    setErrorMessage('');

    try {
      // Validation des champs requis
      const missingFields = platform.required_credentials.filter(
        field => !credentials[field as keyof PlatformCredentials]
      );

      if (missingFields.length > 0) {
        throw new Error(`Champs requis manquants: ${missingFields.join(', ')}`);
      }

      // Créer un connecteur temporaire pour tester
      const tempConnectorId = await connectorManager.createConnector(
        user.id,
        platform.id,
        credentials,
        { is_active: false } // Temporaire, pas actif
      );

      const isValid = await connectorManager.testConnection(tempConnectorId);

      if (isValid) {
        setConnectionStatus('success');
        toast({
          title: "Connexion réussie",
          description: `La connexion à ${platform.display_name} a été établie avec succès.`,
        });
      } else {
        setConnectionStatus('error');
        setErrorMessage('Échec de la connexion. Vérifiez vos identifiants.');
      }

    } catch (error: any) {
      setConnectionStatus('error');
      setErrorMessage(error.message);
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const saveConnector = async () => {
    if (!user || connectionStatus !== 'success') return;

    setIsSaving(true);

    try {
      const connectorId = await connectorManager.createConnector(
        user.id,
        platform.id,
        credentials,
        {
          sync_frequency: syncConfig.frequency,
          sync_entities: syncConfig.entities,
          is_active: true
        }
      );

      // Configurer les webhooks si demandé
      if (syncConfig.webhooks && syncConfig.frequency === 'realtime') {
        await connectorManager.setupWebhooksForConnector(connectorId);
      }

      toast({
        title: "Connecteur configuré",
        description: `${platform.display_name} a été configuré avec succès.`,
      });

      onSuccess(connectorId);
    } catch (error: any) {
      toast({
        title: "Erreur de configuration",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderCredentialField = (field: string) => {
    const isRequired = platform.required_credentials.includes(field);
    const isPassword = field.toLowerCase().includes('secret') || 
                      field.toLowerCase().includes('password') || 
                      field.toLowerCase().includes('token');

    return (
      <div key={field} className="space-y-2">
        <Label htmlFor={field} className="flex items-center gap-2">
          {getFieldLabel(field)}
          {isRequired && <Badge variant="destructive" className="text-xs">Requis</Badge>}
        </Label>
        <Input
          id={field}
          type={isPassword ? 'password' : 'text'}
          value={credentials[field as keyof PlatformCredentials] || ''}
          onChange={(e) => handleCredentialChange(field, e.target.value)}
          placeholder={getFieldPlaceholder(field)}
          className={isRequired && !credentials[field as keyof PlatformCredentials] ? 'border-red-300' : ''}
        />
        {getFieldDescription(field) && (
          <p className="text-sm text-muted-foreground">{getFieldDescription(field)}</p>
        )}
      </div>
    );
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      shop_url: 'URL de la boutique',
      accessToken: 'Token d\'accès',
      apiKey: 'Clé API',
      apiSecret: 'Secret API',
      clientId: 'Consumer Key / Client ID',
      clientSecret: 'Consumer Secret / Client Secret',
      username: 'Nom d\'utilisateur',
      password: 'Mot de passe',
      api_version: 'Version API',
      webhook_secret: 'Secret Webhook',
      storeId: 'ID de la boutique',
      sellerId: 'ID du vendeur'
    };
    return labels[field] || field;
  };

  const getFieldPlaceholder = (field: string): string => {
    const placeholders: Record<string, string> = {
      shop_url: platform.id === 'shopify' ? 'monshop.myshopify.com' : 'https://monsite.com',
      accessToken: '••••••••••••••••',
      apiKey: '••••••••••••••••',
      clientId: '••••••••••••••••',
      clientSecret: '••••••••••••••••',
      api_version: platform.id === 'shopify' ? '2023-10' : '3'
    };
    return placeholders[field] || '';
  };

  const getFieldDescription = (field: string): string => {
    const descriptions: Record<string, string> = {
      shop_url: platform.id === 'shopify' ? 
        'Votre domaine Shopify (ex: monshop.myshopify.com)' :
        'URL complète de votre site (ex: https://monsite.com)',
      accessToken: 'Token généré dans les paramètres API de votre boutique',
      webhook_secret: 'Secret pour vérifier l\'authenticité des webhooks (optionnel)'
    };
    return descriptions[field] || '';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {platform.logo_url && (
                <img src={platform.logo_url} alt={platform.display_name} className="w-8 h-8" />
              )}
              <div>
                <CardTitle>Configurer {platform.display_name}</CardTitle>
                <CardDescription>{platform.description}</CardDescription>
              </div>
            </div>
            <Badge variant="outline">{platform.category}</Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="credentials" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="credentials" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Identifiants
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Synchronisation
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Temps réel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Identifiants API
              </CardTitle>
              <CardDescription>
                Configurez les identifiants nécessaires pour accéder à l'API {platform.display_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[...platform.required_credentials, ...platform.optional_credentials]
                .map(field => renderCredentialField(field))}

              {platform.documentation_url && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>Besoin d'aide pour obtenir vos identifiants ?</span>
                    <Button variant="outline" size="sm" asChild>
                      <a href={platform.documentation_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Documentation
                      </a>
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={testConnection}
                  disabled={isTestingConnection || !platform.required_credentials.every(
                    field => credentials[field as keyof PlatformCredentials]
                  )}
                >
                  {isTestingConnection ? 'Test en cours...' : 'Tester la connexion'}
                </Button>

                {connectionStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Connexion réussie</span>
                  </div>
                )}

                {connectionStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm">Connexion échouée</span>
                  </div>
                )}
              </div>

              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration de synchronisation</CardTitle>
              <CardDescription>
                Définissez quoi synchroniser et à quelle fréquence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Fréquence de synchronisation</Label>
                <Select 
                  value={syncConfig.frequency} 
                  onValueChange={(value: any) => setSyncConfig(prev => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manuelle uniquement</SelectItem>
                    <SelectItem value="hourly">Toutes les heures</SelectItem>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    {platform.features.webhooks && (
                      <SelectItem value="realtime">Temps réel (webhooks)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Données à synchroniser</Label>
                <div className="grid grid-cols-2 gap-4">
                  {(Object.keys(platform.features) as Array<keyof typeof platform.features>)
                    .filter(feature => feature !== 'webhooks' && platform.features[feature])
                    .map((entity) => (
                      <div key={entity} className="flex items-center space-x-2">
                        <Checkbox
                          id={entity}
                          checked={syncConfig.entities.includes(entity as any)}
                          onCheckedChange={() => handleEntityToggle(entity as any)}
                        />
                        <Label htmlFor={entity} className="capitalize">
                          {entity === 'products' && 'Produits'}
                          {entity === 'orders' && 'Commandes'}
                          {entity === 'customers' && 'Clients'}
                          {entity === 'inventory' && 'Stocks'}
                        </Label>
                      </div>
                    ))}
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {syncConfig.frequency === 'realtime' 
                    ? 'La synchronisation temps réel utilise les webhooks pour des mises à jour instantanées.'
                    : 'La synchronisation programmée vérifie les changements à intervalles réguliers.'
                  }
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synchronisation temps réel</CardTitle>
              <CardDescription>
                Configurez les webhooks pour des mises à jour instantanées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {platform.features.webhooks ? (
                <>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="webhooks"
                      checked={syncConfig.webhooks && syncConfig.frequency === 'realtime'}
                      onCheckedChange={(checked) => {
                        setSyncConfig(prev => ({
                          ...prev,
                          webhooks: checked,
                          frequency: checked ? 'realtime' : 'manual'
                        }));
                      }}
                    />
                    <Label htmlFor="webhooks">Activer la synchronisation temps réel</Label>
                  </div>

                  {syncConfig.webhooks && (
                    <Alert>
                      <Zap className="h-4 w-4" />
                      <AlertDescription>
                        Les webhooks seront configurés automatiquement dans votre boutique {platform.display_name}.
                        Vous recevrez des mises à jour instantanées pour tous les changements.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label>Événements supportés</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {platform.features.products && (
                        <Badge variant="secondary">Produits créés/modifiés</Badge>
                      )}
                      {platform.features.orders && (
                        <Badge variant="secondary">Commandes créées/mises à jour</Badge>
                      )}
                      {platform.features.customers && (
                        <Badge variant="secondary">Clients créés/modifiés</Badge>
                      )}
                      {platform.features.inventory && (
                        <Badge variant="secondary">Stocks mis à jour</Badge>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {platform.display_name} ne supporte pas les webhooks natifs. 
                    La synchronisation se fera via des tâches programmées.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button 
          onClick={saveConnector}
          disabled={connectionStatus !== 'success' || isSaving || syncConfig.entities.length === 0}
        >
          {isSaving ? 'Configuration...' : 'Configurer le connecteur'}
        </Button>
      </div>
    </div>
  );
};

const getFieldLabel = (field: string): string => {
  const labels: Record<string, string> = {
    shop_url: 'URL de la boutique',
    accessToken: 'Token d\'accès',
    apiKey: 'Clé API',
    apiSecret: 'Secret API',
    clientId: 'Consumer Key / Client ID',
    clientSecret: 'Consumer Secret / Client Secret',
    username: 'Nom d\'utilisateur',
    password: 'Mot de passe',
    api_version: 'Version API',
    webhook_secret: 'Secret Webhook',
    storeId: 'ID de la boutique',
    sellerId: 'ID du vendeur'
  };
  return labels[field] || field;
};