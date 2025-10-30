import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Store, ShoppingBag, Share2, RefreshCw, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

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

  const handlePublishToStore = async (storeId: string, platform: string) => {
    setIsPublishing(true)
    try {
      const { error } = await supabase.functions.invoke('store-product-export', {
        body: {
          storeId,
          platform,
          product: {
            name: product.name,
            description: product.description,
            price: product.price,
            sku: product.sku,
            images: product.image_url ? [product.image_url] : [],
            category: product.category,
            tags: product.tags || [],
            inventory_quantity: product.stock_quantity || 100
          },
          action: 'export'
        }
      })

      if (error) throw error

      toast({
        title: "Publié avec succès !",
        description: `Le produit a été publié sur ${platform}`
      })
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Publier: {product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Magasins connectés */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Store className="h-5 w-5 text-info" />
              <h3 className="font-semibold">Magasins connectés</h3>
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
                {stores.map(store => (
                  <div key={store.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{store.platform}</Badge>
                      <span className="font-medium">{store.shop_name || 'Magasin'}</span>
                    </div>
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
                ))}
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
              {['Etsy', 'Cdiscount', 'Allegro', 'ManoMano'].map(marketplace => (
                <Button
                  key={marketplace}
                  variant="outline"
                  onClick={() => handlePublishToMarketplace(marketplace)}
                  className="justify-start"
                >
                  {marketplace}
                </Button>
              ))}
            </div>
          </div>

          {/* Réseaux sociaux */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="h-5 w-5 text-warning" />
              <h3 className="font-semibold">Réseaux sociaux</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['Facebook', 'Instagram', 'Pinterest'].map(social => (
                <Button
                  key={social}
                  variant="outline"
                  onClick={() => handlePublishToSocial(social)}
                  className="justify-start"
                >
                  {social}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
