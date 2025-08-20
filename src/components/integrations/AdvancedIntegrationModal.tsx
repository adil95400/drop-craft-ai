import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ExternalLink, 
  TestTube, 
  RotateCw,
  Settings,
  Key,
  Globe,
  Zap,
  Database,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle,
  Shield
} from 'lucide-react'

interface AdvancedIntegrationModalProps {
  integration: any
  onConnect: (integration: any, credentials?: any, config?: any) => void
  onSync: (integration: any) => void
  onTest: (integration: any) => void
  onUpdateConfig: (integration: any, config: any) => void
}

export const AdvancedIntegrationModal = ({ 
  integration, 
  onConnect, 
  onSync, 
  onTest,
  onUpdateConfig
}: AdvancedIntegrationModalProps) => {
  const [credentials, setCredentials] = useState({
    apiKey: '',
    apiSecret: '',
    shopDomain: '',
    accessToken: '',
    clientId: '',
    clientSecret: '',
    refreshToken: '',
    developerToken: '',
    listId: ''
  })

  const [config, setConfig] = useState({
    autoSync: false,
    syncFrequency: 'daily',
    dataMapping: {},
    filters: {
      categories: [],
      minPrice: '',
      maxPrice: '',
      brands: []
    },
    webhooks: false,
    notifications: true,
    dataRetention: 30,
    errorHandling: 'retry'
  })

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }))
  }

  const handleConfigChange = (field: string, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  const renderConnectionForm = () => {
    switch (integration.name) {
      case 'Shopify':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="shopDomain">Nom du magasin *</Label>
              <Input 
                id="shopDomain"
                placeholder="mon-magasin.myshopify.com"
                value={credentials.shopDomain}
                onChange={(e) => handleCredentialChange('shopDomain', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="accessToken">Token d'accès privé *</Label>
              <Input 
                id="accessToken"
                type="password"
                placeholder="shpat_xxxxxxxxxxxxxx"
                value={credentials.accessToken}
                onChange={(e) => handleCredentialChange('accessToken', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Trouvez votre token dans Admin → Apps → Développer des apps
              </p>
            </div>
          </div>
        )
      
      case 'AliExpress':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey">App Key *</Label>
              <Input 
                id="apiKey"
                type="password"
                placeholder="Votre App Key AliExpress"
                value={credentials.apiKey}
                onChange={(e) => handleCredentialChange('apiKey', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="apiSecret">App Secret *</Label>
              <Input 
                id="apiSecret"
                type="password"
                placeholder="Votre App Secret AliExpress"
                value={credentials.apiSecret}
                onChange={(e) => handleCredentialChange('apiSecret', e.target.value)}
              />
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 Inscrivez-vous au programme Portail Développeur AliExpress pour obtenir vos clés API
              </p>
            </div>
          </div>
        )
      
      case 'BigBuy':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey">Clé API BigBuy *</Label>
              <Input 
                id="apiKey"
                type="password"
                placeholder="Votre clé API BigBuy"
                value={credentials.apiKey}
                onChange={(e) => handleCredentialChange('apiKey', e.target.value)}
              />
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                ✓ API REST complète avec gestion des commandes et stock temps réel
              </p>
            </div>
          </div>
        )
      
      case 'Mailchimp':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey">Clé API Mailchimp *</Label>
              <Input 
                id="apiKey"
                type="password"
                placeholder="votre-cle-api-us1"
                value={credentials.apiKey}
                onChange={(e) => handleCredentialChange('apiKey', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="listId">ID de la liste par défaut</Label>
              <Input 
                id="listId"
                placeholder="ID de votre liste d'abonnés"
                value={credentials.listId}
                onChange={(e) => handleCredentialChange('listId', e.target.value)}
              />
            </div>
          </div>
        )
      
      case 'Klaviyo':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey">Clé API Klaviyo *</Label>
              <Input 
                id="apiKey"
                type="password"
                placeholder="Votre clé API privée Klaviyo"
                value={credentials.apiKey}
                onChange={(e) => handleCredentialChange('apiKey', e.target.value)}
              />
            </div>
          </div>
        )
      
      case 'Google Ads':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="clientId">Client ID *</Label>
              <Input 
                id="clientId"
                placeholder="Votre Client ID OAuth2"
                value={credentials.clientId}
                onChange={(e) => handleCredentialChange('clientId', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="clientSecret">Client Secret *</Label>
              <Input 
                id="clientSecret"
                type="password"
                placeholder="Votre Client Secret OAuth2"
                value={credentials.clientSecret}
                onChange={(e) => handleCredentialChange('clientSecret', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="developerToken">Developer Token *</Label>
              <Input 
                id="developerToken"
                type="password"
                placeholder="Votre Developer Token Google Ads"
                value={credentials.developerToken}
                onChange={(e) => handleCredentialChange('developerToken', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="refreshToken">Refresh Token</Label>
              <Input 
                id="refreshToken"
                type="password"
                placeholder="Token de rafraîchissement OAuth2"
                value={credentials.refreshToken}
                onChange={(e) => handleCredentialChange('refreshToken', e.target.value)}
              />
            </div>
          </div>
        )
      
      case 'Facebook Ads':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="accessToken">Access Token *</Label>
              <Input 
                id="accessToken"
                type="password"
                placeholder="Votre Access Token Facebook"
                value={credentials.accessToken}
                onChange={(e) => handleCredentialChange('accessToken', e.target.value)}
              />
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Générez un token longue durée depuis Facebook Developer Console
              </p>
            </div>
          </div>
        )
      
      case 'Stripe':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey">Clé secrète Stripe *</Label>
              <Input 
                id="apiKey"
                type="password"
                placeholder="sk_live_xxxxx ou sk_test_xxxxx"
                value={credentials.apiKey}
                onChange={(e) => handleCredentialChange('apiKey', e.target.value)}
              />
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-700">
                ⚠️ Utilisez votre clé de test pour les essais, puis passez en mode live
              </p>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="text-center p-6">
            <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Configuration en cours de développement pour {integration.name}
            </p>
          </div>
        )
    }
  }

  const renderAdvancedSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCw className="w-4 h-4" />
            Synchronisation automatique
          </CardTitle>
          <CardDescription>
            Configurez la synchronisation automatique des données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="autoSync">Activer la sync automatique</Label>
            <Switch 
              id="autoSync"
              checked={config.autoSync}
              onCheckedChange={(checked) => handleConfigChange('autoSync', checked)}
            />
          </div>
          
          {config.autoSync && (
            <div>
              <Label>Fréquence de synchronisation</Label>
              <Select 
                value={config.syncFrequency} 
                onValueChange={(value) => handleConfigChange('syncFrequency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Toutes les heures</SelectItem>
                  <SelectItem value="daily">Quotidienne</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="manual">Manuelle uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtres de données
          </CardTitle>
          <CardDescription>
            Définissez quelles données synchroniser
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minPrice">Prix minimum</Label>
              <Input 
                id="minPrice"
                type="number"
                placeholder="0"
                value={config.filters.minPrice}
                onChange={(e) => handleConfigChange('filters', { 
                  ...config.filters, 
                  minPrice: e.target.value 
                })}
              />
            </div>
            <div>
              <Label htmlFor="maxPrice">Prix maximum</Label>
              <Input 
                id="maxPrice"
                type="number"
                placeholder="1000"
                value={config.filters.maxPrice}
                onChange={(e) => handleConfigChange('filters', { 
                  ...config.filters, 
                  maxPrice: e.target.value 
                })}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="categories">Catégories (une par ligne)</Label>
            <Textarea 
              id="categories"
              placeholder="Vêtements&#10;Électronique&#10;Maison & Jardin"
              value={config.filters.categories.join('\n')}
              onChange={(e) => handleConfigChange('filters', { 
                ...config.filters, 
                categories: e.target.value.split('\n').filter(Boolean)
              })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Sécurité & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="webhooks">Activer les webhooks</Label>
            <Switch 
              id="webhooks"
              checked={config.webhooks}
              onCheckedChange={(checked) => handleConfigChange('webhooks', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">Notifications par email</Label>
            <Switch 
              id="notifications"
              checked={config.notifications}
              onCheckedChange={(checked) => handleConfigChange('notifications', checked)}
            />
          </div>
          
          <div>
            <Label>Gestion des erreurs</Label>
            <Select 
              value={config.errorHandling} 
              onValueChange={(value) => handleConfigChange('errorHandling', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="retry">Réessayer automatiquement</SelectItem>
                <SelectItem value="notify">Notifier seulement</SelectItem>
                <SelectItem value="pause">Mettre en pause</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const isValidConnection = () => {
    switch (integration.name) {
      case 'Shopify':
        return credentials.shopDomain && credentials.accessToken
      case 'AliExpress':
        return credentials.apiKey && credentials.apiSecret
      case 'BigBuy':
      case 'Mailchimp':
      case 'Klaviyo':
      case 'Stripe':
        return credentials.apiKey
      case 'Google Ads':
        return credentials.clientId && credentials.clientSecret && credentials.developerToken
      case 'Facebook Ads':
        return credentials.accessToken
      default:
        return false
    }
  }

  return (
    <div className="space-y-6">
      {/* Header avec logo et statut */}
      <div className="flex items-center gap-4">
        <img 
          src={integration.logo} 
          alt={integration.name}
          className="w-12 h-12 object-contain rounded-lg"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{integration.name}</h3>
          <p className="text-sm text-muted-foreground">{integration.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
            {integration.status === 'connected' ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Connecté
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 mr-1" />
                Disponible
              </>
            )}
          </Badge>
          {integration.plan && (
            <Badge variant="outline">{integration.plan}</Badge>
          )}
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connection" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Connexion
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Avancé
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Documentation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4">
          {integration.status === 'connected' ? (
            <div className="space-y-4">
              <Card className="bg-success/5 border-success/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Intégration connectée avec succès</span>
                  </div>
                  {integration.lastSync && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Dernière synchronisation: {new Date(integration.lastSync).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => onTest(integration)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <TestTube className="w-4 h-4" />
                  Tester la connexion
                </Button>
                <Button 
                  onClick={() => onSync(integration)}
                  className="flex items-center gap-2"
                >
                  <RotateCw className="w-4 h-4" />
                  Synchroniser maintenant
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {renderConnectionForm()}
              <Button 
                onClick={() => onConnect(integration, credentials, config)}
                className="w-full"
                disabled={!isValidConnection()}
              >
                <Zap className="w-4 h-4 mr-2" />
                Connecter {integration.name}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          {renderAdvancedSettings()}
          <Button 
            onClick={() => onUpdateConfig(integration, config)}
            className="w-full"
          >
            Sauvegarder la configuration
          </Button>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Statut de connexion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {integration.status === 'connected' ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm text-green-600">En ligne</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-gray-400 rounded-full" />
                      <span className="text-sm text-gray-600">Hors ligne</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Dernière activité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {integration.lastSync ? new Date(integration.lastSync).toLocaleDateString() : 'Jamais'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {integration.status === 'connected' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Statistiques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Données synchronisées</span>
                    <span className="font-medium">{integration.totalSynced || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Erreurs ce mois</span>
                    <span className="font-medium text-red-600">{integration.errors || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taux de réussite</span>
                    <span className="font-medium text-green-600">
                      {integration.successRate || 100}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Documentation officielle</CardTitle>
              <CardDescription>
                Consultez la documentation officielle de {integration.name} pour plus d'informations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <a href={integration.docsUrl || '#'} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ouvrir la documentation
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Fonctionnalités disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {integration.features?.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}