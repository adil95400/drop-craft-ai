import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  Sparkles, Palette, Image as ImageIcon, Search, Eye, Copy, Download,
  Loader2, Mail, Share2, Megaphone, LayoutTemplate, Wand2
} from 'lucide-react'
import { useCanvaIntegration, CanvaDesign } from '@/hooks/useCanvaIntegration'
import { useMarketingAIImages, AIImage } from '@/hooks/useMarketingAIImages'
import { useToast } from '@/hooks/use-toast'

const QUICK_TEMPLATES = [
  { 
    id: 'email-header', 
    name: 'En-tête Email', 
    prompt: 'Professional email header banner with modern gradient background, clean typography space',
    icon: Mail,
    size: { width: 1200, height: 300 }
  },
  { 
    id: 'social-square', 
    name: 'Post Carré', 
    prompt: 'Eye-catching social media post, square format, bold colors, minimal text space',
    icon: Share2,
    size: { width: 1080, height: 1080 }
  },
  { 
    id: 'ad-banner', 
    name: 'Bannière Pub', 
    prompt: 'Digital advertising banner, attention-grabbing design, call-to-action space',
    icon: Megaphone,
    size: { width: 1200, height: 628 }
  },
  { 
    id: 'story', 
    name: 'Story', 
    prompt: 'Vertical story format, vibrant design, engaging visual for mobile',
    icon: LayoutTemplate,
    size: { width: 1080, height: 1920 }
  },
]

type VisualItem = {
  type: 'canva' | 'ai'
  id: string
  title: string
  thumbnail: string | null
  createdAt: string
  data: CanvaDesign | AIImage
}

export function MarketingVisualStudio() {
  const { designs: canvaDesigns, isLoading: canvaLoading, isConnected: canvaConnected } = useCanvaIntegration()
  const { images: aiImages, isLoading: aiLoading, isGenerating, generateImage } = useMarketingAIImages()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<VisualItem | null>(null)
  const [isQuickGenerating, setIsQuickGenerating] = useState<string | null>(null)

  // Combine all visuals
  const allVisuals: VisualItem[] = [
    ...canvaDesigns.map(d => ({
      type: 'canva' as const,
      id: d.id,
      title: d.title,
      thumbnail: d.thumbnail_url,
      createdAt: d.created_at,
      data: d
    })),
    ...aiImages.map(img => ({
      type: 'ai' as const,
      id: img.id,
      title: img.prompt.slice(0, 50) + (img.prompt.length > 50 ? '...' : ''),
      thumbnail: img.image_base64,
      createdAt: img.created_at,
      data: img
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const filteredVisuals = allVisuals.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(search.toLowerCase())
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'canva' && v.type === 'canva') ||
      (activeTab === 'ai' && v.type === 'ai')
    return matchesSearch && matchesTab
  })

  const handleQuickGenerate = async (template: typeof QUICK_TEMPLATES[0]) => {
    setIsQuickGenerating(template.id)
    try {
      await generateImage({
        prompt: template.prompt,
        width: template.size.width,
        height: template.size.height,
        style: 'marketing',
        category: 'general'
      })
      toast({
        title: "Image générée",
        description: `${template.name} créé avec succès`
      })
    } catch (error) {
      console.error('Quick generate error:', error)
    } finally {
      setIsQuickGenerating(null)
    }
  }

  const handleCopy = async (item: VisualItem) => {
    const imageUrl = item.type === 'ai' 
      ? (item.data as AIImage).image_base64 
      : (item.data as CanvaDesign).thumbnail_url

    if (imageUrl) {
      try {
        const response = await fetch(imageUrl)
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

  const handleDownload = (item: VisualItem) => {
    const imageUrl = item.type === 'ai' 
      ? (item.data as AIImage).image_base64 
      : (item.data as CanvaDesign).thumbnail_url

    if (imageUrl) {
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `visual-${item.id}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const isLoading = canvaLoading || aiLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Création rapide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUICK_TEMPLATES.map(template => (
              <Button
                key={template.id}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => handleQuickGenerate(template)}
                disabled={isGenerating || isQuickGenerating === template.id}
              >
                {isQuickGenerating === template.id ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <template.icon className="h-6 w-6" />
                )}
                <span className="text-sm">{template.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ImageIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allVisuals.length}</p>
              <p className="text-xs text-muted-foreground">Total visuels</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Palette className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{canvaDesigns.length}</p>
              <p className="text-xs text-muted-foreground">Designs Canva</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{aiImages.length}</p>
              <p className="text-xs text-muted-foreground">Images IA</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${canvaConnected ? 'bg-green-500/10' : 'bg-muted'}`}>
              <Palette className={`h-5 w-5 ${canvaConnected ? 'text-green-500' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-sm font-medium">{canvaConnected ? 'Connecté' : 'Non connecté'}</p>
              <p className="text-xs text-muted-foreground">Canva</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Gallery */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Galerie de visuels</CardTitle>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                Tous ({allVisuals.length})
              </TabsTrigger>
              <TabsTrigger value="ai">
                <Sparkles className="h-4 w-4 mr-1" />
                IA ({aiImages.length})
              </TabsTrigger>
              <TabsTrigger value="canva">
                <Palette className="h-4 w-4 mr-1" />
                Canva ({canvaDesigns.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {filteredVisuals.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Aucun visuel trouvé</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredVisuals.map(item => (
                    <div 
                      key={`${item.type}-${item.id}`}
                      className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer border hover:border-primary transition-colors"
                      onClick={() => { setSelectedItem(item); setShowPreviewDialog(true) }}
                    >
                      {item.thumbnail ? (
                        <img 
                          src={item.thumbnail} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <Badge variant={item.type === 'ai' ? 'default' : 'secondary'} className="mb-1">
                            {item.type === 'ai' ? 'IA' : 'Canva'}
                          </Badge>
                          <p className="text-white text-xs line-clamp-2">{item.title}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedItem?.type === 'ai' ? (
                <Sparkles className="h-5 w-5 text-primary" />
              ) : (
                <Palette className="h-5 w-5 text-blue-500" />
              )}
              {selectedItem?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border bg-muted max-h-[60vh] flex items-center justify-center">
                {selectedItem.thumbnail ? (
                  <img 
                    src={selectedItem.thumbnail} 
                    alt={selectedItem.title}
                    className="max-w-full max-h-[60vh] object-contain"
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={selectedItem.type === 'ai' ? 'default' : 'secondary'}>
                  {selectedItem.type === 'ai' ? 'Généré par IA' : 'Canva'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Créé le {new Date(selectedItem.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => selectedItem && handleCopy(selectedItem)}>
              <Copy className="h-4 w-4 mr-2" />
              Copier
            </Button>
            <Button variant="outline" onClick={() => selectedItem && handleDownload(selectedItem)}>
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
