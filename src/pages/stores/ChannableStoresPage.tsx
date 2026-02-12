/**
 * Page Boutiques avec design Channable
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Link, useNavigate } from 'react-router-dom'
import { useIntegrationsUnified } from '@/hooks/unified'
import { 
  ChannablePageLayout,
  ChannableHeroSection,
  ChannableStatsGrid,
  ChannableSearchBar,
  ChannableCategoryFilter,
  ChannableCard,
  ChannableEmptyState,
  ChannableQuickActions
} from '@/components/channable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StoreConnectionStatus } from '@/components/stores/StoreConnectionStatus'
import { 
  Store, 
  Plus, 
  RefreshCw, 
  Settings, 
  Unplug, 
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ShoppingBag,
  Globe,
  Zap,
  Package
} from 'lucide-react'

const storeCategories = [
  { id: 'all', label: 'Toutes', icon: Store, count: 0 },
  { id: 'connected', label: 'Connectées', icon: CheckCircle, count: 0 },
  { id: 'error', label: 'Erreurs', icon: XCircle, count: 0 },
  { id: 'pending', label: 'En attente', icon: AlertCircle, count: 0 },
]

const platformLogos: Record<string, string> = {
  shopify: '🛍️',
  woocommerce: '🛒',
  prestashop: '🏪',
  magento: '🏬',
  amazon: '📦',
  ebay: '🏷️',
}

export default function ChannableStoresPage() {
  const navigate = useNavigate()
  const { integrations, isLoading: loading, refetch, sync: syncIntegration, disconnect: disconnectIntegration } = useIntegrationsUnified()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const handleSync = async (integrationId: string) => {
    await syncIntegration(integrationId)
  }

  const [disconnectId, setDisconnectId] = useState<string | null>(null)

  const handleDisconnect = async (integrationId: string) => {
    setDisconnectId(integrationId)
  }

  const confirmDisconnect = async () => {
    if (!disconnectId) return
    await disconnectIntegration(disconnectId)
    setDisconnectId(null)
  }

  // Stats
  const stats = [
    {
      label: 'Boutiques totales',
      value: integrations.length,
      icon: Store,
      trend: '+2',
      color: 'primary' as const,
      onClick: () => setSelectedCategory('all')
    },
    {
      label: 'Connectées',
      value: integrations.filter(i => i.connection_status === 'connected').length,
      icon: CheckCircle,
      trend: '+1',
      color: 'success' as const,
      onClick: () => setSelectedCategory('connected')
    },
    {
      label: 'Produits synchronisés',
      value: '2,847',
      icon: Package,
      trend: '+156',
      color: 'warning' as const,
      onClick: () => navigate('/products')
    },
    {
      label: 'Commandes sync',
      value: '1,234',
      icon: ShoppingBag,
      trend: '+89',
      color: 'primary' as const,
      onClick: () => navigate('/orders')
    }
  ]

  // Catégories avec comptages
  const categoriesWithCounts = storeCategories.map(cat => ({
    ...cat,
    count: cat.id === 'all' 
      ? integrations.length 
      : integrations.filter(i => i.connection_status === cat.id).length
  }))

  // Actions rapides
  const quickActions = [
    {
      label: 'Connecter une boutique',
      icon: Plus,
      onClick: () => navigate('/stores/connect'),
      variant: 'default' as const
    },
    {
      label: 'Actualiser',
      icon: RefreshCw,
      onClick: refetch,
      variant: 'outline' as const
    }
  ]

  // Filtrage
  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = (integration as any).config?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.platform_name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || integration.connection_status === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <ChannablePageLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ChannablePageLayout>
    )
  }

  return (
    <ChannablePageLayout>
      {/* Hero */}
      <ChannableHeroSection
        title="Gestion des Boutiques"
        subtitle="Connectez et gérez toutes vos boutiques e-commerce depuis un seul endroit"
        icon={Store}
      />

      {/* Stats */}
      <ChannableStatsGrid stats={stats} />

      {/* Quick Actions */}
      <ChannableQuickActions actions={quickActions} />

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <ChannableCategoryFilter
          categories={categoriesWithCounts}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <ChannableSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher une boutique..."
        />
      </div>

      {/* Content */}
      {filteredIntegrations.length === 0 ? (
        <ChannableEmptyState
          icon={Store}
          title="Aucune boutique trouvée"
          description={searchQuery 
            ? "Aucune boutique ne correspond à votre recherche" 
            : "Connectez votre première boutique pour commencer"
          }
          action={{
            label: 'Connecter une boutique',
            onClick: () => navigate('/stores/connect')
          }}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration, index) => (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full hover:shadow-lg transition-all group border-border/50 hover:border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl">
                        {platformLogos[integration.platform_name.toLowerCase()] || '🏪'}
                      </div>
                      <div>
                        <CardTitle className="text-base group-hover:text-primary transition-colors">
                          {(integration as any).config?.name || integration.platform_name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {integration.platform_name}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      className={`${
                        integration.connection_status === 'connected' 
                          ? 'bg-green-500/10 text-green-600 border-green-500/30' 
                          : integration.connection_status === 'error'
                          ? 'bg-red-500/10 text-red-600 border-red-500/30'
                          : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30'
                      } border`}
                    >
                      {integration.connection_status === 'connected' ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> Connectée</>
                      ) : integration.connection_status === 'error' ? (
                        <><XCircle className="w-3 h-3 mr-1" /> Erreur</>
                      ) : (
                        <><AlertCircle className="w-3 h-3 mr-1" /> En attente</>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {integration.store_url && (
                      <a 
                        href={integration.store_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                        <span className="truncate">{integration.store_url}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Dernière sync:</span>
                      <span className="font-medium">
                        {integration.last_sync_at 
                          ? new Date(integration.last_sync_at).toLocaleDateString('fr-FR')
                          : 'Jamais'
                        }
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(integration.id)}
                        disabled={integration.connection_status === 'connecting'}
                        className="w-full group-hover:border-primary group-hover:text-primary transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 mr-1.5" />
                        Sync
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/stores/${integration.id}/settings`)}
                        className="w-full"
                      >
                        <Settings className="w-4 h-4 mr-1.5" />
                        Config
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(integration.id)}
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Unplug className="w-4 h-4 mr-1.5" />
                      Déconnecter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add New Store Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer group">
          <CardContent className="flex flex-col items-center justify-center py-12" onClick={() => navigate('/stores/connect')}>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ajouter une nouvelle boutique</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Connectez Shopify, WooCommerce, Amazon, eBay et plus de 50 autres plateformes
            </p>
          </CardContent>
        </Card>
      </motion.div>
      <ConfirmDialog
        open={!!disconnectId}
        onOpenChange={(open) => { if (!open) setDisconnectId(null) }}
        title="Déconnecter cette boutique ?"
        description="Êtes-vous sûr de vouloir déconnecter cette boutique ?"
        confirmText="Déconnecter"
        variant="destructive"
        onConfirm={confirmDisconnect}
      />
    </ChannablePageLayout>
  )
}
