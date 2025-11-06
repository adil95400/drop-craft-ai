import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { publicationService } from '@/services/publication/PublicationService'
import { Loader2, CheckCircle, XCircle, Upload, Settings } from 'lucide-react'

interface ProductPublisherProps {
  productId: string
  productName: string
  currentPrice: number
  availableMarketplaces: Array<{
    id: string
    name: string
    icon: string
    connected: boolean
  }>
  onPublishComplete?: () => void
}

export function ProductPublisher({
  productId,
  productName,
  currentPrice,
  availableMarketplaces,
  onPublishComplete
}: ProductPublisherProps) {
  const { toast } = useToast()
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([])
  const [publishing, setPublishing] = useState(false)
  const [publishResults, setPublishResults] = useState<any[]>([])
  const [overridePrice, setOverridePrice] = useState<number | null>(null)
  const [syncInventory, setSyncInventory] = useState(true)

  const connectedMarketplaces = availableMarketplaces.filter(m => m.connected)

  const toggleMarketplace = (marketplaceId: string) => {
    setSelectedMarketplaces(prev =>
      prev.includes(marketplaceId)
        ? prev.filter(id => id !== marketplaceId)
        : [...prev, marketplaceId]
    )
  }

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
    setPublishResults([])

    try {
      const result = await publicationService.publishProduct(
        productId,
        selectedMarketplaces,
        {
          syncInventory,
          overridePrice: overridePrice || undefined
        }
      )

      setPublishResults(result.results)

      const successCount = result.results.filter(r => r.success).length
      const failCount = result.results.filter(r => !r.success).length

      toast({
        title: 'Publication terminée',
        description: `${successCount} succès, ${failCount} échec(s)`,
        variant: successCount > 0 ? 'default' : 'destructive'
      })

      if (onPublishComplete) {
        onPublishComplete()
      }
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Publier le produit
        </CardTitle>
        <CardDescription>
          Publiez "{productName}" sur les marketplaces sélectionnées
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Options de publication */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Options de publication</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sync-inventory"
                checked={syncInventory}
                onCheckedChange={(checked) => setSyncInventory(checked as boolean)}
              />
              <Label htmlFor="sync-inventory" className="cursor-pointer">
                Synchroniser automatiquement le stock
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="override-price">
                Prix personnalisé (optionnel)
              </Label>
              <Input
                id="override-price"
                type="number"
                step="0.01"
                placeholder={`Prix actuel: ${currentPrice.toFixed(2)}€`}
                value={overridePrice || ''}
                onChange={(e) => setOverridePrice(parseFloat(e.target.value) || null)}
              />
            </div>
          </div>
        </div>

        {/* Sélection des marketplaces */}
        <div className="space-y-3">
          <Label>Sélectionnez les marketplaces</Label>
          
          {connectedMarketplaces.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucune marketplace connectée</p>
              <p className="text-sm mt-2">Connectez des marketplaces dans les paramètres</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {connectedMarketplaces.map((marketplace) => (
                <div
                  key={marketplace.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedMarketplaces.includes(marketplace.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => toggleMarketplace(marketplace.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedMarketplaces.includes(marketplace.id)}
                      onCheckedChange={() => toggleMarketplace(marketplace.id)}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-2xl">{marketplace.icon}</span>
                      <span className="font-medium">{marketplace.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Résultats de publication */}
        {publishResults.length > 0 && (
          <div className="space-y-3">
            <Label>Résultats de publication</Label>
            <div className="space-y-2">
              {publishResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.success
                      ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                      : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{result.marketplace}</p>
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                      {result.error && (
                        <p className="text-sm text-red-600">{result.error}</p>
                      )}
                    </div>
                  </div>
                  {result.listingId && (
                    <Badge variant="secondary">{result.listingId}</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-3">
          <Button
            onClick={handlePublish}
            disabled={publishing || selectedMarketplaces.length === 0}
            className="flex-1"
          >
            {publishing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publication en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Publier sur {selectedMarketplaces.length} marketplace(s)
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
