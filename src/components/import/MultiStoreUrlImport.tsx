import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link2, Loader2, Store, Rocket, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { MultiStoreImportSelector } from './MultiStoreImportSelector'
import { useMultiStoreImport, ProductImportData } from '@/hooks/useMultiStoreImport'
import { cn } from '@/lib/utils'

interface MultiStoreUrlImportProps {
  className?: string
  onImportComplete?: (results: any) => void
}

export function MultiStoreUrlImport({ className, onImportComplete }: MultiStoreUrlImportProps) {
  const { toast } = useToast()
  const [url, setUrl] = useState('')
  const [isScraping, setIsScraping] = useState(false)
  const [scrapedProduct, setScrapedProduct] = useState<ProductImportData | null>(null)

  const {
    selectedCount,
    hasSelection,
    isImporting,
    progress,
    importToMultipleStoresAsync
  } = useMultiStoreImport()

  // Scrape product from URL
  const handleScrape = async () => {
    if (!url.trim()) {
      toast({
        title: "URL requise",
        description: "Veuillez entrer une URL de produit",
        variant: "destructive"
      })
      return
    }

    setIsScraping(true)
    setScrapedProduct(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Non authentifié')

      const { data, error } = await supabase.functions.invoke('product-url-scraper', {
        body: { url },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (error) throw error

      if (data?.product) {
        const product: ProductImportData = {
          title: data.product.title || data.product.name || 'Produit sans nom',
          description: data.product.description,
          price: parseFloat(data.product.price) || 0,
          compare_at_price: data.product.compare_at_price ? parseFloat(data.product.compare_at_price) : undefined,
          cost_price: data.product.cost_price ? parseFloat(data.product.cost_price) : undefined,
          sku: data.product.sku,
          images: data.product.images || data.product.image_urls || [],
          video_urls: data.product.video_urls || [],
          variants: data.product.variants || [],
          category: data.product.category,
          tags: data.product.tags || [],
          source_url: url,
          source_platform: data.product.source_platform || 'web',
          brand: data.product.brand
        }

        setScrapedProduct(product)
        toast({
          title: "Produit récupéré",
          description: product.title
        })
      } else {
        throw new Error('Aucun produit trouvé')
      }
    } catch (error: any) {
      toast({
        title: "Erreur de scraping",
        description: error.message || 'Impossible de récupérer le produit',
        variant: "destructive"
      })
    } finally {
      setIsScraping(false)
    }
  }

  // Import to all selected stores
  const handleMultiStoreImport = async () => {
    if (!scrapedProduct) return

    try {
      const results = await importToMultipleStoresAsync(scrapedProduct)
      onImportComplete?.(results)
      
      // Reset after successful import
      if (results.successful > 0) {
        setUrl('')
        setScrapedProduct(null)
      }
    } catch (error) {
      console.error('Multi-store import failed:', error)
    }
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          Import Multi-Boutiques
        </CardTitle>
        <CardDescription>
          Importez un produit depuis une URL vers plusieurs boutiques simultanément
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL Input */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="https://www.aliexpress.com/item/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10"
                disabled={isScraping || isImporting}
              />
            </div>
            <Button 
              onClick={handleScrape} 
              disabled={!url.trim() || isScraping || isImporting}
            >
              {isScraping ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyse...
                </>
              ) : (
                'Analyser'
              )}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">AliExpress</Badge>
            <Badge variant="outline">Amazon</Badge>
            <Badge variant="outline">Shopify</Badge>
            <Badge variant="outline">Temu</Badge>
            <Badge variant="outline">+20 plateformes</Badge>
          </div>
        </div>

        {/* Scraped Product Preview */}
        {scrapedProduct && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border">
              {scrapedProduct.images?.[0] && (
                <img 
                  src={scrapedProduct.images[0]} 
                  alt={scrapedProduct.title}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{scrapedProduct.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-primary">
                    {scrapedProduct.price?.toFixed(2)} €
                  </span>
                  {scrapedProduct.compare_at_price && (
                    <span className="text-sm text-muted-foreground line-through">
                      {scrapedProduct.compare_at_price.toFixed(2)} €
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{scrapedProduct.source_platform}</Badge>
                  {scrapedProduct.images && (
                    <span>{scrapedProduct.images.length} image(s)</span>
                  )}
                  {scrapedProduct.variants && scrapedProduct.variants.length > 0 && (
                    <span>{scrapedProduct.variants.length} variante(s)</span>
                  )}
                </div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            </div>

            {/* Store Selector */}
            <MultiStoreImportSelector showProgress={true} />

            {/* Import Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleMultiStoreImport}
              disabled={!hasSelection || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Import en cours... ({progress.completed}/{progress.total})
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Importer vers {selectedCount} boutique(s)
                </>
              )}
            </Button>

            {/* Import Results Summary */}
            {progress.completed > 0 && progress.completed === progress.total && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20"
              >
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-700">
                  {progress.successful} importation(s) réussie(s)
                </span>
                {progress.failed > 0 && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="flex items-center gap-1 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {progress.failed} échec(s)
                    </span>
                  </>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Empty state */}
        {!scrapedProduct && !isScraping && (
          <div className="text-center py-8 text-muted-foreground">
            <Store className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              Entrez une URL de produit pour commencer l'import multi-boutiques
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default MultiStoreUrlImport
