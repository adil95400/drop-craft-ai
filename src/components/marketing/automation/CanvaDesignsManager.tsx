import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  Palette, Plus, Search, MoreVertical, Trash2, Eye, ExternalLink,
  Loader2, RefreshCw, Link2, Unlink, Image as ImageIcon, FileImage,
  LayoutTemplate, Share2
} from 'lucide-react'
import { useCanvaIntegration, CanvaDesign } from '@/hooks/useCanvaIntegration'

const DESIGN_TYPES = [
  { value: 'SocialMediaGraphic', label: 'Réseaux sociaux', icon: Share2 },
  { value: 'Presentation', label: 'Présentation', icon: LayoutTemplate },
  { value: 'Poster', label: 'Poster', icon: FileImage },
  { value: 'EmailHeader', label: 'En-tête email', icon: ImageIcon },
]

export function CanvaDesignsManager() {
  const { 
    integration, 
    designs, 
    isLoading, 
    isConnecting,
    isConnected,
    connectCanva,
    disconnectCanva,
    getDesigns,
    openCanvaEditor
  } = useCanvaIntegration()

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [selectedDesign, setSelectedDesign] = useState<CanvaDesign | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const filteredDesigns = designs.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'all' || d.design_type === filterType
    return matchesSearch && matchesType
  })

  const handleCreateDesign = (designType: string) => {
    openCanvaEditor(undefined, designType)
    setShowCreateDialog(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Palette className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Connectez votre compte Canva</h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Liez votre compte Canva pour créer et gérer vos designs marketing directement depuis cette interface.
              </p>
            </div>
            <Button 
              size="lg" 
              onClick={connectCanva}
              disabled={isConnecting}
              className="mt-4"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Connecter Canva
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Features preview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Share2 className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-medium">Réseaux sociaux</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Créez des visuels optimisés pour Facebook, Instagram, LinkedIn et plus.
            </p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ImageIcon className="h-5 w-5 text-green-600" />
              </div>
              <h4 className="font-medium">Bannières email</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Designez des en-têtes et bannières pour vos campagnes email.
            </p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileImage className="h-5 w-5 text-purple-600" />
              </div>
              <h4 className="font-medium">Publicités</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Créez des visuels publicitaires pour vos campagnes ads.
            </p>
          </Card>
        </div>
      </div>
    )
  }

  // Connected state
  return (
    <div className="space-y-6">
      {/* Header */}
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
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {DESIGN_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => getDesigns()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Synchroniser
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Design
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={disconnectCanva} className="text-destructive">
                <Unlink className="h-4 w-4 mr-2" />
                Déconnecter Canva
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 bg-green-500 rounded-full" />
            <span className="text-sm font-medium">Canva connecté</span>
            <Badge variant="secondary">{designs.length} designs</Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            Dernière sync: {integration?.created_at ? new Date(integration.created_at).toLocaleDateString() : 'Jamais'}
          </span>
        </div>
      </Card>

      {/* Designs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredDesigns.length === 0 ? (
          <Card className="col-span-full p-8 text-center">
            <p className="text-muted-foreground">Aucun design trouvé</p>
            <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un design
            </Button>
          </Card>
        ) : (
          filteredDesigns.map((design) => (
            <DesignCard 
              key={design.id}
              design={design}
              onPreview={() => { setSelectedDesign(design); setShowPreviewDialog(true) }}
              onOpen={() => openCanvaEditor(design.canva_design_id)}
            />
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouveau design</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {DESIGN_TYPES.map(type => (
              <Button 
                key={type.value}
                variant="outline" 
                className="justify-start h-auto p-4"
                onClick={() => handleCreateDesign(type.value)}
              >
                <type.icon className="h-5 w-5 mr-3" />
                <span>{type.label}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedDesign?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDesign?.thumbnail ? (
              <img 
                src={selectedDesign.thumbnail} 
                alt={selectedDesign.title}
                className="w-full rounded-lg border"
              />
            ) : (
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Badge>{selectedDesign?.design_type || 'Design'}</Badge>
              <span className="text-sm text-muted-foreground">
                Modifié: {selectedDesign?.updated_at ? new Date(selectedDesign.updated_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
          <DialogFooter>
            {selectedDesign?.design_url && (
              <Button variant="outline" asChild>
                <a href={selectedDesign.design_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir dans Canva
                </a>
              </Button>
            )}
            <Button onClick={() => setShowPreviewDialog(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface DesignCardProps {
  design: CanvaDesign
  onPreview: () => void
  onOpen: () => void
}

function DesignCard({ design, onPreview, onOpen }: DesignCardProps) {
  return (
    <Card className="overflow-hidden">
      <div 
        className="h-40 bg-gradient-to-br from-muted to-muted/50 cursor-pointer relative"
        onClick={onPreview}
      >
        {design.thumbnail ? (
          <img 
            src={design.thumbnail} 
            alt={design.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{design.title}</h4>
            <Badge variant="secondary" className="mt-1 text-xs">
              {design.design_type || 'Design'}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onPreview}>
                <Eye className="h-4 w-4 mr-2" />
                Voir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpen}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir dans Canva
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
