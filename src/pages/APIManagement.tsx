import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

const APIManagement = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [newKeyForm, setNewKeyForm] = useState({
    name: '',
    permissions: [] as string[],
    expires_in: '365'
  })

  // Fetch API keys from Supabase
  const { data: apiKeys = [], isLoading: loadingKeys } = useQuery({
    queryKey: ['api-keys', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  // Fetch API logs from Supabase
  const { data: apiLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['api-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('api_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  // Create API key mutation
  const createKeyMutation = useMutation({
    mutationFn: async (form: typeof newKeyForm) => {
      if (!user?.id) throw new Error('Non authentifié')
      
      const keyValue = `sk_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      const expiresAt = form.expires_in === '0' ? null : 
        new Date(Date.now() + parseInt(form.expires_in) * 24 * 60 * 60 * 1000).toISOString()
      
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: form.name,
          key: keyValue,
          scopes: form.permissions,
          expires_at: expiresAt,
          is_active: true
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      setShowCreateDialog(false)
      setNewKeyForm({ name: '', permissions: [], expires_in: '365' })
      toast.success('Clé API créée avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la création de la clé API')
    }
  })

  // Revoke API key mutation
  const revokeKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      if (!user?.id) throw new Error('Non authentifié')
      
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', keyId)
        .eq('user_id', user.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast.success('Clé API révoquée')
    },
    onError: () => {
      toast.error('Erreur lors de la révocation')
    }
  })

  // Regenerate API key mutation
  const regenerateKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      if (!user?.id) throw new Error('Non authentifié')
      
      const newKeyValue = `sk_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      
      const { error } = await supabase
        .from('api_keys')
        .update({ key: newKeyValue })
        .eq('id', keyId)
        .eq('user_id', user.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast.success('Clé API régénérée')
    },
    onError: () => {
      toast.error('Erreur lors de la régénération')
    }
  })

  // Delete API key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      if (!user?.id) throw new Error('Non authentifié')
      
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)
        .eq('user_id', user.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast.success('Clé API supprimée')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    }
  })

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

  const formatLastUsed = (lastUsed?: string | null) => {
    if (!lastUsed) return 'Jamais'
    
    const date = new Date(lastUsed)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Il y a quelques minutes'
    if (diffInHours < 24) return `Il y a ${diffInHours}h`
    return date.toLocaleDateString('fr-FR')
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getHTTPStatusColor = (statusCode: number | null) => {
    if (!statusCode) return 'text-gray-600'
    if (statusCode >= 200 && statusCode < 300) return 'text-green-600'
    if (statusCode >= 400 && statusCode < 500) return 'text-orange-600'
    if (statusCode >= 500) return 'text-red-600'
    return 'text-gray-600'
  }

  const maskAPIKey = (key: string) => {
    if (key.length < 20) return key
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

  const loading = loadingKeys || loadingLogs

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
                  onClick={() => createKeyMutation.mutate(newKeyForm)} 
                  disabled={createKeyMutation.isPending || !newKeyForm.name || newKeyForm.permissions.length === 0}
                >
                  {createKeyMutation.isPending ? 'Création...' : 'Créer la clé API'}
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
                <p className="text-2xl font-bold">{apiKeys.filter(k => k.is_active).length}</p>
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
                <p className="text-2xl font-bold">{apiLogs.length}</p>
                <p className="text-sm text-muted-foreground">Requêtes récentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{apiKeys.filter(k => !k.is_active).length}</p>
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
              <CardDescription>Gérez vos clés API et leurs permissions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8">
                  <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune clé API</h3>
                  <p className="text-muted-foreground mb-4">Créez votre première clé API</p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle clé API
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Clé</TableHead>
                      <TableHead>Permissions</TableHead>
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
                              Créée le {new Date(apiKey.created_at || '').toLocaleDateString('fr-FR')}
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
                              size="icon"
                              onClick={() => toggleKeyVisibility(apiKey.id)}
                            >
                              {visibleKeys.has(apiKey.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(apiKey.key)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(apiKey.scopes || []).slice(0, 2).map((scope: string) => (
                              <Badge key={scope} variant="outline" className="text-xs">
                                {scope}
                              </Badge>
                            ))}
                            {(apiKey.scopes || []).length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{(apiKey.scopes || []).length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatLastUsed(apiKey.last_used_at)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(apiKey.is_active || false)}>
                            {apiKey.is_active ? 'Active' : 'Révoquée'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => regenerateKeyMutation.mutate(apiKey.id)}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Régénérer
                              </DropdownMenuItem>
                              {apiKey.is_active && (
                                <DropdownMenuItem onClick={() => revokeKeyMutation.mutate(apiKey.id)}>
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  Révoquer
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => deleteKeyMutation.mutate(apiKey.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs d'activité API</CardTitle>
              <CardDescription>Historique des appels API récents</CardDescription>
            </CardHeader>
            <CardContent>
              {apiLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun log d'activité
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Temps de réponse</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">{log.endpoint}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.method}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={getHTTPStatusColor(log.status_code)}>
                            {log.status_code}
                          </span>
                        </TableCell>
                        <TableCell>{log.response_time_ms || log.duration_ms || 0}ms</TableCell>
                        <TableCell className="font-mono text-sm">{log.ip_address || '-'}</TableCell>
                        <TableCell>
                          {new Date(log.created_at || '').toLocaleString('fr-FR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
              <CardDescription>Guide d'utilisation de l'API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Authentification</h3>
                <p className="text-muted-foreground mb-3">
                  Incluez votre clé API dans le header Authorization de chaque requête:
                </p>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>Authorization: Bearer sk_votre_cle_api</code>
                </pre>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Endpoints disponibles</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-sm">/api/v1/products</code>
                    <span className="text-muted-foreground text-sm">- Liste des produits</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <Badge variant="outline">POST</Badge>
                    <code className="text-sm">/api/v1/products</code>
                    <span className="text-muted-foreground text-sm">- Créer un produit</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-sm">/api/v1/orders</code>
                    <span className="text-muted-foreground text-sm">- Liste des commandes</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-sm">/api/v1/customers</code>
                    <span className="text-muted-foreground text-sm">- Liste des clients</span>
                  </div>
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
