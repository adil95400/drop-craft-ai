import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Link2, Search, Package, ImageIcon, Loader2, CheckCircle2, AlertCircle, 
  Sparkles, ShoppingCart, Plus, Trash2, X, Zap, Globe, Camera,
  TrendingUp, History, Eye, Upload, ArrowRight
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { PlatformLogo } from '@/components/ui/platform-logo'
import { getPlatformColor, getPlatformName } from '@/utils/platformLogos'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { 
  ChannablePageLayout, 
  ChannableHeroSection, 
  ChannableCard, 
  ChannableStatsGrid 
} from '@/components/channable'
import { ProfitCalculator } from '@/components/import/ProfitCalculator'
import { ImportSuccessAnimation } from '@/components/ui/import-success-animation'
import { useImportSuccessAnimation } from '@/hooks/useImportSuccessAnimation'

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
  const location = useLocation()
  const reducedMotion = useReducedMotion()

  const {
    isVisible: showSuccessAnim,
    productCount: successProductCount,
    productName: successProductName,
    showSuccessAnimation,
    hideSuccessAnimation,
    handleViewProducts,
    handleContinueImport,
  } = useImportSuccessAnimation()

  const searchParams = new URLSearchParams(window.location.search)
  const initialUrl = searchParams.get('url') || ''

  const [urlInput, setUrlInput] = useState(initialUrl)
  const [queuedUrls, setQueuedUrls] = useState<QueuedUrl[]>(() => {
    if (initialUrl) {
      return [{ id: crypto.randomUUID(), url: initialUrl, status: 'pending' as const }]
    }
    return []
  })
  const [isProcessingUrls, setIsProcessingUrls] = useState(false)

  const [queuedImages, setQueuedImages] = useState<QueuedImage[]>([])
  const [imageProductInfo, setImageProductInfo] = useState({
    name: '', description: '', price: '', category: ''
  })
  const [isProcessingImages, setIsProcessingImages] = useState(false)

  const [priceMultiplier, setPriceMultiplier] = useState(1.5)
  const [activeTab, setActiveTab] = useState('url')
  const [isImportingFromModal, setIsImportingFromModal] = useState(false)

  const locationState = (location as any).state as { confirmedProduct?: any; queuedItemId?: string } | undefined
  React.useEffect(() => {
    if (locationState?.confirmedProduct && locationState?.queuedItemId) {
      const item = queuedUrls.find(q => q.id === locationState.queuedItemId)
      if (item) {
        importFromUrlWithData(item, locationState.confirmedProduct)
      }
      window.history.replaceState({}, '')
    }
  }, [locationState?.confirmedProduct]) // eslint-disable-line react-hooks/exhaustive-deps

  const [autoProcessed, setAutoProcessed] = useState(false)
  React.useEffect(() => {
    if (initialUrl && queuedUrls.length > 0 && !autoProcessed) {
      setAutoProcessed(true)
      setUrlInput('')
      processUrlQueue()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // === URL Import Functions ===
  const addUrlsToQueue = () => {
    const urls = urlInput.split(/[\n,\s]+/).map(u => u.trim()).filter(u => u && (u.startsWith('http://') || u.startsWith('https://')))
    if (urls.length === 0) { toast.error('Aucune URL valide détectée'); return }
    const newQueued: QueuedUrl[] = urls.map(url => ({ id: crypto.randomUUID(), url, status: 'pending' as const }))
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
          body: { url: item.url, action: 'preview', price_multiplier: priceMultiplier }
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
    navigate('/import/preview', { state: { product: item.preview, returnTo: `/import/autods`, queuedItemId: item.id } })
  }

  const importFromUrlWithData = async (item: QueuedUrl, editedProduct?: any) => {
    if (!item.preview) return
    setIsImportingFromModal(true)
    setQueuedUrls(prev => prev.map(q => q.id === item.id ? { ...q, status: 'loading' as const } : q))
    try {
      const productData = editedProduct || item.preview
      const { data, error } = await supabase.functions.invoke('quick-import-url', {
        body: {
          url: item.url, action: 'import', price_multiplier: priceMultiplier,
          override_data: editedProduct ? {
            title: productData.title, description: productData.description,
            price: productData.price, suggested_price: productData.suggested_price,
            sku: productData.sku, brand: productData.brand, images: productData.images
          } : undefined
        }
      })
      if (error) throw error
      if (!data.success) throw new Error(data.error)
      setQueuedUrls(prev => prev.filter(q => q.id !== item.id))
      toast.success(`"${productData.title?.slice(0, 50)}..." importé`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'import')
      setQueuedUrls(prev => prev.map(q => q.id === item.id ? { ...q, status: 'success' as const } : q))
    } finally { setIsImportingFromModal(false) }
  }

  const importFromUrl = async (item: QueuedUrl) => { await importFromUrlWithData(item) }

  const importAllUrls = async () => {
    const toImport = queuedUrls.filter(q => q.status === 'success' && q.preview)
    for (const item of toImport) { await importFromUrl(item) }
    showSuccessAnimation(toImport.length, toImport[0]?.preview?.title)
  }

  const removeFromUrlQueue = (id: string) => { setQueuedUrls(prev => prev.filter(q => q.id !== id)) }

  // === Image Import Functions ===
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages: QueuedImage[] = acceptedFiles.map(file => ({
      id: crypto.randomUUID(), file, preview: URL.createObjectURL(file), status: 'pending' as const
    }))
    setQueuedImages(prev => [...prev, ...newImages])
    toast.success(`${acceptedFiles.length} image${acceptedFiles.length > 1 ? 's' : ''} ajoutée${acceptedFiles.length > 1 ? 's' : ''}`)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] }, multiple: true
  })

  const addImageFromUrl = () => {
    const urlVal = prompt('Entrez l\'URL de l\'image:')
    if (!urlVal) return
    setQueuedImages(prev => [...prev, { id: crypto.randomUUID(), url: urlVal, preview: urlVal, status: 'pending' }])
    toast.success('Image ajoutée')
  }

  const removeFromImageQueue = (id: string) => {
    setQueuedImages(prev => {
      const item = prev.find(i => i.id === id)
      if (item?.file) URL.revokeObjectURL(item.preview)
      return prev.filter(i => i.id !== id)
    })
  }

  const importImages = async () => {
    if (queuedImages.length === 0) { toast.error('Aucune image à importer'); return }
    setIsProcessingImages(true)
    try {
      const imageUrls: string[] = []
      for (const img of queuedImages) {
        if (img.url) { imageUrls.push(img.url) }
        else if (img.file) {
          const fileExt = img.file.name.split('.').pop()
          const fileName = `${user?.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`
          const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, img.file)
          if (uploadError) {
            const dataUrl = await new Promise<string>(resolve => {
              const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.readAsDataURL(img.file!)
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
            name: imageProductInfo.name || undefined, description: imageProductInfo.description || undefined,
            price: imageProductInfo.price ? parseFloat(imageProductInfo.price) : undefined,
            category: imageProductInfo.category || undefined, stock_quantity: 999
          }
        }
      })
      if (error) throw error
      if (!data.success) throw new Error(data.error)
      showSuccessAnimation(data.imported, imageProductInfo.name)
      queuedImages.forEach(img => { if (img.file) URL.revokeObjectURL(img.preview) })
      setQueuedImages([])
      setImageProductInfo({ name: '', description: '', price: '', category: '' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'import')
    } finally { setIsProcessingImages(false) }
  }

  const successfulUrls = queuedUrls.filter(q => q.status === 'success')
  const pendingUrls = queuedUrls.filter(q => q.status === 'pending')
  const errorUrls = queuedUrls.filter(q => q.status === 'error')

  return (
    <ChannablePageLayout
      title="Import Rapide"
      metaTitle="Import Rapide - AutoDS Style"
      metaDescription="Importez des produits depuis URLs ou images"
      maxWidth="2xl"
      padding="md"
      backTo="/import"
      backLabel="Retour à l'Import"
    >
      {/* Hero */}
      <ChannableHeroSection
        badge={{ icon: Zap, label: 'Import Rapide' }}
        title="Import en masse ultra-rapide"
        description="Importez depuis URLs ou images, analysez et ajoutez à votre catalogue en quelques secondes"
        variant="compact"
        showHexagons={!reducedMotion}
        primaryAction={{
          label: 'Historique des imports',
          onClick: () => navigate('/import/history'),
          icon: History,
        }}
      />

      {/* Stats Grid */}
      <ChannableStatsGrid
        columns={4}
        compact
        stats={[
          { label: 'En file', value: queuedUrls.length, icon: Package, color: 'info' },
          { label: 'Prêts', value: successfulUrls.length, icon: CheckCircle2, color: 'success' },
          { label: 'Erreurs', value: errorUrls.length, icon: AlertCircle, color: 'destructive' },
          { label: 'Marge', value: `x${priceMultiplier.toFixed(1)}`, icon: TrendingUp, color: 'primary' },
        ]}
      />

      {/* Plateformes supportées */}
      <ChannableCard
        title="Plateformes supportées"
        icon={Globe}
        description="Collez un lien depuis n'importe laquelle de ces plateformes"
      >
        <div className="flex flex-wrap gap-2 mt-2">
          {supportedPlatforms.map(platform => (
            <Badge 
              key={platform} 
              variant="secondary" 
              className={cn("text-xs flex items-center gap-1.5 px-2.5 py-1", getPlatformColor(platform))}
            >
              <PlatformLogo platform={platform} size="sm" />
              {getPlatformName(platform)}
            </Badge>
          ))}
        </div>
      </ChannableCard>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-muted/50 border border-border/50">
          <TabsTrigger value="url" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Globe className="h-4 w-4" />
            Import par URL
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Camera className="h-4 w-4" />
            Import par Image
          </TabsTrigger>
        </TabsList>

        {/* === URL TAB === */}
        <TabsContent value="url" className="space-y-6">
          <ChannableCard
            title="Ajouter des URLs"
            icon={Link2}
            description="Collez une ou plusieurs URLs (une par ligne ou séparées par des virgules)"
          >
            <div className="space-y-4 mt-2">
              <Textarea 
                placeholder={"https://www.aliexpress.com/item/123.html\nhttps://www.amazon.fr/dp/B08XYZ123\nhttps://www.temu.com/goods/123456.html"}
                value={urlInput} 
                onChange={e => setUrlInput(e.target.value)} 
                rows={4} 
                className="font-mono text-sm bg-background/50 border-border/50"
                aria-label="URLs des produits à importer"
              />
              
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Marge bénéficiaire</Label>
                    <Badge variant="outline" className="text-primary border-primary/30 font-mono">
                      x{priceMultiplier.toFixed(1)} ({Math.round((priceMultiplier - 1) * 100)}%)
                    </Badge>
                  </div>
                  <Slider 
                    value={[priceMultiplier]} 
                    onValueChange={([value]) => setPriceMultiplier(value)} 
                    min={1.1} max={3} step={0.1}
                    aria-label="Multiplicateur de prix"
                  />
                </div>
                
                <Button onClick={addUrlsToQueue} disabled={!urlInput.trim()} className="shadow-md">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter à la file
                </Button>
              </div>
            </div>
          </ChannableCard>

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
            <ChannableCard
              title={`File d'attente (${queuedUrls.length})`}
              icon={Package}
              description={`${successfulUrls.length} produit${successfulUrls.length > 1 ? 's' : ''} prêt${successfulUrls.length > 1 ? 's' : ''} à importer`}
              actions={[
                {
                  label: isProcessingUrls ? 'Analyse...' : 'Analyser tout',
                  onClick: processUrlQueue,
                  variant: 'outline',
                  icon: isProcessingUrls ? Loader2 : Search,
                },
                {
                  label: `Importer tout (${successfulUrls.length})`,
                  onClick: importAllUrls,
                  variant: 'default',
                  icon: ShoppingCart,
                }
              ]}
            >
              <ScrollArea className="h-[420px] mt-2">
                <div className="space-y-3">
                  {queuedUrls.map((item, index) => (
                    <motion.div 
                      key={item.id}
                      initial={reducedMotion ? {} : { opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={cn(
                        "flex gap-4 p-4 rounded-xl border transition-all duration-200",
                        item.status === 'success' && "bg-green-500/5 border-green-500/20 hover:border-green-500/40",
                        item.status === 'error' && "bg-destructive/5 border-destructive/20",
                        item.status === 'loading' && "bg-primary/5 border-primary/20",
                        item.status === 'pending' && "bg-muted/30 border-border/50 hover:border-border"
                      )}
                    >
                      {/* Preview Images */}
                      <div className="flex-shrink-0 flex gap-1">
                        <div className="w-20 h-20 rounded-lg bg-muted/50 overflow-hidden relative border border-border/30">
                          {item.preview?.images?.[0] ? (
                            <>
                              <img src={item.preview.images[0]} alt="" className="w-full h-full object-cover" />
                              {(item.preview.images?.length || 0) > 1 && (
                                <div className="absolute bottom-1 right-1 bg-background/80 backdrop-blur-sm text-foreground text-[10px] px-1.5 py-0.5 rounded-md font-medium border border-border/50">
                                  +{(item.preview.images?.length || 0) - 1}
                                </div>
                              )}
                            </>
                          ) : item.status === 'loading' ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        {item.preview?.images && item.preview.images.length > 1 && (
                          <div className="hidden sm:flex flex-col gap-0.5 w-6">
                            {item.preview.images.slice(1, 4).map((img, idx) => (
                              <div key={idx} className="w-6 h-6 rounded bg-muted/50 overflow-hidden border border-border/20">
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
                            <h4 className="font-semibold line-clamp-2 text-sm leading-snug">{item.preview.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <Badge variant="secondary" className={cn("text-xs", getPlatformColor(item.preview.platform_detected))}>
                                <PlatformLogo platform={item.preview.platform_detected} size="sm" />
                                <span className="ml-1">{getPlatformName(item.preview.platform_detected)}</span>
                              </Badge>
                              <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-md border border-border/30">
                                <span className="text-muted-foreground text-xs">Coût</span>
                                <span className="font-semibold text-sm">{(item.preview.price ?? 0).toFixed(2)} {item.preview.currency}</span>
                              </div>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
                                <span className="text-green-700 dark:text-green-400 text-xs">Vente</span>
                                <span className="font-bold text-sm text-green-600 dark:text-green-400">{(item.preview.suggested_price ?? 0).toFixed(2)} €</span>
                              </div>
                              {item.preview.profit_margin > 0 && (
                                <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-500/30 text-xs">
                                  +{item.preview.profit_margin}%
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 text-xs">
                              <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/20 gap-1">
                                <ImageIcon className="h-3 w-3" />
                                {item.preview.images?.length || 0}
                              </Badge>
                              {item.preview.variants && item.preview.variants.length > 0 && (
                                <Badge variant="secondary" className="bg-accent text-accent-foreground gap-1">
                                  <Package className="h-3 w-3" />
                                  {item.preview.variants.length}
                                </Badge>
                              )}
                              {item.preview.brand && (
                                <Badge variant="outline" className="text-xs">{item.preview.brand}</Badge>
                              )}
                            </div>
                          </>
                        ) : item.error ? (
                          <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">{item.error}</span>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground truncate font-mono">{item.url}</p>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {item.status === 'success' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => openPreviewModal(item)} className="h-8">
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Aperçu
                            </Button>
                            <Button size="sm" onClick={() => importFromUrl(item)} className="h-8 bg-primary hover:bg-primary/90 shadow-sm">
                              <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                              Importer
                            </Button>
                          </>
                        )}
                        <Button 
                          size="icon" variant="ghost" onClick={() => removeFromUrlQueue(item.id)}
                          aria-label="Supprimer" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </ChannableCard>
          )}
        </TabsContent>

        {/* === IMAGE TAB === */}
        <TabsContent value="image" className="space-y-6">
          <ChannableCard
            title="Importer par images"
            icon={Camera}
            description="Glissez-déposez des images ou ajoutez-les via URL"
          >
            <div className="space-y-4 mt-2">
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  isDragActive 
                    ? "border-primary bg-primary/5" 
                    : "border-border/50 hover:border-primary/50 hover:bg-muted/20"
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
                    <p className="font-medium mb-1">Glissez-déposez vos images ici</p>
                    <p className="text-sm text-muted-foreground">PNG, JPG, WEBP acceptés</p>
                  </>
                )}
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={addImageFromUrl} className="border-border/50">
                  <Link2 className="h-4 w-4 mr-2" />
                  Ajouter via URL
                </Button>
                {queuedImages.length > 0 && (
                  <Button onClick={importImages} disabled={isProcessingImages} className="shadow-md">
                    {isProcessingImages ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Créer {queuedImages.length} produit{queuedImages.length > 1 ? 's' : ''}
                  </Button>
                )}
              </div>
            </div>
          </ChannableCard>

          {/* Image Queue */}
          {queuedImages.length > 0 && (
            <ChannableCard
              title={`Images en attente (${queuedImages.length})`}
              icon={ImageIcon}
            >
              <div className="space-y-6 mt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {queuedImages.map(img => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden border border-border/30">
                      <img src={img.preview} alt="Aperçu" className="w-full aspect-square object-cover" />
                      <Button
                        size="icon" variant="destructive"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                        onClick={() => removeFromImageQueue(img.id)}
                        aria-label="Supprimer l'image"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/20 border border-border/30">
                  <div className="space-y-1.5">
                    <Label htmlFor="product-name" className="text-xs font-medium text-muted-foreground">Nom du produit (optionnel)</Label>
                    <Input id="product-name" value={imageProductInfo.name}
                      onChange={e => setImageProductInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Laissez vide pour génération IA" className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="product-price" className="text-xs font-medium text-muted-foreground">Prix (optionnel)</Label>
                    <Input id="product-price" type="number" value={imageProductInfo.price}
                      onChange={e => setImageProductInfo(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="29.99" className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="product-description" className="text-xs font-medium text-muted-foreground">Description (optionnel)</Label>
                    <Textarea id="product-description" value={imageProductInfo.description}
                      onChange={e => setImageProductInfo(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Laissez vide pour génération IA" rows={3} className="bg-background/50"
                    />
                  </div>
                </div>
              </div>
            </ChannableCard>
          )}
        </TabsContent>
      </Tabs>

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
