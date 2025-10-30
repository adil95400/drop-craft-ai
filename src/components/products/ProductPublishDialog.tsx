import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Store, ShoppingBag, Share2, RefreshCw, Check, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { getPlatformConfig, getAllPlatforms, PlatformConfig } from '@/lib/platform-configs'
import { ProductAdapter } from '@/lib/product-adapter'

interface ProductPublishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
}

type PublishTarget = 'store' | 'marketplace' | 'social'

interface StoreIntegration {
  id: string
  platform: string
  shop_name?: string
  is_active: boolean
}

export function ProductPublishDialog({ open, onOpenChange, product }: ProductPublishDialogProps) {
  const { toast } = useToast()
  const [isPublishing, setIsPublishing] = useState(false)
  const [stores, setStores] = useState<StoreIntegration[]>([])
  const [loadingStores, setLoadingStores] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [adaptationResult, setAdaptationResult] = useState<any>(null)

  useEffect(() => {
    if (open) {
      fetchStores()
    }
  }, [open])

  const fetchStores = async () => {
    setLoadingStores(true)
    try {
      const { data, error } = await supabase
        .from('store_integrations')
        .select('*')
        .eq('is_active', true)

      if (error) throw error
      setStores(data || [])
    } catch (error) {
      console.error('Error fetching stores:', error)
    } finally {
      setLoadingStores(false)
    }
  }

  const previewAdaptation = (platformId: string) => {
    const config = getPlatformConfig(platformId)
    if (!config) return
    
    const adapter = new ProductAdapter(config)
    const result = adapter.adapt(product)
    
    setSelectedPlatform(platformId)
    setAdaptationResult(result)
  }

  const handlePublishToStore = async (storeId: string, platform: string) => {
    // Adapter le produit avant publication
    const config = getPlatformConfig(platform)
    if (!config) {
      toast({
        title: "Configuration manquante",
        description: `Configuration pour ${platform} non trouvée`,
        variant: "destructive"
      })
      return
    }

    const adapter = new ProductAdapter(config)
    const result = adapter.adapt(product)

    if (!result.isValid) {
      toast({
        title: "Produit invalide",
        description: `Le produit ne respecte pas les règles de ${platform}. Vérifiez les erreurs.`,
        variant: "destructive"
      })
      setSelectedPlatform(platform)
      setAdaptationResult(result)
      return
    }

    setIsPublishing(true)
    try {
      const { error } = await supabase.functions.invoke('store-product-export', {
        body: {
          storeId,
          platform,
          product: result.adapted, // Utiliser le produit adapté
          action: 'export'
        }
      })

      if (error) throw error

      toast({
        title: "✅ Publié avec succès !",
        description: `Le produit a été adapté et publié sur ${platform}${result.warnings.length > 0 ? ` (${result.warnings.length} avertissement(s))` : ''}`
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error('Publish error:', error)
      toast({
        title: "Erreur de publication",
        description: "Impossible de publier le produit",
        variant: "destructive"
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const handlePublishToMarketplace = async (marketplace: string) => {
    toast({
      title: "Bientôt disponible",
      description: `Publication sur ${marketplace} arrive prochainement`
    })
  }

  const handlePublishToSocial = async (platform: string) => {
    toast({
      title: "Bientôt disponible",
      description: `Partage sur ${platform} arrive prochainement`
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Publication Multi-Canal avec Adaptation Automatique</DialogTitle>
          <DialogDescription>
            Chaque produit est automatiquement adapté aux formats, règles et configurations de chaque plateforme
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {/* Résumé du produit */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>{product.name}</strong> - {product.price}€
                {adaptationResult && (
                  <span className="ml-2">
                    {adaptationResult.isValid ? (
                      <Badge variant="secondary" className="ml-2">✓ Compatible</Badge>
                    ) : (
                      <Badge variant="destructive" className="ml-2">⚠ Corrections requises</Badge>
                    )}
                  </span>
                )}
              </AlertDescription>
            </Alert>

            {/* Aperçu d'adaptation si sélectionné */}
            {adaptationResult && selectedPlatform && (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Aperçu: {getPlatformConfig(selectedPlatform)?.name}</h3>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSelectedPlatform(null)
                    setAdaptationResult(null)
                  }}>
                    Fermer
                  </Button>
                </div>

                {/* Erreurs */}
                {adaptationResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{adaptationResult.errors.length} erreur(s) critique(s)</strong>
                      <ul className="mt-2 space-y-1 text-sm">
                        {adaptationResult.errors.map((err: any, i: number) => (
                          <li key={i}>• {err.field}: {err.message}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Avertissements */}
                {adaptationResult.warnings.length > 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{adaptationResult.warnings.length} ajustement(s) automatique(s)</strong>
                      <ul className="mt-2 space-y-1 text-sm">
                        {adaptationResult.warnings.map((warn: any, i: number) => (
                          <li key={i}>• {warn.field}: {warn.message}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Produit adapté */}
                {adaptationResult.isValid && (
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Produit adapté:</p>
                    <div className="bg-background p-3 rounded border space-y-1">
                      <p><strong>Titre:</strong> {adaptationResult.adapted.title}</p>
                      <p><strong>Description:</strong> {adaptationResult.adapted.description.substring(0, 100)}...</p>
                      <p><strong>Prix:</strong> {adaptationResult.adapted.price} {adaptationResult.adapted.currency}</p>
                      <p><strong>Images:</strong> {adaptationResult.adapted.images.length} image(s)</p>
                      {adaptationResult.adapted.tags && (
                        <p><strong>Tags:</strong> {adaptationResult.adapted.tags.length} tag(s)</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Magasins connectés */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Store className="h-5 w-5 text-info" />
                <h3 className="font-semibold">Stores (Shopify, WooCommerce)</h3>
              </div>
              {loadingStores ? (
                <div className="flex items-center justify-center p-4">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                </div>
              ) : stores.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                  Aucun magasin connecté. Connectez d'abord un magasin.
                </p>
              ) : (
                <div className="space-y-2">
                  {stores.map(store => {
                    const config = getPlatformConfig(store.platform)
                    return (
                      <div key={store.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{config?.icon}</span>
                          <div>
                            <Badge variant="outline">{store.platform}</Badge>
                            <p className="text-sm font-medium">{store.shop_name || 'Magasin'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => previewAdaptation(store.platform)}
                          >
                            <Info className="h-4 w-4 mr-1" />
                            Aperçu
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handlePublishToStore(store.id, store.platform)}
                            disabled={isPublishing}
                          >
                            {isPublishing ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Publier
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Marketplaces */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag className="h-5 w-5 text-success" />
                <h3 className="font-semibold">Marketplaces</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['amazon', 'etsy', 'cdiscount'].map(platformId => {
                  const config = getPlatformConfig(platformId)
                  if (!config) return null
                  return (
                    <div key={platformId} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{config.icon}</span>
                        <span className="font-medium">{config.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => previewAdaptation(platformId)}
                          className="flex-1"
                        >
                          <Info className="h-3 w-3 mr-1" />
                          Aperçu
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handlePublishToMarketplace(config.name)}
                          className="flex-1"
                        >
                          Publier
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>• {config.images.minCount}-{config.images.maxCount} images</p>
                        <p>• Titre max: {config.title.maxLength} car.</p>
                        <p>• {config.requiredFields.length} champs requis</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Réseaux sociaux */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="h-5 w-5 text-warning" />
                <h3 className="font-semibold">Réseaux Sociaux</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['facebook', 'instagram', 'pinterest'].map(platformId => {
                  const config = getPlatformConfig(platformId)
                  if (!config) return null
                  return (
                    <div key={platformId} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{config.icon}</span>
                        <span className="font-medium text-sm">{config.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => previewAdaptation(platformId)}
                          className="flex-1 text-xs"
                        >
                          Aperçu
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handlePublishToSocial(config.name)}
                          className="flex-1 text-xs"
                        >
                          Publier
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>• Ratio: {config.images.aspectRatio || '1:1'}</p>
                        <p>• {config.title.maxLength} car. max</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Info Adaptation */}
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">✨ Adaptation Automatique Activée</p>
                <ul className="text-sm space-y-1">
                  <li>✓ Formats d'images adaptés (tailles, ratios)</li>
                  <li>✓ Titres et descriptions optimisés par plateforme</li>
                  <li>✓ Prix convertis selon les devises supportées</li>
                  <li>✓ Tags et catégories mappés automatiquement</li>
                  <li>✓ Validation automatique avant publication</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
