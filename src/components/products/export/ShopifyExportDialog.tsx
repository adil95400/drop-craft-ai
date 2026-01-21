/**
 * Dialog pour exporter des produits vers Shopify
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
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Store,
  Package
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface ShopifyExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productIds: string[]
  productNames?: string[]
  onSuccess?: () => void
}

interface ShopifyIntegration {
  id: string
  store_url: string
  platform: string
  is_active: boolean
  config?: {
    credentials?: {
      shop_domain?: string
      access_token?: string
    }
  }
}

interface ExportResult {
  success: boolean
  exported_count?: number
  errors?: string[]
  message?: string
}

export function ShopifyExportDialog({
  open,
  onOpenChange,
  productIds,
  productNames = [],
  onSuccess
}: ShopifyExportDialogProps) {
  const { user } = useAuth()
  const [integrations, setIntegrations] = useState<ShopifyIntegration[]>([])
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ExportResult | null>(null)

  // Charger les intégrations Shopify actives
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
        .or('platform.eq.shopify,store_url.ilike.%myshopify.com%')

      if (error) throw error

      const shopifyIntegrations = (data || []).filter(
        i => i.platform === 'shopify' || i.store_url?.includes('myshopify.com')
      ) as ShopifyIntegration[]

      setIntegrations(shopifyIntegrations)
      
      if (shopifyIntegrations.length === 1) {
        setSelectedIntegration(shopifyIntegrations[0].id)
      }
    } catch (error) {
      console.error('Error loading integrations:', error)
      toast.error('Impossible de charger les intégrations Shopify')
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

    // Extraire les credentials
    const config = integration.config as Record<string, unknown> || {}
    const credentials = (config?.credentials as Record<string, string>) || {}
    const shopDomain = credentials?.shop_domain || integration.store_url?.replace('https://', '').replace('http://', '')
    const accessToken = credentials?.access_token

    if (!shopDomain || !accessToken) {
      toast.error('Credentials Shopify manquants. Veuillez reconfigurer l\'intégration.')
      return
    }

    setIsExporting(true)
    setProgress(0)
    setResult(null)

    try {
      // Simuler la progression
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const { data, error } = await supabase.functions.invoke('shopify-operations', {
        body: {
          operation: 'export-products',
          integrationId: selectedIntegration,
          credentials: {
            shop_domain: shopDomain,
            access_token: accessToken
          },
          operation_data: {
            product_ids: productIds
          }
        }
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (error) throw error

      setResult(data as ExportResult)

      if (data?.success) {
        toast.success(data.message || `${data.exported_count} produit(s) exporté(s) vers Shopify`)
        onSuccess?.()
      } else {
        toast.error(data?.error || 'Erreur lors de l\'export')
      }
    } catch (error) {
      console.error('Export error:', error)
      setResult({
        success: false,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue']
      })
      toast.error('Erreur lors de l\'export vers Shopify')
    } finally {
      setIsExporting(false)
    }
  }

  const handleClose = () => {
    if (!isExporting) {
      setResult(null)
      setProgress(0)
      setSelectedIntegration(null)
      onOpenChange(false)
    }
  }

  const getStoreName = (integration: ShopifyIntegration) => {
    const url = integration.store_url || ''
    const match = url.match(/([^.]+)\.myshopify\.com/)
    return match ? match[1] : url
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Exporter vers Shopify
          </DialogTitle>
          <DialogDescription>
            {productIds.length} produit(s) sélectionné(s) pour l'export
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Afficher les produits sélectionnés */}
          {productNames.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Produits à exporter :</label>
              <ScrollArea className="h-[100px] w-full rounded-md border p-3">
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Boutique Shopify :</label>
            {isLoading ? (
              <div className="flex items-center gap-2 p-4 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Chargement...</span>
              </div>
            ) : integrations.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aucune intégration Shopify active trouvée. 
                  Configurez d'abord votre connexion Shopify dans les paramètres.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-2">
                {integrations.map(integration => (
                  <button
                    key={integration.id}
                    onClick={() => setSelectedIntegration(integration.id)}
                    disabled={isExporting}
                    className={`flex items-center gap-3 p-3 rounded-md border text-left transition-colors ${
                      selectedIntegration === integration.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Store className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {getStoreName(integration)}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {integration.store_url}
                      </div>
                    </div>
                    {selectedIntegration === integration.id && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Progression */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Export en cours...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Résultat */}
          {result && (
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
                        {result.errors.length} erreur(s) : {result.errors.slice(0, 2).join(', ')}
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
