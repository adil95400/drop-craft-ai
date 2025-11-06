import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Upload, Package } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface BulkPublisherProps {
  productIds: string[]
  availableMarketplaces: Array<{
    id: string
    platform: string
    name: string
    isConnected: boolean
  }>
  onComplete?: () => void
}

export function BulkPublisher({ 
  productIds, 
  availableMarketplaces,
  onComplete 
}: BulkPublisherProps) {
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([])
  const [publishing, setPublishing] = useState(false)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  const handleBulkPublish = async () => {
    if (selectedMarketplaces.length === 0) {
      toast({
        title: 'Aucune marketplace sélectionnée',
        variant: 'destructive'
      })
      return
    }

    setPublishing(true)
    setProgress(0)

    try {
      let completed = 0
      const total = productIds.length

      for (const productId of productIds) {
        await supabase.functions.invoke('marketplace-publish', {
          body: {
            product_id: productId,
            marketplace_ids: selectedMarketplaces,
          }
        })

        completed++
        setProgress((completed / total) * 100)
      }

      toast({
        title: 'Publication terminée',
        description: `${total} produits publiés sur ${selectedMarketplaces.length} marketplace(s)`,
      })

      onComplete?.()
    } catch (error: any) {
      toast({
        title: 'Erreur de publication',
        description: error.message,
        variant: 'destructive'
      })
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
        <Label className="text-sm font-medium">Marketplaces cibles</Label>
        {availableMarketplaces.map((marketplace) => (
          <div key={marketplace.id} className="flex items-center gap-3">
            <Checkbox
              id={`bulk-${marketplace.id}`}
              checked={selectedMarketplaces.includes(marketplace.id)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedMarketplaces([...selectedMarketplaces, marketplace.id])
                } else {
                  setSelectedMarketplaces(selectedMarketplaces.filter(id => id !== marketplace.id))
                }
              }}
              disabled={!marketplace.isConnected || publishing}
            />
            <Label 
              htmlFor={`bulk-${marketplace.id}`}
              className={!marketplace.isConnected ? 'opacity-50' : ''}
            >
              {marketplace.name}
            </Label>
          </div>
        ))}
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
        disabled={publishing || selectedMarketplaces.length === 0}
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
