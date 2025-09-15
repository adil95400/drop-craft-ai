import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Code, 
  Key, 
  Globe, 
  Webhook, 
  BarChart3, 
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Play,
  BookOpen,
  Zap,
  Shield
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface APIKey {
  id: string
  name: string
  key: string
  permissions: string[]
  lastUsed: string
  created: string
  status: 'active' | 'revoked'
  usage: {
    requests: number
    limit: number
    period: string
  }
}

interface Webhook {
  id: string
  url: string
  events: string[]
  secret: string
  status: 'active' | 'inactive'
  lastDelivery: string
  successRate: number
}

interface APIEndpoint {
  method: string
  path: string
  description: string
  parameters?: Array<{
    name: string
    type: string
    required: boolean
    description: string
  }>
  example?: string
}

export function DeveloperConsole() {
  const { toast } = useToast()
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [endpoints] = useState<APIEndpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [showWebhookDialog, setShowWebhookDialog] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  // Mock data pour la démo
  useEffect(() => {
    const mockAPIKeys: APIKey[] = [
      {
        id: '1',
        name: 'Production API',
        key: 'pk_live_123456789abcdef...',
        permissions: ['products:read', 'orders:read', 'orders:write', 'analytics:read'],
        lastUsed: '2024-03-15T10:30:00Z',
        created: '2024-01-15T00:00:00Z',
        status: 'active',
        usage: {
          requests: 8450,
          limit: 10000,
          period: 'monthly'
        }
      },
      {
        id: '2',
        name: 'Development API',
        key: 'pk_test_987654321fedcba...',
        permissions: ['products:read', 'products:write'],
        lastUsed: '2024-03-14T16:45:00Z',
        created: '2024-02-01T00:00:00Z',
        status: 'active',
        usage: {
          requests: 1250,
          limit: 5000,
          period: 'monthly'
        }
      },
      {
        id: '3',
        name: 'Analytics Only',
        key: 'pk_analytics_555666777...',
        permissions: ['analytics:read'],
        lastUsed: '2024-03-13T08:20:00Z',
        created: '2024-03-01T00:00:00Z',
        status: 'revoked',
        usage: {
          requests: 0,
          limit: 1000,
          period: 'monthly'
        }
      }
    ]

    const mockWebhooks: Webhook[] = [
      {
        id: '1',
        url: 'https://myapp.com/webhooks/orders',
        events: ['order.created', 'order.updated', 'order.cancelled'],
        secret: 'whsec_123abc...',
        status: 'active',
        lastDelivery: '2024-03-15T10:15:00Z',
        successRate: 98.5
      },
      {
        id: '2',
        url: 'https://analytics.mycompany.com/events',
        events: ['product.viewed', 'product.purchased'],
        secret: 'whsec_456def...',
        status: 'active',
        lastDelivery: '2024-03-15T09:30:00Z',
        successRate: 99.2
      },
      {
        id: '3',
        url: 'https://old-system.company.com/api/sync',
        events: ['inventory.updated'],
        secret: 'whsec_789ghi...',
        status: 'inactive',
        lastDelivery: '2024-03-10T12:00:00Z',
        successRate: 85.3
      }
    ]

    setAPIKeys(mockAPIKeys)
    setWebhooks(mockWebhooks)
    setLoading(false)
  }, [])

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys)
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId)
    } else {
      newVisibleKeys.add(keyId)
    }
    setVisibleKeys(newVisibleKeys)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copié!",
        description: "La clé API a été copiée dans le presse-papiers",
      })
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de copier la clé",
        variant: "destructive"
      })
    }
  }

  const revokeAPIKey = (keyId: string) => {
    setApiKeys(prev => prev.map(key => 
      key.id === keyId ? { ...key, status: 'revoked' as const } : key
    ))
    toast({
      title: "Clé révoquée",
      description: "La clé API a été révoquée avec succès",
    })
  }

  const testWebhook = async (webhookId: string) => {
    toast({
      title: "Test en cours...",
      description: "Envoi d'un événement de test au webhook",
    })
    
    // Simulation d'un test
    setTimeout(() => {
      toast({
        title: "Test réussi",
        description: "Le webhook a répondu avec succès (200 OK)",
      })
    }, 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Console Développeur</h1>
          <p className="text-muted-foreground">
            Gérez vos clés API, webhooks et intégrations
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline">
            <BookOpen className="mr-2 h-4 w-4" />
            Documentation API
          </Button>
          <Button className="bg-gradient-to-r from-primary to-primary/80">
            <Code className="mr-2 h-4 w-4" />
            Playground
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Key className="mr-2 h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Clés API actives</p>
                <p className="text-lg font-semibold">{apiKeys.filter(k => k.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Webhook className="mr-2 h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Webhooks</p>
                <p className="text-lg font-semibold">{webhooks.filter(w => w.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Requêtes ce mois</p>
                <p className="text-lg font-semibold">{apiKeys.reduce((sum, key) => sum + key.usage.requests, 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Zap className="mr-2 h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Uptime API</p>
                <p className="text-lg font-semibold">99.9%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="api-keys" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api-keys">Clés API</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="api-keys" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestion des clés API</h2>
            
            <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle clé API
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle clé API</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="keyName">Nom de la clé</Label>
                    <Input id="keyName" placeholder="Production API" />
                  </div>
                  <div>
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['products:read', 'products:write', 'orders:read', 'orders:write', 'analytics:read'].map(perm => (
                        <div key={perm} className="flex items-center space-x-2">
                          <input type="checkbox" id={perm} />
                          <Label htmlFor={perm} className="text-sm">{perm}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full">Créer la clé API</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <Card key={apiKey.id} className={apiKey.status === 'revoked' ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Key className="mr-2 h-4 w-4" />
                        {apiKey.name}
                      </CardTitle>
                      <CardDescription>
                        Créée le {new Date(apiKey.created).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className={apiKey.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {apiKey.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Clé API</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input 
                        value={visibleKeys.has(apiKey.id) ? apiKey.key : apiKey.key.replace(/./g, '•')}
                        readOnly 
                        className="font-mono text-sm"
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                      >
                        {visibleKeys.has(apiKey.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(apiKey.key)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Dernière utilisation</p>
                      <p>{new Date(apiKey.lastUsed).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Requêtes ce mois</p>
                      <p>{apiKey.usage.requests.toLocaleString()} / {apiKey.usage.limit.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Permissions</p>
                      <p>{apiKey.permissions.length} autorisations</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">Permissions</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {apiKey.permissions.map(permission => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {apiKey.status === 'active' && (
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        Modifier
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => revokeAPIKey(apiKey.id)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Révoquer
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestion des webhooks</h2>
            
            <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau webhook
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un nouveau webhook</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="webhookUrl">URL du webhook</Label>
                    <Input id="webhookUrl" placeholder="https://myapp.com/webhooks" />
                  </div>
                  <div>
                    <Label>Événements</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {['order.created', 'order.updated', 'product.created', 'product.updated'].map(event => (
                        <div key={event} className="flex items-center space-x-2">
                          <input type="checkbox" id={event} />
                          <Label htmlFor={event} className="text-sm">{event}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full">Créer le webhook</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Webhook className="mr-2 h-4 w-4" />
                        {webhook.url}
                      </CardTitle>
                      <CardDescription>
                        {webhook.events.length} événements surveillés
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={webhook.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {webhook.status}
                      </Badge>
                      <Badge variant="outline">
                        {webhook.successRate}% success
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Dernière livraison</p>
                      <p>{new Date(webhook.lastDelivery).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Taux de succès</p>
                      <p className={webhook.successRate > 95 ? 'text-green-600' : 'text-yellow-600'}>
                        {webhook.successRate}%
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">Secret</Label>
                    <Input 
                      value={webhook.secret.replace(/./g, '•')}
                      readOnly 
                      className="font-mono text-sm mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">Événements</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {webhook.events.map(event => (
                        <Badge key={event} variant="secondary" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => testWebhook(webhook.id)}
                    >
                      <Play className="mr-1 h-4 w-4" />
                      Tester
                    </Button>
                    <Button variant="outline" size="sm">
                      Modifier
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-1 h-4 w-4" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Documentation API
              </CardTitle>
              <CardDescription>
                Guide complet pour intégrer notre API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Points d'entrée principaux</h3>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className="bg-green-100 text-green-800">GET</Badge>
                        <code className="text-sm">/api/v1/products</code>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Récupérer la liste des produits
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Paramètres: limit, offset, search, category
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className="bg-blue-100 text-blue-800">POST</Badge>
                        <code className="text-sm">/api/v1/products</code>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Créer un nouveau produit
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Corps: name, description, price, category
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className="bg-green-100 text-green-800">GET</Badge>
                        <code className="text-sm">/api/v1/orders</code>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Récupérer les commandes
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Paramètres: status, date_from, date_to
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Authentification</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <code className="text-sm">
                      curl -H "Authorization: Bearer YOUR_API_KEY" \<br/>
                      &nbsp;&nbsp;&nbsp;&nbsp;https://api.yourapp.com/v1/products
                    </code>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Exemple de réponse</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-sm">
{`{
  "data": [
    {
      "id": "123",
      "name": "Product Name",
      "price": 29.99,
      "category": "electronics"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Logs API
              </CardTitle>
              <CardDescription>
                Historique des requêtes et événements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { time: '10:30:45', method: 'GET', endpoint: '/api/v1/products', status: 200, duration: '120ms' },
                  { time: '10:29:32', method: 'POST', endpoint: '/api/v1/orders', status: 201, duration: '250ms' },
                  { time: '10:28:15', method: 'GET', endpoint: '/api/v1/analytics', status: 200, duration: '95ms' },
                  { time: '10:27:08', method: 'PUT', endpoint: '/api/v1/products/123', status: 200, duration: '180ms' },
                  { time: '10:26:42', method: 'GET', endpoint: '/api/v1/products', status: 429, duration: '45ms' }
                ].map((log, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-muted-foreground">{log.time}</span>
                      <Badge 
                        className={
                          log.method === 'GET' ? 'bg-green-100 text-green-800' :
                          log.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {log.method}
                      </Badge>
                      <code className="text-sm">{log.endpoint}</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className={
                          log.status === 200 || log.status === 201 ? 'bg-green-100 text-green-800' :
                          log.status === 429 ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {log.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{log.duration}</span>
                    </div>
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