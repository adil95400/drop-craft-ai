import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getPlatformCategories, type CategoryMapping } from '@/lib/category-mapper'
import { supabase } from '@/integrations/supabase/client'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'

const PLATFORMS = [
  'shopify', 'woocommerce', 'amazon', 'ebay', 'facebook', 'instagram',
  'tiktok', 'pinterest', 'google', 'rakuten', 'fnac', 'bigbuy', 'aliexpress'
]

export function MappingManager() {
  const { user } = useUnifiedAuth()
  const [selectedPlatform, setSelectedPlatform] = useState('shopify')
  const [categoryMappings, setCategoryMappings] = useState<CategoryMapping[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      loadCategoryMappings()
    }
  }, [selectedPlatform, user])

  const loadCategoryMappings = async () => {
    setLoading(true)
    try {
      // In production, we would have a category_mappings table.
      // For now, we'll simulate fetching from product categories to infer mappings
      // or use a placeholder table if one existed.
      // Since we don't have a dedicated table yet, we'll fetch distinct categories from products
      // and show them as "pending mapping" if they exist.
      
      const { data: products } = await (supabase.from('products') as any)
        .select('category')
        .eq('user_id', user!.id)
        .not('category', 'is', null)
      
      const uniqueCategories = [...new Set((products || []).map((p: any) => p.category))];
      
      // Simulate existing mappings based on local storage or inference
      const mappings: CategoryMapping[] = uniqueCategories.map((cat, index) => ({
        id: `map-${index}`,
        source_category: cat as string,
        platform: selectedPlatform,
        target_category: '',
        confidence_score: 0,
        is_verified: false
      }));

      setCategoryMappings(mappings)
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
      setCategoryMappings(prev => prev.map(m => 
        m.id === mappingId 
          ? { ...m, target_category: targetCategory, is_verified: isVerified, confidence_score: isVerified ? 1.0 : 0.8 }
          : m
      ))

      // In real implementation: save to database
      // await supabase.from('category_mappings').upsert(...)

      toast({
        title: 'Succès',
        description: 'Mapping mis à jour (simulation)'
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
        <p className="text-muted-foreground">Configurez les correspondances entre vos données et les plateformes</p>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="fields">Champs</TabsTrigger>
          <TabsTrigger value="attributes">Attributs</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Plateforme</CardTitle>
              <CardDescription>Sélectionnez la plateforme pour configurer les mappings de catégories</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="w-[300px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map(platform => (
                    <SelectItem key={platform} value={platform}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mappings de catégories</CardTitle>
                  <CardDescription>{categoryMappings.length} catégorie(s) détectée(s)</CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={loadCategoryMappings}>
                  <RefreshCw className="h-4 w-4 mr-2" />Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                ) : categoryMappings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Aucune catégorie trouvée dans vos produits. Importez des produits pour commencer le mapping.</div>
                ) : (
                  <div className="space-y-3">
                    {categoryMappings.map((mapping) => (
                      <Card key={mapping.id}>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <Badge variant="outline">Source</Badge>
                                <div className="font-medium text-lg">{mapping.source_category}</div>
                              </div>
                              {mapping.is_verified ? (
                                <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Vérifié</Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" />À configurer</Badge>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <Select
                                  value={mapping.target_category}
                                  onValueChange={(value) => handleUpdateMapping(mapping.id!, value, true)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Sélectionner une catégorie cible..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {platformCategories.map(cat => (
                                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
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
              <CardDescription>Les mappings de champs sont configurés dans les paramètres de connexion de chaque plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Accédez aux paramètres d'intégration de chaque plateforme pour configurer les mappings de champs personnalisés.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attributes">
          <Card>
            <CardHeader>
              <CardTitle>Attributs spécifiques</CardTitle>
              <CardDescription>Les attributs requis sont automatiquement gérés selon la plateforme et la catégorie</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Le système remplit automatiquement les attributs spécifiques requis (EAN, GTIN, condition, etc.) lors de la publication.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}