import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, Store } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { PublishProductsService } from '@/services/publishProducts.service'

interface ProductPublisherProps {
  productId: string
  productTitle: string
}

export function ProductPublisher({ productId, productTitle }: ProductPublisherProps) {
  const { user } = useAuth()
  const [selectedStores, setSelectedStores] = useState<string[]>([])
  const [publishing, setPublishing] = useState(false)

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['user-stores', user?.id],
    queryFn: () => PublishProductsService.getUserStores(user!.id),
    enabled: !!user,
  })

  const handlePublish = async () => {
    if (selectedStores.length === 0) {
      toast.error('Veuillez sélectionner au moins une boutique')
      return
    }

    setPublishing(true)
    try {
      const result = await PublishProductsService.publishToStores(productId, selectedStores)

      if (result.successCount > 0) {
        toast.success(`Produit publié sur ${result.successCount} boutique(s)`)
      }
      if (result.failCount > 0) {
        toast.error(`${result.failCount} erreur(s) de publication`)
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur de publication')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Upload className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Publier le produit</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{productTitle}</p>

      <div className="space-y-3 mb-6">
        <Label className="text-sm font-medium">Sélectionnez les boutiques</Label>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : stores.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune boutique connectée. Ajoutez une boutique dans les paramètres.
          </p>
        ) : (
          stores.map((store) => (
            <div key={store.id} className="flex items-center gap-3">
              <Checkbox
                id={store.id}
                checked={selectedStores.includes(store.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedStores([...selectedStores, store.id])
                  } else {
                    setSelectedStores(selectedStores.filter(id => id !== store.id))
                  }
                }}
              />
              <Label htmlFor={store.id} className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                {store.name} ({store.platform})
              </Label>
            </div>
          ))
        )}
      </div>

      <Button
        onClick={handlePublish}
        disabled={publishing || selectedStores.length === 0}
        className="w-full"
      >
        {publishing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Publication en cours...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Publier sur {selectedStores.length} boutique(s)
          </>
        )}
      </Button>
    </Card>
  )
}
