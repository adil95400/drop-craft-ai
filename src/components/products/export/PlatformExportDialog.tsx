/**
 * Dialog pour exporter des produits vers plusieurs plateformes
 */
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Store,
  Package,
  ShoppingBag
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface PlatformExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productIds: string[]
  productNames?: string[]
  onSuccess?: () => void
}

interface StoreIntegration {
  id: string
  store_url: string
  platform: string
  is_active: boolean
  config?: {
    credentials?: Record<string, string>
  }
}

interface ExportResult {
  success: boolean
  exported_count?: number
  errors?: string[]
  message?: string
}

const PLATFORM_INFO: Record<string, { name: string; icon: string; color: string }> = {
  shopify: { name: 'Shopify', icon: '🛍️', color: 'bg-green-500/10 border-green-500/30 text-green-600' },
  woocommerce: { name: 'WooCommerce', icon: '🛒', color: 'bg-purple-500/10 border-purple-500/30 text-purple-600' },
  prestashop: { name: 'PrestaShop', icon: '🏪', color: 'bg-pink-500/10 border-pink-500/30 text-pink-600' },
  magento: { name: 'Magento', icon: '🧱', color: 'bg-orange-500/10 border-orange-500/30 text-orange-600' },
  wix: { name: 'Wix', icon: '🌐', color: 'bg-blue-500/10 border-blue-500/30 text-blue-600' },
  bigcommerce: { name: 'BigCommerce', icon: '📦', color: 'bg-slate-500/10 border-slate-500/30 text-slate-600' },
  squarespace: { name: 'Squarespace', icon: '⬛', color: 'bg-neutral-500/10 border-neutral-500/30 text-neutral-600' },
  amazon: { name: 'Amazon', icon: '📦', color: 'bg-amber-500/10 border-amber-500/30 text-amber-600' },
  ebay: { name: 'eBay', icon: '🏷️', color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600' },
  etsy: { name: 'Etsy', icon: '🧶', color: 'bg-orange-500/10 border-orange-500/30 text-orange-600' },
}

export function PlatformExportDialog({
  open,
  onOpenChange,
  productIds,
  productNames = [],
  onSuccess
}: PlatformExportDialogProps) {
  const { user } = useAuth()
  const [integrations, setIntegrations] = useState<StoreIntegration[]>([])
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ExportResult | null>(null)
  const [exportLogs, setExportLogs] = useState<{ product: string; status: 'pending' | 'success' | 'error'; message?: string }[]>([])

  // Charger les intégrations actives
  useEffect(() => {
    if (open && user) {
      loadIntegrations()
    }
  }, [open, user])

  const loadIntegrations = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('id, store_url, platform, is_active, config')
        .eq('user_id', user?.id)
        .eq('is_active', true)

      if (error) throw error

      // Filtrer pour garder uniquement les intégrations de boutiques (pas marketplaces)
      const storeIntegrations = (data || []).filter(
        i => ['shopify', 'woocommerce', 'prestashop', 'magento', 'wix', 'bigcommerce', 'squarespace', 'amazon', 'ebay', 'etsy'].includes(i.platform?.toLowerCase())
      ) as StoreIntegration[]

      setIntegrations(storeIntegrations)
      
      if (storeIntegrations.length === 1) {
        setSelectedIntegration(storeIntegrations[0].id)
      }
    } catch (error) {
      console.error('Error loading integrations:', error)
      toast.error('Impossible de charger les intégrations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    if (!selectedIntegration || productIds.length === 0) return

    const integration = integrations.find(i => i.id === selectedIntegration)
    if (!integration) {
      toast.error('Intégration non trouvée')
      return
    }

    const platform = integration.platform?.toLowerCase() || 'unknown'

    // Initialiser les logs
    setExportLogs(productNames.map((name, idx) => ({
      product: name || `Produit ${idx + 1}`,
      status: 'pending'
    })))

    setIsExporting(true)
    setProgress(0)
    setResult(null)

    try {
      let functionName = 'store-product-export'
      
      // Utiliser la fonction appropriée selon la plateforme
      if (platform === 'shopify') {
        functionName = 'shopify-operations'
      }

      // Exporter chaque produit
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      for (let i = 0; i < productIds.length; i++) {
        const productId = productIds[i]
        const productName = productNames[i] || `Produit ${i + 1}`

        try {
          // Récupérer les données du produit
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single()

          if (productError) throw productError

          // Appeler la fonction d'export
          const { data, error } = await supabase.functions.invoke(functionName, {
            body: platform === 'shopify' ? {
              operation: 'export-products',
              integrationId: integration.id,
              credentials: integration.config?.credentials,
              operation_data: {
                product_ids: [productId]
              }
            } : {
              storeId: integration.id,
              platform,
              product: {
                name: productData.name,
                description: productData.description,
                price: productData.price,
                sku: productData.sku,
                images: productData.images,
                category: productData.category,
                tags: productData.tags,
                inventory_quantity: productData.stock_quantity || 0
              },
              action: 'export'
            }
          })

          if (error) throw error

          if (data?.success) {
            successCount++
            setExportLogs(prev => prev.map((log, idx) => 
              idx === i ? { ...log, status: 'success' } : log
            ))
          } else {
            throw new Error(data?.error || 'Erreur inconnue')
          }
        } catch (error) {
          errorCount++
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
          errors.push(`${productName}: ${errorMessage}`)
          setExportLogs(prev => prev.map((log, idx) => 
            idx === i ? { ...log, status: 'error', message: errorMessage } : log
          ))
        }

        // Mettre à jour la progression
        setProgress(((i + 1) / productIds.length) * 100)
      }

      setResult({
        success: successCount > 0,
        exported_count: successCount,
        errors: errors.length > 0 ? errors : undefined,
        message: `${successCount} produit(s) exporté(s) vers ${PLATFORM_INFO[platform]?.name || platform}`
      })

      if (successCount > 0) {
        toast.success(`${successCount} produit(s) exporté(s) vers ${PLATFORM_INFO[platform]?.name || platform}`)
        onSuccess?.()
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} erreur(s) lors de l'export`)
      }
    } catch (error) {
      console.error('Export error:', error)
      setResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue']
      })
      toast.error('Erreur lors de l\'export')
    } finally {
      setIsExporting(false)
    }
  }

  const handleClose = () => {
    if (!isExporting) {
      setResult(null)
      setProgress(0)
      setSelectedIntegration(null)
      setExportLogs([])
      onOpenChange(false)
    }
  }

  const getStoreName = (integration: StoreIntegration) => {
    const url = integration.store_url || ''
    // Extraire le nom de domaine
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
      return parsed.hostname.replace('www.', '').split('.')[0]
    } catch {
      return url.split('.')[0] || integration.platform
    }
  }

  const getPlatformInfo = (platform: string) => {
    return PLATFORM_INFO[platform?.toLowerCase()] || { name: platform, icon: '🏪', color: 'bg-muted border-border' }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Exporter vers une boutique
          </DialogTitle>
          <DialogDescription>
            {productIds.length} produit(s) sélectionné(s) pour l'export
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Afficher les produits sélectionnés */}
          {productNames.length > 0 && !isExporting && !result && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Produits à exporter :</label>
              <ScrollArea className="h-[80px] w-full rounded-md border p-3">
                <div className="space-y-1">
                  {productNames.slice(0, 10).map((name, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Package className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{name}</span>
                    </div>
                  ))}
                  {productNames.length > 10 && (
                    <div className="text-sm text-muted-foreground">
                      ... et {productNames.length - 10} autres
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Sélection de la boutique */}
          {!isExporting && !result && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Choisissez une boutique :</label>
              {isLoading ? (
                <div className="flex items-center gap-2 p-4 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Chargement des boutiques...</span>
                </div>
              ) : integrations.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Aucune boutique connectée. 
                    Configurez d'abord vos connexions dans "Canaux & Boutiques".
                  </AlertDescription>
                </Alert>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="grid gap-2 pr-3">
                    {integrations.map(integration => {
                      const platformInfo = getPlatformInfo(integration.platform)
                      return (
                        <button
                          key={integration.id}
                          onClick={() => setSelectedIntegration(integration.id)}
                          disabled={isExporting}
                          className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                            selectedIntegration === integration.id
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <div className={`flex items-center justify-center w-10 h-10 rounded-lg border ${platformInfo.color}`}>
                            <span className="text-lg">{platformInfo.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium flex items-center gap-2">
                              <span className="truncate">{getStoreName(integration)}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${platformInfo.color}`}>
                                {platformInfo.name}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {integration.store_url}
                            </div>
                          </div>
                          {selectedIntegration === integration.id && (
                            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {/* Progression et logs */}
          {isExporting && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Export en cours...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              <ScrollArea className="h-[150px] border rounded-md p-3">
                <div className="space-y-2">
                  {exportLogs.map((log, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {log.status === 'pending' && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                      {log.status === 'success' && <CheckCircle className="h-3 w-3 text-green-500" />}
                      {log.status === 'error' && <AlertCircle className="h-3 w-3 text-destructive" />}
                      <span className={`truncate ${log.status === 'error' ? 'text-destructive' : ''}`}>
                        {log.product}
                      </span>
                      {log.message && (
                        <span className="text-xs text-muted-foreground truncate">
                          - {log.message}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Résultat */}
          {result && (
            <div className="space-y-4">
              <Alert variant={result.success ? 'default' : 'destructive'}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {result.success ? (
                    <span>
                      {result.exported_count} produit(s) exporté(s) avec succès !
                      {result.errors && result.errors.length > 0 && (
                        <span className="block mt-1 text-amber-600">
                          {result.errors.length} erreur(s)
                        </span>
                      )}
                    </span>
                  ) : (
                    <span>
                      Échec de l'export. 
                      {result.errors?.[0] && ` ${result.errors[0]}`}
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              {/* Logs finaux */}
              <ScrollArea className="h-[120px] border rounded-md p-3">
                <div className="space-y-2">
                  {exportLogs.map((log, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {log.status === 'success' && <CheckCircle className="h-3 w-3 text-green-500" />}
                      {log.status === 'error' && <AlertCircle className="h-3 w-3 text-destructive" />}
                      <span className={`truncate ${log.status === 'error' ? 'text-destructive' : ''}`}>
                        {log.product}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isExporting}>
            {result ? 'Fermer' : 'Annuler'}
          </Button>
          {!result && (
            <Button 
              onClick={handleExport} 
              disabled={!selectedIntegration || isExporting || productIds.length === 0}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Exporter {productIds.length} produit(s)
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
