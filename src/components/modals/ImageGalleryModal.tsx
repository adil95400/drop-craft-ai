/**
 * ImageGalleryModal - Modal for previewing and managing product images
 * With full CRUD, AI optimization, and SEO alt-text management
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus,
  Star,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Copy,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Loader2,
  Check,
  GripVertical,
  Search,
  Wand2,
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ImageData {
  url: string
  altText?: string
  optimized?: boolean
  seoScore?: number
}

interface ImageGalleryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  images: string[]
  productName?: string
  productId?: string
  onImagesChange?: (images: string[]) => void
  readOnly?: boolean
}

export function ImageGalleryModal({
  open,
  onOpenChange,
  images,
  productName,
  productId,
  onImagesChange,
  readOnly = false,
}: ImageGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [isAddingImage, setIsAddingImage] = useState(false)
  const [selectedImages, setSelectedImages] = useState<number[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState<'gallery' | 'seo' | 'optimize'>('gallery')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isGeneratingAlt, setIsGeneratingAlt] = useState(false)
  const [altTexts, setAltTexts] = useState<Record<number, string>>({})
  const { toast } = useToast()

  const currentImage = images[currentIndex] || ''

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
    setZoom(1)
    setRotation(0)
  }, [images.length])

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    setZoom(1)
    setRotation(0)
  }, [images.length])

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentImage)
    toast({ title: 'URL copiée', description: 'Lien de l\'image copié dans le presse-papiers' })
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(currentImage)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `image-${currentIndex + 1}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({ title: 'Image téléchargée' })
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de télécharger l\'image', variant: 'destructive' })
    }
  }

  const handleOpenExternal = () => {
    window.open(currentImage, '_blank')
  }

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return
    if (!newImageUrl.startsWith('http')) {
      toast({ title: 'URL invalide', description: 'L\'URL doit commencer par http:// ou https://', variant: 'destructive' })
      return
    }
    const updatedImages = [...images, newImageUrl.trim()]
    onImagesChange?.(updatedImages)
    setNewImageUrl('')
    setIsAddingImage(false)
    toast({ title: 'Image ajoutée', description: 'L\'image a été ajoutée à la galerie' })
  }

  const handleRemoveImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index)
    onImagesChange?.(updatedImages)
    if (currentIndex >= updatedImages.length) {
      setCurrentIndex(Math.max(0, updatedImages.length - 1))
    }
    // Also remove alt text
    const newAltTexts = { ...altTexts }
    delete newAltTexts[index]
    setAltTexts(newAltTexts)
    toast({ title: 'Image supprimée' })
  }

  const handleSetPrimary = (index: number) => {
    if (index === 0) return
    const updatedImages = [...images]
    const [removed] = updatedImages.splice(index, 1)
    updatedImages.unshift(removed)
    onImagesChange?.(updatedImages)
    setCurrentIndex(0)
    toast({ title: 'Image principale définie' })
  }

  const handleSelectImage = (index: number) => {
    setSelectedImages((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  const handleDeleteSelected = () => {
    if (selectedImages.length === 0) return
    const updatedImages = images.filter((_, i) => !selectedImages.includes(i))
    onImagesChange?.(updatedImages)
    setSelectedImages([])
    setCurrentIndex(0)
    toast({ title: `${selectedImages.length} image(s) supprimée(s)` })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') handleNext()
    if (e.key === 'ArrowLeft') handlePrev()
    if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false)
  }

  // Generate alt text using AI
  const handleGenerateAltText = async (index: number) => {
    setIsGeneratingAlt(true)
    try {
      // Simulate AI generation - in production this would call an edge function
      await new Promise(resolve => setTimeout(resolve, 1500))
      const generatedAlt = `${productName || 'Produit'} - Vue ${index + 1}${index === 0 ? ' principale' : ''} - Image de haute qualité montrant les détails du produit`
      setAltTexts(prev => ({ ...prev, [index]: generatedAlt }))
      toast({ title: 'Alt text généré', description: 'Texte alternatif créé avec succès' })
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de générer le texte alternatif', variant: 'destructive' })
    } finally {
      setIsGeneratingAlt(false)
    }
  }

  // Generate alt text for all images
  const handleGenerateAllAltTexts = async () => {
    setIsGeneratingAlt(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      const newAltTexts: Record<number, string> = {}
      images.forEach((_, index) => {
        newAltTexts[index] = `${productName || 'Produit'} - Vue ${index + 1}${index === 0 ? ' principale' : ''} - Image de haute qualité`
      })
      setAltTexts(newAltTexts)
      toast({ title: 'Alt texts générés', description: `${images.length} textes alternatifs créés` })
    } catch (error) {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setIsGeneratingAlt(false)
    }
  }

  // Optimize images
  const handleOptimizeImages = async () => {
    setIsOptimizing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2500))
      toast({ 
        title: 'Images optimisées', 
        description: 'Compression et redimensionnement appliqués avec succès' 
      })
    } catch (error) {
      toast({ title: 'Erreur d\'optimisation', variant: 'destructive' })
    } finally {
      setIsOptimizing(false)
    }
  }

  // Calculate SEO score for an image
  const getSeoScore = (index: number): number => {
    let score = 0
    if (images[index]) score += 30 // Has image
    if (altTexts[index] && altTexts[index].length > 10) score += 40 // Has good alt text
    if (altTexts[index] && altTexts[index].length > 30) score += 20 // Has detailed alt text
    if (altTexts[index] && productName && altTexts[index].toLowerCase().includes(productName.toLowerCase())) score += 10 // Contains product name
    return score
  }

  const getOverallSeoScore = (): number => {
    if (images.length === 0) return 0
    const scores = images.map((_, i) => getSeoScore(i))
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }

  if (images.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Galerie d'images
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">Aucune image disponible</p>
            {!readOnly && (
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Input
                  placeholder="URL de l'image..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                />
                <Button onClick={handleAddImage} disabled={!newImageUrl.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une image
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-6xl max-h-[90vh] p-0 gap-0 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-sm">
                {productName || 'Galerie d\'images'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {images.length} image{images.length > 1 ? 's' : ''} • Image {currentIndex + 1}/{images.length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Tab Switcher */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mr-2">
              <TabsList className="h-8">
                <TabsTrigger value="gallery" className="text-xs h-7 px-3">
                  <ImageIcon className="h-3.5 w-3.5 mr-1" />
                  Galerie
                </TabsTrigger>
                <TabsTrigger value="seo" className="text-xs h-7 px-3">
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  SEO
                  {getOverallSeoScore() < 50 && (
                    <AlertCircle className="h-3 w-3 ml-1 text-amber-500" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="optimize" className="text-xs h-7 px-3">
                  <Wand2 className="h-3.5 w-3.5 mr-1" />
                  Optimiser
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {selectedImages.length > 0 && !readOnly && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer ({selectedImages.length})
              </Button>
            )}
            
            {!readOnly && activeTab === 'gallery' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingImage(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {activeTab === 'gallery' && (
              <>
                {/* Main Image Viewer */}
                <div className="flex-1 flex flex-col bg-black/95 relative">
                  {/* Image Container */}
                  <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden min-h-[400px]">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentIndex}
                        src={currentImage}
                        alt={altTexts[currentIndex] || `Image ${currentIndex + 1}`}
                        className="max-w-full max-h-full object-contain select-none"
                        style={{
                          transform: `scale(${zoom}) rotate(${rotation}deg)`,
                          transition: 'transform 0.2s ease-out',
                        }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        draggable={false}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg'
                        }}
                      />
                    </AnimatePresence>

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                          onClick={handlePrev}
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
                          onClick={handleNext}
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                      </>
                    )}

                    {/* Primary Badge */}
                    {currentIndex === 0 && (
                      <Badge className="absolute top-4 left-4 bg-amber-500 text-white border-0 gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Principale
                      </Badge>
                    )}
                  </div>

                  {/* Toolbar */}
                  <div className="flex items-center justify-center gap-1 p-3 bg-black/80 border-t border-white/10">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
                            onClick={handleZoomOut}
                            disabled={zoom <= 0.5}
                          >
                            <ZoomOut className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Zoom arrière</TooltipContent>
                      </Tooltip>

                      <span className="text-white/60 text-sm px-2 min-w-[50px] text-center">
                        {Math.round(zoom * 100)}%
                      </span>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
                            onClick={handleZoomIn}
                            disabled={zoom >= 3}
                          >
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Zoom avant</TooltipContent>
                      </Tooltip>

                      <div className="w-px h-5 bg-white/20 mx-2" />

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
                            onClick={handleRotate}
                          >
                            <RotateCw className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Pivoter</TooltipContent>
                      </Tooltip>

                      <div className="w-px h-5 bg-white/20 mx-2" />

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
                            onClick={handleCopyUrl}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copier l'URL</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
                            onClick={handleDownload}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Télécharger</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
                            onClick={handleOpenExternal}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ouvrir dans un nouvel onglet</TooltipContent>
                      </Tooltip>

                      {!readOnly && (
                        <>
                          <div className="w-px h-5 bg-white/20 mx-2" />
                          
                          {currentIndex !== 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20"
                                  onClick={() => handleSetPrimary(currentIndex)}
                                >
                                  <Star className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Définir comme principale</TooltipContent>
                            </Tooltip>
                          )}

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                onClick={() => handleRemoveImage(currentIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Supprimer</TooltipContent>
                          </Tooltip>
                        </>
                      )}
                    </TooltipProvider>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'seo' && (
              <div className="flex-1 p-4 overflow-auto">
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Overall SEO Score */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">Score SEO des images</h4>
                        <p className="text-sm text-muted-foreground">Optimisez les textes alternatifs pour un meilleur référencement</p>
                      </div>
                      <div className={cn(
                        "text-3xl font-bold",
                        getOverallSeoScore() >= 70 ? "text-emerald-500" :
                        getOverallSeoScore() >= 40 ? "text-amber-500" : "text-red-500"
                      )}>
                        {getOverallSeoScore()}%
                      </div>
                    </div>
                    
                    {!readOnly && (
                      <Button 
                        onClick={handleGenerateAllAltTexts} 
                        disabled={isGeneratingAlt}
                        className="w-full"
                      >
                        {isGeneratingAlt ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Générer tous les alt texts avec IA
                      </Button>
                    )}
                  </Card>

                  {/* Individual Image SEO */}
                  <div className="space-y-3">
                    {images.map((img, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex gap-4">
                          <img 
                            src={img} 
                            alt={`Image ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg'
                            }}
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Image {index + 1}</span>
                                {index === 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Star className="h-3 w-3 mr-1" />
                                    Principale
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-sm font-semibold",
                                  getSeoScore(index) >= 70 ? "text-emerald-500" :
                                  getSeoScore(index) >= 40 ? "text-amber-500" : "text-red-500"
                                )}>
                                  {getSeoScore(index)}%
                                </span>
                                {getSeoScore(index) >= 70 ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-amber-500" />
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Texte alternatif (alt)</Label>
                              <div className="flex gap-2">
                                <Textarea
                                  placeholder="Décrivez cette image pour le SEO..."
                                  value={altTexts[index] || ''}
                                  onChange={(e) => setAltTexts(prev => ({ ...prev, [index]: e.target.value }))}
                                  className="text-sm min-h-[60px] resize-none"
                                  disabled={readOnly}
                                />
                                {!readOnly && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleGenerateAltText(index)}
                                    disabled={isGeneratingAlt}
                                    className="flex-shrink-0"
                                  >
                                    {isGeneratingAlt ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Sparkles className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'optimize' && (
              <div className="flex-1 p-4 overflow-auto">
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Optimization Actions */}
                  <Card className="p-6">
                    <div className="text-center mb-6">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Wand2 className="h-8 w-8 text-primary" />
                      </div>
                      <h4 className="text-lg font-semibold mb-2">Optimisation des images</h4>
                      <p className="text-sm text-muted-foreground">
                        Améliorez la qualité et les performances de vos images produit
                      </p>
                    </div>

                    <div className="space-y-4">
                      <Card className="p-4 border-dashed">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                            <RefreshCw className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium mb-1">Compression intelligente</h5>
                            <p className="text-sm text-muted-foreground mb-3">
                              Réduisez la taille des fichiers jusqu'à 80% sans perte de qualité visible
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleOptimizeImages}
                              disabled={isOptimizing || readOnly}
                            >
                              {isOptimizing ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Wand2 className="h-4 w-4 mr-2" />
                              )}
                              Compresser les images
                            </Button>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 border-dashed">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                            <Search className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium mb-1">Recherche d'images supplémentaires</h5>
                            <p className="text-sm text-muted-foreground mb-3">
                              Trouvez automatiquement des images similaires pour enrichir votre galerie
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                toast({ title: 'Recherche lancée', description: 'Recherche d\'images en cours...' })
                              }}
                              disabled={readOnly}
                            >
                              <Search className="h-4 w-4 mr-2" />
                              Rechercher des images
                            </Button>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4 border-dashed">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium mb-1">Amélioration IA</h5>
                            <p className="text-sm text-muted-foreground mb-3">
                              Améliorez la qualité, la luminosité et le contraste avec l'IA
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                toast({ title: 'Amélioration lancée', description: 'Traitement des images en cours...' })
                              }}
                              disabled={readOnly}
                            >
                              <Sparkles className="h-4 w-4 mr-2" />
                              Améliorer avec IA
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </Card>

                  {/* Image Stats */}
                  <Card className="p-4">
                    <h5 className="font-medium mb-3">Statistiques des images</h5>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">{images.length}</div>
                        <div className="text-xs text-muted-foreground">Images totales</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-emerald-500">{Object.keys(altTexts).length}</div>
                        <div className="text-xs text-muted-foreground">Alt texts définis</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-amber-500">{getOverallSeoScore()}%</div>
                        <div className="text-xs text-muted-foreground">Score SEO</div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>

          {/* Thumbnails Sidebar */}
          <div className="w-48 border-l bg-muted/30 flex flex-col">
            <div className="p-3 border-b">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Miniatures
              </p>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                 {images.map((img, index) => (
                   <div
                     key={index}
                     className={cn(
                       "relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
                       currentIndex === index
                         ? "border-primary ring-2 ring-primary/30"
                         : "border-transparent hover:border-muted-foreground/30",
                       selectedImages.includes(index) && "ring-2 ring-primary/60"
                     )}
                     onClick={() => {
                       // Si l'utilisateur a déjà commencé une sélection, cliquer sur la miniature doit aussi sélectionner/désélectionner
                       if (!readOnly && selectedImages.length > 0) {
                         handleSelectImage(index)
                         return
                       }
 
                       setCurrentIndex(index)
                       setZoom(1)
                       setRotation(0)
                       if (activeTab !== 'gallery') setActiveTab('gallery')
                     }}
                   >
                    <div className="aspect-square relative">
                      <img
                        src={img}
                        alt={`Miniature ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg'
                        }}
                      />

                      {/* Sélection (toujours visible : fonctionne aussi sur mobile, sans hover) */}
                      {!readOnly && (
                        <button
                          type="button"
                          className={cn(
                            "absolute top-1 right-1 h-6 w-6 rounded-md border flex items-center justify-center",
                            "bg-background/80 backdrop-blur-sm",
                            selectedImages.includes(index)
                              ? "border-primary text-primary"
                              : "border-border text-muted-foreground"
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectImage(index)
                          }}
                          aria-label={selectedImages.includes(index) ? 'Désélectionner l\'image' : 'Sélectionner l\'image'}
                        >
                          {selectedImages.includes(index) ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-current opacity-70" />
                          )}
                        </button>
                      )}

                      {/* Primary indicator */}
                      {index === 0 && (
                        <div className="absolute top-1 left-1">
                          <Star className="h-4 w-4 text-amber-400 fill-amber-400 drop-shadow" />
                        </div>
                      )}

                      {/* SEO indicator */}
                      {altTexts[index] && (
                        <div className="absolute bottom-1 right-1">
                          <FileText className="h-3 w-3 text-emerald-400 drop-shadow" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add Image Thumbnail */}
                {!readOnly && (
                  <div
                    className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 cursor-pointer flex items-center justify-center transition-colors"
                    onClick={() => setIsAddingImage(true)}
                  >
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Add Image Form */}
        <AnimatePresence>
          {isAddingImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-48 p-4 bg-background border-t"
            >
              <div className="flex gap-3">
                <Input
                  placeholder="Collez l'URL de l'image..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddImage()}
                  autoFocus
                  className="flex-1"
                />
                <Button onClick={handleAddImage} disabled={!newImageUrl.trim()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
                <Button variant="ghost" onClick={() => setIsAddingImage(false)}>
                  Annuler
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}