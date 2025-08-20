import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  Key, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  MoreHorizontal, 
  Trash2,
  RefreshCw,
  AlertTriangle,
  Activity,
  Globe,
  Code,
  Book
} from 'lucide-react'

interface APIKey {
  id: string
  name: string
  key: string
  permissions: string[]
  usage_count: number
  last_used?: string
  created_at: string
  expires_at?: string
  status: 'active' | 'revoked' | 'expired'
}

interface APILog {
  id: string
  api_key_id: string
  endpoint: string
  method: string
  status_code: number
  response_time: number
  timestamp: string
  ip_address: string
}

const APIManagement = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [apiLogs, setApiLogs] = useState<APILog[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [newKeyForm, setNewKeyForm] = useState({
    name: '',
    permissions: [] as string[],
    expires_in: '365' // days
  })

  useEffect(() => {
    if (user?.id) {
      loadAPIKeys()
      loadAPILogs()
    }
  }, [user?.id])

  const loadAPIKeys = async () => {
    try {
      // Mock data for now - in real app would fetch from user_api_keys table
      const mockAPIKeys: APIKey[] = [
        {
          id: '1',
          name: 'Production API',
          key: 'sk_live_51H8QxhJ2eZvKYlo2C8M3nA9oKoJGWa4VgBB0mQO6X1',
          permissions: ['products:read', 'products:write', 'orders:read'],
          usage_count: 15420,
          last_used: '2024-01-20T10:30:00Z',
          created_at: '2023-06-15T09:00:00Z',
          status: 'active'
        },
        {
          id: '2',
          name: 'Mobile App',
          key: 'sk_test_4eC39HqLyjWDarjtT1zdp7dc',
          permissions: ['orders:read', 'customers:read'],
          usage_count: 8947,
          last_used: '2024-01-19T16:45:00Z',
          created_at: '2023-09-10T14:20:00Z',
          status: 'active'
        },
        {
          id: '3',
          name: 'Analytics Dashboard',
          key: 'sk_test_BQokikJOvBiI2HlWgH4olfQ2',
          permissions: ['analytics:read'],
          usage_count: 2341,
          last_used: '2024-01-18T08:15:00Z',
          created_at: '2023-12-01T11:00:00Z',
          expires_at: '2024-12-01T11:00:00Z',
          status: 'active'
        },
        {
          id: '4',
          name: 'Legacy Integration',
          key: 'sk_live_rHb1g2IEF4CvgfzVz4Z4rOoU',
          permissions: ['products:read'],
          usage_count: 0,
          created_at: '2023-03-15T10:30:00Z',
          status: 'revoked'
        }
      ]

      setApiKeys(mockAPIKeys)
    } catch (error) {
      console.error('Error loading API keys:', error)
      toast.error('Erreur lors du chargement des clés API')
    }
  }

  const loadAPILogs = async () => {
    try {
      // Mock data for now
      const mockLogs: APILog[] = [
        {
          id: '1',
          api_key_id: '1',
          endpoint: '/api/v1/products',
          method: 'GET',
          status_code: 200,
          response_time: 124,
          timestamp: '2024-01-20T10:30:15Z',
          ip_address: '192.168.1.100'
        },
        {
          id: '2',
          api_key_id: '1',
          endpoint: '/api/v1/orders',
          method: 'POST',
          status_code: 201,
          response_time: 98,
          timestamp: '2024-01-20T10:29:42Z',
          ip_address: '192.168.1.100'
        },
        {
          id: '3',
          api_key_id: '2',
          endpoint: '/api/v1/customers',
          method: 'GET',
          status_code: 200,
          response_time: 76,
          timestamp: '2024-01-20T10:28:33Z',
          ip_address: '10.0.0.25'
        },
        {
          id: '4',
          api_key_id: '1',
          endpoint: '/api/v1/products/123',
          method: 'PUT',
          status_code: 404,
          response_time: 45,
          timestamp: '2024-01-20T10:27:18Z',
          ip_address: '192.168.1.100'
        }
      ]

      setApiLogs(mockLogs)
    } catch (error) {
      console.error('Error loading API logs:', error)
    }
  }

  const createAPIKey = async () => {
    setLoading(true)
    try {
      const newKey: APIKey = {
        id: Date.now().toString(),
        name: newKeyForm.name,
        key: `sk_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        permissions: newKeyForm.permissions,
        usage_count: 0,
        created_at: new Date().toISOString(),
        expires_at: newKeyForm.expires_in === '0' ? undefined : 
          new Date(Date.now() + parseInt(newKeyForm.expires_in) * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      }

      setApiKeys(prev => [...prev, newKey])
      setShowCreateDialog(false)
      setNewKeyForm({ name: '', permissions: [], expires_in: '365' })
      
      toast.success('Clé API créée avec succès')
    } catch (error) {
      console.error('Error creating API key:', error)
      toast.error('Erreur lors de la création de la clé API')
    } finally {
      setLoading(false)
    }
  }

  const revokeAPIKey = async (keyId: string) => {
    try {
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, status: 'revoked' as const } : key
      ))
      
      toast.success('Clé API révoquée')
    } catch (error) {
      console.error('Error revoking API key:', error)
      toast.error('Erreur lors de la révocation')
    }
  }

  const regenerateAPIKey = async (keyId: string) => {
    try {
      const newKeyValue = `sk_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, key: newKeyValue, usage_count: 0 } : key
      ))
      
      toast.success('Clé API régénérée')
    } catch (error) {
      console.error('Error regenerating API key:', error)
      toast.error('Erreur lors de la régénération')
    }
  }

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev)
      if (newSet.has(keyId)) {
        newSet.delete(keyId)
      } else {
        newSet.add(keyId)
      }
      return newSet
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copié dans le presse-papiers')
  }

  const formatLastUsed = (lastUsed?: string) => {
    if (!lastUsed) return 'Jamais'
    
    const date = new Date(lastUsed)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Il y a quelques minutes'
    if (diffInHours < 24) return `Il y a ${diffInHours}h`
    return date.toLocaleDateString('fr-FR')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'revoked':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getHTTPStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'text-green-600'
    if (statusCode >= 400 && statusCode < 500) return 'text-orange-600'
    if (statusCode >= 500) return 'text-red-600'
    return 'text-gray-600'
  }

  const maskAPIKey = (key: string) => {
    return key.substring(0, 12) + '••••••••••••••••••••' + key.substring(key.length - 8)
  }

  const availablePermissions = [
    { id: 'products:read', label: 'Produits - Lecture' },
    { id: 'products:write', label: 'Produits - Écriture' },
    { id: 'orders:read', label: 'Commandes - Lecture' },
    { id: 'orders:write', label: 'Commandes - Écriture' },
    { id: 'customers:read', label: 'Clients - Lecture' },
    { id: 'customers:write', label: 'Clients - Écriture' },
    { id: 'analytics:read', label: 'Analytics - Lecture' },
    { id: 'integrations:read', label: 'Intégrations - Lecture' },
    { id: 'integrations:write', label: 'Intégrations - Écriture' }
  ]

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Key className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gestion API</h1>
            <p className="text-muted-foreground">
              Gérez vos clés API et surveillez leur utilisation
            </p>
          </div>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle clé API
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle clé API</DialogTitle>
              <DialogDescription>
                Configurez les permissions et la durée de vie de votre clé API
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Nom de la clé</Label>
                <Input
                  id="key-name"
                  placeholder="Ex: Production API, Mobile App..."
                  value={newKeyForm.name}
                  onChange={(e) => setNewKeyForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {availablePermissions.map((permission) => (
                    <label key={permission.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newKeyForm.permissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewKeyForm(prev => ({
                              ...prev,
                              permissions: [...prev.permissions, permission.id]
                            }))
                          } else {
                            setNewKeyForm(prev => ({
                              ...prev,
                              permissions: prev.permissions.filter(p => p !== permission.id)
                            }))
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{permission.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expires-in">Expiration</Label>
                <Select 
                  value={newKeyForm.expires_in} 
                  onValueChange={(value) => setNewKeyForm(prev => ({ ...prev, expires_in: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 jours</SelectItem>
                    <SelectItem value="90">90 jours</SelectItem>
                    <SelectItem value="180">6 mois</SelectItem>
                    <SelectItem value="365">1 an</SelectItem>
                    <SelectItem value="0">Jamais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={createAPIKey} 
                  disabled={loading || !newKeyForm.name || newKeyForm.permissions.length === 0}
                >
                  Créer la clé API
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* API Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{apiKeys.length}</p>
                <p className="text-sm text-muted-foreground">Clés API</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{apiKeys.filter(k => k.status === 'active').length}</p>
                <p className="text-sm text-muted-foreground">Actives</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {apiKeys.reduce((sum, key) => sum + key.usage_count, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Requêtes totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{apiKeys.filter(k => k.status === 'revoked').length}</p>
                <p className="text-sm text-muted-foreground">Révoquées</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList>
          <TabsTrigger value="keys">Clés API</TabsTrigger>
          <TabsTrigger value="logs">Logs d'activité</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="keys">
          <Card>
            <CardHeader>
              <CardTitle>Clés API</CardTitle>
              <CardDescription>
                Gérez vos clés API et leurs permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Clé</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Utilisation</TableHead>
                    <TableHead>Dernière utilisation</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{apiKey.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Créée le {new Date(apiKey.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {visibleKeys.has(apiKey.id) ? apiKey.key : maskAPIKey(apiKey.key)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                          >
                            {visibleKeys.has(apiKey.id) ? 
                              <EyeOff className="w-4 h-4" /> : 
                              <Eye className="w-4 h-4" />
                            }
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(apiKey.key)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {apiKey.permissions.slice(0, 2).map((permission) => (
                            <Badge key={permission} variant="secondary" className="text-xs">
                              {permission.split(':')[0]}
                            </Badge>
                          ))}
                          {apiKey.permissions.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{apiKey.permissions.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{apiKey.usage_count.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">requêtes</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatLastUsed(apiKey.last_used)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(apiKey.status)}>
                          {apiKey.status === 'active' ? 'Active' :
                           apiKey.status === 'revoked' ? 'Révoquée' : 'Expirée'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => regenerateAPIKey(apiKey.id)}>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Régénérer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyToClipboard(apiKey.key)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copier la clé
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => revokeAPIKey(apiKey.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Révoquer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs d'activité API</CardTitle>
              <CardDescription>
                Historique des requêtes API récentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Temps de réponse</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Clé API</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <code className="text-sm">{log.endpoint}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getHTTPStatusColor(log.status_code)}`}>
                          {log.status_code}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.response_time}ms
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.ip_address}
                      </TableCell>
                      <TableCell className="text-sm">
                        {apiKeys.find(k => k.id === log.api_key_id)?.name || 'Inconnue'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(log.timestamp).toLocaleString('fr-FR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="w-5 h-5" />
                Documentation API
              </CardTitle>
              <CardDescription>
                Guide d'utilisation et exemples d'intégration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Authentification</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Incluez votre clé API dans l'en-tête Authorization de vos requêtes :
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <code className="text-sm">
                      curl -H "Authorization: Bearer YOUR_API_KEY" https://api.votre-saas.com/v1/products
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Endpoints disponibles</h3>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">GET</Badge>
                        <code className="text-sm">/api/v1/products</code>
                      </div>
                      <p className="text-sm text-muted-foreground">Récupère la liste des produits</p>
                    </div>
                    
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">POST</Badge>
                        <code className="text-sm">/api/v1/products</code>
                      </div>
                      <p className="text-sm text-muted-foreground">Crée un nouveau produit</p>
                    </div>
                    
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">GET</Badge>
                        <code className="text-sm">/api/v1/orders</code>
                      </div>
                      <p className="text-sm text-muted-foreground">Récupère la liste des commandes</p>
                    </div>
                    
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">GET</Badge>
                        <code className="text-sm">/api/v1/customers</code>
                      </div>
                      <p className="text-sm text-muted-foreground">Récupère la liste des clients</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Exemple de réponse</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
{`{
  "data": [
    {
      "id": "prod_123",
      "name": "Produit Example",
      "price": 29.99,
      "currency": "EUR",
      "status": "active"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150
  }
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Limites de taux</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Standard: 1,000 requêtes/heure</li>
                    <li>• Pro: 10,000 requêtes/heure</li>
                    <li>• Ultra Pro: 100,000 requêtes/heure</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default APIManagement