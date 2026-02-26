/**
 * UrlScraper — Paste a product URL to scrape & import via Firecrawl
 */
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Link2, Loader2, CheckCircle2, AlertCircle, Package,
  Star, DollarSign, ImageIcon, ArrowRight, Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScrapedProduct {
  id: string
  title: string
  description: string
  price: number
  selling_price: number
  supplier_price: number
  image_url: string | null
  image_urls: string[]
  source: string
  source_platform: string
  source_url: string
  category: string | null
  rating: number | null
  stock_quantity: number
}

const PLATFORM_HINTS = [
  { name: 'AliExpress', example: 'aliexpress.com/item/...' },
  { name: 'Amazon', example: 'amazon.com/dp/...' },
  { name: 'Temu', example: 'temu.com/...' },
  { name: 'CJ', example: 'cjdropshipping.com/product/...' },
  { name: 'eBay', example: 'ebay.com/itm/...' },
  { name: 'Etsy', example: 'etsy.com/listing/...' },
]

export function UrlScraper() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ScrapedProduct | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleScrape = async () => {
    if (!url.trim()) return
    setIsLoading(true)
    setResult(null)
    setError(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('firecrawl-product-scraper', {
        body: { url: url.trim() },
      })

      if (fnError) throw new Error(fnError.message)
      if (!data?.success) throw new Error(data?.error || 'Erreur inconnue')

      setResult(data.product)
      queryClient.invalidateQueries({ queryKey: ['discovery-supplier-products'] })
      toast({
        title: '✅ Produit extrait et sauvegardé',
        description: `"${data.product.title}" ajouté à votre catalogue fournisseur`,
      })
    } catch (err: any) {
      setError(err.message)
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* URL Input */}
      <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Import par URL — Extraction automatique via IA
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Collez l'URL d'un produit (AliExpress, Amazon, Temu, CJ, eBay...)"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScrape()}
                className="pl-10 h-11"
                disabled={isLoading}
              />
            </div>
            <Button onClick={handleScrape} disabled={isLoading || !url.trim()} className="h-11 gap-2 px-6">
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Extraction...</>
              ) : (
                <><ArrowRight className="h-4 w-4" /> Extraire</>
              )}
            </Button>
          </div>

          {/* Platform hints */}
          <div className="flex flex-wrap gap-2">
            {PLATFORM_HINTS.map(p => (
              <Badge key={p.name} variant="outline" className="text-xs text-muted-foreground">
                {p.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {isLoading && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="font-medium">Extraction en cours...</p>
                <p className="text-sm text-muted-foreground">Analyse de la page et extraction des données produit via Firecrawl</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-40 w-40 rounded-lg shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-8 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <Card className="border-destructive/50">
          <CardContent className="p-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Extraction échouée</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Vérifiez l'URL et réessayez. Certains sites bloquent le scraping.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && !isLoading && (
        <Card className="border-primary/30 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              {/* Image */}
              <div className="md:w-56 shrink-0">
                {result.image_url ? (
                  <img src={result.image_url} alt={result.title} className="w-full h-56 md:h-full object-cover" />
                ) : (
                  <div className="w-full h-56 bg-muted flex items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <Badge variant="outline">{result.source_platform}</Badge>
                    </div>
                    <h3 className="font-semibold text-lg leading-tight">{result.title}</h3>
                  </div>
                </div>

                {result.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{result.description}</p>
                )}

                <Separator />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Coût
                    </p>
                    <p className="font-bold text-lg">{result.supplier_price.toFixed(2)}€</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vente suggérée</p>
                    <p className="font-bold text-lg text-primary">{result.selling_price.toFixed(2)}€</p>
                  </div>
                  {result.rating && (
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Star className="h-3 w-3" /> Note
                      </p>
                      <p className="font-bold text-lg">{result.rating}/5</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Package className="h-3 w-3" /> Stock
                    </p>
                    <p className="font-bold text-lg">{result.stock_quantity}</p>
                  </div>
                </div>

                {result.image_urls && result.image_urls.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {result.image_urls.slice(0, 6).map((img, i) => (
                      <img key={i} src={img} alt="" className="h-16 w-16 rounded object-cover border shrink-0" />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    Sauvegardé dans le catalogue fournisseur
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
