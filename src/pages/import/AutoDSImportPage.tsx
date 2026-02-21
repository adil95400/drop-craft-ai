import React, { useState, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Link2, Search, Package, ImageIcon, Loader2, CheckCircle2, AlertCircle, 
  Sparkles, ShoppingCart, Plus, Trash2, X, Zap, Globe, Camera,
  TrendingUp, Clock, ArrowRight, Upload, History, Eye, Edit, Calculator
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { PlatformLogo } from '@/components/ui/platform-logo'
import { getPlatformColor, getPlatformName } from '@/utils/platformLogos'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { ChannablePageLayout } from '@/components/channable/ChannablePageLayout'
import { ChannableHeroSection } from '@/components/channable/ChannableHeroSection'
import { ProductPreviewEditModal } from '@/components/import/ProductPreviewEditModal'
import { ProfitCalculator } from '@/components/import/ProfitCalculator'
import { ImportSuccessAnimation } from '@/components/ui/import-success-animation'
import { useImportSuccessAnimation } from '@/hooks/useImportSuccessAnimation'

// Hook pour préférences réduites
const useReducedMotion = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

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
  variants?: any[]
  videos?: string[]
  extracted_reviews?: any[]
  reviews?: { rating: number | null; count: number | null }
}

interface QueuedUrl {
  id: string
  url: string
  status: 'pending' | 'loading' | 'success' | 'error'
  preview?: ProductPreview
  error?: string
}

interface QueuedImage {
  id: string
  file?: File
  url?: string
  preview: string
  status: 'pending' | 'loading' | 'success' | 'error'
  productName?: string
  error?: string
}

const supportedPlatforms = ['aliexpress', 'amazon', 'ebay', 'temu', 'wish', 'cjdropshipping', 'bigbuy', 'banggood', 'shein', 'etsy']

