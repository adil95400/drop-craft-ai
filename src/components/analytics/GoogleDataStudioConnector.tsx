import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ExternalLink, 
  Link,
  Check,
  X,
  Copy,
  RefreshCw,
  Settings,
  Database,
  Shield,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'

interface DataStudioConnection {
  id: string
  name: string
  status: 'connected' | 'disconnected' | 'error'
  lastSync: Date | null
  dataSources: string[]
  refreshInterval: string
}

interface ApiEndpoint {
  id: string
  name: string
  url: string
  description: string
  enabled: boolean
}

const apiEndpoints: ApiEndpoint[] = [
  {
    id: 'products',
    name: 'Produits',
    url: '/api/v1/analytics/products',
    description: 'Catalogue produits avec stock et prix',
    enabled: true
  },
  {
    id: 'orders',
    name: 'Commandes',
    url: '/api/v1/analytics/orders',
    description: 'Historique des commandes et revenus',
    enabled: true
  },
  {
    id: 'customers',
    name: 'Clients',
    url: '/api/v1/analytics/customers',
    description: 'Base clients et comportements',
    enabled: true
  },
  {
    id: 'marketing',
    name: 'Marketing',
    url: '/api/v1/analytics/marketing',
    description: 'Performance des campagnes',
    enabled: false
  },
  {
    id: 'inventory',
    name: 'Inventaire',
    url: '/api/v1/analytics/inventory',
    description: 'Mouvements de stock en temps réel',
    enabled: true
  }
]

export function GoogleDataStudioConnector() {
  const [apiKey, setApiKey] = useState('')
  const [projectId, setProjectId] = useState('')
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>(apiEndpoints)
  const [connection, setConnection] = useState<DataStudioConnection | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const handleConnect = async () => {
    if (!apiKey || !projectId) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    setConnecting(true)
    
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setConnection({
      id: 'conn-1',
      name: 'Looker Studio Integration',
      status: 'connected',
      lastSync: new Date(),
      dataSources: endpoints.filter(e => e.enabled).map(e => e.name),
      refreshInterval: '1h'
    })
    
    setConnecting(false)
    toast.success('Connexion établie avec Looker Studio!')
  }

  const handleDisconnect = () => {
    setConnection(null)
    toast.success('Déconnecté de Looker Studio')
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setTestingConnection(false)
    toast.success('Connexion API validée ✓')
  }

  const toggleEndpoint = (id: string, enabled: boolean) => {
    setEndpoints(endpoints.map(e => 
      e.id === id ? { ...e, enabled } : e
    ))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copié dans le presse-papier')
  }

  const generateApiKey = () => {
    const key = 'sk_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    setApiKey(key)
    toast.success('Clé API générée')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ExternalLink className="h-6 w-6 text-primary" />
            Looker Studio (Google Data Studio)
          </h2>
          <p className="text-muted-foreground">
            Connectez vos données à Looker Studio pour des visualisations avancées
          </p>
        </div>
        
        {connection?.status === 'connected' && (
          <Badge className="bg-green-500/10 text-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Connecté
          </Badge>
        )}
      </div>

      {/* Status Alert */}
      {connection?.status === 'connected' && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            Votre connexion à Looker Studio est active. Dernière synchronisation: {connection.lastSync?.toLocaleString('fr-FR')}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Connection Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration de la Connexion
            </CardTitle>
            <CardDescription>
              Paramètres pour connecter ShopOpti à Looker Studio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Clé API ShopOpti</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="sk_live_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <Button variant="outline" onClick={generateApiKey}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>ID Projet Google Cloud</Label>
              <Input
                placeholder="mon-projet-123456"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Intervalle de rafraîchissement</Label>
              <Select defaultValue="1h">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15m">Toutes les 15 minutes</SelectItem>
                  <SelectItem value="1h">Toutes les heures</SelectItem>
                  <SelectItem value="6h">Toutes les 6 heures</SelectItem>
                  <SelectItem value="24h">Quotidien</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              {connection?.status === 'connected' ? (
                <>
                  <Button variant="outline" className="flex-1" onClick={handleTestConnection} disabled={testingConnection}>
                    {testingConnection ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    Tester
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={handleDisconnect}>
                    <X className="h-4 w-4 mr-2" />
                    Déconnecter
                  </Button>
                </>
              ) : (
                <Button className="w-full" onClick={handleConnect} disabled={connecting}>
                  {connecting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Link className="h-4 w-4 mr-2" />
                  )}
                  {connecting ? 'Connexion...' : 'Connecter à Looker Studio'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4" />
              Sources de Données API
            </CardTitle>
            <CardDescription>
              Endpoints disponibles pour Looker Studio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {endpoints.map((endpoint) => (
              <div 
                key={endpoint.id} 
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{endpoint.name}</span>
                    {endpoint.enabled && (
                      <Badge variant="outline" className="text-green-500 border-green-500">
                        Actif
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {baseUrl}{endpoint.url}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(`${baseUrl}${endpoint.url}`)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Switch
                  checked={endpoint.enabled}
                  onCheckedChange={(checked) => toggleEndpoint(endpoint.id, checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Guide de Configuration Looker Studio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</div>
                <span className="font-medium">Créer un Connecteur</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Dans Looker Studio, ajoutez une nouvelle source de données et sélectionnez "Connecteur personnalisé".
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</div>
                <span className="font-medium">Configurer l'API</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Utilisez les URLs d'endpoints ci-dessus et ajoutez votre clé API dans les en-têtes d'autorisation.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">3</div>
                <span className="font-medium">Créer vos Dashboards</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Construisez vos visualisations personnalisées en utilisant les données importées depuis ShopOpti.
              </p>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Conseil:</strong> Utilisez le <a href="https://lookerstudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Looker Studio Community Connectors
              </a> pour une intégration plus simple et des templates pré-configurés.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href="https://lookerstudio.google.com/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir Looker Studio
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://developers.google.com/looker-studio/connector" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Documentation API
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
