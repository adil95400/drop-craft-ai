import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Upload, Store } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface ProductPublisherProps {
  productId: string
  productTitle: string
  availableMarketplaces: Array<{
    id: string
    platform: string
    name: string
    isConnected: boolean
  }>
}

export function ProductPublisher({ 
  productId, 
  productTitle,
  availableMarketplaces 
}: ProductPublisherProps) {
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([])
  const [publishing, setPublishing] = useState(false)
  const { toast } = useToast()

  const handlePublish = async () => {
    if (selectedMarketplaces.length === 0) {
      toast({
        title: 'Aucune marketplace sélectionnée',
        description: 'Veuillez sélectionner au moins une marketplace',
        variant: 'destructive'
      })
      return
    }

    setPublishing(true)

    try {
      const { data, error } = await supabase.functions.invoke('marketplace-publish', {
        body: {
          product_id: productId,
          marketplace_ids: selectedMarketplaces,
        }
      })

      if (error) throw error

      toast({
        title: 'Publication réussie',
        description: `Produit publié sur ${selectedMarketplaces.length} marketplace(s)`,
      })
    } catch (error: any) {
      toast({
        title: 'Erreur de publication',
        description: error.message,
        variant: 'destructive'
      })
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

      <p className="text-sm text-muted-foreground mb-4">
        {productTitle}
      </p>

      <div className="space-y-3 mb-6">
        <Label className="text-sm font-medium">Sélectionnez les marketplaces</Label>
        {availableMarketplaces.map((marketplace) => (
          <div key={marketplace.id} className="flex items-center gap-3">
            <Checkbox
              id={marketplace.id}
              checked={selectedMarketplaces.includes(marketplace.id)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedMarketplaces([...selectedMarketplaces, marketplace.id])
                } else {
                  setSelectedMarketplaces(selectedMarketplaces.filter(id => id !== marketplace.id))
                }
              }}
              disabled={!marketplace.isConnected}
            />
            <Label 
              htmlFor={marketplace.id}
              className={`flex items-center gap-2 ${!marketplace.isConnected ? 'opacity-50' : ''}`}
            >
              <Store className="h-4 w-4" />
              {marketplace.name} ({marketplace.platform})
              {!marketplace.isConnected && (
                <span className="text-xs text-destructive">(Non connectée)</span>
              )}
            </Label>
          </div>
        ))}
      </div>

      <Button 
        onClick={handlePublish}
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
            Publier sur {selectedMarketplaces.length} marketplace(s)
          </>
        )}
      </Button>
    </Card>
  )
}
