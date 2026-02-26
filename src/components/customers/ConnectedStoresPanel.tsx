/**
 * ConnectedStoresPanel - Panneau des boutiques connectées avec toggle activer/désactiver
 * Détection automatique + import clients automatique
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Store, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Users,
  Loader2,
  ChevronDown,
  ChevronUp,
  Link2,
  ShoppingBag,
  Globe,
  Settings2,
  Zap,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { getDateFnsLocale } from '@/utils/dateFnsLocale'
import { useIntegrationsUnified, UnifiedIntegration } from '@/hooks/unified/useIntegrationsUnified'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const platformConfig: Record<string, { icon: React.ReactNode; color: string; gradient: string }> = {
  shopify: { 
    icon: <ShoppingBag className="h-4 w-4" />, 
    color: 'text-green-600',
    gradient: 'from-green-500/20 to-green-600/10'
  },
  woocommerce: { 
    icon: <Store className="h-4 w-4" />, 
    color: 'text-purple-600',
    gradient: 'from-purple-500/20 to-purple-600/10'
  },
  prestashop: { 
    icon: <Store className="h-4 w-4" />, 
    color: 'text-pink-600',
    gradient: 'from-pink-500/20 to-pink-600/10'
  },
  magento: { 
    icon: <Store className="h-4 w-4" />, 
    color: 'text-orange-600',
    gradient: 'from-orange-500/20 to-orange-600/10'
  },
  default: { 
    icon: <Globe className="h-4 w-4" />, 
    color: 'text-blue-600',
    gradient: 'from-blue-500/20 to-blue-600/10'
  }
}

interface ConnectedStoresPanelProps {
  onImportComplete?: () => void
  autoSync?: boolean
}

export function ConnectedStoresPanel({ onImportComplete, autoSync = true }: ConnectedStoresPanelProps) {
  const { connectedIntegrations, isLoading: integrationsLoading, update } = useIntegrationsUnified()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isExpanded, setIsExpanded] = useState(true)
  const [syncingStores, setSyncingStores] = useState<Set<string>>(new Set())
  const [customerCounts, setCustomerCounts] = useState<Record<string, number>>({})
  const [hasAutoSynced, setHasAutoSynced] = useState(false)

  // Fetch customer counts per store
  useEffect(() => {
    const fetchCustomerCounts = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const counts: Record<string, number> = {}
      
      for (const integration of connectedIntegrations) {
        const { count } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .or(`notes.cs.${integration.platform},source_platform.eq.${integration.platform}`)
        
        counts[integration.id] = count || 0
      }
      
      setCustomerCounts(counts)
    }

    if (connectedIntegrations.length > 0) {
      fetchCustomerCounts()
    }
  }, [connectedIntegrations])

  // Auto-sync on mount if enabled
  useEffect(() => {
    if (autoSync && connectedIntegrations.length > 0 && !hasAutoSynced) {
      const activeStores = connectedIntegrations.filter(i => i.is_active)
      if (activeStores.length > 0) {
        // Auto-import from active stores
        activeStores.forEach(store => {
          handleSyncStore(store.id, store.platform, true)
        })
        setHasAutoSynced(true)
      }
    }
  }, [connectedIntegrations, autoSync, hasAutoSynced])

  const handleToggleStore = async (integration: UnifiedIntegration, enabled: boolean) => {
    try {
      update({ 
        id: integration.id, 
        updates: { is_active: enabled } 
      })
      
      toast({
        title: enabled ? 'Boutique activée' : 'Boutique désactivée',
        description: `${integration.platform_name || integration.platform} ${enabled ? 'synchronisera' : 'ne synchronisera plus'} les clients`
      })

      // Auto-import if enabling
      if (enabled) {
        handleSyncStore(integration.id, integration.platform, true)
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleSyncStore = async (storeId: string, platform: string, silent = false) => {
    setSyncingStores(prev => new Set(prev).add(storeId))
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-customers-to-channels', {
        body: { 
          integration_id: storeId,
          platform,
          direction: 'import'
        }
      })

      if (error) throw error

      const importedCount = data?.results?.imported || 0
      
      if (!silent) {
        toast({
          title: 'Import réussi',
          description: `${importedCount} clients importés depuis ${platform}`
        })
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      onImportComplete?.()
    } catch (error: any) {
      if (!silent) {
        toast({
          title: 'Erreur d\'import',
          description: error.message,
          variant: 'destructive'
        })
      }
    } finally {
      setSyncingStores(prev => {
        const next = new Set(prev)
        next.delete(storeId)
        return next
      })
    }
  }

  const handleSyncAll = async () => {
    const activeStores = connectedIntegrations.filter(i => i.is_active)
    for (const store of activeStores) {
      await handleSyncStore(store.id, store.platform)
    }
  }

  if (integrationsLoading) {
    return (
      <Card className="border-0 shadow-sm bg-gradient-to-r from-background to-muted/30 backdrop-blur-sm">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (connectedIntegrations.length === 0) {
    return (
      <Card className="border-dashed border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Aucune boutique connectée</p>
                <p className="text-xs text-muted-foreground">
                  Connectez une boutique pour importer automatiquement vos clients
                </p>
              </div>
            </div>
            <Button variant="default" size="sm" asChild className="gap-2 shadow-lg shadow-primary/20">
              <a href="/stores-channels">
                <Store className="h-4 w-4" />
                Connecter
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const activeStores = connectedIntegrations.filter(i => i.is_active)
  const isSyncingAny = syncingStores.size > 0

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={cn(
          "border-0 shadow-md overflow-hidden transition-all",
          "bg-gradient-to-r from-background via-background to-muted/20 backdrop-blur-xl"
        )}>
          <CardContent className="p-0">
            {/* Header */}
            <div 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 shadow-sm">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <span className={cn(
                    "absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-background shadow-sm",
                    isSyncingAny ? 'bg-blue-500 animate-pulse' : activeStores.length > 0 ? 'bg-green-500' : 'bg-amber-500'
                  )} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Boutiques connectées</span>
                    <Badge variant="secondary" className="text-xs font-medium bg-primary/10 text-primary border-0">
                      {activeStores.length}/{connectedIntegrations.length} actives
                    </Badge>
                    {isSyncingAny && (
                      <Badge variant="outline" className="text-xs gap-1 animate-pulse border-blue-500/30 text-blue-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Sync...
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Import automatique des clients depuis vos boutiques
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSyncAll()
                  }}
                  disabled={isSyncingAny || activeStores.length === 0}
                  className="gap-2 shadow-md shadow-primary/20"
                >
                  <Download className={cn("h-4 w-4", isSyncingAny && "animate-bounce")} />
                  Importer tout
                </Button>
                <div className="p-2 hover:bg-muted/50 rounded-lg transition-colors">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-4 pb-4 pt-0 border-t border-border/30">
                    <div className="grid gap-3 mt-4">
                      {connectedIntegrations.map((integration) => {
                        const config = platformConfig[integration.platform?.toLowerCase()] || platformConfig.default
                        const isSyncing = syncingStores.has(integration.id)
                        const customerCount = customerCounts[integration.id] || 0
                        
                        return (
                          <motion.div
                            key={integration.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-xl",
                              "bg-gradient-to-r",
                              integration.is_active ? config.gradient : 'from-muted/50 to-muted/30',
                              "border border-border/50 hover:border-border transition-all",
                              "shadow-sm hover:shadow-md"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-2.5 rounded-lg border",
                                integration.is_active 
                                  ? `${config.color} bg-background/80 border-current/20` 
                                  : 'text-muted-foreground bg-muted/50 border-muted-foreground/20'
                              )}>
                                {config.icon}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className={cn(
                                    "font-semibold text-sm",
                                    !integration.is_active && "text-muted-foreground"
                                  )}>
                                    {integration.platform_name || integration.platform}
                                  </p>
                                  {integration.is_active && (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {customerCount} clients
                                  </span>
                                  {integration.last_sync_at && (
                                    <span>
                                      Sync {formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true, locale: getDateFnsLocale() })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleSyncStore(integration.id, integration.platform)}
                                    disabled={isSyncing || !integration.is_active}
                                    className="h-8 w-8"
                                  >
                                    <RefreshCw className={cn(
                                      "h-4 w-4",
                                      isSyncing && "animate-spin"
                                    )} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Importer les clients</TooltipContent>
                              </Tooltip>
                              
                              <div className="flex items-center gap-2 pl-2 border-l border-border/50">
                                <span className="text-xs text-muted-foreground">
                                  {integration.is_active ? 'Actif' : 'Inactif'}
                                </span>
                                <Switch
                                  checked={integration.is_active}
                                  onCheckedChange={(checked) => handleToggleStore(integration, checked)}
                                  className="data-[state=checked]:bg-green-500"
                                />
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                      <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground">
                        <a href="/stores-channels">
                          <Settings2 className="h-4 w-4" />
                          Gérer les boutiques
                        </a>
                      </Button>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Zap className="h-3.5 w-3.5 text-primary" />
                        Synchronisation automatique activée
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  )
}
