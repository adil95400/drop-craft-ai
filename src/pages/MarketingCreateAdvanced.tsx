import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Sparkles, 
  Store, 
  Package, 
  Folder,
  Calendar,
  Image,
  Video,
  Send,
  Eye,
  Wand2
} from 'lucide-react'
import { toast } from 'sonner'

// Import des nouveaux composants optimisés
import { OptimizedSelector } from '@/components/performance/OptimizedSelector'
import { CanvaIntegrationPanel } from '@/components/marketing/CanvaIntegrationPanel'
import { MediaUploadZone } from '@/components/media/MediaUploadZone'
import { useMarketing } from '@/hooks/useMarketing'

interface AdvancedCampaignData {
  name: string
  description: string
  type: string
  selectedStores: string[]
  selectedProducts: string[]
  selectedCategories: string[]
  selectedEvents: string[]
  uploadedMedia: any[]
  canvaDesigns: any[]
  settings: {
    budget?: number
    scheduledAt?: string
    aiOptimized: boolean
    abTesting: boolean
  }
}

// Mock data pour la démo
const mockStores = [
  { id: 'store-1', name: 'Boutique Paris Centre', type: 'store' as const, status: 'active' as const, count: 1250 },
  { id: 'store-2', name: 'Boutique Lyon Bellecour', type: 'store' as const, status: 'active' as const, count: 890 },
  { id: 'store-3', name: 'Boutique Marseille Vieux Port', type: 'store' as const, status: 'inactive' as const, count: 567 },
  { id: 'store-4', name: 'Boutique en ligne', type: 'store' as const, status: 'active' as const, count: 3400 }
]

const mockProducts = [
  { id: 'prod-1', name: 'iPhone 15 Pro', type: 'product' as const, status: 'active' as const, count: 45 },
  { id: 'prod-2', name: 'MacBook Pro M3', type: 'product' as const, status: 'active' as const, count: 23 },
  { id: 'prod-3', name: 'AirPods Pro 2', type: 'product' as const, status: 'active' as const, count: 189 },
  { id: 'prod-4', name: 'Apple Watch Series 9', type: 'product' as const, status: 'draft' as const, count: 67 },
  { id: 'prod-5', name: 'iPad Air M2', type: 'product' as const, status: 'active' as const, count: 98 }
]

const mockCategories = [
  { id: 'cat-1', name: 'Smartphones', type: 'category' as const, status: 'active' as const, count: 156 },
  { id: 'cat-2', name: 'Ordinateurs portables', type: 'category' as const, status: 'active' as const, count: 89 },
  { id: 'cat-3', name: 'Accessoires audio', type: 'category' as const, status: 'active' as const, count: 234 },
  { id: 'cat-4', name: 'Tablettes', type: 'category' as const, status: 'inactive' as const, count: 67 }
]

const mockEvents = [
  { id: 'event-1', name: 'Black Friday 2024', type: 'event' as const, status: 'active' as const, count: 50 },
  { id: 'event-2', name: 'Soldes d\'hiver', type: 'event' as const, status: 'draft' as const, count: 30 },
  { id: 'event-3', name: 'Fête des mères', type: 'event' as const, status: 'active' as const, count: 25 },
  { id: 'event-4', name: 'Rentrée scolaire', type: 'event' as const, status: 'inactive' as const, count: 40 }
]

