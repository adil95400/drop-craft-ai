import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useProductImages } from '@/hooks/useProductImages'
import { Loader2 } from 'lucide-react'
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Edit, 
  Star, 
  Eye,
  Download,
  RotateCw,
  Crop,
  Palette
} from 'lucide-react'

interface ProductImageManagerProps {
  productId: string
}

export function ProductImageManager({ productId }: ProductImageManagerProps) {
  const { 
    images, 
    isLoading, 
    addImage, 
    deleteImage, 
    setPrimaryImage, 
    uploadImage,
    isAdding,
    isDeleting 
  } = useProductImages(productId)
  
  const [selectedImage, setSelectedImage] = useState<typeof images[0] | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const handleSetPrimary = (imageId: string) => {
    setPrimaryImage(imageId)
  }

  const handleDelete = (imageId: string) => {
    deleteImage(imageId)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        const url = await uploadImage(file)
        
        // Get image dimensions
        const img = new Image()
        img.src = url
        await new Promise((resolve) => {
          img.onload = resolve
        })

        addImage({
          product_id: productId,
          url,
          alt_text: file.name.replace(/\.[^/.]+$/, ''),
          position: images.length,
          is_primary: images.length === 0,
          width: img.width,
          height: img.height,
          file_size: file.size
        })
      }
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestion des images</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les images de votre produit ({images.length} image{images.length !== 1 ? 's' : ''})
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
            disabled={isUploading}
          />
          <label htmlFor="image-upload">
            <Button asChild disabled={isUploading || isAdding}>
              <span>
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Ajouter des images
              </span>
            </Button>
          </label>
        </div>
      </div>

      {images.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h4 className="text-lg font-semibold mb-2">Aucune image</h4>
            <p className="text-muted-foreground mb-6">
              Ajoutez des images pour améliorer la présentation de votre produit
            </p>
            <label htmlFor="image-upload">
              <Button asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Uploader des images
                </span>
              </Button>
            </label>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              <div className="relative">
                <img
                  src={image.url}
                  alt={image.alt_text || 'Image produit'}
                  className="w-full h-48 object-cover"
                />
                {image.is_primary && (
                  <Badge className="absolute top-2 left-2 bg-primary">
                    <Star className="h-3 w-3 mr-1" />
                    Principal
                  </Badge>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedImage(image)
                      setIsViewerOpen(true)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium truncate">{image.alt_text || 'Image'}</h4>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    {image.width && image.height && (
                      <div className="flex justify-between">
                        <span>Dimensions:</span>
                        <span>{image.width}×{image.height}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Taille:</span>
                      <span>{formatFileSize(image.file_size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ajouté:</span>
                      <span>{new Date(image.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {!image.is_primary && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetPrimary(image.id)}
                        className="flex-1"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Principal
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(image.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Viewer Dialog */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Aperçu de l'image</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative bg-muted rounded-lg overflow-hidden">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.alt_text || 'Image'}
                  className="w-full max-h-96 object-contain"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Informations</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    {selectedImage.width && selectedImage.height && (
                      <div className="flex justify-between">
                        <span>Dimensions:</span>
                        <span>{selectedImage.width}×{selectedImage.height}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Taille:</span>
                      <span>{formatFileSize(selectedImage.file_size)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Actions rapides</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <RotateCw className="h-4 w-4 mr-2" />
                      Rotation
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <Crop className="h-4 w-4 mr-2" />
                      Recadrer
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <Palette className="h-4 w-4 mr-2" />
                      Filtres
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