export default function AutoDSImportPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()

  // Success Animation Hook
  const {
    isVisible: showSuccessAnim,
    productCount: successProductCount,
    productName: successProductName,
    showSuccessAnimation,
    hideSuccessAnimation,
    handleViewProducts,
    handleContinueImport,
  } = useImportSuccessAnimation()

  // Read URL from query params (from QuickImportHero redirect)
  const searchParams = new URLSearchParams(window.location.search)
  const initialUrl = searchParams.get('url') || ''

  // URL Import State
  const [urlInput, setUrlInput] = useState(initialUrl)
  const [queuedUrls, setQueuedUrls] = useState<QueuedUrl[]>(() => {
    if (initialUrl) {
      return [{ id: crypto.randomUUID(), url: initialUrl, status: 'pending' as const }]
    }
    return []
  })
  const [isProcessingUrls, setIsProcessingUrls] = useState(false)

  // Image Import State
  const [queuedImages, setQueuedImages] = useState<QueuedImage[]>([])
  const [imageProductInfo, setImageProductInfo] = useState({
    name: '',
    description: '',
    price: '',
    category: ''
  })
  const [isProcessingImages, setIsProcessingImages] = useState(false)

  // Common State
  const [priceMultiplier, setPriceMultiplier] = useState(1.5)
  const [activeTab, setActiveTab] = useState('url')
  
  // Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedProductForPreview, setSelectedProductForPreview] = useState<QueuedUrl | null>(null)
  const [isImportingFromModal, setIsImportingFromModal] = useState(false)

  // Auto-process if URL came from query params
  const [autoProcessed, setAutoProcessed] = useState(false)
  React.useEffect(() => {
    if (initialUrl && queuedUrls.length > 0 && !autoProcessed) {
      setAutoProcessed(true)
      setUrlInput('')
      // Auto-start analysis
      processUrlQueue()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // === URL Import Functions ===
  const addUrlsToQueue = () => {
    const urls = urlInput.split(/[\n,\s]+/).map(u => u.trim()).filter(u => u && (u.startsWith('http://') || u.startsWith('https://')))
    if (urls.length === 0) {
      toast.error('Aucune URL valide détectée')
      return
    }
    const newQueued: QueuedUrl[] = urls.map(url => ({
      id: crypto.randomUUID(),
      url,
      status: 'pending' as const
    }))
    setQueuedUrls(prev => [...prev, ...newQueued])
    setUrlInput('')
    toast.success(`${urls.length} URL${urls.length > 1 ? 's' : ''} ajoutée${urls.length > 1 ? 's' : ''} à la file`)
  }

  const processUrlQueue = async () => {
    if (queuedUrls.length === 0) return
    setIsProcessingUrls(true)
    for (const item of queuedUrls) {
      if (item.status !== 'pending') continue
      setQueuedUrls(prev => prev.map(q => q.id === item.id ? { ...q, status: 'loading' as const } : q))
      try {
        const { data, error } = await supabase.functions.invoke('quick-import-url', {
          body: {
            url: item.url,
            action: 'preview',
            price_multiplier: priceMultiplier
          }
        })
        if (error) throw error
        if (!data.success) throw new Error(data.error)
        setQueuedUrls(prev => prev.map(q => q.id === item.id ? { ...q, status: 'success' as const, preview: data.data } : q))
      } catch (err) {
        setQueuedUrls(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error' as const, error: err instanceof Error ? err.message : 'Erreur inconnue' } : q))
      }
    }
    setIsProcessingUrls(false)
    toast.success('Analyse terminée')
  }

  const openPreviewModal = (item: QueuedUrl) => {
    if (!item.preview) return
    setSelectedProductForPreview(item)
    setPreviewModalOpen(true)
  }

  const importFromUrlWithData = async (item: QueuedUrl, editedProduct?: any) => {
    if (!item.preview) return
    setIsImportingFromModal(true)
    setQueuedUrls(prev => prev.map(q => q.id === item.id ? { ...q, status: 'loading' as const } : q))
    try {
      const productData = editedProduct || item.preview
      const { data, error } = await supabase.functions.invoke('quick-import-url', {
        body: {
          url: item.url,
          action: 'import',
          price_multiplier: priceMultiplier,
          override_data: editedProduct ? {
            title: productData.title,
            description: productData.description,
            price: productData.price,
            suggested_price: productData.suggested_price,
            sku: productData.sku,
            brand: productData.brand,
            images: productData.images
          } : undefined
        }
      })
      if (error) throw error
      if (!data.success) throw new Error(data.error)
      setQueuedUrls(prev => prev.filter(q => q.id !== item.id))
      setPreviewModalOpen(false)
      setSelectedProductForPreview(null)
      toast.success(`"${productData.title?.slice(0, 50)}..." importé`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'import')
      setQueuedUrls(prev => prev.map(q => q.id === item.id ? { ...q, status: 'success' as const } : q))
    } finally {
      setIsImportingFromModal(false)
    }
  }

  const importFromUrl = async (item: QueuedUrl) => {
    await importFromUrlWithData(item)
  }

  const handleConfirmImportFromModal = async (editedProduct: any) => {
    if (!selectedProductForPreview) return
    await importFromUrlWithData(selectedProductForPreview, editedProduct)
  }

  const importAllUrls = async () => {
    const toImport = queuedUrls.filter(q => q.status === 'success' && q.preview)
    for (const item of toImport) {
      await importFromUrl(item)
    }
    // Show celebration animation instead of just toast
    showSuccessAnimation(toImport.length, toImport[0]?.preview?.title)
  }

  const removeFromUrlQueue = (id: string) => {
    setQueuedUrls(prev => prev.filter(q => q.id !== id))
  }

  // === Image Import Functions ===
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages: QueuedImage[] = acceptedFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending' as const
    }))
    setQueuedImages(prev => [...prev, ...newImages])
    toast.success(`${acceptedFiles.length} image${acceptedFiles.length > 1 ? 's' : ''} ajoutée${acceptedFiles.length > 1 ? 's' : ''}`)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
    multiple: true
  })

  const addImageFromUrl = () => {
    const urlInput = prompt('Entrez l\'URL de l\'image:')
    if (!urlInput) return
    const newImage: QueuedImage = {
      id: crypto.randomUUID(),
      url: urlInput,
      preview: urlInput,
      status: 'pending'
    }
    setQueuedImages(prev => [...prev, newImage])
    toast.success('Image ajoutée')
  }

  const removeFromImageQueue = (id: string) => {
    setQueuedImages(prev => {
      const item = prev.find(i => i.id === id)
      if (item?.file) {
        URL.revokeObjectURL(item.preview)
      }
      return prev.filter(i => i.id !== id)
    })
  }

  const importImages = async () => {
    if (queuedImages.length === 0) {
      toast.error('Aucune image à importer')
      return
    }
    setIsProcessingImages(true)
    try {
      const imageUrls: string[] = []
      for (const img of queuedImages) {
        if (img.url) {
          imageUrls.push(img.url)
        } else if (img.file) {
          const fileExt = img.file.name.split('.').pop()
          const fileName = `${user?.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`
          const { data: uploadData, error: uploadError } = await supabase.storage.from('product-images').upload(fileName, img.file)
          if (uploadError) {
            const dataUrl = await new Promise<string>(resolve => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.readAsDataURL(img.file!)
            })
            imageUrls.push(dataUrl)
          } else {
            const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName)
            imageUrls.push(publicUrl)
          }
        }
      }

      const { data, error } = await supabase.functions.invoke('image-product-import', {
        body: {
          imageUrls,
          productInfo: {
            name: imageProductInfo.name || undefined,
            description: imageProductInfo.description || undefined,
            price: imageProductInfo.price ? parseFloat(imageProductInfo.price) : undefined,
            category: imageProductInfo.category || undefined,
            stock_quantity: 999
          }
        }
      })
      if (error) throw error
      if (!data.success) throw new Error(data.error)
      
      // Show celebration animation
      showSuccessAnimation(data.imported, imageProductInfo.name)

      queuedImages.forEach(img => {
        if (img.file) URL.revokeObjectURL(img.preview)
      })
      setQueuedImages([])
      setImageProductInfo({ name: '', description: '', price: '', category: '' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'import')
    } finally {
      setIsProcessingImages(false)
    }
  }

  const successfulUrls = queuedUrls.filter(q => q.status === 'success')

  return (
    <ChannablePageLayout
      title="Import Rapide"
      metaTitle="Import Rapide - Style AutoDS - ShopOpti"
      metaDescription="Importez des produits depuis URLs ou images, comme AutoDS"
      maxWidth="2xl"
      padding="md"
      backTo="/import"
      backLabel="Retour à l'Import"
    >
      {/* Hero Section */}
      <ChannableHeroSection
        badge={{ icon: Zap, label: 'Import Rapide' }}
        title="Import en masse ultra-rapide"
        subtitle="Importez depuis URLs ou images, analysez et ajoutez à votre catalogue en quelques secondes"
        variant="compact"
        showHexagons={!reducedMotion}
        stats={[
          { label: 'En file', value: queuedUrls.length.toString(), icon: Package },
          { label: 'Prêts', value: successfulUrls.length.toString(), icon: CheckCircle2 },
          { label: 'Marge', value: `x${priceMultiplier.toFixed(1)}`, icon: TrendingUp },
        ]}
        primaryAction={{
          label: 'Historique',
          onClick: () => navigate('/import/history'),
          icon: History,
        }}
      />

      {/* Supported Platforms */}
      <div className="flex flex-wrap justify-center gap-2">
        {supportedPlatforms.map(platform => (
          <Badge 
            key={platform} 
            variant="secondary" 
            className={cn("text-xs flex items-center gap-1", getPlatformColor(platform))}
          >
            <PlatformLogo platform={platform} size="sm" />
            {getPlatformName(platform)}
          </Badge>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Import par URL
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Import par Image
          </TabsTrigger>
        </TabsList>

        {/* URL Import Tab */}
        <TabsContent value="url" className="space-y-6">
          {/* URL Input */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                Ajouter des URLs
              </CardTitle>
              <CardDescription>
                Collez une ou plusieurs URLs (une par ligne ou séparées par des virgules)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="https://www.aliexpress.com/item/123.html&#10;https://www.amazon.fr/dp/B08XYZ123&#10;https://www.temu.com/goods/123456.html" 
                value={urlInput} 
                onChange={e => setUrlInput(e.target.value)} 
                rows={4} 
                className="font-mono text-sm bg-background"
                aria-label="URLs des produits à importer"
              />
              
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Marge bénéficiaire</Label>
                    <span className="text-sm font-medium text-primary">
                      x{priceMultiplier.toFixed(1)} ({Math.round((priceMultiplier - 1) * 100)}%)
                    </span>
                  </div>
                  <Slider 
                    value={[priceMultiplier]} 
                    onValueChange={([value]) => setPriceMultiplier(value)} 
                    min={1.1} 
                    max={3} 
                    step={0.1}
                    aria-label="Multiplicateur de prix"
                  />
                </div>
                
                <Button onClick={addUrlsToQueue} disabled={!urlInput.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter à la file
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Profit Calculator */}
          {successfulUrls.length > 0 && successfulUrls[0].preview && (
            <ProfitCalculator
              purchasePrice={successfulUrls[0].preview.price}
              suggestedPrice={successfulUrls[0].preview.suggested_price}
              currency={successfulUrls[0].preview.currency || 'EUR'}
              onPriceChange={(price) => setPriceMultiplier(price / successfulUrls[0].preview!.price)}
            />
          )}

          {/* URL Queue */}
          {queuedUrls.length > 0 && (
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    File d'attente ({queuedUrls.length})
                  </CardTitle>
                  <CardDescription>
                    {successfulUrls.length} produit{successfulUrls.length > 1 ? 's' : ''} prêt{successfulUrls.length > 1 ? 's' : ''} à importer
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={processUrlQueue} 
                    disabled={isProcessingUrls || queuedUrls.every(q => q.status !== 'pending')} 
                    variant="outline"
                  >
                    {isProcessingUrls ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Analyser tout
                  </Button>
                  <Button 
                    onClick={importAllUrls} 
                    disabled={successfulUrls.length === 0} 
                    className="bg-gradient-to-r from-orange-500 to-red-600"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Importer tout ({successfulUrls.length})
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {queuedUrls.map(item => (
                      <motion.div 
                        key={item.id}
                        initial={reducedMotion ? {} : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex gap-4 p-4 rounded-xl border transition-colors",
                          item.status === 'success' && "bg-green-500/5 border-green-500/20",
                          item.status === 'error' && "bg-red-500/5 border-red-500/20",
                          item.status === 'loading' && "bg-blue-500/5 border-blue-500/20",
                          item.status === 'pending' && "bg-muted/30 border-border/50"
                        )}
                      >
                        {/* Preview Images */}
                        <div className="flex-shrink-0 flex gap-1">
                          {/* Main image */}
                          <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden relative">
                            {item.preview?.images?.[0] ? (
                              <>
                                <img src={item.preview.images[0]} alt="" className="w-full h-full object-cover" />
                                {(item.preview.images?.length || 0) > 1 && (
                                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                    +{(item.preview.images?.length || 0) - 1}
                                  </div>
                                )}
                              </>
                            ) : item.status === 'loading' ? (
                              <div className="w-full h-full flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          {/* Thumbnail strip for multiple images */}
                          {item.preview?.images && item.preview.images.length > 1 && (
                            <div className="hidden sm:flex flex-col gap-0.5 w-6">
                              {item.preview.images.slice(1, 4).map((img, idx) => (
                                <div key={idx} className="w-6 h-6 rounded bg-muted overflow-hidden">
                                  <img src={img} alt="" className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Details */}
                        <div className="flex-1 min-w-0 space-y-2">
                          {item.preview ? (
                            <>
                              <h4 className="font-medium line-clamp-2 text-sm leading-snug">{item.preview.title}</h4>
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <Badge className={getPlatformColor(item.preview.platform_detected)}>
                                  {getPlatformName(item.preview.platform_detected)}
                                </Badge>
                                <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-md">
                                  <span className="text-muted-foreground text-xs">Coût:</span>
                                  <span className="font-medium text-orange-600">
                                    {(item.preview.price ?? 0).toFixed(2)} {item.preview.currency}
                                  </span>
                                </div>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <div className="flex items-center gap-2 bg-green-500/10 px-2 py-1 rounded-md">
                                  <span className="text-green-700 text-xs">Vente:</span>
                                  <span className="font-bold text-green-600">
                                    {(item.preview.suggested_price ?? 0).toFixed(2)} €
                                  </span>
                                </div>
                                {item.preview.profit_margin > 0 && (
                                  <Badge variant="outline" className="text-green-600 border-green-500/30">
                                    +{item.preview.profit_margin}% marge
                                  </Badge>
                                )}
                              </div>
                              {/* Enhanced info row with icons */}
                              <div className="flex flex-wrap gap-2 text-xs">
                                {/* Images count with visual indicator */}
                                <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 border-blue-500/30 gap-1">
                                  <ImageIcon className="h-3 w-3" />
                                  {item.preview.images?.length || 0} image{(item.preview.images?.length || 0) > 1 ? 's' : ''}
                                </Badge>
                                
                                {/* Variants */}
                                {item.preview.variants && item.preview.variants.length > 0 && (
                                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border-amber-500/30 gap-1">
                                    <Package className="h-3 w-3" />
                                    {item.preview.variants.length} variante{item.preview.variants.length > 1 ? 's' : ''}
                                  </Badge>
                                )}
                                
                                {/* Videos */}
                                {item.preview.videos && item.preview.videos.length > 0 && (
                                  <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 border-purple-500/30 gap-1">
                                    🎬 {item.preview.videos.length} vidéo{item.preview.videos.length > 1 ? 's' : ''}
                                  </Badge>
                                )}
                                
                                {/* SKU */}
                                {item.preview.sku && !item.preview.sku.startsWith('IMPORT-') && (
                                  <span className="font-mono text-xs bg-gray-500/10 text-gray-600 px-1.5 py-0.5 rounded">
                                    {item.preview.sku}
                                  </span>
                                )}
                                
                                {/* Brand */}
                                {item.preview.brand && (
                                  <span className="text-primary font-medium">
                                    {item.preview.brand}
                                  </span>
                                )}
                              </div>
                            </>
                          ) : item.error ? (
                            <div className="flex items-center gap-2 text-red-500">
                              <AlertCircle className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm">{item.error}</span>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground truncate">{item.url}</p>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.status === 'success' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openPreviewModal(item)}
                                className="border-primary/30 hover:bg-primary/5"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Aperçu
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => importFromUrl(item)}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 shadow-md hover:shadow-lg transition-shadow"
                              >
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                Importer
                              </Button>
                            </>
                          )}
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => removeFromUrlQueue(item.id)}
                            aria-label="Supprimer de la file"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Image Import Tab */}
        <TabsContent value="image" className="space-y-6">
          {/* Dropzone */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Importer par images
              </CardTitle>
              <CardDescription>
                Glissez-déposez des images ou ajoutez-les via URL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  isDragActive 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                )}
              >
                <input {...getInputProps()} aria-label="Zone de dépôt d'images" />
                <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                {isDragActive ? (
                  <p className="font-medium text-primary">Déposez les images ici...</p>
                ) : (
                  <>
                    <p className="font-medium mb-2">Glissez-déposez vos images ici</p>
                    <p className="text-sm text-muted-foreground">ou cliquez pour sélectionner</p>
                  </>
                )}
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={addImageFromUrl}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Ajouter via URL
                </Button>
                {queuedImages.length > 0 && (
                  <Button 
                    onClick={importImages}
                    disabled={isProcessingImages}
                    className="bg-gradient-to-r from-primary to-purple-600"
                  >
                    {isProcessingImages ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Créer {queuedImages.length} produit{queuedImages.length > 1 ? 's' : ''}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Image Queue */}
          {queuedImages.length > 0 && (
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Images en attente ({queuedImages.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {queuedImages.map(img => (
                    <div key={img.id} className="relative group">
                      <img 
                        src={img.preview} 
                        alt="Aperçu" 
                        className="w-full aspect-square object-cover rounded-lg border"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={() => removeFromImageQueue(img.id)}
                        aria-label="Supprimer l'image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {/* Product Info */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="product-name">Nom du produit (optionnel)</Label>
                    <Input
                      id="product-name"
                      value={imageProductInfo.name}
                      onChange={e => setImageProductInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Laissez vide pour génération IA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-price">Prix (optionnel)</Label>
                    <Input
                      id="product-price"
                      type="number"
                      value={imageProductInfo.price}
                      onChange={e => setImageProductInfo(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="29.99"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="product-description">Description (optionnel)</Label>
                    <Textarea
                      id="product-description"
                      value={imageProductInfo.description}
                      onChange={e => setImageProductInfo(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Laissez vide pour génération IA"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal d'aperçu et modification */}
      <ProductPreviewEditModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        product={selectedProductForPreview?.preview || null}
        onConfirmImport={handleConfirmImportFromModal}
        isImporting={isImportingFromModal}
      />

      {/* Success Animation */}
      <ImportSuccessAnimation
        isVisible={showSuccessAnim}
        productCount={successProductCount}
        productName={successProductName}
        onViewProducts={handleViewProducts}
        onContinue={handleContinueImport}
        onClose={hideSuccessAnimation}
      />
    </ChannablePageLayout>
  )
}
