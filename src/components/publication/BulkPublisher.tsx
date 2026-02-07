import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Loader2, Upload, Package, Store } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { PublishProductsService } from '@/services/publishProducts.service'

interface BulkPublisherProps {
  productIds: string[]
  onComplete?: () => void
}

export function BulkPublisher({ productIds, onComplete }: BulkPublisherProps) {
  const { user } = useAuth()
  const [selectedStores, setSelectedStores] = useState<string[]>([])
  const [publishing, setPublishing] = useState(false)
  const [progress, setProgress] = useState(0)

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['user-stores', user?.id],
    queryFn: () => PublishProductsService.getUserStores(user!.id),
    enabled: !!user,
  })

  const handleBulkPublish = async () => {
    if (selectedStores.length === 0) {
      toast.error('Aucune boutique sélectionnée')
      return
    }

    setPublishing(true)
    setProgress(0)

    try {
      let completed = 0
      const total = productIds.length

      for (const productId of productIds) {
        try {
          await PublishProductsService.publishToStores(productId, selectedStores)
        } catch (e) {
          console.error(`Failed to publish ${productId}:`, e)
        }
        completed++
        setProgress((completed / total) * 100)
      }

      toast.success(`${total} produits publiés sur ${selectedStores.length} boutique(s)`)
      onComplete?.()
    } catch (error: any) {
      toast.error(error.message || 'Erreur de publication')
    } finally {
      setPublishing(false)
      setProgress(0)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Publication groupée</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {productIds.length} produit(s) sélectionné(s)
      </p>

      <div className="space-y-3 mb-6">
        <Label className="text-sm font-medium">Boutiques cibles</Label>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : stores.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune boutique connectée.</p>
        ) : (
          stores.map((store) => (
            <div key={store.id} className="flex items-center gap-3">
              <Checkbox
                id={`bulk-${store.id}`}
                checked={selectedStores.includes(store.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedStores([...selectedStores, store.id])
                  } else {
                    setSelectedStores(selectedStores.filter(id => id !== store.id))
                  }
                }}
                disabled={publishing}
              />
              <Label htmlFor={`bulk-${store.id}`} className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                {store.name} ({store.platform})
              </Label>
            </div>
          ))
        )}
      </div>

      {publishing && (
        <div className="mb-4">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {Math.round(progress)}% complété
          </p>
        </div>
      )}

      <Button
        onClick={handleBulkPublish}
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
            Publier {productIds.length} produit(s)
          </>
        )}
      </Button>
    </Card>
  )
}
