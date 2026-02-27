/**
 * SupplierSettingsPage - Configuration complète des fournisseurs et API
 * Style Channable avec Hero Section
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { 
  Settings, Key, RefreshCw, CheckCircle, XCircle,
  Plus, Trash2, Eye, EyeOff, Clock, Loader2, Shield,
  TestTube, Copy, Bell, Webhook
} from 'lucide-react'

const SUPPLIER_TYPES = [
  { id: 'cj', name: 'CJ Dropshipping', logo: '🚀' },
  { id: 'bigbuy', name: 'BigBuy', logo: '📦' },
  { id: 'printful', name: 'Printful', logo: '👕' },
  { id: 'aliexpress', name: 'AliExpress', logo: '🛒' },
  { id: 'custom', name: 'Autre / Personnalisé', logo: '⚙️' },
]

export default function SupplierSettingsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newCredential, setNewCredential] = useState({
    supplier_type: '',
    supplier_name: '',
    api_key: '',
    api_secret: '',
    endpoint: ''
  })
  const [testingId, setTestingId] = useState<string | null>(null)
  const [deleteCredentialId, setDeleteCredentialId] = useState<string | null>(null)

  // Fetch credentials
  const { data: credentials = [], isLoading } = useQuery({
    queryKey: ['supplier-credentials'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('supplier_credentials_vault')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching credentials:', error)
        return []
      }
      return data || []
    }
  })

  // Fetch sync settings
  const { data: syncSettings } = useQuery({
    queryKey: ['supplier-sync-settings'],
    queryFn: async () => {
      return {
        auto_sync: true,
        sync_interval: '6h',
        notify_errors: true,
        notify_new_products: false,
        notify_price_changes: true
      }
    }
  })

  // Add credential mutation
  const addCredentialMutation = useMutation({
    mutationFn: async (cred: typeof newCredential) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await (supabase
        .from('supplier_credentials_vault') as any)
        .insert({
          user_id: user.id,
          supplier_id: cred.supplier_type,
          credential_type: 'api',
          credentials_encrypted: JSON.stringify({
            api_key: cred.api_key,
            api_secret: cred.api_secret || null,
            name: cred.supplier_name,
            endpoint: cred.endpoint
          }),
          is_valid: false
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-credentials'] })
      setShowAddDialog(false)
      setNewCredential({ supplier_type: '', supplier_name: '', api_key: '', api_secret: '', endpoint: '' })
      toast({ title: "Clé API ajoutée", description: "Les credentials ont été sauvegardés" })
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" })
    }
  })

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (credentialId: string) => {
      setTestingId(credentialId)
      const { data, error } = await supabase.functions.invoke('supplier-test-connection', {
        body: { credentialId }
      })
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-credentials'] })
      toast({ 
        title: data.success ? "Connexion réussie" : "Échec de connexion",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      })
    },
    onError: () => {
      toast({ title: "Erreur de test", description: "Impossible de tester la connexion", variant: "destructive" })
    },
    onSettled: () => setTestingId(null)
  })

  // Delete credential mutation
  const deleteCredentialMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('supplier_credentials_vault')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-credentials'] })
      toast({ title: "Credential supprimé" })
    }
  })

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copié dans le presse-papier" })
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any; label: string }> = {
      connected: { color: 'bg-green-500', icon: CheckCircle, label: 'Connecté' },
      active: { color: 'bg-green-500', icon: CheckCircle, label: 'Actif' },
      pending: { color: 'bg-yellow-500', icon: Clock, label: 'En attente' },
      error: { color: 'bg-red-500', icon: XCircle, label: 'Erreur' },
      revoked: { color: 'bg-gray-500', icon: XCircle, label: 'Révoqué' },
    }
    const { color, icon: Icon, label } = config[status] || config.pending
    return (
      <Badge className={`${color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    )
  }

  const activeCredentials = credentials.filter((c: any) => c.connection_status === 'active' || c.connection_status === 'connected').length

  return (
    <ChannablePageWrapper
      title="Paramètres Fournisseurs"
      subtitle="Configuration"
      description="Gérez vos credentials, webhooks et paramètres de synchronisation fournisseurs."
      heroImage="settings"
      badge={{ label: 'Configuration' }}
      actions={
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter une clé API
        </Button>
      }
    >

      <Tabs defaultValue="credentials" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
          <TabsTrigger value="credentials" className="gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">Credentials</span>
          </TabsTrigger>
          <TabsTrigger value="sync" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Synchronisation</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
        </TabsList>

        {/* Credentials Tab */}
        <TabsContent value="credentials" className="space-y-4">
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Clés API Fournisseurs
              </CardTitle>
              <CardDescription>
                Gérez les credentials de connexion à vos fournisseurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : credentials.length === 0 ? (
                <div className="text-center py-12">
                  <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Aucune clé API configurée</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Ajoutez vos clés API pour connecter vos fournisseurs
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une clé API
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {credentials.map((cred: any) => {
                    const supplierName = cred.metadata?.name || SUPPLIER_TYPES.find(s => s.id === cred.supplier_id)?.name || cred.supplier_id
                    const apiKey = cred.api_key_encrypted || '••••••••'
                    return (
                      <div key={cred.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl w-10 h-10 flex items-center justify-center bg-muted rounded-lg">
                            {SUPPLIER_TYPES.find(s => s.id === cred.supplier_id)?.logo || '📦'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{supplierName}</p>
                              {getStatusBadge(cred.connection_status)}
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {showKeys[cred.id] ? apiKey : '••••••••••••••••'}
                              </code>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleShowKey(cred.id)}>
                                {showKeys[cred.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(apiKey)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            {cred.last_validated_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Dernière validation: {new Date(cred.last_validated_at).toLocaleString('fr-FR')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testConnectionMutation.mutate(cred.id)}
                            disabled={testingId === cred.id}
                          >
                            {testingId === cred.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <TestTube className="h-4 w-4 mr-2" />
                            )}
                            Tester
                          </Button>
                          <Button variant="ghost" size="icon">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setDeleteCredentialId(cred.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Tab */}
        <TabsContent value="sync" className="space-y-4">
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Paramètres de synchronisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Synchronisation automatique</Label>
                  <p className="text-sm text-muted-foreground">
                    Synchroniser automatiquement les produits et stocks
                  </p>
                </div>
                <Switch defaultChecked={syncSettings?.auto_sync} />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Intervalle de synchronisation</Label>
                <Select defaultValue={syncSettings?.sync_interval || '6h'}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Toutes les heures</SelectItem>
                    <SelectItem value="3h">Toutes les 3 heures</SelectItem>
                    <SelectItem value="6h">Toutes les 6 heures</SelectItem>
                    <SelectItem value="12h">Toutes les 12 heures</SelectItem>
                    <SelectItem value="24h">Toutes les 24 heures</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Synchroniser les prix</Label>
                  <p className="text-sm text-muted-foreground">
                    Mettre à jour les prix automatiquement
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Synchroniser les stocks</Label>
                  <p className="text-sm text-muted-foreground">
                    Mettre à jour les niveaux de stock
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications fournisseurs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Erreurs de synchronisation</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir une alerte en cas d'erreur
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Nouveaux produits</Label>
                  <p className="text-sm text-muted-foreground">
                    Notification quand de nouveaux produits sont disponibles
                  </p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Changements de prix</Label>
                  <p className="text-sm text-muted-foreground">
                    Alertes sur les variations de prix importantes
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Ruptures de stock</Label>
                  <p className="text-sm text-muted-foreground">
                    Être alerté des produits en rupture
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhooks
              </CardTitle>
              <CardDescription>
                Configurez des webhooks pour recevoir des notifications en temps réel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Aucun webhook configuré
                </p>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un webhook
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Credential Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une clé API</DialogTitle>
            <DialogDescription>
              Connectez un nouveau fournisseur avec ses credentials API
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type de fournisseur</Label>
              <Select 
                value={newCredential.supplier_type}
                onValueChange={(v) => setNewCredential(prev => ({ ...prev, supplier_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPLIER_TYPES.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.logo} {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nom du credential</Label>
              <Input 
                placeholder="Mon compte CJ"
                value={newCredential.supplier_name}
                onChange={(e) => setNewCredential(prev => ({ ...prev, supplier_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Clé API</Label>
              <Input 
                type="password"
                placeholder="Votre clé API"
                value={newCredential.api_key}
                onChange={(e) => setNewCredential(prev => ({ ...prev, api_key: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Secret API (optionnel)</Label>
              <Input 
                type="password"
                placeholder="Votre secret API"
                value={newCredential.api_secret}
                onChange={(e) => setNewCredential(prev => ({ ...prev, api_secret: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={() => addCredentialMutation.mutate(newCredential)}
              disabled={!newCredential.supplier_type || !newCredential.api_key || addCredentialMutation.isPending}
            >
              {addCredentialMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteCredentialId}
        onOpenChange={(open) => { if (!open) setDeleteCredentialId(null) }}
        title="Supprimer cette clé API ?"
        description="Cette action est irréversible."
        confirmText="Supprimer"
        variant="destructive"
        onConfirm={() => { if (deleteCredentialId) { deleteCredentialMutation.mutate(deleteCredentialId); setDeleteCredentialId(null) } }}
      />
    </ChannablePageWrapper>
  )
}
