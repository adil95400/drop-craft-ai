import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { publicationService } from '@/services/publication/PublicationService'
import { Loader2, Upload, CheckCircle, XCircle, Package } from 'lucide-react'

interface BulkPublisherProps {
  selectedProducts: Array<{
    id: string
    name: string
    price: number
  }>
  availableMarketplaces: Array<{
    id: string
    name: string
    icon: string
    connected: boolean
  }>
  onPublishComplete?: () => void
}

export function BulkPublisher({
  selectedProducts,
  availableMarketplaces,
  onPublishComplete
}: BulkPublisherProps) {
  const { toast } = useToast()
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([])
  const [publishing, setPublishing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [syncInventory, setSyncInventory] = useState(true)
  const [bulkResults, setBulkResults] = useState<any>(null)

  const connectedMarketplaces = availableMarketplaces.filter(m => m.connected)

  const toggleMarketplace = (marketplaceId: string) => {
    setSelectedMarketplaces(prev =>
      prev.includes(marketplaceId)
        ? prev.filter(id => id !== marketplaceId)
        : [...prev, marketplaceId]
    )
  }

  const handleBulkPublish = async () => {
    if (selectedMarketplaces.length === 0) {
      toast({
        title: 'Aucune marketplace sélectionnée',
        description: 'Veuillez sélectionner au moins une marketplace',
        variant: 'destructive'
      })
      return
    }

    setPublishing(true)
    setProgress(0)
    setBulkResults(null)

    try {
      const productIds = selectedProducts.map(p => p.id)
      
      // Simuler la progression
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 500)

      const result = await publicationService.publishMultipleProducts(
        productIds,
        selectedMarketplaces,
        { syncInventory }
      )

      clearInterval(progressInterval)
      setProgress(100)
      setBulkResults(result)

      toast({
        title: 'Publication terminée',
        description: `${result.successCount} produit(s) publié(s) avec succès`,
        variant: result.successCount > 0 ? 'default' : 'destructive'
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
          <Package className="h-5 w-5" />
          Publication en masse
        </CardTitle>
        <CardDescription>
          Publiez {selectedProducts.length} produit(s) sur plusieurs marketplaces
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Options */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="bulk-sync-inventory"
              checked={syncInventory}
              onCheckedChange={(checked) => setSyncInventory(checked as boolean)}
            />
            <Label htmlFor="bulk-sync-inventory" className="cursor-pointer">
              Synchroniser automatiquement le stock
            </Label>
          </div>
        </div>

        {/* Sélection des marketplaces */}
        <div className="space-y-3">
          <Label>Marketplaces cibles</Label>
          
          {connectedMarketplaces.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucune marketplace connectée</p>
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

        {/* Progression */}
        {publishing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Publication en cours...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Résultats */}
        {bulkResults && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold">{bulkResults.successCount}</p>
                <p className="text-sm text-muted-foreground">Succès</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold">{bulkResults.failCount}</p>
                <p className="text-sm text-muted-foreground">Échecs</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold">{bulkResults.totalProducts}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {bulkResults.results.map((result: any, index: number) => (
                <div
                  key={index}
                  className="border rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{result.productName}</span>
                    <Badge variant={result.marketplaceResults.some((r: any) => r.success) ? 'default' : 'destructive'}>
                      {result.marketplaceResults.filter((r: any) => r.success).length}/{result.marketplaceResults.length}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {result.marketplaceResults.map((mr: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        {mr.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-muted-foreground">{mr.marketplace}</span>
                        {mr.error && (
                          <span className="text-red-600 text-xs">{mr.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action */}
        <Button
          onClick={handleBulkPublish}
          disabled={publishing || selectedMarketplaces.length === 0}
          className="w-full"
          size="lg"
        >
          {publishing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Publication en cours...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Publier {selectedProducts.length} produit(s) sur {selectedMarketplaces.length} marketplace(s)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
