/**
 * Dialog professionnel pour exporter des produits vers plusieurs plateformes
 * Optimisé avec animations Framer Motion et design moderne
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Package,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Store,
  TrendingUp,
  ExternalLink,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

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

type ExportStep = 'select' | 'exporting' | 'complete'

const PLATFORM_CONFIG: Record<string, { 
  name: string; 
  gradient: string; 
  icon: string;
  bgClass: string;
  textClass: string;
}> = {
  shopify: { 
    name: 'Shopify', 
    icon: '🛍️', 
    gradient: 'from-green-500 to-emerald-600',
    bgClass: 'bg-green-500/10 border-green-500/20',
    textClass: 'text-green-600 dark:text-green-400'
  },
  woocommerce: { 
    name: 'WooCommerce', 
    icon: '🛒', 
    gradient: 'from-purple-500 to-violet-600',
    bgClass: 'bg-purple-500/10 border-purple-500/20',
    textClass: 'text-purple-600 dark:text-purple-400'
  },
  prestashop: { 
    name: 'PrestaShop', 
    icon: '🏪', 
    gradient: 'from-pink-500 to-rose-600',
    bgClass: 'bg-pink-500/10 border-pink-500/20',
    textClass: 'text-pink-600 dark:text-pink-400'
  },
  magento: { 
    name: 'Magento', 
    icon: '🧱', 
    gradient: 'from-orange-500 to-amber-600',
    bgClass: 'bg-orange-500/10 border-orange-500/20',
    textClass: 'text-orange-600 dark:text-orange-400'
  },
  wix: { 
    name: 'Wix', 
    icon: '🌐', 
    gradient: 'from-blue-500 to-cyan-600',
    bgClass: 'bg-blue-500/10 border-blue-500/20',
    textClass: 'text-blue-600 dark:text-blue-400'
  },
  bigcommerce: { 
    name: 'BigCommerce', 
    icon: '📦', 
    gradient: 'from-slate-500 to-gray-600',
    bgClass: 'bg-slate-500/10 border-slate-500/20',
    textClass: 'text-slate-600 dark:text-slate-400'
  },
  squarespace: { 
    name: 'Squarespace', 
    icon: '⬛', 
    gradient: 'from-neutral-600 to-stone-700',
    bgClass: 'bg-neutral-500/10 border-neutral-500/20',
    textClass: 'text-neutral-600 dark:text-neutral-400'
  },
  amazon: { 
    name: 'Amazon', 
    icon: '📦', 
    gradient: 'from-amber-500 to-yellow-600',
    bgClass: 'bg-amber-500/10 border-amber-500/20',
    textClass: 'text-amber-600 dark:text-amber-400'
  },
  ebay: { 
    name: 'eBay', 
    icon: '🏷️', 
    gradient: 'from-yellow-500 to-orange-500',
    bgClass: 'bg-yellow-500/10 border-yellow-500/20',
    textClass: 'text-yellow-600 dark:text-yellow-500'
  },
  etsy: { 
    name: 'Etsy', 
    icon: '🧶', 
    gradient: 'from-orange-500 to-red-500',
    bgClass: 'bg-orange-500/10 border-orange-500/20',
    textClass: 'text-orange-600 dark:text-orange-400'
  },
}

export function PlatformExportDialog({
  open,
  onOpenChange,
  productIds,
  productNames = [],
  onSuccess
}: PlatformExportDialogProps) {
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const [integrations, setIntegrations] = useState<StoreIntegration[]>([])
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<ExportStep>('select')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ExportResult | null>(null)
  const [exportLogs, setExportLogs] = useState<{ 
    product: string; 
    status: 'pending' | 'success' | 'error'; 
    message?: string 
  }[]>([])

  useEffect(() => {
    if (open && user) {
      loadIntegrations()
      setStep('select')
      setResult(null)
      setProgress(0)
      setExportLogs([])
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

      const validPlatforms = Object.keys(PLATFORM_CONFIG)
      const storeIntegrations = (data || []).filter(
        i => validPlatforms.includes(i.platform?.toLowerCase())
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

    setExportLogs(productNames.map((name, idx) => ({
      product: name || `Produit ${idx + 1}`,
      status: 'pending'
    })))

    setStep('exporting')
    setProgress(0)
    setResult(null)

    try {
      const functionName = platform === 'shopify' ? 'shopify-operations' : 'store-product-export'
      
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      for (let i = 0; i < productIds.length; i++) {
        const productId = productIds[i]
        const productName = productNames[i] || `Produit ${i + 1}`

        try {
          // Essayer d'abord imported_products, puis products
          let productData = null
          let productError = null

          // Tenter imported_products d'abord (source principale)
          const { data: importedData, error: importedError } = await supabase
            .from('imported_products')
            .select('*')
            .eq('id', productId)
            .maybeSingle()

          if (importedData) {
            productData = {
              name: importedData.name,
              description: importedData.description,
              price: importedData.price,
              sku: importedData.sku,
              images: importedData.image_urls || [],
              category: importedData.category,
              tags: (importedData.metadata as Record<string, unknown>)?.tags || [],
              stock_quantity: importedData.stock_quantity || 0
            }
          } else {
            // Fallback vers la table products
            const { data: prodData, error: prodError } = await supabase
              .from('products')
              .select('*')
              .eq('id', productId)
              .maybeSingle()

            if (prodData) {
              productData = prodData
            } else {
              throw new Error(`Produit non trouvé (ID: ${productId.slice(0, 8)}...)`)
            }
          }

          if (!productData) {
            throw new Error('Données produit introuvables')
          }

          const { data, error } = await supabase.functions.invoke(functionName, {
            body: platform === 'shopify' ? {
              operation: 'export-products',
              integrationId: integration.id,
              credentials: integration.config?.credentials,
              operation_data: { product_ids: [productId] }
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

        setProgress(((i + 1) / productIds.length) * 100)
      }

      const platformName = PLATFORM_CONFIG[platform]?.name || platform

      setResult({
        success: successCount > 0,
        exported_count: successCount,
        errors: errors.length > 0 ? errors : undefined,
        message: `${successCount} produit(s) exporté(s) vers ${platformName}`
      })

      setStep('complete')

      if (successCount > 0) {
        toast.success(`${successCount} produit(s) exporté(s) vers ${platformName}`)
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
      setStep('complete')
      toast.error('Erreur lors de l\'export')
    }
  }

  const handleClose = () => {
    if (step !== 'exporting') {
      setResult(null)
      setProgress(0)
      setSelectedIntegration(null)
      setExportLogs([])
      setStep('select')
      onOpenChange(false)
    }
  }

  const getStoreName = (integration: StoreIntegration) => {
    const url = integration.store_url || ''
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
      return parsed.hostname.replace('www.', '').split('.')[0]
    } catch {
      return url.split('.')[0] || integration.platform
    }
  }

  const getPlatformConfig = (platform: string) => {
    return PLATFORM_CONFIG[platform?.toLowerCase()] || { 
      name: platform, 
      icon: '🏪', 
      gradient: 'from-gray-500 to-slate-600',
      bgClass: 'bg-muted border-border',
      textClass: 'text-muted-foreground'
    }
  }

  const selectedPlatform = selectedIntegration 
    ? getPlatformConfig(integrations.find(i => i.id === selectedIntegration)?.platform || '')
    : null

  const content = (
    <div className="flex flex-col gap-6">
      {/* Header Stats */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border border-primary/10"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Produits sélectionnés</p>
            <p className="text-2xl font-bold">{productIds.length}</p>
          </div>
        </div>
        {step === 'select' && selectedPlatform && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className={cn("text-sm py-1 px-3", selectedPlatform.bgClass, selectedPlatform.textClass)}>
              {selectedPlatform.icon} {selectedPlatform.name}
            </Badge>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Step 1: Sélection */}
        {step === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                  <Loader2 className="h-10 w-10 animate-spin text-primary relative" />
                </div>
                <p className="text-sm text-muted-foreground">Chargement des boutiques...</p>
              </div>
            ) : integrations.length === 0 ? (
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center justify-center py-12 gap-4 text-center"
              >
                <div className="p-4 rounded-full bg-muted/50">
                  <Store className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Aucune boutique connectée</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configurez vos connexions dans "Canaux & Boutiques"
                  </p>
                </div>
                <Button variant="outline" size="sm" className="mt-2">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Configurer
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">
                    Destination de l'export
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {integrations.length} boutique(s)
                  </Badge>
                </div>
                
                <ScrollArea className={cn("pr-4", isMobile ? "h-[280px]" : "h-[260px]")}>
                  <div className="grid gap-3">
                    {integrations.map((integration, idx) => {
                      const config = getPlatformConfig(integration.platform)
                      const isSelected = selectedIntegration === integration.id
                      
                      return (
                        <motion.button
                          key={integration.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => setSelectedIntegration(integration.id)}
                          className={cn(
                            "group relative flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200",
                            isSelected 
                              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                              : "border-border hover:border-primary/40 hover:bg-muted/30"
                          )}
                        >
                          {/* Platform Icon */}
                          <div className={cn(
                            "flex items-center justify-center w-12 h-12 rounded-xl text-2xl transition-transform group-hover:scale-105",
                            isSelected ? `bg-gradient-to-br ${config.gradient} text-white shadow-lg` : config.bgClass
                          )}>
                            {isSelected ? (
                              <span className="drop-shadow-md">{config.icon}</span>
                            ) : (
                              <span>{config.icon}</span>
                            )}
                          </div>
                          
                          {/* Store Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold truncate capitalize">
                                {getStoreName(integration)}
                              </span>
                              <Badge 
                                variant="secondary" 
                                className={cn("text-[10px] px-2 py-0", config.bgClass, config.textClass)}
                              >
                                {config.name}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {integration.store_url}
                            </p>
                          </div>
                          
                          {/* Selection Indicator */}
                          <div className={cn(
                            "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                            isSelected 
                              ? "border-primary bg-primary" 
                              : "border-muted-foreground/30"
                          )}>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              >
                                <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                              </motion.div>
                            )}
                          </div>
                          
                          {/* Hover Glow Effect */}
                          {isSelected && (
                            <motion.div
                              layoutId="selectedGlow"
                              className="absolute inset-0 rounded-xl bg-primary/5 -z-10"
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Export en cours */}
        {step === 'exporting' && (
          <motion.div
            key="exporting"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Progress Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="font-medium">Export en cours...</span>
                </div>
                <span className="text-sm font-semibold text-primary">
                  {Math.round(progress)}%
                </span>
              </div>
              
              <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
            
            {/* Live Logs */}
            <ScrollArea className={cn("border rounded-xl", isMobile ? "h-[240px]" : "h-[200px]")}>
              <div className="p-4 space-y-2">
                {exportLogs.map((log, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg text-sm",
                      log.status === 'success' && "bg-green-500/10",
                      log.status === 'error' && "bg-destructive/10",
                      log.status === 'pending' && "bg-muted/50"
                    )}
                  >
                    {log.status === 'pending' && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
                    )}
                    {log.status === 'success' && (
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                    {log.status === 'error' && (
                      <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                    <span className={cn(
                      "truncate flex-1",
                      log.status === 'error' && "text-destructive"
                    )}>
                      {log.product}
                    </span>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}

        {/* Step 3: Résultat */}
        {step === 'complete' && result && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Result Banner */}
            <motion.div 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className={cn(
                "relative overflow-hidden p-6 rounded-2xl text-center",
                result.success 
                  ? "bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-green-600/10 border border-green-500/20"
                  : "bg-gradient-to-br from-destructive/10 via-red-500/5 to-destructive/10 border border-destructive/20"
              )}
            >
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  className={cn(
                    "mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4",
                    result.success ? "bg-green-500" : "bg-destructive"
                  )}
                >
                  {result.success ? (
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-white" />
                  )}
                </motion.div>
                
                <h3 className="text-xl font-bold mb-2">
                  {result.success ? 'Export réussi !' : 'Export échoué'}
                </h3>
                
                <div className="flex items-center justify-center gap-4 text-sm">
                  {result.exported_count !== undefined && result.exported_count > 0 && (
                    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="font-medium">{result.exported_count} exporté(s)</span>
                    </div>
                  )}
                  {result.errors && result.errors.length > 0 && (
                    <div className="flex items-center gap-1.5 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">{result.errors.length} erreur(s)</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Decorative Elements */}
              {result.success && (
                <>
                  <Sparkles className="absolute top-3 right-3 h-5 w-5 text-green-500/40" />
                  <TrendingUp className="absolute bottom-3 left-3 h-5 w-5 text-green-500/40" />
                </>
              )}
            </motion.div>

            {/* Detail Logs */}
            <ScrollArea className={cn("border rounded-xl", isMobile ? "h-[180px]" : "h-[150px]")}>
              <div className="p-4 space-y-2">
                {exportLogs.map((log, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg text-sm",
                      log.status === 'success' && "bg-green-500/5",
                      log.status === 'error' && "bg-destructive/5"
                    )}
                  >
                    {log.status === 'success' && (
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                    {log.status === 'error' && (
                      <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                    <span className={cn(
                      "truncate",
                      log.status === 'error' && "text-destructive"
                    )}>
                      {log.product}
                    </span>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  const footer = (
    <div className="flex items-center justify-between gap-3 w-full">
      <Button 
        variant="outline" 
        onClick={handleClose} 
        disabled={step === 'exporting'}
        className="flex-1 sm:flex-none"
      >
        {step === 'complete' ? 'Fermer' : 'Annuler'}
      </Button>
      
      {step === 'select' && (
        <Button 
          onClick={handleExport} 
          disabled={!selectedIntegration || productIds.length === 0}
          className={cn(
            "flex-1 sm:flex-none gap-2 transition-all",
            selectedIntegration && `bg-gradient-to-r ${selectedPlatform?.gradient || 'from-primary to-primary/80'}`
          )}
        >
          <Upload className="h-4 w-4" />
          Exporter
          <Badge variant="secondary" className="ml-1 bg-white/20 text-white border-0">
            {productIds.length}
          </Badge>
        </Button>
      )}
      
      {step === 'complete' && result?.errors && result.errors.length > 0 && (
        <Button 
          variant="outline"
          onClick={() => setStep('select')}
          className="flex-1 sm:flex-none gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Export Multi-Plateforme
            </DrawerTitle>
            <DrawerDescription>
              Synchronisez vos produits vers vos boutiques
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">
            {content}
          </div>
          <DrawerFooter className="pt-2">
            {footer}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] gap-0">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            Export Multi-Plateforme
          </DialogTitle>
          <DialogDescription>
            Synchronisez vos produits vers vos boutiques connectées
          </DialogDescription>
        </DialogHeader>
        
        {content}
        
        <DialogFooter className="pt-6 border-t mt-6">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
