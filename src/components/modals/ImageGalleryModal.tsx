/**
 * ImageGalleryModal - Modal for previewing and managing product images
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
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
        className="max-w-5xl max-h-[90vh] p-0 gap-0 overflow-hidden"
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
            
            {!readOnly && (
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
          {/* Main Image Viewer */}
          <div className="flex-1 flex flex-col bg-black/95 relative">
            {/* Image Container */}
            <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentIndex}
                  src={currentImage}
                  alt={`Image ${currentIndex + 1}`}
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
                      "relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
                      currentIndex === index
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-muted-foreground/30",
                      selectedImages.includes(index) && "ring-2 ring-blue-500"
                    )}
                    onClick={() => {
                      setCurrentIndex(index)
                      setZoom(1)
                      setRotation(0)
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
                      
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        {!readOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-white hover:bg-white/20"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectImage(index)
                            }}
                          >
                            <div className={cn(
                              "h-4 w-4 rounded border-2 flex items-center justify-center",
                              selectedImages.includes(index)
                                ? "bg-blue-500 border-blue-500"
                                : "border-white"
                            )}>
                              {selectedImages.includes(index) && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </Button>
                        )}
                      </div>

                      {/* Primary indicator */}
                      {index === 0 && (
                        <div className="absolute top-1 left-1">
                          <Star className="h-4 w-4 text-amber-400 fill-amber-400 drop-shadow" />
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
