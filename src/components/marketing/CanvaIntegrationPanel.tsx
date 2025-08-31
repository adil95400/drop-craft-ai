import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCanvaIntegration } from '@/hooks/useCanvaIntegration'
import { 
  Palette, 
  Plus, 
  ExternalLink, 
  Image, 
  Video, 
  FileText, 
  Monitor,
  Wand2,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

interface CanvaIntegrationPanelProps {
  onDesignSelected?: (designId: string, designData: any) => void
  selectedStores?: string[]
  selectedProducts?: string[]
  selectedCategories?: string[]
  selectedEvents?: string[]
}

const templateCategories = [
  { id: 'marketing', label: 'Marketing', icon: Wand2 },
  { id: 'social', label: 'Réseaux Sociaux', icon: Image },
  { id: 'email', label: 'Email', icon: FileText },
  { id: 'ads', label: 'Publicités', icon: Monitor }
]

const designTypes = [
  { id: 'presentation', label: 'Présentation', icon: Monitor },
  { id: 'social_post', label: 'Post Social', icon: Image },
  { id: 'document', label: 'Document', icon: FileText },
  { id: 'video', label: 'Vidéo', icon: Video },
  { id: 'image', label: 'Image', icon: Image },
  { id: 'design', label: 'Design', icon: Palette }
]

export function CanvaIntegrationPanel({ 
  onDesignSelected,
  selectedStores = [],
  selectedProducts = [],
  selectedCategories = [],
  selectedEvents = []
}: CanvaIntegrationPanelProps) {
  const {
    isConnecting,
    isLoading,
    designs,
    templates,
    connectCanva,
    checkConnectionStatus,
    getDesigns,
    getTemplates,
    openCanvaEditor,
    createDesignFromTemplate
  } = useCanvaIntegration()

  const [isConnected, setIsConnected] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('marketing')

  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkConnectionStatus()
      setIsConnected(connected)
      if (connected) {
        getDesigns()
        getTemplates()
      }
    }
    checkConnection()
  }, [checkConnectionStatus, getDesigns, getTemplates])

  const handleCreateDesign = async (templateId: string) => {
    const customData = {
      stores: selectedStores,
      products: selectedProducts, 
      categories: selectedCategories,
      events: selectedEvents
    }

    const result = await createDesignFromTemplate(templateId, customData)
    if (result && onDesignSelected) {
      onDesignSelected(result.design_id, result)
    }
  }

  const filteredTemplates = templates.filter(template => 
    template.category === selectedCategory
  )

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Intégration Canva
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Palette className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Connectez-vous à Canva</h3>
              <p className="text-muted-foreground mb-4">
                Créez des designs professionnels directement depuis Drop Craft AI
              </p>
            </div>
            <Button 
              onClick={connectCanva}
              disabled={isConnecting}
              className="gap-2"
            >
              {isConnecting ? (
                <>
                  <Wand2 className="h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Connecter Canva
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Canva Design Studio
          </CardTitle>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Connecté
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="designs">Mes Designs</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            {/* Sélecteur de catégorie */}
            <div className="flex gap-2">
              {templateCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="gap-2"
                >
                  <category.icon className="h-4 w-4" />
                  {category.label}
                </Button>
              ))}
            </div>

            {/* Contexte de sélection */}
            {(selectedStores.length > 0 || selectedProducts.length > 0 || 
              selectedCategories.length > 0 || selectedEvents.length > 0) && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Contexte sélectionné</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {selectedStores.length > 0 && (
                      <p>Magasins: {selectedStores.length} sélectionné(s)</p>
                    )}
                    {selectedProducts.length > 0 && (
                      <p>Produits: {selectedProducts.length} sélectionné(s)</p>
                    )}
                    {selectedCategories.length > 0 && (
                      <p>Catégories: {selectedCategories.length} sélectionnée(s)</p>
                    )}
                    {selectedEvents.length > 0 && (
                      <p>Événements: {selectedEvents.length} sélectionné(s)</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Grille de templates */}
            <div className="grid grid-cols-2 gap-3">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[3/2] bg-muted animate-pulse rounded-lg" />
                ))
              ) : (
                filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="group cursor-pointer"
                    onClick={() => handleCreateDesign(template.id)}
                  >
                    <div className="aspect-[3/2] bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg border flex items-center justify-center relative overflow-hidden group-hover:shadow-lg transition-all">
                      <Image className="h-8 w-8 text-primary/60" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <Plus className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="font-medium text-sm truncate">{template.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {template.description}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => openCanvaEditor()}
            >
              <ExternalLink className="h-4 w-4" />
              Ouvrir Canva Editor
            </Button>
          </TabsContent>

          <TabsContent value="designs" className="space-y-4">
            {designs.length === 0 ? (
              <div className="text-center py-8">
                <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Aucun design trouvé</p>
                <Button 
                  variant="outline" 
                  className="mt-4 gap-2"
                  onClick={() => openCanvaEditor()}
                >
                  <Plus className="h-4 w-4" />
                  Créer un design
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {designs.map((design) => {
                  const TypeIcon = designTypes.find(t => t.id === design.design_type)?.icon || FileText
                  
                  return (
                    <div
                      key={design.id}
                      className="group cursor-pointer"
                      onClick={() => {
                        openCanvaEditor(design.id)
                        if (onDesignSelected) {
                          onDesignSelected(design.id, design)
                        }
                      }}
                    >
                      <div className="aspect-[3/2] bg-gradient-to-br from-muted to-muted/50 rounded-lg border flex items-center justify-center relative overflow-hidden group-hover:shadow-lg transition-all">
                        {design.thumbnail ? (
                          <img 
                            src={design.thumbnail} 
                            alt={design.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <TypeIcon className="h-8 w-8 text-muted-foreground" />
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                          <ExternalLink className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="font-medium text-sm truncate">{design.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(design.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}