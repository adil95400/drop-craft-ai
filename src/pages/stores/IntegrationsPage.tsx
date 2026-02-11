import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Loader2, RefreshCw, Settings, Trash2, Activity, AlertCircle, CheckCircle, Clock, Plus, Search, Zap } from 'lucide-react'
import { BackButton } from '@/components/navigation/BackButton'
import { useStoreIntegrations } from '@/hooks/useStoreIntegrations'
import { useSyncLogs } from '@/hooks/useSyncLogs'
import { AutoConfigWizard } from '@/components/integrations/AutoConfigWizard'
import { SyncStatusInline } from './components/SyncStatusInline'
import type { UnifiedIntegration as Integration } from '@/hooks/unified'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'

export default function IntegrationsPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<{ name: string; type: string } | null>(null)
  
  const { integrations, isLoading, refetch, syncIntegration, testConnection, deleteIntegration, isSyncing, isTesting } = useStoreIntegrations()
  const { stats: syncStats } = useSyncLogs()

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = !searchTerm || 
      integration.platform_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.store_config?.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.store_config?.domain?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || integration.connection_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSync = (integrationId: string) => { syncIntegration(integrationId); };
  const handleTest = (integrationId: string) => { testConnection(integrationId); };
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const handleDelete = (integrationId: string) => { setDeleteConfirmId(integrationId); };
  const confirmDelete = () => { if (deleteConfirmId) { deleteIntegration(deleteConfirmId); setDeleteConfirmId(null); } };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'syncing': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default: return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = { 'connected': 'default', 'active': 'default', 'error': 'destructive', 'syncing': 'secondary', 'disconnected': 'outline', 'never': 'outline' } as const
    const labels = { 'connected': 'Actif', 'active': 'Actif', 'error': 'Erreur', 'syncing': 'Synchronisation', 'disconnected': 'Déconnecté', 'never': 'Jamais synchronisé' }
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{labels[status as keyof typeof labels] || status}</Badge>
  }

  const formatDate = (dateString: string | null) => { if (!dateString) return 'Jamais'; return new Date(dateString).toLocaleString('fr-FR') }
  const handleAddIntegration = (platformName: string, platformType: string) => { setSelectedPlatform({ name: platformName, type: platformType }); setWizardOpen(true) }
  const handleWizardComplete = (integration: Integration) => { refetch(); navigate(`/stores-channels/integrations/${integration.id}`) }

  if (isLoading) {
    return (
      <ChannablePageWrapper title="Intégrations" description="Chargement..." heroImage="integrations" badge={{ label: 'Intégrations', icon: Activity }}>
        <div className="flex items-center justify-center min-h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </ChannablePageWrapper>
    )
  }

  return (
    <ChannablePageWrapper
      title="Intégrations"
      description="Gérez vos intégrations e-commerce et leur synchronisation"
      heroImage="integrations"
      badge={{ label: 'Intégrations', icon: Activity }}
      actions={
        <div className="flex gap-2">
          {integrations.some(i => i.platform_type === 'shopify') && (
            <Button onClick={() => navigate('/stores-channels/shopify-management')} variant="outline" size="sm"><Zap className="h-4 w-4 mr-2" />Gestion Shopify</Button>
          )}
          <Button onClick={() => refetch()} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-2" />Actualiser</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" /><Zap className="h-4 w-4 mr-1" />Configuration auto</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Plateformes e-commerce</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAddIntegration('shopify', 'ecommerce')}>🛍️ Shopify</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddIntegration('woocommerce', 'ecommerce')}>🛒 WooCommerce</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddIntegration('prestashop', 'ecommerce')}>🏪 PrestaShop</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Marketplaces</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAddIntegration('amazon', 'marketplace')}>📦 Amazon</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/stores-channels/connect')}>Configuration manuelle...</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      <BackButton to="/stores-channels" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Total</p><p className="text-2xl font-bold">{integrations.length}</p></div><Activity className="h-8 w-8 text-primary opacity-50" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Actives</p><p className="text-2xl font-bold text-green-600">{integrations.filter(i => i.connection_status === 'connected' || i.connection_status === 'active').length}</p></div><CheckCircle className="h-8 w-8 text-green-500 opacity-50" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Produits sync</p><p className="text-2xl font-bold">{syncStats.totalProducts}</p></div><div className="h-8 w-8 flex items-center justify-center text-2xl opacity-50">📦</div></div><Button variant="ghost" size="sm" className="w-full mt-3 text-xs" onClick={() => navigate('/stores-channels/imported-products')}>Voir les produits →</Button></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Commandes sync</p><p className="text-2xl font-bold">{syncStats.totalOrders}</p></div><div className="h-8 w-8 flex items-center justify-center text-2xl opacity-50">🛒</div></div></CardContent></Card>
      </div>

      {/* Search and filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher une intégration..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('all')}>Toutes</Button>
          <Button variant={statusFilter === 'connected' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('connected')}>Actives</Button>
          <Button variant={statusFilter === 'error' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('error')}>Erreurs</Button>
        </div>
      </div>

      {/* Integrations List */}
      {filteredIntegrations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">{integrations.length === 0 ? 'Aucune intégration' : 'Aucun résultat'}</h3>
            <p className="text-muted-foreground mb-6">{integrations.length === 0 ? 'Commencez par connecter votre première boutique' : 'Essayez de modifier vos filtres de recherche'}</p>
            {integrations.length === 0 && (<Button onClick={() => navigate('/stores-channels/connect')}><Plus className="h-4 w-4 mr-2" />Ajouter une intégration</Button>)}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredIntegrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(integration.connection_status)}
                    <div>
                      <CardTitle className="text-lg">{integration.store_config?.shop_name || `Boutique ${integration.platform_name}`}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">{integration.platform_name}{integration.store_config?.domain && ` • ${integration.store_config.domain}`}</p>
                    </div>
                  </div>
                  {getStatusBadge(integration.connection_status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <SyncStatusInline integrationId={integration.id} lastSyncAt={integration.last_sync_at} syncStatus={integration.sync_status} storeConfig={integration.store_config} onSync={() => handleSync(integration.id)} isSyncing={isSyncing} />
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Créée le {formatDate(integration.created_at)}</span>
                    <span className="capitalize">Sync: {integration.sync_frequency}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => handleTest(integration.id)} variant="outline" size="sm" disabled={isTesting}><Activity className="h-4 w-4 mr-2" />Tester</Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Settings className="h-4 w-4 mr-2" />Gérer</Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/stores-channels/integrations/${integration.id}`)}><Settings className="h-4 w-4 mr-2" />Paramètres</DropdownMenuItem>
                        {integration.platform_type === 'shopify' && (<DropdownMenuItem onClick={() => navigate('/stores-channels/shopify-management')}><Zap className="h-4 w-4 mr-2" />Gestion Shopify</DropdownMenuItem>)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button onClick={() => handleDelete(integration.id)} variant="outline" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedPlatform && (
        <AutoConfigWizard open={wizardOpen} onOpenChange={setWizardOpen} platformName={selectedPlatform.name} platformType={selectedPlatform.type} onComplete={handleWizardComplete} />
      )}

      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}
        title="Supprimer cette intégration ?"
        description="Êtes-vous sûr de vouloir supprimer cette intégration ?"
        confirmText="Supprimer"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </ChannablePageWrapper>
  )
}
