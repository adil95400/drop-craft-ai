import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Images, Upload, Trash2, Star, Eye, Download, GripVertical } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ProductImage {
  id: string
  url: string
  alt: string
  is_primary: boolean
  order: number
  size?: number
}

interface ProductImageGalleryProps {
  productId: string
  images?: ProductImage[]
}

function SortableImage({ image, onSetPrimary, onDelete, onPreview }: {
  image: ProductImage
  onSetPrimary: (id: string) => void
  onDelete: (id: string) => void
  onPreview: (url: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      <div className="aspect-square rounded-lg overflow-hidden border-2 border-primary/20 bg-muted">
        <img
          src={image.url}
          alt={image.alt}
          className="w-full h-full object-cover"
        />
        
        {image.is_primary && (
          <Badge className="absolute top-2 left-2 bg-primary/90">
            <Star className="h-3 w-3 mr-1 fill-white" />
            Principale
          </Badge>
        )}

        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onPreview(image.url)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onSetPrimary(image.id)}
            disabled={image.is_primary}
          >
            <Star className={`h-4 w-4 ${image.is_primary ? 'fill-white' : ''}`} />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(image.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-2 bg-secondary rounded"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        </div>
      </div>
      
      <div className="mt-2 space-y-1">
        <p className="text-xs text-muted-foreground truncate">{image.alt || 'Sans titre'}</p>
        {image.size && (
          <p className="text-xs text-muted-foreground">
            {(image.size / 1024).toFixed(0)} KB
          </p>
        )}
      </div>
    </div>
  )
}

export function ProductImageGallery({ productId, images: initialImages = [] }: ProductImageGalleryProps) {
  const { toast } = useToast()
  const [images, setImages] = useState<ProductImage[]>(
    initialImages.length > 0 
      ? initialImages 
      : [
          {
            id: '1',
            url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
            alt: 'Image produit 1',
            is_primary: true,
            order: 0,
            size: 245000
          },
          {
            id: '2',
            url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
            alt: 'Image produit 2',
            is_primary: false,
            order: 1,
            size: 198000
          },
          {
            id: '3',
            url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
            alt: 'Image produit 3',
            is_primary: false,
            order: 2,
            size: 312000
          }
        ]
  )
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        
        const newItems = arrayMove(items, oldIndex, newIndex)
        return newItems.map((item, index) => ({ ...item, order: index }))
      })
      
      toast({
        title: "Ordre modifié",
        description: "L'ordre des images a été mis à jour"
      })
    }
  }

  const handleUpload = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (!files) return

      toast({
        title: "Upload en cours...",
        description: `${files.length} image(s) en cours d'upload`
      })

      // Simuler l'upload
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Images ajoutées",
        description: `${files.length} image(s) ont été ajoutées à la galerie`
      })
    }
    
    input.click()
  }

  const handleSetPrimary = (imageId: string) => {
    setImages(images.map(img => ({
      ...img,
      is_primary: img.id === imageId
    })))
    
    toast({
      title: "Image principale définie",
      description: "Cette image sera affichée en premier"
    })
  }

  const handleDelete = (imageId: string) => {
    const image = images.find(img => img.id === imageId)
    if (image?.is_primary && images.length > 1) {
      toast({
        title: "Impossible de supprimer",
        description: "Définissez d'abord une autre image comme principale",
        variant: "destructive"
      })
      return
    }

    setImages(images.filter(img => img.id !== imageId))
    toast({
      title: "Image supprimée",
      description: "L'image a été retirée de la galerie"
    })
  }

  const totalSize = images.reduce((acc, img) => acc + (img.size || 0), 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Images className="h-5 w-5 text-primary" />
              Galerie d'Images
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {images.length} image(s)
              </Badge>
              <Badge variant="outline">
                {(totalSize / 1024 / 1024).toFixed(2)} MB
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleUpload} className="flex-1">
              <Upload className="h-4 w-4 mr-2" />
              Ajouter des images
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Télécharger tout
            </Button>
          </div>

          {images.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-primary/20 rounded-lg">
              <Images className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground mb-2">Aucune image</p>
              <p className="text-sm text-muted-foreground mb-4">
                Ajoutez des images pour créer une galerie
              </p>
              <Button onClick={handleUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Commencer
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={images.map(img => img.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <SortableImage
                      key={image.id}
                      image={image}
                      onSetPrimary={handleSetPrimary}
                      onDelete={handleDelete}
                      onPreview={setPreviewUrl}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">💡 Conseils</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Glissez-déposez pour réorganiser les images</li>
              <li>• Utilisez des images haute qualité (min. 1000x1000px)</li>
              <li>• Format recommandé : JPG ou PNG</li>
              <li>• L'image principale s'affiche en premier sur votre boutique</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  )
}