export default function MarketingCreateAdvanced() {
  const navigate = useNavigate()
  const { createCampaign, isCreatingCampaign } = useMarketing()
  const [step, setStep] = useState(1)
  
  const [campaignData, setCampaignData] = useState<AdvancedCampaignData>({
    name: '',
    description: '',
    type: 'email',
    selectedStores: [],
    selectedProducts: [],
    selectedCategories: [],
    selectedEvents: [],
    uploadedMedia: [],
    canvaDesigns: [],
    settings: {
      aiOptimized: true,
      abTesting: false
    }
  })

  // Calcul du score d'optimisation
  const getOptimizationScore = () => {
    let score = 0
    if (campaignData.selectedStores.length > 0) score += 15
    if (campaignData.selectedProducts.length > 0) score += 20
    if (campaignData.selectedCategories.length > 0) score += 15
    if (campaignData.selectedEvents.length > 0) score += 10
    if (campaignData.uploadedMedia.length > 0) score += 15
    if (campaignData.canvaDesigns.length > 0) score += 20
    if (campaignData.settings.aiOptimized) score += 5
    return Math.min(score, 100)
  }

  const handleFinish = async () => {
    try {
      const finalCampaignData = {
        name: campaignData.name || `Campagne ${new Date().toLocaleDateString()}`,
        description: campaignData.description || 'Campagne créée avec Drop Craft AI',
        type: campaignData.type as any,
        status: 'draft' as const,
        target_audience: {
          stores: campaignData.selectedStores,
          products: campaignData.selectedProducts,
          categories: campaignData.selectedCategories,
          events: campaignData.selectedEvents
        },
        content: {
          media: campaignData.uploadedMedia,
          canva_designs: campaignData.canvaDesigns
        },
        settings: campaignData.settings,
        budget_total: campaignData.settings.budget || 0
      }

      await createCampaign(finalCampaignData)
      toast.success('Campagne avancée créée avec succès!')
      navigate('/marketing')
    } catch (error) {
      console.error('Erreur création campagne:', error)
      toast.error('Erreur lors de la création')
    }
  }

  const optimizationScore = getOptimizationScore()

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header avec score d'optimisation */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Créateur de Campagne Avancé
        </h1>
        <p className="text-muted-foreground">
          Sélectionnez vos magasins, produits, catégories et événements pour une campagne ultra-ciblée
        </p>
        
        <Card className="max-w-md mx-auto border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Score d'optimisation</span>
              <Badge variant={optimizationScore > 80 ? 'default' : optimizationScore > 50 ? 'secondary' : 'outline'}>
                {optimizationScore}%
              </Badge>
            </div>
            <Progress value={optimizationScore} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {optimizationScore > 80 ? 'Excellent ciblage!' : 
               optimizationScore > 50 ? 'Bon ciblage' : 'Ajoutez plus d\'éléments'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sélecteurs - Colonne gauche */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Sélecteurs Intelligents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="stores" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="stores" className="text-xs">
                    <Store className="h-3 w-3 mr-1" />
                    Magasins
                  </TabsTrigger>
                  <TabsTrigger value="products" className="text-xs">
                    <Package className="h-3 w-3 mr-1" />
                    Produits
                  </TabsTrigger>
                  <TabsTrigger value="categories" className="text-xs">
                    <Folder className="h-3 w-3 mr-1" />
                    Catégories
                  </TabsTrigger>
                  <TabsTrigger value="events" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    Événements
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="stores" className="mt-4">
                  <OptimizedSelector
                    title="Sélection des Magasins"
                    type="stores"
                    items={mockStores}
                    selectedIds={campaignData.selectedStores}
                    onSelectionChange={(ids) => 
                      setCampaignData(prev => ({ ...prev, selectedStores: ids }))
                    }
                    maxHeight="300px"
                  />
                </TabsContent>

                <TabsContent value="products" className="mt-4">
                  <OptimizedSelector
                    title="Sélection des Produits"
                    type="products"
                    items={mockProducts}
                    selectedIds={campaignData.selectedProducts}
                    onSelectionChange={(ids) => 
                      setCampaignData(prev => ({ ...prev, selectedProducts: ids }))
                    }
                    maxHeight="300px"
                  />
                </TabsContent>

                <TabsContent value="categories" className="mt-4">
                  <OptimizedSelector
                    title="Sélection des Catégories"
                    type="categories"
                    items={mockCategories}
                    selectedIds={campaignData.selectedCategories}
                    onSelectionChange={(ids) => 
                      setCampaignData(prev => ({ ...prev, selectedCategories: ids }))
                    }
                    maxHeight="300px"
                  />
                </TabsContent>

                <TabsContent value="events" className="mt-4">
                  <OptimizedSelector
                    title="Sélection des Événements"
                    type="events"
                    items={mockEvents}
                    selectedIds={campaignData.selectedEvents}
                    onSelectionChange={(ids) => 
                      setCampaignData(prev => ({ ...prev, selectedEvents: ids }))
                    }
                    maxHeight="300px"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Résumé de sélection */}
          {(campaignData.selectedStores.length > 0 || 
            campaignData.selectedProducts.length > 0 || 
            campaignData.selectedCategories.length > 0 || 
            campaignData.selectedEvents.length > 0) && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Résumé de la Sélection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {campaignData.selectedStores.length > 0 && (
                  <div className="flex justify-between">
                    <span>Magasins sélectionnés</span>
                    <Badge>{campaignData.selectedStores.length}</Badge>
                  </div>
                )}
                {campaignData.selectedProducts.length > 0 && (
                  <div className="flex justify-between">
                    <span>Produits sélectionnés</span>
                    <Badge>{campaignData.selectedProducts.length}</Badge>
                  </div>
                )}
                {campaignData.selectedCategories.length > 0 && (
                  <div className="flex justify-between">
                    <span>Catégories sélectionnées</span>
                    <Badge>{campaignData.selectedCategories.length}</Badge>
                  </div>
                )}
                {campaignData.selectedEvents.length > 0 && (
                  <div className="flex justify-between">
                    <span>Événements sélectionnés</span>
                    <Badge>{campaignData.selectedEvents.length}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Médias et Canva - Colonne droite */}
        <div className="space-y-6">
          {/* Upload de médias */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                Médias & Ressources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MediaUploadZone
                onFilesUploaded={(files) => {
                  setCampaignData(prev => ({
                    ...prev,
                    uploadedMedia: [...prev.uploadedMedia, ...files]
                  }))
                }}
                maxFiles={5}
                maxSize={25}
              />
            </CardContent>
          </Card>

          {/* Intégration Canva */}
          <CanvaIntegrationPanel
            selectedStores={campaignData.selectedStores}
            selectedProducts={campaignData.selectedProducts}
            selectedCategories={campaignData.selectedCategories}
            selectedEvents={campaignData.selectedEvents}
            onDesignSelected={(designId, designData) => {
              setCampaignData(prev => ({
                ...prev,
                canvaDesigns: [...prev.canvaDesigns, { id: designId, data: designData }]
              }))
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigate('/marketing')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Annuler
            </Button>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Campagne prête</p>
                <p className="font-medium">
                  {campaignData.selectedStores.length + 
                   campaignData.selectedProducts.length + 
                   campaignData.selectedCategories.length + 
                   campaignData.selectedEvents.length} éléments sélectionnés
                </p>
              </div>

              <Button 
                onClick={handleFinish}
                disabled={isCreatingCampaign}
                size="lg"
                className="min-w-[160px]"
              >
                {isCreatingCampaign ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Création...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Créer la Campagne
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}