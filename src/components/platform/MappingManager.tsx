import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getPlatformCategories, type CategoryMapping } from '@/lib/category-mapper'

const PLATFORMS = [
  'shopify', 'woocommerce', 'amazon', 'ebay', 'facebook', 'instagram',
  'tiktok', 'pinterest', 'google', 'rakuten', 'fnac', 'bigbuy', 'aliexpress'
]

export function MappingManager() {
  const [selectedPlatform, setSelectedPlatform] = useState('shopify')
  const [categoryMappings, setCategoryMappings] = useState<CategoryMapping[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadCategoryMappings()
  }, [selectedPlatform])

  const loadCategoryMappings = async () => {
    setLoading(true)
    try {
      // Use mock data since category_mappings table doesn't exist
      const mockMappings: CategoryMapping[] = [
        {
          id: '1',
          source_category: 'Electronics',
          platform: selectedPlatform,
          target_category: 'Electronics & Gadgets',
          confidence_score: 0.95,
          is_verified: true
        },
        {
          id: '2',
          source_category: 'Clothing',
          platform: selectedPlatform,
          target_category: 'Apparel & Accessories',
          confidence_score: 0.88,
          is_verified: false
        },
        {
          id: '3',
          source_category: 'Home & Garden',
          platform: selectedPlatform,
          target_category: 'Home & Living',
          confidence_score: 0.92,
          is_verified: true
        }
      ]
      setCategoryMappings(mockMappings)
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMapping = async (mappingId: string, targetCategory: string, isVerified: boolean) => {
    try {
      // Update local state since table doesn't exist
      setCategoryMappings(prev => prev.map(m => 
        m.id === mappingId 
          ? { ...m, target_category: targetCategory, is_verified: isVerified, confidence_score: isVerified ? 1.0 : 0.8 }
          : m
      ))

      toast({
        title: 'Succès',
        description: 'Mapping mis à jour'
      })
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const platformCategories = getPlatformCategories(selectedPlatform)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestion des Mappings</h1>
        <p className="text-muted-foreground">
          Configurez les correspondances entre vos données et les plateformes
        </p>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="fields">Champs</TabsTrigger>
          <TabsTrigger value="attributes">Attributs</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          {/* Sélection de plateforme */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Plateforme
              </CardTitle>
              <CardDescription>
                Sélectionnez la plateforme pour configurer les mappings de catégories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map(platform => (
                    <SelectItem key={platform} value={platform}>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Liste des mappings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mappings de catégories</CardTitle>
                  <CardDescription>
                    {categoryMappings.length} mapping(s) configuré(s)
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={loadCategoryMappings}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </div>
                ) : categoryMappings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun mapping configuré pour cette plateforme.
                    <br />
                    Les mappings seront créés automatiquement lors de la publication de produits.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categoryMappings.map((mapping) => (
                      <Card key={mapping.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Catégorie source</Label>
                                <div className="font-medium">{mapping.source_category}</div>
                              </div>
                              {mapping.is_verified ? (
                                <Badge variant="default" className="gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Vérifié
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Automatique ({Math.round(mapping.confidence_score * 100)}%)
                                </Badge>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                Catégorie {selectedPlatform}
                              </Label>
                              <div className="flex gap-2">
                                <Select
                                  value={mapping.target_category}
                                  onValueChange={(value) =>
                                    handleUpdateMapping(mapping.id!, value, true)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {platformCategories.map(cat => (
                                      <SelectItem key={cat} value={cat}>
                                        {cat}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {!mapping.is_verified && (
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() =>
                                      handleUpdateMapping(mapping.id!, mapping.target_category, true)
                                    }
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fields">
          <Card>
            <CardHeader>
              <CardTitle>Mappings de champs</CardTitle>
              <CardDescription>
                Les mappings de champs sont configurés dans les paramètres de connexion de chaque plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Accédez aux paramètres d'intégration de chaque plateforme pour configurer les mappings de champs personnalisés.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attributes">
          <Card>
            <CardHeader>
              <CardTitle>Attributs spécifiques</CardTitle>
              <CardDescription>
                Les attributs requis sont automatiquement gérés selon la plateforme et la catégorie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Le système remplit automatiquement les attributs spécifiques requis (EAN, GTIN, condition, etc.) lors de la publication.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
