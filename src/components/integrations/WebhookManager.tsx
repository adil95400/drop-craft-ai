import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { 
  Webhook, 
  Plus, 
  Settings, 
  TestTube, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Copy,
  Eye,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface WebhookConfig {
  id: string
  integration_id: string
  integration_name: string
  webhook_url: string
  events: string[]
  is_active: boolean
  secret_key: string
  last_triggered: string | null
  success_count: number
  error_count: number
  created_at: string
}

export const WebhookManager = () => {
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfig | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch webhooks with integration details
  const { data: webhooks = [], isLoading, refetch } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      // Simulate webhooks data based on real integrations
      const { data: integrations } = await supabase
        .from('integrations')
        .select('id, platform_name, platform')
        .eq('is_active', true)

      if (!integrations) return []

      // Generate mock webhook data
      const mockWebhooks: WebhookConfig[] = (integrations as any[])?.flatMap((integration: any) => 
        Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => ({
          id: `webhook-${integration.id}-${i}`,
          integration_id: integration.id,
          integration_name: integration.platform_name || integration.platform,
          webhook_url: `https://your-domain.com/webhooks/${integration.platform}`,
          events: getEventsByPlatform(integration.platform),
          is_active: Math.random() > 0.3,
          secret_key: generateSecretKey(),
          last_triggered: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : null,
          success_count: Math.floor(Math.random() * 500),
          error_count: Math.floor(Math.random() * 50),
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }))
      ) || []

      return mockWebhooks
    },
  })

  const createWebhookMutation = useMutation({
    mutationFn: async (webhookData: Partial<WebhookConfig>) => {
      // Simulate webhook creation
      return {
        id: crypto.randomUUID(),
        ...webhookData,
        secret_key: generateSecretKey(),
        created_at: new Date().toISOString(),
        success_count: 0,
        error_count: 0
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
      toast({
        title: "Webhook créé",
        description: "Le webhook a été configuré avec succès."
      })
      setIsCreateModalOpen(false)
    }
  })

  const testWebhookMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      // Simulate webhook test
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (Math.random() > 0.2) {
        return { success: true, response_time: Math.floor(Math.random() * 500) + 100 }
      } else {
        throw new Error('Test webhook failed: Connection timeout')
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Test réussi",
        description: `Webhook testé avec succès (${data.response_time}ms)`
      })
    },
    onError: (error) => {
      toast({
        title: "Test échoué",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const toggleWebhookMutation = useMutation({
    mutationFn: async ({ webhookId, isActive }: { webhookId: string; isActive: boolean }) => {
      // Simulate webhook status toggle
      return { webhookId, isActive }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
      toast({
        title: "Webhook mis à jour",
        description: "Le statut du webhook a été modifié."
      })
    }
  })

  const deleteWebhookMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      // Simulate webhook deletion
      return webhookId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
      toast({
        title: "Webhook supprimé",
        description: "Le webhook a été supprimé avec succès."
      })
    }
  })

  const getEventsByPlatform = (platform: string): string[] => {
    const eventMap: Record<string, string[]> = {
      'shopify': ['order.created', 'order.updated', 'product.created', 'product.updated', 'customer.created'],
      'aliexpress': ['order.status_changed', 'product.price_updated', 'inventory.updated'],
      'bigbuy': ['stock.updated', 'order.shipped', 'product.added'],
      'stripe': ['payment.succeeded', 'payment.failed', 'subscription.created', 'invoice.created'],
      'paypal': ['payment.completed', 'payment.failed', 'subscription.activated'],
      'mailchimp': ['list.subscribe', 'list.unsubscribe', 'campaign.sent'],
      'default': ['data.updated', 'status.changed']
    }
    
    return eventMap[platform] || eventMap['default']
  }

  const generateSecretKey = () => {
    return 'whsec_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copié",
      description: "Texte copié dans le presse-papiers."
    })
  }

  const getStatusBadge = (webhook: WebhookConfig) => {
    if (!webhook.is_active) {
      return <Badge variant="outline">Inactif</Badge>
    }
    
    const errorRate = webhook.error_count / (webhook.success_count + webhook.error_count || 1)
    if (errorRate > 0.1) {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Erreurs</Badge>
    }
    
    return <Badge className="bg-green-100 text-green-800 border-green-200">
      <CheckCircle className="w-3 h-3 mr-1" />Actif
    </Badge>
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
                <Webhook className="w-5 h-5" />
                Gestion des Webhooks
              </CardTitle>
              <CardDescription>
                Configurez des webhooks pour recevoir des notifications en temps réel
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetch()} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau Webhook
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Créer un nouveau webhook</DialogTitle>
                    <DialogDescription>
                      Configurez un webhook pour recevoir des événements de vos intégrations
                    </DialogDescription>
                  </DialogHeader>
                  <CreateWebhookForm onSubmit={createWebhookMutation.mutate} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Webhooks</p>
                <p className="text-2xl font-bold">{webhooks.length}</p>
              </div>
              <Webhook className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actifs</p>
                <p className="text-2xl font-bold text-green-600">
                  {webhooks.filter(w => w.is_active).length}
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
                <p className="text-sm font-medium text-muted-foreground">Succès Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {webhooks.reduce((sum, w) => sum + w.success_count, 0).toLocaleString()}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Erreurs Total</p>
                <p className="text-2xl font-bold text-red-600">
                  {webhooks.reduce((sum, w) => sum + w.error_count, 0)}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Webhooks Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Intégration</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Événements</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière activité</TableHead>
                <TableHead>Succès / Erreurs</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun webhook configuré
                  </TableCell>
                </TableRow>
              ) : (
                webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-medium">{webhook.integration_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded max-w-xs truncate">
                          {webhook.webhook_url}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(webhook.webhook_url)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.slice(0, 2).map((event, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                        {webhook.events.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{webhook.events.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(webhook)}</TableCell>
                    <TableCell>
                      {webhook.last_triggered ? (
                        <div className="text-sm">
                          {new Date(webhook.last_triggered).toLocaleString()}
                        </div>
                      ) : (
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          Jamais
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm text-green-600">
                          ✓ {webhook.success_count.toLocaleString()}
                        </div>
                        <div className="text-sm text-red-600">
                          ✗ {webhook.error_count}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => testWebhookMutation.mutate(webhook.id)}
                          disabled={testWebhookMutation.isPending}
                        >
                          <TestTube className="w-4 h-4" />
                        </Button>
                        <Switch
                          checked={webhook.is_active}
                          onCheckedChange={(checked) => 
                            toggleWebhookMutation.mutate({ 
                              webhookId: webhook.id, 
                              isActive: checked 
                            })
                          }
                        />
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <WebhookDetailsModal webhook={webhook} />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteWebhookMutation.mutate(webhook.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper components
const CreateWebhookForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    integration_id: '',
    webhook_url: '',
    events: [] as string[],
    is_active: true
  })

  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations-for-webhooks'],
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
        <Label htmlFor="integration">Intégration</Label>
        <Select 
          value={formData.integration_id} 
          onValueChange={(value) => setFormData({ ...formData, integration_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une intégration" />
          </SelectTrigger>
          <SelectContent>
            {(integrations as any[]).map((integration: any) => (
              <SelectItem key={integration.id} value={integration.id}>
                {integration.platform_name || integration.platform}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="webhook_url">URL du Webhook</Label>
        <Input
          id="webhook_url"
          type="url"
          placeholder="https://your-domain.com/webhooks/endpoint"
          value={formData.webhook_url}
          onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">Activer immédiatement</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit">Créer le webhook</Button>
      </div>
    </form>
  )
}

const WebhookDetailsModal = ({ webhook }: { webhook: WebhookConfig }) => {
  const { toast } = useToast()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg">{webhook.integration_name} Webhook</h3>
        <p className="text-muted-foreground">Détails et configuration</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>URL du Webhook</Label>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-xs bg-muted p-2 rounded flex-1 break-all">
              {webhook.webhook_url}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(webhook.webhook_url)
                toast({ title: "URL copiée" })
              }}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div>
          <Label>Clé Secrète</Label>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-xs bg-muted p-2 rounded flex-1 break-all">
              {webhook.secret_key}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(webhook.secret_key)
                toast({ title: "Clé copiée" })
              }}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      <div>
        <Label>Événements Surveillés</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {webhook.events.map((event, idx) => (
            <Badge key={idx} variant="outline">{event}</Badge>
          ))}
        </div>
      </div>

      <div>
        <Label>Statistiques</Label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <Card>
            <CardContent className="p-3">
              <div className="text-sm font-medium text-green-600">Succès</div>
              <div className="text-lg font-bold">{webhook.success_count.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-sm font-medium text-red-600">Erreurs</div>
              <div className="text-lg font-bold">{webhook.error_count}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}