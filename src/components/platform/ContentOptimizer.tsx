import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Check, Loader2, TrendingUp, Eye } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { usePlatformManagement } from '@/hooks/usePlatformManagement'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

interface ProductOption {
  id: string
  title: string
  description: string | null
  category: string | null
  price: number | null
}

export function ContentOptimizer() {
  const [products, setProducts] = useState<ProductOption[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [selectedPlatform, setSelectedPlatform] = useState('shopify')
  const [optimizationType, setOptimizationType] = useState<'title' | 'description' | 'keywords' | 'full'>('full')
  const [optimizing, setOptimizing] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState<any>(null)
  
  const { optimizations, platforms, createOptimization, applyOptimization, loading } = usePlatformManagement()

  const optimizationTypes = [
    { value: 'title', label: 'Titre uniquement' },
    { value: 'description', label: 'Description uniquement' },
    { value: 'keywords', label: 'Mots-clés uniquement' },
    { value: 'full', label: 'Optimisation complète' }
  ]

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('products')
        .select('id, title, description, category, price')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('title')
        .limit(100)

      if (error) throw error
      setProducts(data || [])
      
      if (data?.length && !selectedProduct) {
        setSelectedProduct(data[0].id)
      }
    } catch (error: any) {
      console.error('Error fetching products:', error)
    }
  }

  const optimizeContent = async () => {
    if (!selectedProduct) return

    setOptimizing(true)
    setOptimizationResult(null)

    const currentProduct = products.find(p => p.id === selectedProduct)
    
    const result = await createOptimization(
      selectedProduct,
      selectedPlatform,
      optimizationType,
      {
        title: currentProduct?.title || '',
        description: currentProduct?.description || '',
        category: currentProduct?.category || '',
        price: currentProduct?.price || 0
      }
    )

    if (result) {
      setOptimizationResult({
        optimizationId: result.id,
        optimizedContent: JSON.stringify(result.optimized_content, null, 2),
        optimizationScore: result.optimization_score,
        suggestions: result.suggestions
      })
    }

    setOptimizing(false)
  }

  const handleApplyOptimization = async (optimizationId: string) => {
    await applyOptimization(optimizationId)
    setOptimizationResult(null)
  }

  const currentProduct = products.find(p => p.id === selectedProduct)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Optimisation IA du Contenu</h2>
        <p className="text-muted-foreground">
          Optimisez vos descriptions produits pour chaque marketplace
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle Optimisation</CardTitle>
          <CardDescription>
            Sélectionnez un produit et une plateforme pour optimiser le contenu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Produit</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Plateforme cible</label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map(platform => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type d'optimisation</label>
              <Select value={optimizationType} onValueChange={(v: any) => setOptimizationType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {optimizationTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {currentProduct && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-medium">Aperçu du produit actuel</h4>
              <p className="text-sm"><strong>Nom:</strong> {currentProduct.title}</p>
              <p className="text-sm"><strong>Catégorie:</strong> {currentProduct.category || 'Non définie'}</p>
              <p className="text-sm"><strong>Prix:</strong> {currentProduct.price}€</p>
              {currentProduct.description && (
                <p className="text-sm">
                  <strong>Description:</strong> {currentProduct.description.substring(0, 150)}...
                </p>
              )}
            </div>
          )}

          <Button
            onClick={optimizeContent}
            disabled={optimizing || !selectedProduct}
            className="w-full"
          >
            {optimizing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Optimisation en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Optimiser avec l'IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {optimizationResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Résultat de l'optimisation</CardTitle>
              <Badge variant={optimizationResult.optimizationScore >= 75 ? 'default' : 'secondary'}>
                Score: {optimizationResult.optimizationScore}/100
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="optimized">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="optimized">Contenu optimisé</TabsTrigger>
                <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              </TabsList>
              <TabsContent value="optimized" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Contenu optimisé par l'IA:</h4>
                  <Textarea
                    value={optimizationResult.optimizedContent}
                    readOnly
                    className="min-h-[200px]"
                  />
                </div>
                <Button
                  onClick={() => handleApplyOptimization(optimizationResult.optimizationId)}
                  className="w-full"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Appliquer cette optimisation
                </Button>
              </TabsContent>
              <TabsContent value="suggestions" className="space-y-3">
                {optimizationResult.suggestions?.map((suggestion: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 mt-1 text-blue-500" />
                      <div>
                        <p className="font-medium capitalize">{suggestion.type}</p>
                        <p className="text-sm text-muted-foreground">{suggestion.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Historique des optimisations</CardTitle>
          <CardDescription>Les 20 dernières optimisations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {optimizations.map((opt) => {
              const product = products.find(p => p.id === opt.product_id)
              
              return (
                <div
                  key={opt.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{product?.title || 'Produit supprimé'}</p>
                      <Badge variant="outline" className="capitalize">
                        {opt.platform}
                      </Badge>
                      {opt.is_applied && (
                        <Badge variant="default">
                          <Check className="w-3 h-3 mr-1" />
                          Appliqué
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {opt.optimization_type} · Score: {opt.optimization_score}/100
                    </p>
                  </div>
                  {!opt.is_applied && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApplyOptimization(opt.id)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Appliquer
                    </Button>
                  )}
                </div>
              )
            })}

            {!optimizations.length && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Aucune optimisation pour le moment</p>
                <p className="text-sm">Lancez votre première optimisation IA !</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
