import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ExternalLink, 
  TestTube, 
  RotateCw,
  Settings,
  Key,
  Globe,
  Zap
} from 'lucide-react'

interface IntegrationModalProps {
  integration: any
  onConnect: (integration: any, credentials?: any) => void
  onSync: (integration: any) => void
  onTest: (integration: any) => void
}

export const IntegrationModal = ({ 
  integration, 
  onConnect, 
  onSync, 
  onTest 
}: IntegrationModalProps) => {
  const [credentials, setCredentials] = useState({
    apiKey: '',
    apiSecret: '',
    shopDomain: '',
    accessToken: ''
  })

  const handleCredentialChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }))
  }

  const renderConnectionForm = () => {
    switch (integration.name) {
      case 'Shopify':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="shopDomain">Nom du magasin</Label>
              <Input 
                id="shopDomain"
                placeholder="mon-magasin.myshopify.com"
                value={credentials.shopDomain}
                onChange={(e) => handleCredentialChange('shopDomain', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="accessToken">Token d'accès</Label>
              <Input 
                id="accessToken"
                type="password"
                placeholder="shpat_xxxxxxxxxxxxxx"
                value={credentials.accessToken}
                onChange={(e) => handleCredentialChange('accessToken', e.target.value)}
              />
            </div>
          </div>
        )
      case 'AliExpress':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey">Clé API</Label>
              <Input 
                id="apiKey"
                type="password"
                placeholder="Votre clé API AliExpress"
                value={credentials.apiKey}
                onChange={(e) => handleCredentialChange('apiKey', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="apiSecret">Secret API</Label>
              <Input 
                id="apiSecret"
                type="password"
                placeholder="Votre secret API AliExpress"
                value={credentials.apiSecret}
                onChange={(e) => handleCredentialChange('apiSecret', e.target.value)}
              />
            </div>
          </div>
        )
      case 'BigBuy':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey">Clé API BigBuy</Label>
              <Input 
                id="apiKey"
                type="password"
                placeholder="Votre clé API BigBuy"
                value={credentials.apiKey}
                onChange={(e) => handleCredentialChange('apiKey', e.target.value)}
              />
            </div>
          </div>
        )
      default:
        return (
          <div className="text-center p-6">
            <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Cette intégration sera bientôt disponible.
            </p>
          </div>
        )
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
        <div>
          <h3 className="font-semibold text-lg">{integration.name}</h3>
          <p className="text-sm text-muted-foreground">{integration.description}</p>
        </div>
        <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
          {integration.status === 'connected' ? 'Connecté' : 'Disponible'}
        </Badge>
      </div>

      <Separator />

      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connection">
            <Key className="w-4 h-4 mr-2" />
            Connexion
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Paramètres
          </TabsTrigger>
          <TabsTrigger value="docs">
            <Globe className="w-4 h-4 mr-2" />
            Documentation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4">
          {integration.status === 'connected' ? (
            <div className="space-y-4">
              <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-sm text-success">✓ Intégration connectée avec succès</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => onTest(integration)}
                  variant="outline"
                  className="flex-1"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Tester la connexion
                </Button>
                <Button 
                  onClick={() => onSync(integration)}
                  className="flex-1"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  Synchroniser
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {renderConnectionForm()}
              <Button 
                onClick={() => onConnect(integration, credentials)}
                className="w-full"
                disabled={!credentials.apiKey && !credentials.shopDomain}
              >
                <Zap className="w-4 h-4 mr-2" />
                Connecter {integration.name}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="space-y-4">
            <h4 className="font-medium">Fonctionnalités disponibles</h4>
            <div className="space-y-2">
              {integration.features.map((feature: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <div className="space-y-4">
            <h4 className="font-medium">Documentation officielle</h4>
            <p className="text-sm text-muted-foreground">
              Consultez la documentation officielle de {integration.name} pour plus d'informations sur l'API.
            </p>
            <Button variant="outline" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Ouvrir la documentation
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}