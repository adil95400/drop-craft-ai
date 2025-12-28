import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Sparkles, Wand2, Search, MoreVertical, Trash2, Eye, Download,
  Loader2, Image as ImageIcon, Copy, Mail, Share2, Megaphone,
  LayoutGrid, List
} from 'lucide-react'
import { useMarketingAIImages, AIImage, GenerateImageParams } from '@/hooks/useMarketingAIImages'
import { useToast } from '@/hooks/use-toast'

const IMAGE_STYLES = [
  { value: 'marketing', label: 'Marketing Pro', description: 'Clean, professional marketing visuals' },
  { value: 'creative', label: 'Créatif', description: 'Bold, eye-catching designs' },
  { value: 'minimal', label: 'Minimaliste', description: 'Simple, elegant aesthetics' },
  { value: 'vibrant', label: 'Coloré', description: 'Bright, energetic colors' },
  { value: 'corporate', label: 'Corporate', description: 'Professional business style' },
]

const IMAGE_CATEGORIES = [
  { value: 'email', label: 'Email Banner', icon: Mail },
  { value: 'social', label: 'Réseaux sociaux', icon: Share2 },
  { value: 'ad', label: 'Publicité', icon: Megaphone },
  { value: 'general', label: 'Général', icon: ImageIcon },
]

const IMAGE_SIZES = [
  { value: '1024x1024', label: 'Carré (1024x1024)', width: 1024, height: 1024 },
  { value: '1920x1080', label: 'Paysage (1920x1080)', width: 1920, height: 1080 },
  { value: '1080x1920', label: 'Portrait (1080x1920)', width: 1080, height: 1920 },
  { value: '1200x628', label: 'Facebook (1200x628)', width: 1200, height: 628 },
  { value: '1080x1080', label: 'Instagram (1080x1080)', width: 1080, height: 1080 },
]

const PROMPT_SUGGESTIONS = [
  "Bannière email promotionnelle pour soldes d'été avec couleurs vives",
  "Image de hero pour landing page SaaS moderne et épurée",
  "Visuel publicitaire pour nouvelle collection de produits",
  "Background abstrait pour email newsletter tech",
  "Illustration minimaliste pour campagne Black Friday",
]

export function AIImageGenerator() {
  const { images, isLoading, isGenerating, generateImage, deleteImage } = useMarketingAIImages()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [selectedImage, setSelectedImage] = useState<AIImage | null>(null)

  // Generation form
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('marketing')
  const [selectedSize, setSelectedSize] = useState('1024x1024')
  const [selectedCategory, setSelectedCategory] = useState('general')

  const filteredImages = images.filter(img => {
    const matchesSearch = img.prompt.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = filterCategory === 'all' || img.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt requis",
        description: "Veuillez décrire l'image que vous souhaitez générer",
        variant: "destructive"
      })
      return
    }

    const size = IMAGE_SIZES.find(s => s.value === selectedSize)
    const params: GenerateImageParams = {
      prompt,
      width: size?.width || 1024,
      height: size?.height || 1024,
      style: selectedStyle,
      category: selectedCategory
    }

    const result = await generateImage(params)
    if (result) {
      setPrompt('')
    }
  }

  const handleCopyImage = async (image: AIImage) => {
    if (image.image_base64) {
      try {
        // For base64 images
        const response = await fetch(image.image_base64)
        const blob = await response.blob()
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
        toast({
          title: "Image copiée",
          description: "L'image a été copiée dans le presse-papiers"
        })
      } catch {
        toast({
          title: "Erreur",
          description: "Impossible de copier l'image",
          variant: "destructive"
        })
      }
    }
  }

  const handleDownload = (image: AIImage) => {
    if (image.image_base64) {
      const link = document.createElement('a')
      link.href = image.image_base64
      link.download = `ai-image-${image.id}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Generator Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Générateur d'images IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Description de l'image</Label>
            <Textarea
              placeholder="Décrivez l'image que vous souhaitez créer..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex flex-wrap gap-2">
              {PROMPT_SUGGESTIONS.slice(0, 3).map((suggestion, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setPrompt(suggestion)}
                >
                  {suggestion.slice(0, 40)}...
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Style</Label>
              <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_STYLES.map(style => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Taille</Label>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_SIZES.map(size => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="h-4 w-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Générer l'image
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Images Library */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {IMAGE_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {filteredImages.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune image générée</p>
              <p className="text-sm text-muted-foreground">
                Utilisez le générateur ci-dessus pour créer vos premières images
              </p>
            </div>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredImages.map(image => (
              <ImageCard
                key={image.id}
                image={image}
                onPreview={() => { setSelectedImage(image); setShowPreviewDialog(true) }}
                onCopy={() => handleCopyImage(image)}
                onDownload={() => handleDownload(image)}
                onDelete={() => deleteImage(image.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredImages.map(image => (
              <ImageListItem
                key={image.id}
                image={image}
                onPreview={() => { setSelectedImage(image); setShowPreviewDialog(true) }}
                onCopy={() => handleCopyImage(image)}
                onDownload={() => handleDownload(image)}
                onDelete={() => deleteImage(image.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Prévisualisation</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border bg-muted">
                {selectedImage.image_base64 ? (
                  <img 
                    src={selectedImage.image_base64} 
                    alt={selectedImage.prompt}
                    className="w-full h-auto max-h-[60vh] object-contain"
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm"><strong>Prompt:</strong> {selectedImage.prompt}</p>
                <div className="flex items-center gap-2">
                  <Badge>{selectedImage.category}</Badge>
                  <Badge variant="outline">{selectedImage.width}x{selectedImage.height}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedImage.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => selectedImage && handleCopyImage(selectedImage)}>
              <Copy className="h-4 w-4 mr-2" />
              Copier
            </Button>
            <Button variant="outline" onClick={() => selectedImage && handleDownload(selectedImage)}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
            <Button onClick={() => setShowPreviewDialog(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface ImageCardProps {
  image: AIImage
  onPreview: () => void
  onCopy: () => void
  onDownload: () => void
  onDelete: () => void
}

function ImageCard({ image, onPreview, onCopy, onDownload, onDelete }: ImageCardProps) {
  return (
    <Card className="overflow-hidden group">
      <div 
        className="aspect-square bg-muted cursor-pointer relative"
        onClick={onPreview}
      >
        {image.image_base64 ? (
          <img 
            src={image.image_base64} 
            alt={image.prompt}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Eye className="h-8 w-8 text-white" />
        </div>
      </div>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm line-clamp-2 flex-1">{image.prompt}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onPreview}>
                <Eye className="h-4 w-4 mr-2" />
                Voir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

function ImageListItem({ image, onPreview, onCopy, onDownload, onDelete }: ImageCardProps) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-4">
        <div 
          className="h-16 w-16 rounded-lg overflow-hidden bg-muted cursor-pointer shrink-0"
          onClick={onPreview}
        >
          {image.image_base64 ? (
            <img 
              src={image.image_base64} 
              alt={image.prompt}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{image.prompt}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">{image.category}</Badge>
            <span className="text-xs text-muted-foreground">
              {image.width}x{image.height}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(image.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={onCopy}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDownload}>
            <Download className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
