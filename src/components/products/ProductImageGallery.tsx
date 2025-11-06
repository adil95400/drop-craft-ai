import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Image as ImageIcon, Link as LinkIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface ProductImageGalleryProps {
  images: string[]
  onImagesChange: (images: string[]) => void
}

export function ProductImageGallery({ images, onImagesChange }: ProductImageGalleryProps) {
  const [newImageUrl, setNewImageUrl] = useState('')

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      onImagesChange([...images, newImageUrl.trim()])
      setNewImageUrl('')
    }
  }

  const handleRemoveImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  const handleSetPrimary = (index: number) => {
    const newImages = [...images]
    const [primary] = newImages.splice(index, 1)
    newImages.unshift(primary)
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Ajouter une image (URL)</Label>
        <div className="flex gap-2">
          <Input
            placeholder="https://exemple.com/image.jpg"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
          />
          <Button type="button" onClick={handleAddImage} variant="outline">
            <LinkIcon className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.length === 0 ? (
          <Card className="col-span-full p-8 flex flex-col items-center justify-center text-center border-dashed">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Aucune image</p>
          </Card>
        ) : (
          images.map((image, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <img src={image} alt={`Produit ${index + 1}`} className="w-full h-32 object-cover" />
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
                  Principale
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {index !== 0 && (
                  <Button type="button" size="sm" variant="secondary" onClick={() => handleSetPrimary(index)}>
                    Définir principale
                  </Button>
                )}
                <Button type="button" size="sm" variant="destructive" onClick={() => handleRemoveImage(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
