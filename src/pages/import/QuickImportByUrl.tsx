import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Link2, 
  Search, 
  Package, 
  DollarSign, 
  ImageIcon, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Copy,
  Edit3,
  ShoppingCart
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { PlatformLogo } from '@/components/ui/platform-logo'
import { getPlatformColor, getPlatformName } from '@/utils/platformLogos'

interface ProductPreview {
  title: string
  description: string
  price: number
  currency: string
  suggested_price: number
  profit_margin: number
  images: string[]
  brand: string
  sku: string
  platform_detected: string
  source_url: string
}

const supportedPlatforms = [
  'aliexpress', 'amazon', 'ebay', 'temu', 'wish', 'cjdropshipping', 'bigbuy'
]

export default function QuickImportByUrl() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [preview, setPreview] = useState<ProductPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [priceMultiplier, setPriceMultiplier] = useState(1.5)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedPrice, setEditedPrice] = useState(0)

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast.error('Veuillez entrer une URL')
      return
    }

    setIsLoading(true)
    setError(null)
    setPreview(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('quick-import-url', {
        body: { 
          url: url.trim(), 
          user_id: user?.id,
          action: 'preview',
          price_multiplier: priceMultiplier
        }
      })

      if (fnError) throw fnError
      if (!data.success) throw new Error(data.error)

      setPreview(data.data)
      setEditedTitle(data.data.title)
      setEditedPrice(data.data.suggested_price)
      toast.success('Produit analysé avec succès')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'analyse'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    if (!preview || !user) return

    setIsImporting(true)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('quick-import-url', {
        body: { 
          url: preview.source_url, 
          user_id: user.id,
          action: 'import',
          price_multiplier: editedPrice / preview.price
        }
      })

      if (fnError) throw fnError
      if (!data.success) throw new Error(data.error)

      toast.success('Produit importé avec succès !', {
        description: `"${editedTitle}" ajouté à votre catalogue`,
        action: {
          label: 'Voir',
          onClick: () => navigate('/products')
        }
      })

      // Reset form
      setUrl('')
      setPreview(null)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'import'
      toast.error(message)
    } finally {
      setIsImporting(false)
    }
  }

  const updateSuggestedPrice = (multiplier: number) => {
    setPriceMultiplier(multiplier)
    if (preview) {
      setEditedPrice(Math.ceil(preview.price * multiplier * 100) / 100)
    }
  }

  return (
    <>
      <Helmet>
        <title>Import Rapide par URL - ShopOpti</title>
        <meta name="description" content="Importez un produit instantanément depuis AliExpress, Amazon, eBay et plus" />
      </Helmet>

      <div className="container max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-white mb-4">
            <Link2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Import Rapide par URL</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Collez un lien produit et importez-le instantanément dans votre catalogue
          </p>
        </div>

        {/* Supported platforms */}
        <div className="flex flex-wrap justify-center gap-2">
          {supportedPlatforms.map((platform) => (
            <Badge key={platform} variant="secondary" className={cn("text-xs flex items-center gap-1", getPlatformColor(platform))}>
              <PlatformLogo platform={platform} size="sm" />
              {getPlatformName(platform)}
            </Badge>
          ))}
        </div>

        {/* URL Input */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-url">URL du produit</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="product-url"
                      placeholder="https://www.aliexpress.com/item/123456.html"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="pl-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    />
                  </div>
                  <Button onClick={handleAnalyze} disabled={isLoading || !url.trim()}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">Analyser</span>
                  </Button>
                </div>
              </div>

              {/* Price multiplier slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Marge bénéficiaire</Label>
                  <span className="text-sm font-medium text-primary">
                    x{priceMultiplier.toFixed(1)} ({Math.round((priceMultiplier - 1) * 100)}% de marge)
                  </span>
                </div>
                <Slider
                  value={[priceMultiplier]}
                  onValueChange={([value]) => updateSuggestedPrice(value)}
                  min={1.1}
                  max={3}
                  step={0.1}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10%</span>
                  <span>100%</span>
                  <span>200%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Preview */}
        {preview && (
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg">Produit trouvé</CardTitle>
                </div>
                <Badge className={cn("flex items-center gap-1", getPlatformColor(preview.platform_detected))}>
                  <PlatformLogo platform={preview.platform_detected} size="sm" />
                  {getPlatformName(preview.platform_detected)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Images */}
                <div className="space-y-3">
                  {preview.images.length > 0 ? (
                    <>
                      <div className="aspect-square rounded-xl overflow-hidden bg-muted">
                        <img 
                          src={preview.images[0]} 
                          alt={preview.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg'
                          }}
                        />
                      </div>
                      {preview.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {preview.images.slice(1, 5).map((img, i) => (
                            <img 
                              key={i}
                              src={img}
                              alt={`${preview.title} ${i + 2}`}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          ))}
                          {preview.images.length > 5 && (
                            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground flex-shrink-0">
                              +{preview.images.length - 5}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="aspect-square rounded-xl bg-muted flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Edit3 className="h-3 w-3" /> Titre du produit
                    </Label>
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="font-medium"
                    />
                  </div>

                  {/* Prices */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Prix fournisseur</Label>
                      <div className="text-lg font-medium text-muted-foreground line-through">
                        {(preview.price ?? 0).toFixed(2)} {preview.currency}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-green-600">Prix de vente</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editedPrice}
                          onChange={(e) => setEditedPrice(parseFloat(e.target.value) || 0)}
                          className="text-lg font-bold text-green-600 w-24"
                          step="0.01"
                        />
                        <span className="text-lg font-bold text-green-600">€</span>
                      </div>
                    </div>
                  </div>

                  {/* Profit */}
                  <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Bénéfice estimé</span>
                      <div className="text-right">
                        <span className="text-xl font-bold text-green-600">
                          +{(editedPrice - (preview.price ?? 0)).toFixed(2)} €
                        </span>
                        <span className="text-sm text-green-600 ml-2">
                          ({editedPrice > 0 ? Math.round(((editedPrice - (preview.price ?? 0)) / editedPrice) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-2 text-sm">
                    {preview.brand && (
                      <Badge variant="outline">
                        <Package className="h-3 w-3 mr-1" />
                        {preview.brand}
                      </Badge>
                    )}
                    {preview.sku && (
                      <Badge variant="outline">
                        SKU: {preview.sku.slice(0, 15)}
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {preview.images.length} images
                    </Badge>
                  </div>

                  {/* Description preview */}
                  {preview.description && (
                    <div className="text-sm text-muted-foreground line-clamp-3">
                      {preview.description}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleImport}
                  disabled={isImporting}
                  className="flex-1 bg-gradient-to-r from-primary to-purple-600"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4 mr-2" />
                  )}
                  Importer dans mon catalogue
                </Button>
                
                <Button variant="outline" asChild>
                  <a href={preview.source_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Voir l'original
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        {!preview && !error && (
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Comment ça marche ?</h3>
                  <ol className="text-sm text-muted-foreground space-y-1">
                    <li>1. Trouvez un produit sur AliExpress, Amazon, eBay...</li>
                    <li>2. Copiez l'URL du produit</li>
                    <li>3. Collez-la ci-dessus et cliquez sur Analyser</li>
                    <li>4. Ajustez le prix et importez en un clic</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
