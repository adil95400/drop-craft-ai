import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Edit, 
  Star, 
  Eye,
  Download,
  Maximize,
  RotateCw,
  Crop,
  Palette
} from 'lucide-react'

interface ProductImage {
  id: string
  url: string
  alt: string
  isPrimary: boolean
  size: number
  format: string
  dimensions: { width: number; height: number }
  uploadDate: string
}

interface ProductImageManagerProps {
  productId: string
}

export function ProductImageManager({ productId }: ProductImageManagerProps) {
  const [images, setImages] = useState<ProductImage[]>([
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
      alt: 'Vue principale du produit',
      isPrimary: true,
      size: 245760,
      format: 'JPG',
      dimensions: { width: 800, height: 600 },
      uploadDate: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400',
      alt: 'Vue latérale du produit',
      isPrimary: false,
      size: 189440,
      format: 'JPG',
      dimensions: { width: 800, height: 600 },
      uploadDate: '2024-01-15T10:32:00Z'
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400',
      alt: 'Détail du produit',
      isPrimary: false,
      size: 210340,
      format: 'JPG',
      dimensions: { width: 800, height: 600 },
      uploadDate: '2024-01-15T10:35:00Z'
    }
  ])
  
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const setPrimaryImage = (imageId: string) => {
    setImages(images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    })))
    toast.success('Image principale mise à jour')
  }

  const deleteImage = (imageId: string) => {
    setImages(images.filter(img => img.id !== imageId))
    toast.success('Image supprimée')
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach(file => {
        // Simulation d'upload
        const newImage: ProductImage = {
          id: Date.now().toString(),
          url: URL.createObjectURL(file),
          alt: `Image ${file.name}`,
          isPrimary: images.length === 0,
          size: file.size,
          format: file.type.split('/')[1].toUpperCase(),
          dimensions: { width: 800, height: 600 }, // Simulation
          uploadDate: new Date().toISOString()
        }
        setImages(prev => [...prev, newImage])
      })
      toast.success('Images uploadées avec succès')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestion des images</h3>
          <p className="text-sm text-muted-foreground">
            Gérez les images de votre produit avec optimisation automatique
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
          />
          <label htmlFor="image-upload">
            <Button asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
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
                  alt={image.alt}
                  className="w-full h-48 object-cover"
                />
                {image.isPrimary && (
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
                    <h4 className="font-medium truncate">{image.alt}</h4>
                    <Badge variant="outline" className="text-xs">
                      {image.format}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Dimensions:</span>
                      <span>{image.dimensions.width}×{image.dimensions.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taille:</span>
                      <span>{formatFileSize(image.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uploadé:</span>
                      <span>{new Date(image.uploadDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {!image.isPrimary && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPrimaryImage(image.id)}
                        className="flex-1"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Principal
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteImage(image.id)}
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
                  alt={selectedImage.alt}
                  className="w-full max-h-96 object-contain"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Informations</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Format:</span>
                      <span>{selectedImage.format}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dimensions:</span>
                      <span>{selectedImage.dimensions.width}×{selectedImage.dimensions.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taille:</span>
                      <span>{formatFileSize(selectedImage.size)}</span>
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