import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useProductImages } from '@/hooks/useProductImages'
import { Loader2, Upload, Image as ImageIcon, Trash2, Star, Eye, Download, Link as LinkIcon, Plus, GripVertical } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProductImageManagerProps {
  productId: string
}

export function ProductImageManager({ productId }: ProductImageManagerProps) {
  const { 
    images, isLoading, addImage, deleteImage, setPrimaryImage, uploadImage, isAdding, isDeleting 
  } = useProductImages(productId)
  
  const [selectedImage, setSelectedImage] = useState<typeof images[0] | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes || bytes === 0) return '—'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const handleFiles = useCallback(async (files: File[]) => {
    if (!files.length) return
    setIsUploading(true)
    try {
      for (const file of files) {
        const url = await uploadImage(file)
        const img = new Image()
        img.src = url
        await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve })

        addImage({
          product_id: productId,
          url,
          alt_text: file.name.replace(/\.[^/.]+$/, ''),
          position: images.length,
          is_primary: images.length === 0,
          width: img.naturalWidth || 0,
          height: img.naturalHeight || 0,
          file_size: file.size
        })
      }
    } finally {
      setIsUploading(false)
    }
  }, [uploadImage, addImage, productId, images.length])

  const handleAddUrl = () => {
    if (!urlInput.trim()) return
    addImage({
      product_id: productId,
      url: urlInput.trim(),
      alt_text: 'Image produit',
      position: images.length,
      is_primary: images.length === 0,
    })
    setUrlInput('')
    setShowUrlInput(false)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFiles,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] },
    multiple: true,
    disabled: isUploading,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestion des images</h3>
          <p className="text-sm text-muted-foreground">
            {images.length} image{images.length !== 1 ? 's' : ''} • Glissez-déposez pour ajouter
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowUrlInput(!showUrlInput)} className="gap-2">
            <LinkIcon className="h-4 w-4" />
            URL
          </Button>
          <label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
              className="hidden"
              disabled={isUploading}
            />
            <Button asChild disabled={isUploading || isAdding} className="gap-2">
              <span>
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Uploader
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* URL Input */}
      {showUrlInput && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://exemple.com/image.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                />
                <Button onClick={handleAddUrl} disabled={!urlInput.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Drop Zone + Images Grid */}
      {images.length === 0 ? (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer",
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50"
          )}
        >
          <input {...getInputProps()} />
          <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h4 className="text-lg font-semibold mb-2">Aucune image</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Glissez-déposez vos images ici, ou cliquez pour sélectionner
          </p>
          <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, GIF • Max 10 MB</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Drag zone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer",
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/30"
            )}
          >
            <input {...getInputProps()} />
            <p className="text-sm text-muted-foreground">
              {isDragActive ? '📸 Déposez les images ici...' : '+ Glissez-déposez des images pour les ajouter'}
            </p>
          </div>

          {/* Images Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {images.map((image, idx) => (
                <motion.div
                  key={image.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Card className="overflow-hidden group relative">
                    <div className="relative aspect-square bg-muted">
                      <img
                        src={image.url}
                        alt={image.alt_text || 'Image produit'}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                      />
                      {image.is_primary && (
                        <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground gap-1 text-[10px]">
                          <Star className="h-3 w-3" />
                          Principal
                        </Badge>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => { setSelectedImage(image); setIsViewerOpen(true) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!image.is_primary && (
                          <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setPrimaryImage(image.id)}>
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => deleteImage(image.id)} disabled={isDeleting}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-2">
                      <p className="text-xs text-muted-foreground truncate">{image.alt_text || 'Image'}</p>
                      <div className="flex justify-between text-[10px] text-muted-foreground/70 mt-0.5">
                        {image.width && image.height && <span>{image.width}×{image.height}</span>}
                        <span>{formatFileSize(image.file_size)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Image Viewer Dialog */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Aperçu de l'image</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative bg-muted rounded-lg overflow-hidden">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.alt_text || 'Image'}
                  className="w-full max-h-[500px] object-contain"
                />
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {selectedImage.width && selectedImage.height && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Dimensions</p>
                    <p className="font-medium">{selectedImage.width}×{selectedImage.height}</p>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Taille</p>
                  <p className="font-medium">{formatFileSize(selectedImage.file_size)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Ajouté le</p>
                  <p className="font-medium">{new Date(selectedImage.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
