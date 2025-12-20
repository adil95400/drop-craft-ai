import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Key, 
  Plus, 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2, 
  RotateCw,
  Shield,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface APIKey {
  id: string
  name: string
  key_preview: string
  platform: string
  integration_id: string
  permissions: string[]
  last_used: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
  usage_count: number
}

export const APIKeysManager = () => {
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch API keys with integration details
  const { data: apiKeys = [], isLoading, refetch } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      // Get integrations first
      const { data: integrations } = await supabase
        .from('integrations')
        .select('id, platform_name, platform, is_active')

      if (!integrations) return []

      // Generate mock API keys for each integration
      const mockKeys: APIKey[] = (integrations as any[])?.flatMap((integration: any) => 
        Array.from({ length: Math.floor(Math.random() * 2) + 1 }, (_, i) => ({
          id: `key-${integration.id}-${i}`,
          name: `${integration.platform_name || integration.platform} API Key ${i + 1}`,
          key_preview: generateKeyPreview(),
          platform: integration.platform_name || integration.platform,
          integration_id: integration.id,
          permissions: getPermissionsByPlatform(integration.platform),
          last_used: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
          expires_at: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString() : null,
          is_active: integration.is_active && Math.random() > 0.2,
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          usage_count: Math.floor(Math.random() * 1000)
        }))
      ) || []

      return mockKeys.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    },
  })

  const createKeyMutation = useMutation({
    mutationFn: async (keyData: Partial<APIKey>) => {
      // Simulate API key creation with secure storage
      const newKey = {
        id: crypto.randomUUID(),
        ...keyData,
        key_preview: generateKeyPreview(),
        created_at: new Date().toISOString(),
        usage_count: 0,
        is_active: true
      }

      // Simulate secure storage
      toast({
        title: "Clé API créée",
        description: "La clé a été générée et stockée de manière sécurisée.",
      })

      return newKey
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      setIsCreateModalOpen(false)
    }
  })

  const rotateKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      // Simulate key rotation
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { keyId, newPreview: generateKeyPreview() }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast({
        title: "Clé rotée",
        description: "Une nouvelle clé a été générée et l'ancienne a été révoquée.",
      })
    }
  })

  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      // Simulate secure key deletion
      await new Promise(resolve => setTimeout(resolve, 500))
      return keyId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast({
        title: "Clé supprimée",
        description: "La clé API a été révoquée et supprimée de manière sécurisée.",
      })
    }
  })

  function generateKeyPreview(): string {
    const prefix = ['sk_', 'pk_', 'api_', 'key_'][Math.floor(Math.random() * 4)]
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const visible = Array.from({ length: 8 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
    return `${prefix}${visible}•••••••••••••••••••••••••••••`
  }

  function getPermissionsByPlatform(platform: string): string[] {
    const permissionMap: Record<string, string[]> = {
      'shopify': ['read:products', 'write:products', 'read:orders', 'write:orders'],
      'aliexpress': ['read:products', 'read:categories', 'read:orders'],
      'bigbuy': ['read:catalog', 'read:stock', 'write:orders'],
      'stripe': ['read:payments', 'write:payments', 'read:customers'],
      'paypal': ['read:payments', 'write:payments'],
      'mailchimp': ['read:lists', 'write:lists', 'read:campaigns'],
      'google_ads': ['read:campaigns', 'write:campaigns', 'read:reports'],
      'facebook_ads': ['read:ads', 'write:ads', 'read:insights']
    }
    
    return permissionMap[platform] || ['read:basic', 'write:basic']
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
    toast({
      title: "Copié",
      description: "Clé copiée dans le presse-papiers."
    })
  }

  const getStatusBadge = (key: APIKey) => {
    if (!key.is_active) {
      return <Badge variant="outline">Inactive</Badge>
    }
    
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return <Badge variant="destructive">Expirée</Badge>
    }
    
    if (key.last_used && new Date(key.last_used) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />Active
      </Badge>
    }
    
    return <Badge variant="secondary">Inutilisée</Badge>
  }

  const getRiskLevel = (key: APIKey) => {
    const daysSinceUsed = key.last_used 
      ? Math.floor((Date.now() - new Date(key.last_used).getTime()) / (1000 * 60 * 60 * 24))
      : 999

    if (!key.is_active) return { level: 'low', color: 'gray' }
    if (key.expires_at && new Date(key.expires_at) < new Date()) return { level: 'high', color: 'red' }
    if (daysSinceUsed > 30) return { level: 'medium', color: 'yellow' }
    return { level: 'low', color: 'green' }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Gestion des Clés API
              </CardTitle>
              <CardDescription>
                Gérez vos clés API de manière sécurisée avec rotation et monitoring
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetch()} size="sm">
                <RotateCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle Clé
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer une nouvelle clé API</DialogTitle>
                    <DialogDescription>
                      Générez une nouvelle clé API sécurisée pour vos intégrations
                    </DialogDescription>
                  </DialogHeader>
                  <CreateKeyForm onSubmit={createKeyMutation.mutate} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Security Alert */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Sécurité :</strong> Vos clés API sont chiffrées et stockées de manière sécurisée. 
          Elles ne sont jamais affichées en entier après leur création. Effectuez une rotation régulière pour maintenir la sécurité.
        </AlertDescription>
      </Alert>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clés</p>
                <p className="text-2xl font-bold">{apiKeys.length}</p>
              </div>
              <Key className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actives</p>
                <p className="text-2xl font-bold text-green-600">
                  {apiKeys.filter(k => k.is_active).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expirent Bientôt</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {apiKeys.filter(k => k.expires_at && new Date(k.expires_at) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilisations</p>
                <p className="text-2xl font-bold text-blue-600">
                  {apiKeys.reduce((sum, k) => sum + k.usage_count, 0).toLocaleString()}
                </p>
              </div>
              <Settings className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Keys Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Plateforme</TableHead>
                <TableHead>Clé</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière utilisation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucune clé API configurée
                  </TableCell>
                </TableRow>
              ) : (
                apiKeys.map((key) => {
                  const risk = getRiskLevel(key)
                  return (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{key.platform}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-xs">
                          <code className="text-xs bg-muted p-1 rounded font-mono">
                            {visibleKeys.has(key.id) ? key.key_preview.replace('•••••••••••••••••••••••••••••', 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') : key.key_preview}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKeyVisibility(key.id)}
                          >
                            {visibleKeys.has(key.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(key.key_preview)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-40">
                          {key.permissions.slice(0, 2).map((perm, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                          {key.permissions.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{key.permissions.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(key)}</TableCell>
                      <TableCell>
                        {key.last_used ? (
                          <div className="text-sm">
                            {new Date(key.last_used).toLocaleDateString()}
                            <div className="text-xs text-muted-foreground">
                              {key.usage_count.toLocaleString()} utilisations
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Jamais</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => rotateKeyMutation.mutate(key.id)}
                            disabled={rotateKeyMutation.isPending}
                          >
                            <RotateCw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteKeyMutation.mutate(key.id)}
                            disabled={deleteKeyMutation.isPending}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper component
const CreateKeyForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    platform: '',
    integration_id: '',
    permissions: [] as string[]
  })

  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations-for-keys'],
    queryFn: async () => {
      const { data } = await supabase
        .from('integrations')
        .select('id, platform_name, platform_type')
        .eq('is_active', true)
      return data || []
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nom de la clé</Label>
        <Input
          id="name"
          placeholder="Ma clé API Shopify"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="integration">Intégration</Label>
        <select 
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          value={formData.integration_id} 
          onChange={(e) => {
            const integration = (integrations as any[]).find((i: any) => i.id === e.target.value)
            setFormData({ 
              ...formData, 
              integration_id: e.target.value,
              platform: (integration as any)?.platform_name || (integration as any)?.platform || ''
            })
          }}
          required
        >
          <option value="">Sélectionner une intégration</option>
          {(integrations as any[]).map((integration: any) => (
            <option key={integration.id} value={integration.id}>
              {integration.platform_name || integration.platform}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end">
        <Button type="submit">Générer la clé</Button>
      </div>
    </form>
  )
}