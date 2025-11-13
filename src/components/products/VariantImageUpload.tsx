import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Link as LinkIcon, X, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface VariantImageUploadProps {
  imageUrl?: string | null
  onImageChange: (url: string) => void
}

export const VariantImageUpload = ({ imageUrl, onImageChange }: VariantImageUploadProps) => {
  const { toast } = useToast()
  const [urlInput, setUrlInput] = useState('')
  const [isUrlMode, setIsUrlMode] = useState(false)

  const processFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Le fichier doit être une image",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image ne doit pas dépasser 5MB",
        variant: "destructive"
      })
      return
    }

    try {
      // Convert to base64 for preview
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        onImageChange(base64String)
        toast({
          title: "Image chargée",
          description: "L'image a été ajoutée avec succès"
        })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger l'image",
        variant: "destructive"
      })
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        processFile(acceptedFiles[0])
      }
    },
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    multiple: false
  })

  const handleUrlSubmit = () => {
    if (!urlInput) return

    try {
      new URL(urlInput) // Validate URL
      onImageChange(urlInput)
      setUrlInput('')
      setIsUrlMode(false)
      toast({
        title: "Image ajoutée",
        description: "L'URL de l'image a été enregistrée"
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "URL invalide",
        variant: "destructive"
      })
    }
  }

  const handleRemoveImage = () => {
    onImageChange('')
    toast({
      title: "Image supprimée",
      description: "L'image a été retirée de la variante"
    })
  }

  return (
    <div className="space-y-4">
      <Label>Image de la variante</Label>
      
      {imageUrl ? (
        <div className="relative">
          <img 
            src={imageUrl} 
            alt="Variante"
            className="h-32 w-32 object-cover rounded-lg border"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg'
            }}
          />
          <Button
            size="sm"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={handleRemoveImage}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {!isUrlMode ? (
            <>
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                  transition-colors
                  ${isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  {isDragActive ? (
                    <p className="text-sm text-primary">Déposez l'image ici...</p>
                  ) : (
                    <>
                      <p className="text-sm text-foreground">
                        Glissez-déposez une image ou cliquez pour parcourir
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Taille max: 5MB • Formats: JPG, PNG, WEBP
                      </p>
                    </>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setIsUrlMode(true)}
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Ou utiliser une URL
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://exemple.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              />
              <Button type="button" onClick={handleUrlSubmit}>
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsUrlMode(false)
                  setUrlInput('')
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
